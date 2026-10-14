/**
 * Couche d'accès aux données (DataLayer) unifiée et indépendante de l'interface.
 * Enregistre localement immédiatement, gère la file d'attente (Outbox) et orchestre la synchronisation.
 */

import { storageManager } from './storage/StorageManager';
import { SyncOperation, OpType, SyncStatus } from './types';
import { generateUUID } from './security/cryptoUtils';

export class DataLayer {
  private static listeners: Set<() => void> = new Set();

  public static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('[DataLayer] Listener error:', e);
      }
    }
  }

  // --- LECTURE LOCALE IMMÉDIATE ---

  public static async queryAll<T>(collection: string): Promise<T[]> {
    const adapter = await storageManager.getAdapter();
    return await adapter.getAll<T>(collection);
  }

  public static async getById<T>(collection: string, id: string): Promise<T | null> {
    const adapter = await storageManager.getAdapter();
    return await adapter.get<T>(collection, id);
  }

  // --- ÉCRITURE LOCALE + FILE D'ATTENTE OUTBOX ---

  public static async saveRecord<T extends Record<string, any>>(
    collection: string,
    id: string,
    data: T,
    isNew = false
  ): Promise<void> {
    const adapter = await storageManager.getAdapter();
    
    // 1. Sauvegarde locale immédiate
    const record = { ...data, id, _localModifiedAt: Date.now() };
    await adapter.put(collection, id, record);

    // 2. Ajout dans l'Outbox
    const operation: SyncOperation = {
      id: generateUUID(),
      collection,
      recordId: id,
      opType: isNew ? 'CREATE' : 'UPDATE',
      payload: record,
      timestamp: Date.now(),
      status: 'pending',
      syncLevel: 'LOCAL',
      retryCount: 0
    };

    await adapter.put('outbox', operation.id, operation);
    this.notify();
  }

  public static async deleteRecord(collection: string, id: string): Promise<void> {
    const adapter = await storageManager.getAdapter();

    // 1. Suppression locale immédiate
    await adapter.delete(collection, id);

    // 2. Ajout dans l'Outbox avec opType DELETE
    const operation: SyncOperation = {
      id: generateUUID(),
      collection,
      recordId: id,
      opType: 'DELETE',
      payload: null,
      timestamp: Date.now(),
      status: 'pending',
      syncLevel: 'LOCAL',
      retryCount: 0
    };

    await adapter.put('outbox', operation.id, operation);
    this.notify();
  }

  // --- GESTION DE L'OUTBOX ---

  public static async getPendingOperations(): Promise<SyncOperation[]> {
    const adapter = await storageManager.getAdapter();
    const all = await adapter.getAll<SyncOperation>('outbox');
    return all.filter((op) => op.status === 'pending' || op.status === 'failed');
  }

  public static async getAllOperations(): Promise<SyncOperation[]> {
    const adapter = await storageManager.getAdapter();
    return await adapter.getAll<SyncOperation>('outbox');
  }

  public static async markOperationSynced(id: string, level: SyncStatus): Promise<void> {
    const adapter = await storageManager.getAdapter();
    const op = await adapter.get<SyncOperation>('outbox', id);
    if (op) {
      op.status = 'synced';
      op.syncLevel = level;
      await adapter.put('outbox', id, op);
      this.notify();
    }
  }

  public static async markOperationFailed(id: string, errorMessage: string): Promise<void> {
    const adapter = await storageManager.getAdapter();
    const op = await adapter.get<SyncOperation>('outbox', id);
    if (op) {
      op.status = 'failed';
      op.retryCount = (op.retryCount || 0) + 1;
      op.lastError = errorMessage;
      await adapter.put('outbox', id, op);
      this.notify();
    }
  }

  public static async retryFailedOperations(): Promise<number> {
    const adapter = await storageManager.getAdapter();
    const all = await adapter.getAll<SyncOperation>('outbox');
    const failed = all.filter((op) => op.status === 'failed');
    for (const op of failed) {
      op.status = 'pending';
      op.lastError = undefined;
      await adapter.put('outbox', op.id, op);
    }
    this.notify();
    return failed.length;
  }

  public static async clearCompletedOperations(): Promise<void> {
    const adapter = await storageManager.getAdapter();
    const all = await adapter.getAll<SyncOperation>('outbox');
    for (const op of all) {
      if (op.status === 'synced' && op.syncLevel === 'CLOUD') {
        await adapter.delete('outbox', op.id);
      }
    }
    this.notify();
  }

  public static async getOutboxStats(): Promise<{
    pending: number;
    syncedLan: number;
    syncedCloud: number;
    failed: number;
    total: number;
  }> {
    const adapter = await storageManager.getAdapter();
    const all = await adapter.getAll<SyncOperation>('outbox');
    let pending = 0;
    let syncedLan = 0;
    let syncedCloud = 0;
    let failed = 0;

    for (const op of all) {
      if (op.status === 'pending') pending++;
      else if (op.status === 'failed') failed++;
      else if (op.status === 'synced') {
        if (op.syncLevel === 'CLOUD') syncedCloud++;
        else if (op.syncLevel === 'LAN') syncedLan++;
      }
    }

    return {
      pending,
      syncedLan,
      syncedCloud,
      failed,
      total: all.length
    };
  }
}
