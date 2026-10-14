import { ref, get, update, query, orderByChild, equalTo } from 'firebase/database';
import { database, isFirebaseConfigured } from './firebase';
import { auditService } from './auditService';
import { UserMetadata, AccountStatus } from '../types';
import { storageManager } from '../offline/storage/StorageManager';
import { generateSalt, hashPasswordWithSalt } from '../offline/security/cryptoUtils';
import { OfflineCredential } from '../offline/types';
import { syncLogger } from '../offline/sync/syncLogger';
import { syncEngine } from '../offline/sync/syncEngine';

type AuthListener = (user: UserMetadata | null) => void;

const OFFLINE_VALIDITY_DAYS = 30;

class AuthService {
  private currentUser: UserMetadata | null = null;
  private listeners: Set<AuthListener> = new Set();
  private isOfflineMode = false;

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

  public isSessionOffline(): boolean {
    return this.isOfflineMode;
  }

  public async signIn(email: string, pass: string): Promise<{ user: UserMetadata; status: AccountStatus }> {
    const cleanEmail = email.trim().toLowerCase();
    const isNavigatorOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Si l'appareil est hors ligne ou Firebase injoignable, basculer sur l'authentification locale sécurisée
    if (!isNavigatorOnline) {
      return await this.signInOffline(cleanEmail, pass);
    }

    try {
      return await this.signInOnline(cleanEmail, pass);
    } catch (err: any) {
      // Si l'erreur est une erreur réseau (Firebase inaccessible, DNS, etc.), tenter le fallback hors ligne
      if (
        err.message?.includes('network') ||
        err.message?.includes('fetch') ||
        err.message?.includes('Failed to get document') ||
        err.message?.includes('offline') ||
        err.code === 'unavailable'
      ) {
        syncLogger.log('warn', 'Connexion Firebase indisponible — Tentative d\'authentification locale hors ligne', 'LOCAL');
        return await this.signInOffline(cleanEmail, pass);
      }
      throw err;
    }
  }

  // --- AUTHENTIFICATION EN LIGNE (FIREBASE RTDB) ---

  private async signInOnline(cleanEmail: string, pass: string): Promise<{ user: UserMetadata; status: AccountStatus }> {
    if (!isFirebaseConfigured || !database) {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, undefined, 'Base de données non configurée');
      throw new Error("Le service de base de données n'est pas configuré. Veuillez contacter l'administrateur.");
    }

    const usersRef = ref(database, 'users');
    let foundUid = '';
    let rawData: any = null;

    // 1. Recherche directe par clé/username (ex: 'admin', 'feno', etc.)
    const directSnap = await get(ref(database, `users/${cleanEmail}`));
    if (directSnap.exists()) {
      foundUid = directSnap.key!;
      rawData = directSnap.val();
    } else {
      // 2. Recherche par e-mail
      const emailQuery = query(usersRef, orderByChild('email'), equalTo(cleanEmail));
      const emailSnap = await get(emailQuery);

      if (emailSnap.exists()) {
        emailSnap.forEach((child) => {
          foundUid = child.key!;
          rawData = child.val();
        });
      } else {
        // 3. Recherche par matricule ou parcours complet
        const allUsersSnap = await get(usersRef);
        if (allUsersSnap.exists()) {
          const allData = allUsersSnap.val();
          for (const key of Object.keys(allData)) {
            const u = allData[key];
            if (
              key.toLowerCase() === cleanEmail ||
              u.email?.toLowerCase() === cleanEmail ||
              u.matricule?.toLowerCase() === cleanEmail ||
              u.username?.toLowerCase() === cleanEmail
            ) {
              foundUid = key;
              rawData = u;
              break;
            }
          }
        }
      }
    }

    if (!rawData) {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, undefined, 'Utilisateur introuvable dans RTDB');
      throw new Error('Identifiant ou mot de passe incorrect.');
    }

    if (!rawData || rawData.password !== pass) {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, foundUid, 'Mot de passe incorrect');
      throw new Error('Adresse e-mail ou mot de passe incorrect.');
    }

    const role = rawData.role || (rawData.admin === true || rawData.isAdmin === true ? 'ADMIN' : 'MEMBER');
    const status: AccountStatus = rawData.accountStatus || rawData.status || 'ACTIVE';

    if (status === 'DISABLED') {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, foundUid, 'Compte désactivé');
      throw new Error("Ce compte a été désactivé par l'administration.");
    }

    if (status === 'SUSPENDED') {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, foundUid, 'Compte suspendu');
      throw new Error("Votre compte a été suspendu. Veuillez contacter l'administration.");
    }

    if (status === 'PENDING') {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, foundUid, 'Compte en attente');
      throw new Error("Votre compte est en attente d'approbation par l'administration.");
    }

    if (status === 'REJECTED') {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, foundUid, 'Compte rejeté');
      throw new Error("Votre demande d'adhésion a été rejetée.");
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
    this.isOfflineMode = false;
    localStorage.setItem('amm_authenticated_user', JSON.stringify(metadata));
    this.notifyListeners();
    auditService.logEvent('LOGIN_SUCCESS', metadata.email, metadata.uid, 'Connexion RTDB en ligne réussie');

    // Sauvegarde sécurisée des identifiants hors-ligne (hachage salé, jamais mot de passe clair)
    try {
      const adapter = await storageManager.getAdapter();
      const salt = generateSalt(16);
      const hash = await hashPasswordWithSalt(pass, salt);

      const credentialRecord: OfflineCredential = {
        uid: foundUid,
        email: cleanEmail,
        passwordHash: hash,
        salt,
        displayName: metadata.displayName,
        role: metadata.role,
        status: metadata.status,
        permissions: metadata.permissions || [],
        userData: metadata,
        cachedAt: Date.now(),
        offlineExpiresAt: Date.now() + OFFLINE_VALIDITY_DAYS * 24 * 60 * 60 * 1000
      };

      await adapter.put('offline_credentials', cleanEmail, credentialRecord);
      syncLogger.log('success', `Identifiants hors-ligne enregistrés pour ${cleanEmail} (validité : ${OFFLINE_VALIDITY_DAYS}j)`, 'LOCAL');

      // Pré-chargement en arrière-plan des données pour l'utilisation hors ligne
      syncEngine.pullRemoteChanges().catch((e) => console.warn('Cache warm-up warning:', e));
    } catch (e) {
      console.warn('Erreur lors de la mise en cache des identifiants hors-ligne:', e);
    }

    return { user: metadata, status: metadata.status };
  }

  // --- AUTHENTIFICATION HORS LIGNE SÉCURISÉE (PHASE 3) ---

  private async signInOffline(cleanEmail: string, pass: string): Promise<{ user: UserMetadata; status: AccountStatus }> {
    const adapter = await storageManager.getAdapter();
    const storedCred = await adapter.get<OfflineCredential>('offline_credentials', cleanEmail);

    if (!storedCred) {
      throw new Error(
        "Aucun compte n'a encore été initialisé sur cet appareil pour cette adresse. Une première connexion en ligne (Internet ou réseau local) est requise pour synchroniser vos accès."
      );
    }

    // Vérification de la durée d'expiration hors ligne
    if (Date.now() > storedCred.offlineExpiresAt) {
      throw new Error(
        `Votre autorisation d'accès hors ligne a expiré (validité de ${OFFLINE_VALIDITY_DAYS} jours dépassée). Veuillez vous connecter au moins une fois à Internet ou au serveur local pour renouveler votre accès.`
      );
    }

    // Calcul et vérification du hachage salé
    const inputHash = await hashPasswordWithSalt(pass, storedCred.salt);
    if (inputHash !== storedCred.passwordHash) {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, storedCred.uid, 'Mot de passe incorrect hors ligne');
      throw new Error('Adresse e-mail ou mot de passe incorrect.');
    }

    if (storedCred.status === 'DISABLED' || storedCred.status === 'SUSPENDED') {
      throw new Error("Ce compte n'est pas autorisé.");
    }

    const metadata: UserMetadata = storedCred.userData;
    this.currentUser = metadata;
    this.isOfflineMode = true;
    localStorage.setItem('amm_authenticated_user', JSON.stringify(metadata));
    this.notifyListeners();

    syncLogger.log('success', `Connexion hors ligne accordée à ${metadata.displayName} (${metadata.role})`, 'LOCAL');
    return { user: metadata, status: metadata.status };
  }

  public async sendResetPasswordEmail(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    auditService.logEvent('PASSWORD_RESET_REQUEST', cleanEmail, undefined, 'Demande de réinitialisation');
    throw new Error("La réinitialisation par e-mail n'est pas disponible pour ce mode de connexion. Veuillez contacter l'administrateur.");
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

      // Mettre à jour l'empreinte locale
      const adapter = await storageManager.getAdapter();
      const salt = generateSalt(16);
      const hash = await hashPasswordWithSalt(newPass, salt);
      const storedCred = await adapter.get<OfflineCredential>('offline_credentials', email.toLowerCase());
      if (storedCred) {
        storedCred.passwordHash = hash;
        storedCred.salt = salt;
        await adapter.put('offline_credentials', email.toLowerCase(), storedCred);
      }

      auditService.logEvent('PASSWORD_UPDATED', email, uid, 'Mot de passe mis à jour dans RTDB');
    } catch {
      throw new Error('Erreur lors de la mise à jour du mot de passe.');
    }
  }

  public async signOut(): Promise<void> {
    if (this.currentUser) {
      auditService.logEvent('LOGOUT', this.currentUser.email, this.currentUser.uid, 'Déconnexion');
    }

    this.currentUser = null;
    this.isOfflineMode = false;
    localStorage.removeItem('amm_authenticated_user');
    this.notifyListeners();
  }
}

export const authService = new AuthService();