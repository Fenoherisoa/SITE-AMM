import { PointageDay } from '../../models/Pointage';

export class LegacyPointageAdapter {
  static toDomain(dateKey: string, legacy: any): PointageDay {
    return {
      date: dateKey,
      statuses: legacy
    };
  }
}
