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
   * Real Authentication Login against Firebase Auth with DB Sync Fallback
   */
  public static async loginWithFirebase(email: string, pass: string): Promise<UserProfile> {
    const cleanEmail = email.trim();
    let firebaseUser: User;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      firebaseUser = userCredential.user;
    } catch (authError: any) {
      // Check if user exists in Realtime Database (pre-provisioned by admin/system)
      const usersRef = ref(db, USERS_PATH);
      const snapshot = await get(usersRef);
      const allUsersVal = snapshot.val() || {};
      const userEntries = Object.entries(allUsersVal) as [string, UserProfile][];
      
      const existingEntry = userEntries.find(([_, profile]) => profile.email?.toLowerCase() === cleanEmail.toLowerCase());

      if (existingEntry) {
        const [oldUid, existingProfile] = existingEntry;
        try {
          // Automatically create the Auth account if it only exists in the Realtime Database
          const newUserCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          firebaseUser = newUserCredential.user;
          await updateProfile(firebaseUser, { displayName: existingProfile.displayName });

          // Update UID reference in Database if it changed
          if (oldUid !== firebaseUser.uid) {
            existingProfile.uid = firebaseUser.uid;
            await set(ref(db, `${USERS_PATH}/${firebaseUser.uid}`), existingProfile);
          }
        } catch (creationError: any) {
          if (creationError.code === 'auth/email-already-in-use') {
            throw new Error('Identifiants incorrects (mot de passe invalide). Veuillez vérifier votre mot de passe.');
          }
          throw creationError;
        }
      } else {
        const isFirstUser = Object.keys(allUsersVal).length === 0;

        if (
          isFirstUser &&
          (authError.code === 'auth/invalid-credential' ||
           authError.code === 'auth/user-not-found' ||
           authError.code === 'auth/wrong-password')
        ) {
          // Create initial Master ADMIN in Firebase Auth
          const newUserCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          firebaseUser = newUserCredential.user;

          await updateProfile(firebaseUser, { displayName: cleanEmail.split('@')[0] });

          const adminProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || cleanEmail,
            displayName: cleanEmail.split('@')[0],
            role: 'ADMIN',
            status: 'ACTIVE',
            department: 'Direction générale',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };

          await set(ref(db, `${USERS_PATH}/${firebaseUser.uid}`), adminProfile);

          await this.logAuditAction(
            adminProfile.uid,
            adminProfile.email,
            adminProfile.displayName,
            adminProfile.role,
            'INITIALISATION_ADMIN',
            'Initialisation automatique du premier compte Administrateur système'
          );

          return adminProfile;
        }

        if (
          authError.code === 'auth/invalid-credential' ||
          authError.code === 'auth/user-not-found' ||
          authError.code === 'auth/wrong-password'
        ) {
          throw new Error(
            'Identifiants incorrects (email ou mot de passe invalide). Veuillez vérifier vos saisies ou contacter votre administrateur système pour faire pré-provisionner votre accès.'
          );
        } else if (authError.code === 'auth/too-many-requests') {
          throw new Error('Accès temporairement bloqué suite à de trop nombreuses tentatives infructueuses.');
        } else {
          throw authError;
        }
      }
    }

    // Fetch existing database user profile
    let profile = await this.getUserProfile(firebaseUser.uid);

    // Security check 1: If account exists and is DISABLED, sign out immediately
    if (profile && profile.status === 'DISABLED') {
      await signOut(auth);
      throw new Error('Votre compte utilisateur a été désactivé par l’administrateur système.');
    }

    // Security check 2: Verify role is within the 5 authorized roles
    const ALLOWED_ROLES: UserRole[] = ['ADMIN', 'DIRECTEUR', 'COMPTABLE', 'GESTIONNAIRE', 'ASSISTANT COMPTABLE'];
    if (profile && !ALLOWED_ROLES.includes(profile.role)) {
      await signOut(auth);
      throw new Error(`Accès refusé. Le rôle '${profile.role}' n'est pas autorisé.`);
    }

    // Security check 3: If profile does not exist in Database yet
    if (!profile) {
      const usersRef = ref(db, USERS_PATH);
      const snapshot = await get(usersRef);
      const isFirstUser = !snapshot.exists() || Object.keys(snapshot.val() || {}).length === 0;

      if (isFirstUser) {
        profile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || cleanEmail,
          displayName: firebaseUser.displayName || cleanEmail.split('@')[0],
          role: 'ADMIN',
          status: 'ACTIVE',
          department: 'Direction générale',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
        await set(ref(db, `${USERS_PATH}/${firebaseUser.uid}`), profile);
      } else {
        await signOut(auth);
        throw new Error('Accès refusé. Ce compte n’a pas été pré-provisionné dans la base de données par l’administrateur système.');
      }
    } else {
      // Update last login timestamp
      const lastLoginAt = new Date().toISOString();
      await update(ref(db, `${USERS_PATH}/${firebaseUser.uid}`), { lastLoginAt });
      profile.lastLoginAt = lastLoginAt;
    }

    // Audit Log
    await this.logAuditAction(
      profile.uid,
      profile.email,
      profile.displayName,
      profile.role,
      'CONNEXION',
      'Connexion réussie au système SITE-AMM'
    );

    return profile;
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
    await signOut(auth);
  }
}