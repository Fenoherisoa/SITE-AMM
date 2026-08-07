import { Member } from '../../models/Member';

export class LegacyOlonaAdapter {
  static toDomain(legacy: any): Member {
    return {
      id: legacy.id,
      matricule: legacy.matricule,
      name: legacy.anarana,
      nationalId: legacy.cin || undefined,
      dateOfBirth: legacy.date_naissance || undefined,
      adhesionDate: legacy.date_adhesion || undefined,
      contact: { telephone: legacy.telephone || undefined },
      address: {
        region: legacy.region || undefined,
        province: legacy.province || undefined,
        commune: legacy.commune || undefined,
        district: legacy.district || undefined,
        fokontany: legacy.fokontany || undefined
      },
      photoUrl: legacy.photo || undefined,
      project: legacy.tetikasa || undefined,
      metadata: {}
    };
  }
}
