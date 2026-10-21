import { ref, get, update } from 'firebase/database';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { database, auth, isFirebaseConfigured } from './firebase';
import { auditService } from './auditService';
import { UserMetadata, AccountStatus } from '../types';
import { storageManager } from '../offline/storage/StorageManager';
import { generateSalt, hashPasswordWithSalt } from '../offline/security/cryptoUtils';
import { OfflineCredential } from '../offline/types';
import { syncLogger } from '../offline/sync/syncLogger';
import { syncEngine } from '../offline/sync/syncEngine';

/**
 * Vérifie si une chaîne constitue un segment de clé de chemin Firebase RTDB valide.
 * Les chemins Firebase ne doivent pas être vides et ne peuvent pas contenir '.', '#', '$', '[', ou ']'.
 */
export function isValidFirebaseKey(key: string): boolean {
  return typeof key === 'string' && key.trim().length > 0 && !/[.#$\[\]/]/.test(key);
}

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

    // Synchronisation en temps réel avec Firebase Authentication
    if (auth) {
      onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser && database && isFirebaseConfigured) {
          try {
            const uidSnap = await get(ref(database, `users/${fbUser.uid}`));
            if (uidSnap.exists()) {
              const raw = uidSnap.val();
              if (raw.status === 'DISABLED' || raw.status === 'SUSPENDED') {
                await this.signOut();
                return;
              }
              const role = raw.role || (raw.admin === true || raw.isAdmin === true ? 'ADMIN' : 'MEMBER');
              const status: AccountStatus = raw.accountStatus || raw.status || 'ACTIVE';
              const permissions: string[] = Array.isArray(raw.permissions)
                ? raw.permissions
                : typeof raw.permissions === 'object' && raw.permissions !== null
                ? Object.keys(raw.permissions)
                : [];

              const metadata: UserMetadata = {
                uid: fbUser.uid,
                email: fbUser.email || raw.email || '',
                displayName: raw.displayName || raw.username || raw.fullName || (fbUser.email || '').split('@')[0],
                role: role as UserMetadata['role'],
                status,
                permissions,
                department: raw.department || raw.sector || '',
                memberSince: raw.memberSince || raw.registrationDate || new Date().toISOString().split('T')[0],
                phone: raw.phone || '',
                cin: raw.cin || '',
                location: raw.location || raw.address || '',
                portalAccess: raw.portalAccess !== false,
                linkedEmployeeId: raw.linkedEmployeeId || raw.employeeId || ''
              };

              this.currentUser = metadata;
              localStorage.setItem('amm_authenticated_user', JSON.stringify(metadata));
              this.notifyListeners();
            }
          } catch (e) {
            console.warn('[authService] onAuthStateChanged profil warning:', e);
          }
        }
      });
    }
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

  // --- AUTHENTIFICATION EN LIGNE (FIREBASE AUTH & RTDB) ---

  private async signInOnline(cleanEmail: string, pass: string): Promise<{ user: UserMetadata; status: AccountStatus }> {
    if (!isFirebaseConfigured || !database) {
      auditService.logEvent('LOGIN_FAILURE', cleanEmail, undefined, 'Base de données non configurée');
      throw new Error("Le service de base de données n'est pas configuré. Veuillez contacter l'administrateur.");
    }

    const trimmedInput = cleanEmail.trim().toLowerCase();
    const isEmail = trimmedInput.includes('@');
    let fbAuthUser: User | null = null;
    let foundUid = '';
    let rawData: any = null;

    // 1. Authentification Firebase Authentication officielle si une adresse e-mail est saisie
    if (auth && isEmail) {
      try {
        const userCred = await signInWithEmailAndPassword(auth, trimmedInput, pass);
        fbAuthUser = userCred.user;
        foundUid = userCred.user.uid;
      } catch (authErr: any) {
        const code = authErr?.code;
        if (code === 'auth/too-many-requests') {
          auditService.logEvent('LOGIN_FAILURE', trimmedInput, undefined, 'Trop de tentatives');
          throw new Error('Trop de tentatives infructueuses. Veuillez patienter avant de réessayer.');
        }
        // Pour les autres codes d'erreur (auth/wrong-password, auth/user-not-found, etc.),
        // on poursuivra vers la recherche des profils existants dans RTDB pour compatibilité continue.
      }
    }

    // 2. Si l'utilisateur a été authentifié par Firebase Auth, rechercher son profil sous users/${fbAuthUser.uid}
    if (fbAuthUser) {
      const uidRef = ref(database, `users/${fbAuthUser.uid}`);
      const uidSnap = await get(uidRef);
      if (uidSnap.exists()) {
        rawData = uidSnap.val();
        foundUid = fbAuthUser.uid;
      }
    }

    // 3. Recherche sécurisée dans la base RTDB
    // RÈGLE CRUCIALE : Ne JAMAIS utiliser directement une adresse e-mail dans un chemin ref(database, `users/${path}`)
    if (!rawData) {
      // a) Vérification par clé directe UNIQUEMENT si l'identifiant est une clé Firebase valide (ex: 'admin', 'feno')
      if (isValidFirebaseKey(trimmedInput)) {
        const directSnap = await get(ref(database, `users/${trimmedInput}`));
        if (directSnap.exists()) {
          const val = directSnap.val();
          if (fbAuthUser || String(val.password) === String(pass)) {
            foundUid = directSnap.key!;
            rawData = val;
          }
        }
      }

      // b) Si non trouvé par clé directe, recherche sécurisée par champ 'email', matricule ou nom
      if (!rawData) {
        const usersRef = ref(database, 'users');
        const allUsersSnap = await get(usersRef);

        if (allUsersSnap.exists()) {
          const allData = allUsersSnap.val() as Record<string, any>;
          for (const [key, u] of Object.entries(allData)) {
            if (!u) continue;
            const keyMatch = key.toLowerCase() === trimmedInput;
            const emailMatch = u.email && u.email.toLowerCase() === trimmedInput;
            const matriculeMatch = u.matricule && u.matricule.toLowerCase() === trimmedInput;
            const usernameMatch = u.username && u.username.toLowerCase() === trimmedInput;

            if (keyMatch || emailMatch || matriculeMatch || usernameMatch) {
              if (fbAuthUser) {
                // Utilisateur authentifié via Firebase Auth, on lie son profil existant à son UID stable
                rawData = u;
                foundUid = fbAuthUser.uid;

                // Migration / liaison contrôlée vers users/${fbAuthUser.uid} sans supprimer l'ancienne clé
                try {
                  await update(ref(database, `users/${fbAuthUser.uid}`), {
                    ...u,
                    uid: fbAuthUser.uid,
                    email: fbAuthUser.email || u.email || trimmedInput,
                    lastLoginAt: new Date().toISOString()
                  });
                } catch (migErr) {
                  console.warn('[authService] Migration UID warning:', migErr);
                }
                break;
              } else if (String(u.password) === String(pass)) {
                // Mot de passe RTDB correct
                rawData = u;
                foundUid = u.uid && isValidFirebaseKey(u.uid)
                  ? u.uid
                  : (isValidFirebaseKey(key) ? key : key.replace(/[.#$\[\]]/g, '_'));
                break;
              }
            }
          }
        }
      }
    }

    // 4. Si l'utilisateur est authentifié avec Firebase Auth mais n'a pas encore de profil RTDB,
    // création de sa fiche profil sous users/${fbAuthUser.uid}
    if (!rawData && fbAuthUser) {
      const isAdmin = trimmedInput === 'raveloarison777@gmail.com' || trimmedInput.includes('admin');
      const defaultProfile = {
        uid: fbAuthUser.uid,
        email: fbAuthUser.email || trimmedInput,
        displayName: fbAuthUser.displayName || trimmedInput.split('@')[0],
        role: isAdmin ? 'ADMIN' : 'MEMBER',
        status: 'ACTIVE',
        permissions: isAdmin
          ? ['overview', 'members', 'adhesion', 'accounting', 'operations', 'historique', 'calendar', 'messenger', 'security', 'parametre']
          : ['overview', 'members', 'calendar', 'messenger'],
        department: 'Direction générale',
        memberSince: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        portalAccess: true
      };
      await update(ref(database, `users/${fbAuthUser.uid}`), defaultProfile);
      rawData = defaultProfile;
      foundUid = fbAuthUser.uid;
    }

    // 5. Validation finale des identifiants
    if (!rawData) {
      auditService.logEvent('LOGIN_FAILURE', trimmedInput, undefined, 'Utilisateur introuvable ou mot de passe incorrect');
      throw new Error('Adresse e-mail ou mot de passe incorrect.');
    }

    if (!fbAuthUser && String(rawData.password) !== String(pass)) {
      auditService.logEvent('LOGIN_FAILURE', trimmedInput, foundUid, 'Mot de passe incorrect');
      throw new Error('Adresse e-mail ou mot de passe incorrect.');
    }

    // Si authentifié avec succès via RTDB et qu'il s'agit d'une adresse email,
    // tenter d'associer un compte Firebase Auth pour les futures sessions
    if (!fbAuthUser && auth && isEmail) {
      try {
        const cred = await signInWithEmailAndPassword(auth, trimmedInput, pass);
        foundUid = cred.user.uid;
        await update(ref(database, `users/${cred.user.uid}`), {
          ...rawData,
          uid: cred.user.uid,
          email: trimmedInput,
          lastLoginAt: new Date().toISOString()
        });
      } catch {
        if (pass.length >= 6) {
          try {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const cred = await createUserWithEmailAndPassword(auth, trimmedInput, pass);
            foundUid = cred.user.uid;
            await update(ref(database, `users/${cred.user.uid}`), {
              ...rawData,
              uid: cred.user.uid,
              email: trimmedInput,
              lastLoginAt: new Date().toISOString()
            });
          } catch {
            // Ignorer si la création n'est pas possible dans cette session
          }
        }
      }
    }

    const role = rawData.role || (rawData.admin === true || rawData.isAdmin === true ? 'ADMIN' : 'MEMBER');
    const status: AccountStatus = rawData.accountStatus || rawData.status || 'ACTIVE';

    if (status === 'DISABLED') {
      auditService.logEvent('LOGIN_FAILURE', trimmedInput, foundUid, 'Compte désactivé');
      throw new Error("Ce compte a été désactivé par l'administration.");
    }

    if (status === 'SUSPENDED') {
      auditService.logEvent('LOGIN_FAILURE', trimmedInput, foundUid, 'Compte suspendu');
      throw new Error("Votre compte a été suspendu. Veuillez contacter l'administration.");
    }

    if (status === 'PENDING') {
      auditService.logEvent('LOGIN_FAILURE', trimmedInput, foundUid, 'Compte en attente');
      throw new Error("Votre compte est en attente d'approbation par l'administration.");
    }

    if (status === 'REJECTED') {
      auditService.logEvent('LOGIN_FAILURE', trimmedInput, foundUid, 'Compte rejeté');
      throw new Error("Votre demande d'adhésion a été rejetée.");
    }

    const permissions: string[] = Array.isArray(rawData.permissions)
      ? rawData.permissions
      : typeof rawData.permissions === 'object' && rawData.permissions !== null
      ? Object.keys(rawData.permissions)
      : [];

    const safeUid = isValidFirebaseKey(foundUid)
      ? foundUid
      : (rawData.uid && isValidFirebaseKey(rawData.uid) ? rawData.uid : trimmedInput.replace(/[.#$\[\]@]/g, '_'));

    const metadata: UserMetadata = {
      uid: safeUid,
      email: rawData.email || trimmedInput,
      displayName: rawData.username || rawData.displayName || rawData.fullName || trimmedInput.split('@')[0],
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
    auditService.logEvent('LOGIN_SUCCESS', metadata.email, metadata.uid, 'Connexion réussie');

    // Mettre à jour lastLoginAt sous sa clé UID valide
    if (isValidFirebaseKey(safeUid)) {
      try {
        await update(ref(database, `users/${safeUid}`), {
          lastLoginAt: new Date().toISOString()
        });
      } catch {}
    }

    // Sauvegarde sécurisée des identifiants hors-ligne (hachage salé, jamais mot de passe clair)
    try {
      const adapter = await storageManager.getAdapter();
      const salt = generateSalt(16);
      const hash = await hashPasswordWithSalt(pass, salt);

      const credentialRecord: OfflineCredential = {
        uid: safeUid,
        email: trimmedInput,
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

      await adapter.put('offline_credentials', trimmedInput, credentialRecord);
      syncLogger.log('success', `Identifiants hors-ligne enregistrés pour ${trimmedInput} (validité : ${OFFLINE_VALIDITY_DAYS}j)`, 'LOCAL');

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
    if (auth && isFirebaseConfigured) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        auditService.logEvent('PASSWORD_RESET_REQUEST', cleanEmail, undefined, 'Email de réinitialisation envoyé via Firebase Auth');
        return;
      } catch (authErr: any) {
        console.warn('[authService] sendPasswordResetEmail error:', authErr);
        if (authErr.code === 'auth/user-not-found') {
          throw new Error('Aucun compte n\'est associé à cette adresse e-mail.');
        }
        throw new Error('Impossible d\'envoyer l\'e-mail de réinitialisation. Veuillez vérifier votre adresse.');
      }
    }
    auditService.logEvent('PASSWORD_RESET_REQUEST', cleanEmail, undefined, 'Demande de réinitialisation');
    throw new Error("Le service d'authentification n'est pas disponible.");
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
      if (auth?.currentUser) {
        await updatePassword(auth.currentUser, newPass);
      }

      if (uid && isValidFirebaseKey(uid)) {
        const userRef = ref(database, `users/${uid}`);
        await update(userRef, { password: newPass, updatedAt: new Date().toISOString() });
      }

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

      auditService.logEvent('PASSWORD_UPDATED', email, uid, 'Mot de passe mis à jour');
    } catch (err: any) {
      console.error('[authService] Erreur mise à jour mot de passe:', err);
      if (err.code === 'auth/requires-recent-login') {
        throw new Error('Pour des raisons de sécurité, veuillez vous déconnecter et vous reconnecter avant de changer votre mot de passe.');
      }
      throw new Error(err.message || 'Erreur lors de la mise à jour du mot de passe.');
    }
  }

  public async signOut(): Promise<void> {
    if (this.currentUser) {
      auditService.logEvent('LOGOUT', this.currentUser.email, this.currentUser.uid, 'Déconnexion');
    }

    if (auth) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.warn('[authService] Firebase signOut error:', err);
      }
    }

    this.currentUser = null;
    this.isOfflineMode = false;
    localStorage.removeItem('amm_authenticated_user');
    this.notifyListeners();
  }
}

export const authService = new AuthService();