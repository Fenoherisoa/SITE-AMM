import { User } from '../../models/User';

export interface UserRepository {
  getUserByUid(uid: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUserMetadata(uid: string, patch: Partial<User>): Promise<void>;
  updateAccountStatus(uid: string, status: User['accountStatus']): Promise<void>;
  updatePortalAccess(uid: string, portalAccess: User['portalAccess']): Promise<void>;
  updateRoles(uid: string, roles: string[]): Promise<void>;
  updatePermissions(uid: string, permissions: Record<string, boolean> | string[]): Promise<void>;
  recordLastLogin(uid: string, when: string): Promise<void>;
}
