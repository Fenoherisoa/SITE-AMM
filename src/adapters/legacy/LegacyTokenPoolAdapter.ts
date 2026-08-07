import { TokenPoolEntry } from '../../models/TokenPoolEntry';

export class LegacyTokenPoolAdapter {
  static toDomain(key: string, legacy: any): TokenPoolEntry {
    return {
      key,
      role: legacy.role,
      tokenMasked: legacy.token_miasa ? String(legacy.token_miasa).slice(0,4) + '...' : undefined
    };
  }
}
