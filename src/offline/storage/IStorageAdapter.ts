/**
 * Interface commune pour les adaptateurs de base de données locale (IndexedDB / SQLite / Mémoire)
 */

export interface IStorageAdapter {
  init(): Promise<void>;
  isReady(): boolean;
  
  // Opérations CRUD génériques par collection
  get<T>(collection: string, id: string): Promise<T | null>;
  getAll<T>(collection: string): Promise<T[]>;
  put<T>(collection: string, id: string, item: T): Promise<void>;
  putBatch<T>(collection: string, items: Array<{ id: string; data: T }>): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  clear(collection: string): Promise<void>;
  
  // Sauvegarde & Restauration
  exportAll(): Promise<Record<string, any[]>>;
  importAll(data: Record<string, any[]>): Promise<void>;
}
