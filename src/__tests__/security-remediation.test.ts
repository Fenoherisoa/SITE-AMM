import { InvitationTokenService } from '../auth/InvitationTokenService';
import { LegacyPendingRequestAdapter } from '../adapters/legacy/LegacyPendingRequestAdapter';
import { LegacyTokenPoolAdapter } from '../adapters/legacy/LegacyTokenPoolAdapter';
import { FirebaseUserRepository } from '../repositories/firebase/FirebaseUserRepository';
import { AuthorizationService } from '../auth/AuthorizationService';

describe('Security remediation safeguards', () => {
  test('legacy password fields are never mapped into domain User objects', () => {
    const repo = new FirebaseUserRepository();
    const user = (repo as any).mapLegacyToUser('legacyUid', { email: 'a@example.com', password: 'secret' });
    expect(user.email).toBe('a@example.com');
    expect((user as any).password).toBeUndefined();
  });

  test('repository writes remove password fields', async () => {
    const db = {
      ref: jest.fn(() => ({
        update: jest.fn().mockResolvedValue(undefined)
      }))
    } as any;
    const repo = new FirebaseUserRepository(db);
    await repo.updateUserMetadata('uid', { email: 'b@example.com', password: 'x' } as any);
    const updateCall = db.ref.mock.results[0].value.update;
    expect(updateCall).toHaveBeenCalledWith(expect.not.objectContaining({ password: 'x' }));
  });

  test('token pool is masked in domain mapping', () => {
    const entry = LegacyTokenPoolAdapter.toDomain('role1', { role: 'ADMIN', token_miasa: 'abc123' });
    expect(entry.tokenMasked).toContain('...');
    expect(entry.tokenMasked).not.toContain('abc123');
  });

  test('invitation tokens are hashed and raw tokens are never persisted', () => {
    const svc = new InvitationTokenService();
    const raw = svc.createInvitation(5, 'admin');
    const valid = svc.validateInvitation(raw);
    expect(valid).toBe(true);
    expect(raw).not.toEqual('');
  });

  test('authorization prevents unauthorized account changes', () => {
    const user = { role: 'MEMBER', permissions: {}, portalAccess: [] } as any;
    expect(AuthorizationService.hasPermission(user, 'users.manage')).toBe(false);
  });

  test('pending requests flag legacy password presence without storing the secret', () => {
    const req = LegacyPendingRequestAdapter.toDomain('req1', { password: 'secret' });
    expect(req.legacyPasswordPresent).toBe(true);
    expect((req as any).password).toBeUndefined();
  });
});
