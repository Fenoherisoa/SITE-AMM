import { Conversation } from '../../models/MessageThread';

export class LegacyMessageAdapter {
  static toDomain(key: string, legacy: any): Conversation {
    return {
      id: key,
      participants: (legacy.participants || key.split('_')),
      messages: [],
      unreadCounts: {}
    };
  }
}
