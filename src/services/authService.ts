import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  updatePassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database, isFirebaseConfigured } from './firebase';
import { auditService } from './auditService';
import { UserMetadata, AccountStatus } from '../types';

type AuthListener = (user: UserMetadata | null) => void;

class AuthService {
  private currentUser: UserMetadata | null = null;
  private listeners: Set<AuthListener> = new Set();
  private isInitialized = false;

  constructor() {
    this.initAuthListener();
  }

  private initAuthListener() {
    // Check saved local session first
    const savedUser = localStorage.getItem('amm_authenticated_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch {
        localStorage.removeItem('amm_authenticated_user');
      }
    }

    if (isFirebaseConfigured && auth) {
      onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const meta = await this.fetchUserMetadataFromRtdb(fbUser.uid, fbUser.email || '');
          // Enforce active/approved account status
          if (meta.status === 'DISABLED' || meta.status === 'SUSPENDED') {
            await this.signOut();
            this.currentUser = null;
          } else {
            this.currentUser = meta;
            localStorage.setItem('amm_authenticated_user', JSON.stringify(meta));
          }
        } else {
          this.currentUser = null;
          localStorage.removeItem('amm_authenticated_user');
        }
        this.notifyListeners();
      });
    }

    this.isInitialized = true;
    this.notifyListeners();
  }

  /**
   * Helper to retrieve user metadata from RTDB /users/{uid} safely, ignoring any password field
   */
  private async fetchUserMetadataFromRtdb(uid: string, defaultEmail: string): Promise<UserMetadata> {
    const cleanEmail = defaultEmail.trim().toLowerCase();

    if (isFirebaseConfigured && database) {
      try {
        const userRef = ref(database, `users/${uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const rawData = snapshot.val();
          
          // CRITICAL: Explicitly NEVER read, copy or expose rawData.password!
          const role = rawData.role || (rawData.isAdmin ? 'ADMIN' : 'MEMBER');
          const status: AccountStatus = rawData.accountStatus || rawData.status || 'ACTIVE';
          const permissions: string[] = Array.isArray(rawData.permissions) 
            ? rawData.permissions 
            : typeof rawData.permissions === 'object' && rawData.permissions !== null
            ? Object.keys(rawData.permissions)
            : [];

          return {
            uid,
            email: rawData.email || cleanEmail,
            displayName: rawData.username || rawData.displayName || rawData.fullName || cleanEmail.split('@')[0],
            role: role as UserMetadata['role'],
            status,
            permissions,
            department: rawData.department || rawData.sector || '',
            memberSince: rawData.memberSince || rawData.registrationDate || new Date().toISOString().split('T')[0],
            phone: rawData.phone || '',
            cin: rawData.cin || '',
            location: rawData.location || rawData.address || '',
            portalAccess: rawData.portalAccess !== false,
            linkedEmployeeId: rawData.linkedEmployeeId || rawData.employeeId || ''
          };
        }
      } catch (err) {
        console.warn(`[AuthService] Could not load RTDB metadata for ${uid}:`, err);
      }
    }

    // Default metadata construct if RTDB node doesn't exist yet
    return {
      uid,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0] || 'Membre AMM',
      role: 'MEMBER',
      status: 'ACTIVE',
      permissions: ['members.read'],
      memberSince: new Date().toISOString().split('T')[0]
    };
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  public getCurrentUser(): UserMetadata | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  public isApprovedOrActive(): boolean {
    return (
      this.currentUser !== null &&
      (this.currentUser.status === 'ACTIVE' || this.currentUser.status === 'APPROVED')
    );
  }

  /**
   * Authenticate user strictly against Firebase Auth
   */
  public async signIn(email: string, pass: string): Promise<{ user: UserMetadata; status: AccountStatus }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!isFirebaseConfigured || !auth) {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, undefined, 'Service Firebase non configuré');
      throw new Error('Le service d\'authentification n\'est pas configuré. Veuillez contacter l\'administrateur.');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const fbUser = userCredential.user;
      
      const metadata = await this.fetchUserMetadataFromRtdb(fbUser.uid, fbUser.email || cleanEmail);

      // Check account lifecycle status
      if (metadata.status === 'DISABLED') {
        auditService.logEvent('LOGIN_FAILURE', cleanEmail, fbUser.uid, 'Tentative de connexion sur un compte désactivé');
        await this.signOut();
        throw new Error('Ce compte a été désactivé par l\'administration.');
      }

      if (metadata.status === 'SUSPENDED') {
        auditService.logEvent('LOGIN_FAILURE', cleanEmail, fbUser.uid, 'Tentative de connexion sur un compte suspendu');
        await this.signOut();
        throw new Error('Votre compte a été suspendu. Veuillez contacter l\'administration.');
      }

      if (metadata.status === 'PENDING') {
        auditService.logEvent('LOGIN_FAILURE', cleanEmail, fbUser.uid, 'Tentative de connexion sur un compte en attente');
        await this.signOut();
        throw new Error('Votre compte est en attente d\'approbation par l\'administration.');
      }

      if (metadata.status === 'REJECTED') {
        auditService.logEvent('LOGIN_FAILURE', cleanEmail, fbUser.uid, 'Tentative de connexion sur un compte rejeté');
        await this.signOut();
        throw new Error('Votre demande d\'adhésion a été rejetée.');
      }

      this.currentUser = metadata;
      localStorage.setItem('amm_authenticated_user', JSON.stringify(metadata));
      this.notifyListeners();
      auditService.logEvent('LOGIN_SUCCESS', metadata.email, metadata.uid, 'Connexion Firebase réussie');
      return { user: metadata, status: metadata.status };
    } catch (err: unknown) {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, undefined, 'Échec authentification Firebase');
      if (err instanceof Error && (err.message.includes('désactivé') || err.message.includes('attente') || err.message.includes('suspendu') || err.message.includes('rejetée'))) {
        throw err;
      }
      throw new Error(this.mapFirebaseError(err));
    }
  }

  /**
   * Send Password Reset Link via Firebase Auth
   */
  public async sendResetPasswordEmail(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    auditService.logEvent('PASSWORD_RESET_REQUEST', cleanEmail, undefined, 'Demande de réinitialisation envoyée');

    if (!isFirebaseConfigured || !auth) {
      throw new Error('Le service Firebase n\'est pas disponible.');
    }

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: unknown) {
      throw new Error(this.mapFirebaseError(err));
    }
  }

  /**
   * Update current authenticated user password in Firebase Auth
   */
  public async updateCurrentPassword(_currentPass: string, newPass: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Vous devez être connecté pour modifier votre mot de passe.');
    }

    const email = this.currentUser.email;
    const uid = this.currentUser.uid;

    if (!isFirebaseConfigured || !auth || !auth.currentUser) {
      throw new Error('Session d\'authentification Firebase non valide.');
    }

    try {
      await updatePassword(auth.currentUser, newPass);
      auditService.logEvent('PASSWORD_UPDATED', email, uid, 'Mot de passe Firebase mis à jour');
    } catch (err: unknown) {
      throw new Error(this.mapFirebaseError(err));
    }
  }

  /**
   * Sign out current user from Firebase Auth
   */
  public async signOut(): Promise<void> {
    if (this.currentUser) {
      auditService.logEvent('LOGOUT', this.currentUser.email, this.currentUser.uid, 'Déconnexion utilisateur');
    }

    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('[AuthService] Firebase signout error:', err);
      }
    }

    this.currentUser = null;
    localStorage.removeItem('amm_authenticated_user');
    this.notifyListeners();
  }

  private mapFirebaseError(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: string }).code;
      switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return 'Adresse e-mail ou mot de passe incorrect.';
        case 'auth/too-many-requests':
          return 'Accès temporairement bloqué suite à plusieurs tentatives infructueuses. Veuillez réessayer plus tard.';
        case 'auth/user-disabled':
          return 'Ce compte a été désactivé par l\'administration.';
        case 'auth/invalid-email':
          return 'Adresse e-mail invalide.';
        case 'auth/weak-password':
          return 'Le mot de passe doit comporter au moins 6 caractères.';
        case 'auth/network-request-failed':
          return 'Erreur de connexion réseau. Veuillez vérifier votre connexion Internet.';
        default:
          return 'Une erreur d\'authentification s\'est produite. Veuillez vérifier vos identifiants.';
      }
    }
    return 'Impossible de se connecter. Veuillez vérifier vos identifiants.';
  }
}

export const authService = new AuthService();
