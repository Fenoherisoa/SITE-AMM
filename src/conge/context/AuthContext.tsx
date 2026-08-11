import React, { createContext, useContext, useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { database } from '../services/firebase';
import { getUserBalance } from '../services/dbService';
import { ensureSeedDatabase } from '../services/seedService';
import { UserProfile, LeaveBalance } from '../types';

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  balance: LeaveBalance | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUserProfileAndBalance = async (uid: string) => {
    if (!database) return;
    try {
      const snap = await get(ref(database, `users/${uid}`));
      if (snap.exists()) {
        const val = snap.val();
        const loadedProf: UserProfile = {
          uid,
          email: val.email || `${uid}@company.com`,
          displayName: val.displayName || val.name || uid.toUpperCase(),
          role: val.role || 'USER',
          cin: val.cin || '',
          phone: val.phone || '',
          departmentName: val.departmentName || 'Service Entreprise',
          jobTitle: val.jobTitle || 'Collaborateur',
          permissions: val.permissions || {},
        };
        setProfile(loadedProf);
        const bal = await getUserBalance(uid);
        setBalance(bal);
      }
    } catch (err) {
      console.error('Error loading user profile & balance:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await ensureSeedDatabase();
      const storedUid = localStorage.getItem('rtdb_session_uid');
      if (storedUid && database) {
        await loadUserProfileAndBalance(storedUid);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const refreshUserData = async () => {
    if (profile?.uid) {
      await loadUserProfileAndBalance(profile.uid);
    }
  };

  const login = async (identifier: string, pass: string) => {
    if (!identifier.trim() || !pass.trim()) {
      return { success: false, error: 'Veuillez renseigner votre identifiant (e-mail / CIN / téléphone) et mot de passe.' };
    }
    if (!database) {
      return { success: false, error: 'Connexion à la base de données impossible.' };
    }

    try {
      const snap = await get(ref(database, 'users'));
      if (!snap.exists()) {
        return { success: false, error: 'Aucun utilisateur trouvé dans la base de données.' };
      }

      const usersObj = snap.val();
      let matchedUid: string | null = null;
      let matchedUserData: any = null;

      const trimmedIdent = identifier.trim().toLowerCase();

      for (const [key, userVal] of Object.entries<any>(usersObj)) {
        if (!userVal) continue;
        const keyMatch = key.toLowerCase() === trimmedIdent;
        const emailMatch = userVal.email && userVal.email.toLowerCase() === trimmedIdent;
        const cinMatch = userVal.cin && String(userVal.cin).toLowerCase() === trimmedIdent;
        const phoneMatch = userVal.phone && String(userVal.phone).replace(/\s+/g, '') === trimmedIdent.replace(/\s+/g, '');

        if (keyMatch || emailMatch || cinMatch || phoneMatch) {
          if (String(userVal.password) === String(pass.trim())) {
            matchedUid = key;
            matchedUserData = userVal;
            break;
          }
        }
      }

      if (!matchedUid || !matchedUserData) {
        return { success: false, error: 'Identifiants ou mot de passe incorrects. Veuillez vérifier vos données dans la base.' };
      }

      const formattedProfile: UserProfile = {
        uid: matchedUid,
        email: matchedUserData.email || `${matchedUid}@company.com`,
        displayName: matchedUserData.displayName || matchedUserData.name || matchedUid.toUpperCase(),
        role: matchedUserData.role || 'USER',
        cin: matchedUserData.cin || '',
        phone: matchedUserData.phone || '',
        departmentName: matchedUserData.departmentName || 'Service Entreprise',
        jobTitle: matchedUserData.jobTitle || 'Collaborateur',
        permissions: matchedUserData.permissions || {},
      };

      setProfile(formattedProfile);
      localStorage.setItem('rtdb_session_uid', matchedUid);

      const bal = await getUserBalance(matchedUid);
      setBalance(bal);

      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return { success: false, error: err.message || 'Erreur lors de l’authentification.' };
    }
  };

  const logout = async () => {
    localStorage.removeItem('rtdb_session_uid');
    setProfile(null);
    setBalance(null);
  };

  return (
    <AuthContext.Provider value={{
      user: profile,
      profile,
      balance,
      loading,
      login,
      logout,
      refreshUserData,
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
