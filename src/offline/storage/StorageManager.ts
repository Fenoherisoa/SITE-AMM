/**
 * StorageManager - Gestionnaire unique de la base de données locale
 */

import { IStorageAdapter } from './IStorageAdapter';
import { IndexedDbAdapter } from './IndexedDbAdapter';

class StorageManager {
  private adapter: IStorageAdapter;
  private isInit = false;

  constructor() {
    this.adapter = new IndexedDbAdapter();
  }

  public async getAdapter(): Promise<IStorageAdapter> {
    if (!this.isInit) {
      await this.adapter.init();
      this.isInit = true;
    }
    return this.adapter;
  }
}

export const storageManager = new StorageManager();
