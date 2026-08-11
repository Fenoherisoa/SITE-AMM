import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthService } from '../services/authService';
import { UserProfile, UserRole, RolePermissions, ROLE_PERMISSIONS } from '../types/auth';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  permissions: RolePermissions | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (
    email: string,
    pass: string,
    displayName: string,
    requestedRole?: UserRole,
    department?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setIsLoading(true);
      if (fbUser) {
        try {
          const profile = await AuthService.getUserProfile(fbUser.uid);
          if (profile) {
            if (profile.status === 'DISABLED') {
              setError('Votre compte utilisateur a été désactivé.');
              await AuthService.logout();
              setCurrentUser(null);
              setUserProfile(null);
            } else {
              setCurrentUser(fbUser);
              setUserProfile(profile);
            }
          } else {
            // First time or missing DB record
            setCurrentUser(fbUser);
            // Fetch again or trigger fallback creation
            const fresh = await AuthService.getUserProfile(fbUser.uid);
            setUserProfile(fresh);
          }
        } catch (err: any) {
          console.error('[AuthContext] Auth state error:', err);
          setError(err.message || 'Erreur lors de la vérification de session.');
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const profile = await AuthService.loginWithFirebase(email, pass);
      setUserProfile(profile);
    } catch (err: any) {
      console.error('[AuthContext] Login error:', err);
      let msg = 'Échec de la connexion. Vérifiez vos identifiants.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Email ou mot de passe incorrect.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Accès temporairement bloqué suite à de trop nombreuses tentatives.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    pass: string,
    displayName: string,
    requestedRole: UserRole = 'ASSISTANT COMPTABLE',
    department: string = 'Service comptabilité'
  ) => {
    setError(null);
    setIsLoading(true);
    try {
      const profile = await AuthService.registerUserSelfService(
        email,
        pass,
        displayName,
        requestedRole,
        department
      );
      setUserProfile(profile);
    } catch (err: any) {
      console.error('[AuthContext] Register error:', err);
      let msg = 'Erreur lors de la création de compte.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Cette adresse email est déjà enregistrée.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Le mot de passe doit comporter au moins 6 caractères.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout(userProfile);
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await AuthService.sendPasswordReset(email);
    } catch (err: any) {
      console.error('[AuthContext] Reset password error:', err);
      let msg = 'Erreur lors de l\'envoi de l\'email de réinitialisation.';
      if (err.code === 'auth/user-not-found') {
        msg = 'Aucun compte trouvé avec cet email.';
      }
      throw new Error(msg);
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      const fresh = await AuthService.getUserProfile(currentUser.uid);
      if (fresh) setUserProfile(fresh);
    }
  };

  const permissions = userProfile ? ROLE_PERMISSIONS[userProfile.role] : null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        permissions,
        isLoading,
        error,
        login,
        register,
        logout,
        resetPassword,
        clearError: () => setError(null),
        refreshProfile,
      }}
    >
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
