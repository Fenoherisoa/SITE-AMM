import { AuthorizationService } from '../auth/AuthorizationService';

describe('AuthorizationService', () => {
  const user = { role: 'ADMIN', permissions: { 'members.read': true }, portalAccess: ['members'] } as any;

  test('hasPermission returns true for allowed permission', () => {
    expect(AuthorizationService.hasPermission(user, 'members.read')).toBe(true);
  });

  test('isPortalAllowed returns true for allowed portal', () => {
    expect(AuthorizationService.isPortalAllowed(user, 'members')).toBe(true);
  });
});
