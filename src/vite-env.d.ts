/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_DATABASE_URL?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export interface ElectronStorageAPI {
  get<T>(collection: string, id: string): Promise<T | null>;
  getAll<T>(collection: string): Promise<T[]>;
  put<T>(collection: string, id: string, item: T): Promise<void>;
  putBatch<T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  clear(collection: string): Promise<void>;
  exportAll(): Promise<Record<string, any[]>>;
  importAll(data: Record<string, any[]>): Promise<void>;
}

export interface ElectronAppAPI {
  getVersion(): Promise<string>;
  getPath(name: string): Promise<string>;
  minimize(): void;
  maximize(): void;
  close(): void;
}

export interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  version: string;
  storage: ElectronStorageAPI;
  app: ElectronAppAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
