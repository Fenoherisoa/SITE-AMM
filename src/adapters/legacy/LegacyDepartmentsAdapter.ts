import { Department } from '../../models/Department';

export class LegacyDepartmentsAdapter {
  static fromArrayItem(legacy: any): Department {
    return {
      id: String(legacy.id),
      name: legacy.nom || legacy.name,
      description: legacy.description || undefined,
      positions: (legacy.postes || []).map((p: any) => p.name || p)
    };
  }

  static fromMapItem(key: string, legacy: any): Department {
    return {
      id: key,
      name: legacy.name,
      description: legacy.description
    };
  }
}
