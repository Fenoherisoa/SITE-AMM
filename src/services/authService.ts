import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { database, isFirebaseConfigured } from './firebase';
import { auditService } from './auditService';
import { UserMetadata, AccountStatus } from '../types';

type AuthListener = (user: UserMetadata | null) => void;

class AuthService {
  private currentUser: UserMetadata | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    this.initAuth();
  }

  private initAuth() {
    const savedUser = localStorage.getItem('amm_authenticated_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
      } catch {
        localStorage.removeItem('amm_authenticated_user');
      }
    }
    this.notifyListeners();
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

  public async signIn(email: string, pass: string): Promise<{ user: UserMetadata; status: AccountStatus }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!isFirebaseConfigured || !database) {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, undefined, 'Base de données non configurée');
      throw new Error('Le service de base de données n\'est pas configuré. Veuillez contacter l\'administrateur.');
    }

    try {
      // Fikarohana mivantana amin'ny Realtime Database araka ny e-mail
      const usersRef = ref(database, 'users');
      const emailQuery = query(usersRef, orderByChild('email'), equalTo(cleanEmail));
      const snapshot = await get(emailQuery);

      if (!snapshot.exists()) {
        auditService.logEvent('LOGIN_FAILURE', cleanEmail, undefined, 'Utilisateur introuvable dans RTDB');
        throw new Error('Adresse e-mail ou mot de passe incorrect.');
      }

      let foundUid = '';
      let rawData: any = null;

      snapshot.forEach((childSnapshot) => {
        foundUid = childSnapshot.key!;
        rawData = childSnapshot.val();
      });

      // Famaritana sy fanamarinana ny teny miafina (password)
      if (!rawData || rawData.password !== pass) {
        auditService.logEvent('LOGIN_FAILURE', cleanEmail, foundUid, 'Mot de passe incorrect');
        throw new Error('Adresse e-mail ou mot de passe incorrect.');
      }

      const role = rawData.role || (rawData.admin === true || rawData.isAdmin === true ? 'ADMIN' : 'MEMBER');
      const status: AccountStatus = rawData.accountStatus || rawData.status || 'ACTIVE';

      if (status === 'DISABLED') {
        auditService.logEvent('LOGIN_FAILURE', cleanEmail, foundUid, 'Compte désactivé');
        throw new Error('Ce compte a été désactivé par l\'administration.');
      }

      if (status === 'SUSPENDED') {
        auditService.logEvent('LOGIN_FAILURE', cleanEmail, foundUid, 'Compte suspendu');
        throw new Error('Votre compte a été suspendu. Veuillez contacter l\'administration.');
      }

      if (status === 'PENDING') {
        auditService.logEvent('LOGIN_FAILURE', cleanEmail, foundUid, 'Compte en attente');
        throw new Error('Votre compte est en attente d\'approbation par l\'administration.');
      }

      if (status === 'REJECTED') {
        auditService.logEvent('LOGIN_FAILURE', cleanEmail, foundUid, 'Compte rejeté');
        throw new Error('Votre demande d\'adhésion a été rejetée.');
      }

      const permissions: string[] = Array.isArray(rawData.permissions) 
        ? rawData.permissions 
        : typeof rawData.permissions === 'object' && rawData.permissions !== null
        ? Object.keys(rawData.permissions)
        : [];

      const metadata: UserMetadata = {
        uid: foundUid,
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

      this.currentUser = metadata;
      localStorage.setItem('amm_authenticated_user', JSON.stringify(metadata));
      this.notifyListeners();
      auditService.logEvent('LOGIN_SUCCESS', metadata.email, metadata.uid, 'Connexion RTDB réussie');

      return { user: metadata, status: metadata.status };
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Impossible de se connecter. Veuillez vérifier les informations fournies.');
    }
  }

  public async sendResetPasswordEmail(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    auditService.logEvent('PASSWORD_RESET_REQUEST', cleanEmail, undefined, 'Demande de réinitialisation');
    throw new Error('La réinitialisation par e-mail n\'est pas disponible pour ce mode de connexion. Veuillez contacter l\'administrateur.');
  }

  public async updateCurrentPassword(_currentPass: string, newPass: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Vous devez être connecté pour modifier votre mot de passe.');
    }

    const uid = this.currentUser.uid;
    const email = this.currentUser.email;

    if (!isFirebaseConfigured || !database) {
      throw new Error('Base de données non configurée.');
    }

    try {
      const userRef = ref(database, `users/${uid}`);
      await update(userRef, { password: newPass });
      auditService.logEvent('PASSWORD_UPDATED', email, uid, 'Mot de passe mis à jour dans RTDB');
    } catch (err: unknown) {
      throw new Error('Erreur lors de la mise à jour du mot de passe.');
    }
  }

  public async signOut(): Promise<void> {
    if (this.currentUser) {
      auditService.logEvent('LOGOUT', this.currentUser.email, this.currentUser.uid, 'Déconnexion');
    }

    this.currentUser = null;
    localStorage.removeItem('amm_authenticated_user');
    this.notifyListeners();
  }
}

export const authService = new AuthService();