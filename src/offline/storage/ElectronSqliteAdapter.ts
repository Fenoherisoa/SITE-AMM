/**
 * Adaptateur de stockage SQLite pour l'environnement Electron Windows.
 * Implémente l'interface IStorageAdapter en déléguant les opérations au moteur SQLite
 * du processus principal via l'API IPC sécurisée exposée par le preload.
 */

import { IStorageAdapter } from './IStorageAdapter';

export class ElectronSqliteAdapter implements IStorageAdapter {
  private ready = false;

  public async init(): Promise<void> {
    if (typeof window !== 'undefined' && window.electronAPI?.storage) {
      this.ready = true;
    } else {
      console.warn('[ElectronSqliteAdapter] window.electronAPI.storage non disponible');
      this.ready = false;
    }
  }

  public isReady(): boolean {
    return this.ready && typeof window !== 'undefined' && !!window.electronAPI?.storage;
  }

  public async get<T>(collection: string, id: string): Promise<T | null> {
    if (!this.isReady()) throw new Error('ElectronSqliteAdapter non initialisé');
    return await window.electronAPI!.storage.get<T>(collection, id);
  }

  public async getAll<T>(collection: string): Promise<T[]> {
    if (!this.isReady()) throw new Error('ElectronSqliteAdapter non initialisé');
    return await window.electronAPI!.storage.getAll<T>(collection);
  }

  public async put<T>(collection: string, id: string, item: T): Promise<void> {
    if (!this.isReady()) throw new Error('ElectronSqliteAdapter non initialisé');
    await window.electronAPI!.storage.put<T>(collection, id, item);
  }

  public async putBatch<T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void> {
    if (!this.isReady()) throw new Error('ElectronSqliteAdapter non initialisé');
    await window.electronAPI!.storage.putBatch<T>(collection, items);
  }

  public async delete(collection: string, id: string): Promise<void> {
    if (!this.isReady()) throw new Error('ElectronSqliteAdapter non initialisé');
    await window.electronAPI!.storage.delete(collection, id);
  }

  public async clear(collection: string): Promise<void> {
    if (!this.isReady()) throw new Error('ElectronSqliteAdapter non initialisé');
    await window.electronAPI!.storage.clear(collection);
  }

  public async exportAll(): Promise<Record<string, any[]>> {
    if (!this.isReady()) throw new Error('ElectronSqliteAdapter non initialisé');
    return await window.electronAPI!.storage.exportAll();
  }

  public async importAll(data: Record<string, any[]>): Promise<void> {
    if (!this.isReady()) throw new Error('ElectronSqliteAdapter non initialisé');
    await window.electronAPI!.storage.importAll(data);
  }
}
