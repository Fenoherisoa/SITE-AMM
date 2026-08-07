import { Conversation } from '../../models/MessageThread';

export interface IMessageRepository {
  getConversation(id: string): Promise<Conversation | null>;
  listForUser(userId: string): Promise<Conversation[]>;
  createConversation(conv: Conversation): Promise<void>;
}
