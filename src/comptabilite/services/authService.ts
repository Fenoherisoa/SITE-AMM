import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { ref, get, set, update, push, onValue } from 'firebase/database';
import { initializeApp, deleteApp } from 'firebase/app';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole, UserStatus, AuditLogEntry } from '../types/auth';

const USERS_PATH = 'users';
const AUDIT_LOGS_PATH = 'audit_logs';

export class AuthService {
  /**
   * Fetch a user profile from Firebase Realtime Database
   */
  public static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = ref(db, `${USERS_PATH}/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return snapshot.val() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('[AuthService] Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Record security audit log in Realtime Database
   */
  public static async logAuditAction(
    uid: string,
    userEmail: string,
    userName: string,
    userRole: UserRole,
    action: string,
    details: string
  ): Promise<void> {
    try {
      const logsRef = ref(db, AUDIT_LOGS_PATH);
      const newLogRef = push(logsRef);
      const logEntry: AuditLogEntry = {
        id: newLogRef.key || `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        uid,
        userEmail,
        userName,
        userRole,
        action,
        details,
      };
      await set(newLogRef, logEntry);
    } catch (error) {
      console.error('[AuthService] Error writing audit log:', error);
    }
  }

  /**
   * Subscribe to Audit Logs stream
   */
  public static subscribeToAuditLogs(
    onLogsChange: (logs: AuditLogEntry[]) => void
  ) {
    const logsRef = ref(db, AUDIT_LOGS_PATH);
    const unsubscribe = onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawVal = snapshot.val();
        const list: AuditLogEntry[] = Object.values(rawVal);
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        onLogsChange(list);
      } else {
        onLogsChange([]);
      }
    });
    return unsubscribe;
  }

  /**
   * Subscribe to all users list in Realtime Database
   */
  public static subscribeToUsers(
    onUsersChange: (users: UserProfile[]) => void
  ) {
    const usersRef = ref(db, USERS_PATH);
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawVal = snapshot.val();
        const list: UserProfile[] = Object.values(rawVal);
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUsersChange(list);
      } else {
        onUsersChange([]);
      }
    });
    return unsubscribe;
  }

  /**
   * Real Authentication Login against Realtime Database or Firebase Auth
   * Supports username, matricule, or email with access code / password
   */
  public static async loginWithFirebase(identifier: string, pass: string): Promise<UserProfile> {
    const cleanId = identifier.trim();
    if (!cleanId || !pass) {
      throw new Error('Veuillez renseigner votre identifiant et votre mot de passe.');
    }

    const ALLOWED_ROLES: UserRole[] = ['ADMIN', 'DIRECTEUR', 'COMPTABLE', 'GESTIONNAIRE', 'ASSISTANT COMPTABLE'];

    // 1. Primary check: verify against Realtime Database users
    try {
      const usersRef = ref(db, USERS_PATH);
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const allUsersVal = snapshot.val() as Record<string, any>;
        const entries = Object.entries(allUsersVal);

        // Find user by key, email, matricule, or username (case-insensitive)
        const match = entries.find(([key, user]) => {
          const k = key.toLowerCase();
          const q = cleanId.toLowerCase();
          const email = (user.email || '').toLowerCase();
          const matricule = (user.matricule || '').toLowerCase();
          const username = (user.username || user.name || '').toLowerCase();
          return k === q || email === q || matricule === q || username === q;
        });

        if (match) {
          const [userKey, userData] = match;

          // Verify password or access code
          const expectedPass = String(userData.password ?? userData.code ?? userData.pin ?? '');
          if (expectedPass !== pass) {
            await this.logAuditAction(
              userKey,
              userData.email || cleanId,
              userData.displayName || userKey,
              (userData.role?.toUpperCase() || 'COMPTABLE') as UserRole,
              'ECHEC_CONNEXION',
              `Tentative de connexion avec code/mot de passe invalide pour ${cleanId}`
            );
            throw new Error('Identifiants incorrects (mot de passe ou code d’accès invalide).');
          }

          // Check if disabled / suspended
          if (userData.status === 'DISABLED' || userData.status === 'SUSPENDED') {
            throw new Error('Votre compte utilisateur a été désactivé par l’administrateur.');
          }

          // Verify role & permissions
          const rawRole = String(userData.role || '').toUpperCase();
          let userRole: UserRole = 'COMPTABLE';
          if (rawRole === 'SUPER_ADMIN' || rawRole === 'SUPER ADMIN' || rawRole === 'ADMIN') {
            userRole = 'ADMIN';
          } else if (rawRole === 'DIRECTEUR') {
            userRole = 'DIRECTEUR';
          } else if (rawRole === 'GESTIONNAIRE') {
            userRole = 'GESTIONNAIRE';
          } else if (rawRole === 'ASSISTANT COMPTABLE') {
            userRole = 'ASSISTANT COMPTABLE';
          }

          const hasPermission = 
            ALLOWED_ROLES.includes(userRole) ||
            userData.permissions?.accounting === true ||
            userData.permissions?.financial === true;

          if (!hasPermission) {
            throw new Error(`Accès refusé. Le rôle '${userData.role || 'Inconnu'}' n'est pas autorisé à accéder au module Comptabilité.`);
          }

          // Build verified profile
          const profile: UserProfile = {
            uid: userKey,
            email: userData.email || `${userKey}@amm.mg`,
            displayName: userData.name || userData.displayName || userData.username || userKey,
            role: userRole,
            status: 'ACTIVE',
            department: userData.department || 'Comptabilité & Finances',
            createdAt: userData.createdAt || new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };

          // Update last login in RTDB
          try {
            await update(ref(db, `${USERS_PATH}/${userKey}`), { lastLoginAt: profile.lastLoginAt });
          } catch (e) {
            console.warn('[AuthService] Could not update lastLoginAt:', e);
          }

          // Save session to localStorage
          localStorage.setItem('cpt_auth_session', JSON.stringify(profile));

          await this.logAuditAction(
            profile.uid,
            profile.email,
            profile.displayName,
            profile.role,
            'CONNEXION',
            `Connexion réussie au module Comptabilité (Authentification Base AMM)`
          );

          return profile;
        }
      }
    } catch (dbErr: any) {
      if (dbErr.message && !dbErr.message.includes('permission_denied')) {
        // If it's our own thrown error (e.g. invalid password or access denied), rethrow it!
        if (dbErr.message.includes('Identifiants incorrects') || dbErr.message.includes('Accès refusé') || dbErr.message.includes('désactivé')) {
          throw dbErr;
        }
      }
      console.warn('[AuthService] RTDB lookup failed or fallback needed:', dbErr);
    }

    // 2. Fallback check: Firebase Auth (for standard Firebase accounts with email & 6+ chars password)
    let firebaseUser: User;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanId, pass);
      firebaseUser = userCredential.user;
    } catch (authError: any) {
      if (
        authError.code === 'auth/invalid-credential' ||
        authError.code === 'auth/user-not-found' ||
        authError.code === 'auth/wrong-password' ||
        authError.code === 'auth/invalid-email'
      ) {
        throw new Error('Identifiants incorrects (email/identifiant ou mot de passe invalide).');
      } else if (authError.code === 'auth/too-many-requests') {
        throw new Error('Accès temporairement bloqué suite à de trop nombreuses tentatives.');
      } else {
        throw authError;
      }
    }

    // Fetch existing database user profile for Firebase User
    let profile = await this.getUserProfile(firebaseUser.uid);

    if (profile && profile.status === 'DISABLED') {
      await signOut(auth);
      throw new Error('Votre compte utilisateur a été désactivé par l’administrateur système.');
    }

    if (profile && !ALLOWED_ROLES.includes(profile.role)) {
      await signOut(auth);
      throw new Error(`Accès refusé. Le rôle '${profile.role}' n'est pas autorisé.`);
    }

    if (!profile) {
      profile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || cleanId,
        displayName: firebaseUser.displayName || cleanId.split('@')[0],
        role: 'ADMIN',
        status: 'ACTIVE',
        department: 'Direction générale',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await set(ref(db, `${USERS_PATH}/${firebaseUser.uid}`), profile);
    } else {
      const lastLoginAt = new Date().toISOString();
      await update(ref(db, `${USERS_PATH}/${firebaseUser.uid}`), { lastLoginAt });
      profile.lastLoginAt = lastLoginAt;
    }

    localStorage.setItem('cpt_auth_session', JSON.stringify(profile));

    await this.logAuditAction(
      profile.uid,
      profile.email,
      profile.displayName,
      profile.role,
      'CONNEXION',
      'Connexion réussie au système SITE-AMM via Firebase Auth'
    );

    return profile;
  }

  /**
   * Restores session from SITE AMM centralized authentication or local session
   */
  public static restoreCentralizedSession(): UserProfile | null {
    try {
      // Check accounting-specific session first
      const savedCpt = localStorage.getItem('cpt_auth_session');
      if (savedCpt) {
        const parsed = JSON.parse(savedCpt) as UserProfile;
        if (parsed && parsed.uid && parsed.role) {
          return parsed;
        }
      }

      // Check central SITE AMM authentication session
      const savedAmm = localStorage.getItem('amm_authenticated_user');
      if (savedAmm) {
        const ammUser = JSON.parse(savedAmm);
        if (ammUser && ammUser.uid) {
          let role: UserRole = 'COMPTABLE';
          const r = String(ammUser.role || '').toUpperCase();
          if (r === 'ADMIN' || r === 'SUPER_ADMIN' || r === 'SUPER ADMIN') {
            role = 'ADMIN';
          } else if (r === 'DIRECTEUR') {
            role = 'DIRECTEUR';
          } else if (r === 'GESTIONNAIRE') {
            role = 'GESTIONNAIRE';
          } else if (r === 'ASSISTANT COMPTABLE') {
            role = 'ASSISTANT COMPTABLE';
          } else if (r === 'COMPTABLE' || ammUser.permissions?.accounting) {
            role = 'COMPTABLE';
          } else {
            return null; // Not authorized for accounting
          }

          const profile: UserProfile = {
            uid: ammUser.uid,
            email: ammUser.email || `${ammUser.uid}@amm.mg`,
            displayName: ammUser.displayName || ammUser.name || ammUser.username || ammUser.uid,
            role,
            status: ammUser.status === 'DISABLED' || ammUser.status === 'SUSPENDED' ? 'DISABLED' : 'ACTIVE',
            department: ammUser.department || 'Direction & Comptabilité',
            createdAt: ammUser.createdAt || new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };

          localStorage.setItem('cpt_auth_session', JSON.stringify(profile));
          return profile;
        }
      }
    } catch (e) {
      console.warn('[AuthService] Error restoring centralized session:', e);
    }
    return null;
  }

  /**
   * Register a new user self-service sign up
   */
  public static async registerUserSelfService(
    email: string,
    pass: string,
    displayName: string,
    requestedRole: UserRole = 'ASSISTANT COMPTABLE',
    department: string = 'Service comptabilité'
  ): Promise<UserProfile> {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, { displayName });

    const usersRef = ref(db, USERS_PATH);
    const snapshot = await get(usersRef);
    const isFirstUser = !snapshot.exists() || Object.keys(snapshot.val() || {}).length === 0;

    const finalRole: UserRole = isFirstUser ? 'ADMIN' : requestedRole;

    const profile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || email.trim(),
      displayName,
      role: finalRole,
      status: 'ACTIVE',
      department,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await set(ref(db, `${USERS_PATH}/${firebaseUser.uid}`), profile);

    await this.logAuditAction(
      profile.uid,
      profile.email,
      profile.displayName,
      profile.role,
      'CREATION_COMPTE',
      `Inscription initiale self-service (${finalRole})`
    );

    return profile;
  }

  /**
   * Create User by Admin (without disrupting Admin's current session)
   */
  public static async adminCreateUser(
    email: string,
    pass: string,
    displayName: string,
    role: UserRole,
    department: string,
    adminProfile: UserProfile
  ): Promise<UserProfile> {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAgCEmahBYIjsrHexZBAfOJ36e5dlsUynw',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'baseamm-9c2c7.firebaseapp.com',
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app/',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'baseamm-9c2c7',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'baseamm-9c2c7.firebasestorage.app',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '669566780526',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:669566780526:web:58f8d6b9c6b298f0cb0e0b0',
    };

    const tempAppName = `temp-admin-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = (await import('firebase/auth')).getAuth(tempApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email.trim(), pass);
      const newUser = userCredential.user;

      await updateProfile(newUser, { displayName });

      const newProfile: UserProfile = {
        uid: newUser.uid,
        email: newUser.email || email.trim(),
        displayName,
        role,
        status: 'ACTIVE',
        department,
        createdAt: new Date().toISOString(),
        lastLoginAt: 'Jamais connecté',
        createdBy: adminProfile.email,
      };

      await set(ref(db, `${USERS_PATH}/${newUser.uid}`), newProfile);

      await this.logAuditAction(
        adminProfile.uid,
        adminProfile.email,
        adminProfile.displayName,
        adminProfile.role,
        'UTILISATEUR_CREE',
        `Création du compte pour ${email} avec le rôle ${role}`
      );

      await signOut(tempAuth);
      await deleteApp(tempApp);

      return newProfile;
    } catch (err) {
      await deleteApp(tempApp).catch(() => {});
      throw err;
    }
  }

  /**
   * Update User Role (Admin only)
   */
  public static async updateUserRole(
    targetUid: string,
    targetEmail: string,
    newRole: UserRole,
    adminProfile: UserProfile
  ): Promise<void> {
    const userRef = ref(db, `${USERS_PATH}/${targetUid}/role`);
    await set(userRef, newRole);

    await this.logAuditAction(
      adminProfile.uid,
      adminProfile.email,
      adminProfile.displayName,
      adminProfile.role,
      'ROLE_MODIFIE',
      `Modification du rôle de ${targetEmail} -> ${newRole}`
    );
  }

  /**
   * Toggle User Status (ACTIVE / DISABLED)
   */
  public static async toggleUserStatus(
    targetUid: string,
    targetEmail: string,
    newStatus: UserStatus,
    adminProfile: UserProfile
  ): Promise<void> {
    const userRef = ref(db, `${USERS_PATH}/${targetUid}/status`);
    await set(userRef, newStatus);

    await this.logAuditAction(
      adminProfile.uid,
      adminProfile.email,
      adminProfile.displayName,
      adminProfile.role,
      'STATUT_MODIFIE',
      `Changement de statut de ${targetEmail} -> ${newStatus}`
    );
  }

  /**
   * Password Reset Email
   */
  public static async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email.trim());
  }

  /**
   * Sign Out
   */
  public static async logout(currentUserProfile?: UserProfile | null): Promise<void> {
    try {
      localStorage.removeItem('cpt_auth_session');
    } catch (e) {}

    if (currentUserProfile) {
      await this.logAuditAction(
        currentUserProfile.uid,
        currentUserProfile.email,
        currentUserProfile.displayName,
        currentUserProfile.role,
        'DECONNEXION',
        'Fermeture de session'
      );
    }
    await signOut(auth).catch(() => {});
  }
}