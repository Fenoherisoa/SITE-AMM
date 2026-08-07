import { UserMetadata } from '../models/UserMetadata';

export class AuthorizationService {
  static hasPermission(user: UserMetadata | null, permission: string): boolean {
    if (!user) return false;
    const perms = user.permissions as any;
    if (Array.isArray(perms)) return perms.includes(permission);
    if (perms && typeof perms === 'object') return !!perms[permission];
    return false;
  }

  static hasRole(user: UserMetadata | null, role: string): boolean {
    if (!user) return false;
    return user.role === role || (Array.isArray(user.role) && user.role.includes(role));
  }

  static isPortalAllowed(user: UserMetadata | null, portalKey: string): boolean {
    if (!user) return false;
    const access = (user as any).portalAccess;
    if (!access) return false;
    if (Array.isArray(access)) return access.includes(portalKey);
    if (typeof access === 'object') return !!access[portalKey];
    return false;
  }
}
