import { UserRepository } from '../interfaces/UserRepository';
import { User } from '../../models/User';

// NOTE: This is a Firebase RTDB implementation skeleton. It intentionally does not
// initialize any Firebase SDK or load credentials. In production, initialize
// firebase-admin in a secure way using environment variables and service account.

export class FirebaseUserRepository implements UserRepository {
  private db: any; // placeholder for firebase-db instance

  constructor(db?: any) {
    this.db = db; // allow injection of firebase database instance for tests
  }

  async getUserByUid(uid: string): Promise<User | null> {
    if (!this.db) return null;
    const snap = await this.db.ref(`/users/${uid}`).once('value');
    const data = snap.val();
    if (!data) return null;
    return this.mapLegacyToUser(uid, data);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.db) return null;
    const snap = await this.db.ref('/users').orderByChild('email').equalTo(email).once('value');
    const val = snap.val();
    if (!val) return null;
    const key = Object.keys(val)[0];
    return this.mapLegacyToUser(key, val[key]);
  }

  async updateUserMetadata(uid: string, patch: Partial<User>): Promise<void> {
    if (!this.db) return;
    const safePatch = { ...patch };
    // Never write password fields
    delete (safePatch as any).password;
    await this.db.ref(`/users/${uid}`).update(safePatch);
  }

  async updateAccountStatus(uid: string, status: User['accountStatus']): Promise<void> {
    if (!this.db) return;
    await this.db.ref(`/users/${uid}`).update({ accountStatus: status, updatedAt: new Date().toISOString() });
  }

  async updatePortalAccess(uid: string, portalAccess: User['portalAccess']): Promise<void> {
    if (!this.db) return;
    await this.db.ref(`/users/${uid}`).update({ portalAccess, updatedAt: new Date().toISOString() });
  }

  async updateRoles(uid: string, roles: string[]): Promise<void> {
    if (!this.db) return;
    await this.db.ref(`/users/${uid}`).update({ role: roles.join(','), updatedAt: new Date().toISOString() });
  }

  async updatePermissions(uid: string, permissions: Record<string, boolean> | string[]): Promise<void> {
    if (!this.db) return;
    await this.db.ref(`/users/${uid}`).update({ permissions, updatedAt: new Date().toISOString() });
  }

  async recordLastLogin(uid: string, when: string): Promise<void> {
    if (!this.db) return;
    await this.db.ref(`/users/${uid}`).update({ lastLoginAt: when });
  }

  private mapLegacyToUser(key: string, legacy: any): User {
    return {
      uid: key,
      username: key,
      email: legacy.email || undefined,
      phone: legacy.phone || legacy.phone || undefined,
      role: legacy.role || undefined,
      permissions: legacy.permissions || undefined,
      accountStatus: (legacy.status as any) || undefined,
      portalAccess: legacy.portalAccess || undefined,
      profile: {},
      createdAt: legacy.createdAt || undefined,
      updatedAt: legacy.updatedAt || undefined,
      lastLoginAt: legacy.lastLoginAt || undefined
    };
  }
}
