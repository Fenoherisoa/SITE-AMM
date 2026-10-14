/**
 * Adaptateur IndexedDB natif pour navigateur, PWA et WebViews Android/Windows.
 * Fournit une persistance fiable, transactionnelle et structurée sans dépendances externes.
 */

import { IStorageAdapter } from './IStorageAdapter';

const DB_NAME = 'amm_offline_store_v2';
const DB_VERSION = 2;

export const ALL_STORES = [
  'olona',
  'enquetes',
  'comptes',
  'comptabilite',
  'events',
  'operationRequest',
  'token_pool',
  'logs',
  'users',
  'parametres',
  'dossiers',
  'employees',
  'departments',
  'positions',
  'leave_requests',
  'conge_balances',
  'payroll',
  'inventory',
  'movements',
  'suppliers',
  'comptabilite_accounts',
  'comptabilite_entries',
  'comptabilite_assets',
  'outbox',
  'sync_logs',
  'offline_credentials',
  'paired_devices',
  'meta_state'
];

export class IndexedDbAdapter implements IStorageAdapter {
  private db: IDBDatabase | null = null;
  private ready = false;

  public async init(): Promise<void> {
    if (this.ready && this.db) return;

    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        console.warn('[IndexedDbAdapter] IndexedDB non disponible dans cet environnement.');
        this.ready = true;
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        for (const storeName of ALL_STORES) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            if (storeName === 'outbox') {
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            if (storeName === 'sync_logs') {
              store.createIndex('timestamp', 'timestamp', { unique: false });
            }
          }
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.ready = true;
        resolve();
      };

      request.onerror = (event) => {
        console.error('[IndexedDbAdapter] Erreur lors de l’ouverture d’IndexedDB:', (event.target as IDBOpenDBRequest).error);
        this.ready = true; // Fallback
        resolve();
      };
    });
  }

  public isReady(): boolean {
    return this.ready;
  }

  private ensureStore(collection: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore | null {
    if (!this.db || !this.db.objectStoreNames.contains(collection)) {
      return null;
    }
    const tx = this.db.transaction(collection, mode);
    return tx.objectStore(collection);
  }

  public async get<T>(collection: string, id: string): Promise<T | null> {
    if (!this.db) return null;
    return new Promise((resolve) => {
      try {
        const store = this.ensureStore(collection, 'readonly');
        if (!store) return resolve(null);
        const req = store.get(id);
        req.onsuccess = () => {
          const res = req.result;
          resolve(res ? (res.data !== undefined ? res.data : res) : null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  public async getAll<T>(collection: string): Promise<T[]> {
    if (!this.db) return [];
    return new Promise((resolve) => {
      try {
        const store = this.ensureStore(collection, 'readonly');
        if (!store) return resolve([]);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          const normalized = list.map((item: any) => (item.data !== undefined ? item.data : item));
          resolve(normalized);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  public async put<T>(collection: string, id: string, item: T): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      try {
        const store = this.ensureStore(collection, 'readwrite');
        if (!store) return resolve();
        // S'assure que l'objet a la clé attendue 'id'
        const record = typeof item === 'object' && item !== null && !Array.isArray(item)
          ? { ...item, id }
          : { id, data: item };

        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public async putBatch<T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void> {
    if (!this.db || items.length === 0) return;
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(collection, 'readwrite');
        const store = tx.objectStore(collection);
        items.forEach((entry) => {
          const record = typeof entry.data === 'object' && entry.data !== null && !Array.isArray(entry.data)
            ? { ...entry.data, id: entry.id }
            : { id: entry.id, data: entry.data };
          store.put(record);
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public async delete(collection: string, id: string): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      try {
        const store = this.ensureStore(collection, 'readwrite');
        if (!store) return resolve();
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public async clear(collection: string): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      try {
        const store = this.ensureStore(collection, 'readwrite');
        if (!store) return resolve();
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  public async exportAll(): Promise<Record<string, any[]>> {
    const result: Record<string, any[]> = {};
    for (const storeName of ALL_STORES) {
      if (storeName === 'offline_credentials') continue; // Ne pas exporter les empreintes de mots de passe
      result[storeName] = await this.getAll(storeName);
    }
    return result;
  }

  public async importAll(data: Record<string, any[]>): Promise<void> {
    for (const [storeName, items] of Object.entries(data)) {
      if (ALL_STORES.includes(storeName) && Array.isArray(items)) {
        await this.clear(storeName);
        for (const item of items) {
          if (item && item.id) {
            await this.put(storeName, item.id, item);
          }
        }
      }
    }
  }
}
