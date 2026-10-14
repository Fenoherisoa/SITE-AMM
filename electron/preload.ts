/**
 * Preload Script pour l'application Windows SITE-AMM.
 * Sécurisé avec contextIsolation: true et nodeIntegration: false.
 * Expose l'API contrôlée via contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';

// Validation des noms de collection pour empêcher les injections
const VALID_COLLECTION_REGEX = /^[a-zA-Z0-9_\-]+$/;

function sanitizeCollection(collection: string): string {
  if (!collection || typeof collection !== 'string' || !VALID_COLLECTION_REGEX.test(collection)) {
    throw new Error(`Nom de collection non valide: ${collection}`);
  }
  return collection;
}

const electronAPI = {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,

  // Pont vers le stockage SQLite natif du processus principal
  storage: {
    get: async <T>(collection: string, id: string): Promise<T | null> => {
      return await ipcRenderer.invoke('storage:get', sanitizeCollection(collection), String(id));
    },

    getAll: async <T>(collection: string): Promise<T[]> => {
      return await ipcRenderer.invoke('storage:getAll', sanitizeCollection(collection));
    },

    put: async <T>(collection: string, id: string, item: T): Promise<void> => {
      return await ipcRenderer.invoke('storage:put', sanitizeCollection(collection), String(id), item);
    },

    putBatch: async <T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void> => {
      if (!Array.isArray(items)) throw new Error('items doit être un tableau');
      return await ipcRenderer.invoke('storage:putBatch', sanitizeCollection(collection), items);
    },

    delete: async (collection: string, id: string): Promise<void> => {
      return await ipcRenderer.invoke('storage:delete', sanitizeCollection(collection), String(id));
    },

    clear: async (collection: string): Promise<void> => {
      return await ipcRenderer.invoke('storage:clear', sanitizeCollection(collection));
    },

    exportAll: async (): Promise<Record<string, any[]>> => {
      return await ipcRenderer.invoke('storage:exportAll');
    },

    importAll: async (data: Record<string, any[]>): Promise<void> => {
      return await ipcRenderer.invoke('storage:importAll', data);
    }
  },

  // Contrôles de la fenêtre et informations système
  app: {
    getVersion: async (): Promise<string> => {
      return await ipcRenderer.invoke('app:getVersion');
    },

    getPath: async (name: string): Promise<string> => {
      return await ipcRenderer.invoke('app:getPath', name);
    },

    minimize: (): void => {
      ipcRenderer.send('window:minimize');
    },

    maximize: (): void => {
      ipcRenderer.send('window:maximize');
    },

    close: (): void => {
      ipcRenderer.send('window:close');
    }
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
