export interface AuthUser {
  uid: string;
  email?: string | null;
  phone?: string | null;
  displayName?: string | null;
  emailVerified?: boolean;
  lastLoginAt?: string | null;
}

export type AuthState = {
  user: AuthUser | null;
  token?: string;
};

export interface IAuthRepository {
  signInWithEmail(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  sendPasswordResetEmail(email: string): Promise<void>;
  updatePassword(uid: string, newPassword: string): Promise<void>;
  verifyIdToken(idToken: string): Promise<AuthUser>;
}
