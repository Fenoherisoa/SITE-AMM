import { Position } from '../../models/Position';

export class LegacyPositionsAdapter {
  static toDomain(key: string, legacy: any): Position {
    return {
      id: key,
      name: legacy.name,
      description: legacy.description
    };
  }
}
