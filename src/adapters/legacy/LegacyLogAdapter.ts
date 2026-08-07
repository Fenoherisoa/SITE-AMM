import { LogEntry } from '../../models/LogEntry';

export class LegacyLogAdapter {
  static toDomain(key: string, legacy: any): LogEntry {
    return {
      id: key,
      action: legacy.action,
      details: legacy.details,
      operator: legacy.operator,
      timestamp: legacy.timestamp,
      metadata: {}
    };
  }
}
