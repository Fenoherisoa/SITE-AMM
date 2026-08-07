import { LogEntry } from '../../models/LogEntry';

export interface ILogRepository {
  write(entry: Partial<LogEntry>): Promise<string>;
  list(filter?: any): Promise<LogEntry[]>;
}
