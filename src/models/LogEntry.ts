export interface LogEntry {
  id: string;
  action: string;
  details?: string;
  operator?: string;
  operatorUid?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
