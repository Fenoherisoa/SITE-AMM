/**
 * Service de journalisation d'audit des synchronisations (Cloud, LAN, Local)
 */

import { storageManager } from '../storage/StorageManager';
import { SyncLogEntry, LogLevel } from '../types';
import { generateUUID } from '../security/cryptoUtils';

type LogListener = (logs: SyncLogEntry[]) => void;

class SyncLogger {
  private inMemoryLogs: SyncLogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 200;

  constructor() {
    this.loadLogs();
  }

  private async loadLogs() {
    try {
      const adapter = await storageManager.getAdapter();
      const stored = await adapter.getAll<SyncLogEntry>('sync_logs');
      this.inMemoryLogs = stored.sort((a, b) => b.timestamp - a.timestamp).slice(0, this.maxLogs);
      this.notify();
    } catch {
      // ignore
    }
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.inMemoryLogs);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener([...this.inMemoryLogs]);
      } catch (e) {
        console.error('[SyncLogger] Listener error:', e);
      }
    }
  }

  public async log(
    level: LogLevel,
    message: string,
    source: 'LOCAL' | 'LAN' | 'CLOUD' = 'LOCAL',
    details?: string
  ): Promise<void> {
    const entry: SyncLogEntry = {
      id: generateUUID(),
      timestamp: Date.now(),
      level,
      message,
      source,
      details
    };

    this.inMemoryLogs.unshift(entry);
    if (this.inMemoryLogs.length > this.maxLogs) {
      this.inMemoryLogs.pop();
    }
    this.notify();

    try {
      const adapter = await storageManager.getAdapter();
      await adapter.put('sync_logs', entry.id, entry);
    } catch {
      // Ignorer si échec de persistance
    }
  }

  public async clearLogs(): Promise<void> {
    this.inMemoryLogs = [];
    this.notify();
    try {
      const adapter = await storageManager.getAdapter();
      await adapter.clear('sync_logs');
    } catch {
      // ignore
    }
  }

  public getLogs(): SyncLogEntry[] {
    return this.inMemoryLogs;
  }
}

export const syncLogger = new SyncLogger();
