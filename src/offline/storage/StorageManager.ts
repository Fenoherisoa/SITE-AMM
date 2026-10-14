/**
 * StorageManager - Gestionnaire unifié de la persistance locale de SITE-AMM.
 * Détecte intelligemment l'environnement d'exécution :
 * - Sous Electron (Windows App) : utilise ElectronSqliteAdapter (persistance SQLite native sur disque).
 * - En mode Web / Navigateur / LAN : utilise IndexedDbAdapter (persistance transactionnelle IndexedDB).
 */

import { IStorageAdapter } from './IStorageAdapter';
import { IndexedDbAdapter } from './IndexedDbAdapter';
import { ElectronSqliteAdapter } from './ElectronSqliteAdapter';

class StorageManager {
  private adapter: IStorageAdapter | null = null;
  private isInit = false;

  private resolveAdapter(): IStorageAdapter {
    if (typeof window !== 'undefined' && window.electronAPI?.storage) {
      console.log('[StorageManager] Environnement Electron détecté — Utilisation de l\'adaptateur SQLite persistant');
      return new ElectronSqliteAdapter();
    }
    return new IndexedDbAdapter();
  }

  public async getAdapter(): Promise<IStorageAdapter> {
    if (!this.adapter) {
      this.adapter = this.resolveAdapter();
    }

    if (!this.isInit) {
      await this.adapter.init();
      this.isInit = true;
    }
    return this.adapter;
  }

  public isElectronEnvironment(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
  }
}

export const storageManager = new StorageManager();
