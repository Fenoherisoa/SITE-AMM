import { IAuthRepository, AuthUser } from '../../auth/AuthTypes';

// Skeleton adapter for Firebase Auth. Do NOT initialize or embed credentials here.
// Production should instantiate this with a firebase-admin `auth()` instance.
export class FirebaseAuthAdapter implements IAuthRepository {
  private auth: any;

  constructor(auth?: any) {
    this.auth = auth;
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    if (!this.auth) throw new Error('Firebase Auth not initialized');
    const userRecord = await this.auth.getUserByEmail(email);
    // Note: server-side signInWithEmail is typically handled by client SDK; on server use verifyIdToken flows.
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || null,
      emailVerified: userRecord.emailVerified || false,
      lastLoginAt: userRecord.metadata?.lastSignInTime || null
    };
  }

  async signOut(): Promise<void> {
    // No-op on server side; client signs out locally.
    return;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // Server cannot get current user without token; leave as null by default.
    return null;
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    if (!this.auth) throw new Error('Firebase Auth not initialized');
    // On server, generate password reset link and send using email provider.
    await this.auth.generatePasswordResetLink(email);
  }

  async updatePassword(uid: string, newPassword: string): Promise<void> {
    if (!this.auth) throw new Error('Firebase Auth not initialized');
    await this.auth.updateUser(uid, { password: newPassword });
  }

  async verifyIdToken(idToken: string): Promise<AuthUser> {
    if (!this.auth) throw new Error('Firebase Auth not initialized');
    const decoded = await this.auth.verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email || null,
      displayName: decoded.name || null,
      emailVerified: decoded.email_verified || false,
      lastLoginAt: null
    };
  }
}
