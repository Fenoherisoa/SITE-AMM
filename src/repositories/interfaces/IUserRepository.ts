import { UserMetadata } from '../../models/UserMetadata';

export interface IUserRepository {
  getByUsername(username: string): Promise<UserMetadata | null>;
  getByUid(uid: string): Promise<UserMetadata | null>;
  list(): Promise<UserMetadata[]>;
  update(usernameOrUid: string, patch: Partial<UserMetadata>): Promise<void>;
  recordLastLogin(uid: string, when: string): Promise<void>;
}
