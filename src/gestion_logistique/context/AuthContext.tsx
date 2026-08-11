import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { ref, get, set, push } from 'firebase/database';
import { auth, database } from '../lib/firebase';
import { UserProfile, UserRole, UserStatus, AuditLogEntry, AuditEventType } from '../types';
import { INITIAL_USERS, INITIAL_AUDIT_LOGS } from '../data/initialData';

// Default Role Permissions Map
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    'inventory:read', 'inventory:write', 'inventory:delete',
    'movements:read', 'movements:write',
    'financial:read', 'financial:write',
    'suppliers:read', 'suppliers:write',
    'reports:read', 'reports:export',
    'settings:read', 'settings:write',
    'users:manage', 'audit:read'
  ],
  LOGISTICS_MANAGER: [
    'inventory:read', 'inventory:write', 'inventory:delete',
    'movements:read', 'movements:write',
    'financial:read',
    'suppliers:read', 'suppliers:write',
    'reports:read', 'reports:export',
    'settings:read'
  ],
  FINANCIAL_OFFICER: [
    'inventory:read',
    'movements:read',
    'financial:read', 'financial:write',
    'suppliers:read', 'suppliers:write',
    'reports:read', 'reports:export'
  ],
  AUDITOR: [
    'inventory:read',
    'movements:read',
    'financial:read',
    'suppliers:read',
    'reports:read', 'reports:export',
    'audit:read'
  ],
  AGENT: [
    'inventory:read', 'inventory:write',
    'movements:read', 'movements:write',
    'suppliers:read'
  ]
};

export const ROLE_LABELS: Record<UserRole, { title: string; badgeClass: string; desc: string }> = {
  ADMIN: {
    title: 'Directeur Général & Administrateur SI',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
    desc: 'Accès total sans restriction, gestion des utilisateurs, audits et paramètres'
  },
  LOGISTICS_MANAGER: {
    title: 'Responsable Logistique & Patrimoine',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300',
    desc: 'Gestion complète du stock, mouvements, fournisseurs et étiquetage'
  },
  FINANCIAL_OFFICER: {
    title: 'Responsable Financier & Comptable',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
    desc: 'Gestion des écritures comptables, caisses, virements et bilans'
  },
  AUDITOR: {
    title: 'Auditeur Interne & Contrôleur',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
    desc: 'Accès en lecture seule à tous les registres + journal d\'audit de sécurité'
  },
  AGENT: {
    title: 'Magasinier / Agent de Terrain',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    desc: 'Saisie des réceptions, sorties et transferts de matériel uniquement'
  }
};

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  activeRole: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  mfaPending: boolean;
  mfaUser: UserProfile | null;
  sessionTimeoutSeconds: number;
  sessionTimeLeft: number;
  usersList: UserProfile[];
  auditLogs: AuditLogEntry[];
  
  // Auth operations
  loginWithFirebase: (email: string, pass: string) => Promise<{ success: boolean; error?: string; mfaRequired?: boolean }>;
  signupWithFirebase: (email: string, pass: string, name: string, role: UserRole, dept: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoRole: (role: UserRole) => Promise<void>;
  simulateRole: (role: UserRole) => void;
  logout: (reason?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyMfaCode: (code: string) => boolean;
  cancelMfa: () => void;
  
  // Security & User administration
  updateUserProfile: (updatedProfile: Partial<UserProfile>) => Promise<boolean>;
  updateUserRoleAndStatus: (targetUid: string, newRole: UserRole, newStatus: UserStatus) => Promise<boolean>;
  toggleMfaForUser: (targetUid: string, enabled: boolean) => Promise<boolean>;
  addUserToOrg: (newUser: Omit<UserProfile, 'uid' | 'createdAt' | 'lastLogin' | 'permissions'>) => Promise<boolean>;
  logAuditEvent: (action: AuditEventType, details: string, severity?: 'INFO' | 'WARNING' | 'CRITICAL') => Promise<void>;
  extendSession: () => void;
  setSessionTimeout: (seconds: number) => void;
  
  // RBAC permissions helper
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SESSION_TIMEOUT = 15 * 60; // 15 minutes

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('site_amm_user_profile');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Default to Admin for immediate evaluation
  });
  const [activeRole, setActiveRole] = useState<UserRole | null>(() => {
    return userProfile?.role || 'ADMIN';
  });
  const [loading, setLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaUser, setMfaUser] = useState<UserProfile | null>(null);
  
  // Session Timeout Management
  const [sessionTimeoutSeconds, setSessionTimeoutSecondsState] = useState<number>(() => {
    const saved = localStorage.getItem('site_amm_session_timeout');
    return saved ? Number(saved) : DEFAULT_SESSION_TIMEOUT;
  });
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(sessionTimeoutSeconds);

  // Users directory and Audit logs state
  const [usersList, setUsersList] = useState<UserProfile[]>(() => {
    const cached = localStorage.getItem('site_amm_users_directory');
    return cached ? JSON.parse(cached) : INITIAL_USERS;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const cached = localStorage.getItem('site_amm_audit_logs');
    return cached ? JSON.parse(cached) : INITIAL_AUDIT_LOGS;
  });

  // Sync state to local storage
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('site_amm_user_profile', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('site_amm_user_profile');
    }
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('site_amm_users_directory', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('site_amm_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Log Audit Event Helper
  const logAuditEvent = useCallback(async (
    action: AuditEventType, 
    details: string, 
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO'
  ) => {
    const newEntry: AuditLogEntry = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      userId: userProfile?.uid || 'anonymous',
      userEmail: userProfile?.email || 'non-authentifie',
      userName: userProfile?.displayName || 'Utilisateur Inconnu',
      userRole: activeRole || 'AGENT',
      action,
      details,
      ipAddress: '197.220.12.89', // Simulated institutional IP
      severity
    };

    setAuditLogs(prev => [newEntry, ...prev]);

    // Async push to Realtime Database
    try {
      const logRef = ref(database, `site_amm/audit_logs/${newEntry.id}`);
      await set(logRef, newEntry);
    } catch (e) {
      console.warn('[Firebase] Warning saving audit log:', e);
    }
  }, [userProfile, activeRole]);

  // Extend active session timer
  const extendSession = useCallback(() => {
    setSessionTimeLeft(sessionTimeoutSeconds);
  }, [sessionTimeoutSeconds]);

  const setSessionTimeout = useCallback((seconds: number) => {
    setSessionTimeoutSecondsState(seconds);
    localStorage.setItem('site_amm_session_timeout', seconds.toString());
    setSessionTimeLeft(seconds);
  }, []);

  // Inactivity countdown timer
  useEffect(() => {
    if (!userProfile) return;

    const interval = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          logAuditEvent('SESSION_TIMEOUT', 'Déconnexion automatique suite à une inactivité prolongée', 'WARNING');
          setUserProfile(null);
          setFirebaseUser(null);
          setActiveRole(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Reset countdown on user interaction
    const handleUserActivity = () => {
      setSessionTimeLeft(sessionTimeoutSeconds);
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [userProfile, sessionTimeoutSeconds, logAuditEvent]);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Fetch or create profile from database
        try {
          const userRef = ref(database, `site_amm/users/${fbUser.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const profile = snapshot.val() as UserProfile;
            setUserProfile(profile);
            setActiveRole(profile.role);
          } else {
            // Default new profile
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilisateur',
              role: 'AGENT',
              department: 'Exploitation Terrain',
              status: 'ACTIVE',
              mfaEnabled: false,
              lastLogin: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              permissions: ROLE_PERMISSIONS['AGENT']
            };
            await set(userRef, newProfile);
            setUserProfile(newProfile);
            setActiveRole('AGENT');
          }
        } catch (err) {
          console.warn('[Firebase Auth] Exception loading profile:', err);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login with Firebase Auth
  const loginWithFirebase = async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      
      // Look up profile
      const matchingUser = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (matchingUser && matchingUser.status === 'SUSPENDED') {
        await firebaseSignOut(auth);
        await logAuditEvent('FAILED_LOGIN', `Tentative de connexion bloquée: Compte suspendu (${email})`, 'WARNING');
        return { success: false, error: 'Ce compte utilisateur a été suspendu par l\'administrateur.' };
      }

      if (matchingUser && matchingUser.mfaEnabled) {
        setMfaPending(true);
        setMfaUser(matchingUser);
        return { success: true, mfaRequired: true };
      }

      const currentProf: UserProfile = matchingUser || {
        uid: fbUser.uid,
        email: fbUser.email || email,
        displayName: fbUser.displayName || 'Utilisateur AMM',
        role: 'AGENT',
        department: 'Exploitation',
        status: 'ACTIVE',
        mfaEnabled: false,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        permissions: ROLE_PERMISSIONS['AGENT']
      };

      setUserProfile(currentProf);
      setActiveRole(currentProf.role);
      extendSession();

      await logAuditEvent('LOGIN', `Connexion réussie avec Firebase Auth (${email})`, 'INFO');
      return { success: true };
    } catch (err: any) {
      await logAuditEvent('FAILED_LOGIN', `Échec d'authentification pour ${email}: ${err.message}`, 'WARNING');
      return { success: false, error: 'Identifiants invalides. Veuillez vérifier votre adresse e-mail et votre mot de passe.' };
    }
  };

  // Quick 1-click Demo Role Login for evaluation
  const loginAsDemoRole = async (role: UserRole) => {
    const demoUser = usersList.find(u => u.role === role) || INITIAL_USERS.find(u => u.role === role) || INITIAL_USERS[0];
    
    const updatedUser: UserProfile = {
      ...demoUser,
      lastLogin: new Date().toISOString()
    };

    setUserProfile(updatedUser);
    setActiveRole(updatedUser.role);
    extendSession();

    await logAuditEvent('LOGIN', `Connexion de démonstration rapide sous le rôle ${role} (${updatedUser.email})`, 'INFO');
  };

  // Simulate Role Switcher (for instant testing during session)
  const simulateRole = (role: UserRole) => {
    setActiveRole(role);
    logAuditEvent('ROLE_CHANGE', `Simulation dynamique du rôle modifiée vers: ${role}`, 'INFO');
  };

  // Signup with Firebase Auth
  const signupWithFirebase = async (
    email: string, 
    pass: string, 
    name: string, 
    role: UserRole, 
    dept: string
  ) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateFirebaseProfile(cred.user, { displayName: name });

      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email,
        displayName: name,
        role,
        department: dept,
        status: 'ACTIVE',
        mfaEnabled: false,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        permissions: ROLE_PERMISSIONS[role]
      };

      // Save to Firebase Realtime DB
      await set(ref(database, `site_amm/users/${cred.user.uid}`), newProfile);

      setUsersList(prev => [...prev, newProfile]);
      setUserProfile(newProfile);
      setActiveRole(role);
      extendSession();

      await logAuditEvent('LOGIN', `Création de compte et connexion réussie (${email}) - Rôle: ${role}`, 'INFO');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la création du compte' };
    }
  };

  // Password Reset
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      await logAuditEvent('PASSWORD_RESET', `Demande de réinitialisation envoyée à ${email}`, 'INFO');
      return { success: true, message: `Un lien de réinitialisation a été envoyé à l'adresse ${email}` };
    } catch (err: any) {
      return { success: false, message: 'Impossible d\'envoyer l\'email de réinitialisation. Vérifiez l\'adresse reçue.' };
    }
  };

  // Logout
  const logout = async (reason = 'Déconnexion manuelle') => {
    await logAuditEvent('LOGOUT', `Fermeture de session: ${reason}`, 'INFO');
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // ignore
    }
    setUserProfile(null);
    setFirebaseUser(null);
    setActiveRole(null);
    setMfaPending(false);
    setMfaUser(null);
  };

  // MFA verification
  const verifyMfaCode = (code: string) => {
    // Demo accept any 6 digit code or 123456
    if (code.length === 6 && mfaUser) {
      setUserProfile(mfaUser);
      setActiveRole(mfaUser.role);
      setMfaPending(false);
      setMfaUser(null);
      extendSession();
      logAuditEvent('LOGIN', `Validation MFA / 2FA réussie pour ${mfaUser.email}`, 'INFO');
      return true;
    }
    return false;
  };

  const cancelMfa = () => {
    setMfaPending(false);
    setMfaUser(null);
  };

  // Security Management
  const updateUserProfile = async (updated: Partial<UserProfile>) => {
    if (!userProfile) return false;
    const newProf = { ...userProfile, ...updated };
    setUserProfile(newProf);
    setUsersList(prev => prev.map(u => u.uid === newProf.uid ? newProf : u));
    
    try {
      await set(ref(database, `site_amm/users/${newProf.uid}`), newProf);
    } catch (e) {
      // ignore
    }

    await logAuditEvent('PROFILE_UPDATE', `Mise à jour des informations du profil pour ${newProf.email}`, 'INFO');
    return true;
  };

  const updateUserRoleAndStatus = async (targetUid: string, newRole: UserRole, newStatus: UserStatus) => {
    setUsersList(prev => prev.map(u => {
      if (u.uid === targetUid) {
        const updated: UserProfile = {
          ...u,
          role: newRole,
          status: newStatus,
          permissions: ROLE_PERMISSIONS[newRole]
        };
        set(ref(database, `site_amm/users/${targetUid}`), updated).catch(() => {});
        return updated;
      }
      return u;
    }));

    if (userProfile && userProfile.uid === targetUid) {
      setUserProfile(prev => prev ? { ...prev, role: newRole, status: newStatus } : null);
      setActiveRole(newRole);
    }

    await logAuditEvent('ROLE_CHANGE', `Modification du rôle (${newRole}) et statut (${newStatus}) pour UID: ${targetUid}`, 'CRITICAL');
    return true;
  };

  const toggleMfaForUser = async (targetUid: string, enabled: boolean) => {
    setUsersList(prev => prev.map(u => {
      if (u.uid === targetUid) {
        const updated = { ...u, mfaEnabled: enabled };
        set(ref(database, `site_amm/users/${targetUid}`), updated).catch(() => {});
        return updated;
      }
      return u;
    }));

    if (userProfile && userProfile.uid === targetUid) {
      setUserProfile(prev => prev ? { ...prev, mfaEnabled: enabled } : null);
    }

    await logAuditEvent('MFA_TOGGLE', `Changement MFA (2FA) = ${enabled} pour UID: ${targetUid}`, 'WARNING');
    return true;
  };

  const addUserToOrg = async (newUser: Omit<UserProfile, 'uid' | 'createdAt' | 'lastLogin' | 'permissions'>) => {
    const uid = `usr-${Date.now().toString().slice(-6)}`;
    const created: UserProfile = {
      ...newUser,
      uid,
      createdAt: new Date().toISOString(),
      lastLogin: 'Jamais connecté',
      permissions: ROLE_PERMISSIONS[newUser.role]
    };

    setUsersList(prev => [...prev, created]);
    try {
      await set(ref(database, `site_amm/users/${uid}`), created);
    } catch (e) {
      // ignore
    }

    await logAuditEvent('STATUS_CHANGE', `Nouveau membre ajouté à l'organisation: ${created.email} (${created.role})`, 'INFO');
    return true;
  };

  // RBAC Permission Helpers
  const hasPermission = useCallback((permission: string) => {
    if (!activeRole) return false;
    const perms = ROLE_PERMISSIONS[activeRole] || [];
    return perms.includes(permission);
  }, [activeRole]);

  const hasRole = useCallback((roles: UserRole | UserRole[]) => {
    if (!activeRole) return false;
    if (Array.isArray(roles)) {
      return roles.includes(activeRole);
    }
    return activeRole === roles;
  }, [activeRole]);

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      activeRole,
      isAuthenticated: !!userProfile,
      loading,
      mfaPending,
      mfaUser,
      sessionTimeoutSeconds,
      sessionTimeLeft,
      usersList,
      auditLogs,
      
      loginWithFirebase,
      signupWithFirebase,
      loginAsDemoRole,
      simulateRole,
      logout,
      resetPassword,
      verifyMfaCode,
      cancelMfa,
      
      updateUserProfile,
      updateUserRoleAndStatus,
      toggleMfaForUser,
      addUserToOrg,
      logAuditEvent,
      extendSession,
      setSessionTimeout,
      
      hasPermission,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
