import { EventModel } from '../../models/Event';

export class LegacyEventAdapter {
  static toDomain(key: string, legacy: any): EventModel {
    return {
      id: key,
      title: legacy.title || legacy.name,
      description: legacy.desc || legacy.description,
      date: legacy.date,
      participants: legacy.participants || [],
      images: legacy.images || []
    };
  }
}
