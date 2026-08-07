import { InvitationTokenService } from '../auth/InvitationTokenService';

describe('InvitationTokenService', () => {
  test('create, validate, consume invitation', () => {
    const svc = new InvitationTokenService();
    const token = svc.createInvitation(1);
    expect(typeof token).toBe('string');
    expect(svc.validateInvitation(token)).toBe(true);
    expect(svc.consumeInvitation(token, 'admin')).toBe(true);
    expect(svc.validateInvitation(token)).toBe(false);
  });

  test('expired invitation', () => {
    const svc = new InvitationTokenService();
    const token = svc.createInvitation(-1); // already expired
    expect(svc.validateInvitation(token)).toBe(false);
  });
});
