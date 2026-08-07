import { PendingRequest } from '../../models/PendingRequest';

export class LegacyPendingRequestAdapter {
  static toDomain(key: string, legacy: any): PendingRequest {
    return {
      matricule: legacy.matricule || key,
      name: legacy.nom || legacy.name || '',
      contact: legacy.contact || undefined,
      createdAt: legacy.createdAt || undefined,
      status: legacy.statut || legacy.status || undefined,
      legacyPasswordPresent: typeof legacy.password !== 'undefined',
      metadata: {}
    };
  }
}
