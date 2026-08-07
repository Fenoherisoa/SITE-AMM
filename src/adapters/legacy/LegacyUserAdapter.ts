import { UserMetadata } from '../../models/UserMetadata';

export class LegacyUserAdapter {
  static toDomain(username: string, legacy: any): UserMetadata {
    return {
      username,
      role: legacy.role,
      permissions: legacy.permissions || {},
      email: legacy.email || undefined,
      phone: legacy.phone || legacy.phone,
      linkedEmployeeId: undefined,
      status: 'legacy'
    };
  }
}
