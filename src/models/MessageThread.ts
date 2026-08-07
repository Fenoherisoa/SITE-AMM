export interface Message {
  id: string;
  senderId: string;
  text?: string;
  attachments?: string[];
  timestamp: string;
  readBy?: string[];
}

export interface Conversation {
  id: string;
  participants: string[];
  messages?: Message[];
  unreadCounts?: Record<string, number>;
}
