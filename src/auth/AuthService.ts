import { IAuthRepository, AuthUser } from './AuthTypes';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';

export class AuthService {
  private authRepo: IAuthRepository;
  private userRepo: IUserRepository;

  constructor(authRepo: IAuthRepository, userRepo: IUserRepository) {
    this.authRepo = authRepo;
    this.userRepo = userRepo;
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const user = await this.authRepo.signInWithEmail(email, password);
    // record last login in metadata repository (do not log sensitive data)
    try {
      await this.userRepo.recordLastLogin(user.uid, new Date().toISOString());
    } catch (e) {
      // swallow to avoid failing authentication on audit write issues
    }
    return user;
  }

  async signOut(): Promise<void> {
    await this.authRepo.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.authRepo.getCurrentUser();
  }

  async sendPasswordReset(email: string): Promise<void> {
    // To avoid account enumeration, caller should use a uniform response regardless of existence
    await this.authRepo.sendPasswordResetEmail(email);
  }

  async updatePassword(uid: string, newPassword: string): Promise<void> {
    await this.authRepo.updatePassword(uid, newPassword);
  }

  async verifyAuthentication(idToken: string): Promise<AuthUser> {
    return this.authRepo.verifyIdToken(idToken);
  }
}
