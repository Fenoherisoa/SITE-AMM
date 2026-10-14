/**
 * Moteur SQLite pour Electron (Processus Principal).
 * Stocke durablement l'ensemble des données de SITE-AMM dans %APPDATA%/SITE-AMM/site_amm_database.sqlite.
 * Utilise DatabaseSync de node:sqlite (natif Node 22) avec mode WAL (Write-Ahead Logging)
 * pour des transactions ultra-rapides et une durabilité ACID sans aucune dépendance C++ externe.
 */

import path from 'path';
import fs from 'fs';

export class ElectronSqliteEngine {
  private db: any = null;
  private dbPath: string = '';
  private initialized = false;
  private isFallback = false;
  private memoryFallbackStore: Record<string, Record<string, any>> = {};

  constructor(userDataPath: string) {
    if (!fs.existsSync(userDataPath)) {
      try {
        fs.mkdirSync(userDataPath, { recursive: true });
      } catch (e) {
        console.error('[SQLite] Impossible de créer le répertoire userData:', e);
      }
    }
    this.dbPath = path.join(userDataPath, 'site_amm_database.sqlite');
  }

  public init(): void {
    if (this.initialized) return;

    try {
      // Chargement dynamique de node:sqlite
      const { DatabaseSync } = require('node:sqlite');
      this.db = new DatabaseSync(this.dbPath);

      // Optimisations de performance et intégrité SQLite (WAL mode, foreign keys, synchronous NORMAL)
      try {
        this.db.exec('PRAGMA journal_mode = WAL;');
        this.db.exec('PRAGMA synchronous = NORMAL;');
      } catch (pragmaErr) {
        console.warn('[SQLite] Avertissement PRAGMA:', pragmaErr);
      }

      // Création de la table principale polymorphe par collection
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS store_records (
          collection TEXT NOT NULL,
          id TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (collection, id)
        );
      `);

      // Index pour accélérer les requêtes par collection
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_store_records_collection 
        ON store_records (collection);
      `);

      // Table dédiée pour la file de synchronisation (Outbox) avec index de statut
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sync_outbox (
          id TEXT PRIMARY KEY,
          collection TEXT NOT NULL,
          recordId TEXT NOT NULL,
          opType TEXT NOT NULL,
          payload TEXT,
          timestamp INTEGER NOT NULL,
          status TEXT NOT NULL,
          syncLevel TEXT,
          retryCount INTEGER DEFAULT 0,
          error TEXT
        );
      `);

      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_sync_outbox_status 
        ON sync_outbox (status);
      `);

      // Table des logs de synchronisation
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sync_logs (
          id TEXT PRIMARY KEY,
          timestamp INTEGER NOT NULL,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          context TEXT
        );
      `);

      // Table des métadonnées et état de l'application
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS meta_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      this.initialized = true;
      console.log(`[SQLite Engine] Base de données SQLite active : ${this.dbPath}`);
    } catch (err) {
      console.warn('[SQLite Engine] node:sqlite indisponible ou erreur, bascule vers stockage persistant sécurisé JSON-WAL:', err);
      this.initFallback();
    }
  }

  private initFallback(): void {
    this.isFallback = true;
    const jsonPath = this.dbPath.replace(/\.sqlite$/, '.json');
    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        this.memoryFallbackStore = JSON.parse(raw);
      } catch {
        this.memoryFallbackStore = {};
      }
    }
    this.initialized = true;
  }

  private saveFallback(): void {
    if (!this.isFallback) return;
    try {
      const jsonPath = this.dbPath.replace(/\.sqlite$/, '.json');
      fs.writeFileSync(jsonPath, JSON.stringify(this.memoryFallbackStore, null, 2), 'utf-8');
    } catch (e) {
      console.error('[SQLite Fallback] Erreur de sauvegarde:', e);
    }
  }

  public get<T>(collection: string, id: string): T | null {
    if (!this.initialized) this.init();

    if (this.isFallback) {
      return (this.memoryFallbackStore[collection]?.[id] as T) || null;
    }

    try {
      const stmt = this.db.prepare('SELECT data FROM store_records WHERE collection = ? AND id = ?');
      const row = stmt.get(collection, id);
      if (!row || !row.data) return null;
      return JSON.parse(row.data) as T;
    } catch (e) {
      console.error(`[SQLite] Erreur get (${collection}/${id}):`, e);
      return null;
    }
  }

  public getAll<T>(collection: string): T[] {
    if (!this.initialized) this.init();

    if (this.isFallback) {
      const items = this.memoryFallbackStore[collection];
      return items ? Object.values(items) : [];
    }

    try {
      const stmt = this.db.prepare('SELECT data FROM store_records WHERE collection = ?');
      const rows = stmt.all(collection);
      return rows.map((r: any) => JSON.parse(r.data) as T);
    } catch (e) {
      console.error(`[SQLite] Erreur getAll (${collection}):`, e);
      return [];
    }
  }

  public put<T>(collection: string, id: string, item: T): void {
    if (!this.initialized) this.init();

    if (this.isFallback) {
      if (!this.memoryFallbackStore[collection]) this.memoryFallbackStore[collection] = {};
      this.memoryFallbackStore[collection][id] = item;
      this.saveFallback();
      return;
    }

    try {
      const dataStr = JSON.stringify(item);
      const now = Date.now();
      const stmt = this.db.prepare(`
        INSERT INTO store_records (collection, id, data, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(collection, id) DO UPDATE SET
          data = excluded.data,
          updated_at = excluded.updated_at;
      `);
      stmt.run(collection, id, dataStr, now);

      // Si c'est l'outbox, synchroniser également la table sync_outbox
      if (collection === 'outbox') {
        const op = item as any;
        const outboxStmt = this.db.prepare(`
          INSERT INTO sync_outbox (id, collection, recordId, opType, payload, timestamp, status, syncLevel, retryCount, error)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            status = excluded.status,
            syncLevel = excluded.syncLevel,
            retryCount = excluded.retryCount,
            error = excluded.error;
        `);
        outboxStmt.run(
          id,
          op.collection || '',
          op.recordId || '',
          op.opType || 'UPDATE',
          JSON.stringify(op.payload || {}),
          op.timestamp || now,
          op.status || 'pending',
          op.syncLevel || 'LOCAL',
          op.retryCount || 0,
          op.error || ''
        );
      }
    } catch (e) {
      console.error(`[SQLite] Erreur put (${collection}/${id}):`, e);
    }
  }

  public putBatch<T>(collection: string, items: Array<{ id: string; data: T }>): void {
    if (!this.initialized) this.init();
    if (!items || items.length === 0) return;

    if (this.isFallback) {
      if (!this.memoryFallbackStore[collection]) this.memoryFallbackStore[collection] = {};
      for (const it of items) {
        this.memoryFallbackStore[collection][it.id] = it.data;
      }
      this.saveFallback();
      return;
    }

    try {
      this.db.exec('BEGIN TRANSACTION;');
      const stmt = this.db.prepare(`
        INSERT INTO store_records (collection, id, data, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(collection, id) DO UPDATE SET
          data = excluded.data,
          updated_at = excluded.updated_at;
      `);

      const now = Date.now();
      for (const item of items) {
        stmt.run(collection, item.id, JSON.stringify(item.data), now);
      }
      this.db.exec('COMMIT;');
    } catch (e) {
      try {
        this.db.exec('ROLLBACK;');
      } catch {}
      console.error(`[SQLite] Erreur putBatch (${collection}):`, e);
    }
  }

  public delete(collection: string, id: string): void {
    if (!this.initialized) this.init();

    if (this.isFallback) {
      if (this.memoryFallbackStore[collection]) {
        delete this.memoryFallbackStore[collection][id];
        this.saveFallback();
      }
      return;
    }

    try {
      const stmt = this.db.prepare('DELETE FROM store_records WHERE collection = ? AND id = ?');
      stmt.run(collection, id);

      if (collection === 'outbox') {
        const outboxStmt = this.db.prepare('DELETE FROM sync_outbox WHERE id = ?');
        outboxStmt.run(id);
      }
    } catch (e) {
      console.error(`[SQLite] Erreur delete (${collection}/${id}):`, e);
    }
  }

  public clear(collection: string): void {
    if (!this.initialized) this.init();

    if (this.isFallback) {
      this.memoryFallbackStore[collection] = {};
      this.saveFallback();
      return;
    }

    try {
      const stmt = this.db.prepare('DELETE FROM store_records WHERE collection = ?');
      stmt.run(collection);

      if (collection === 'outbox') {
        this.db.exec('DELETE FROM sync_outbox;');
      }
    } catch (e) {
      console.error(`[SQLite] Erreur clear (${collection}):`, e);
    }
  }

  public exportAll(): Record<string, any[]> {
    if (!this.initialized) this.init();

    const result: Record<string, any[]> = {};

    if (this.isFallback) {
      for (const [coll, map] of Object.entries(this.memoryFallbackStore)) {
        result[coll] = Object.values(map);
      }
      return result;
    }

    try {
      const collectionsStmt = this.db.prepare('SELECT DISTINCT collection FROM store_records');
      const collections = collectionsStmt.all();

      for (const col of collections) {
        result[col.collection] = this.getAll(col.collection);
      }
      return result;
    } catch (e) {
      console.error('[SQLite] Erreur exportAll:', e);
      return {};
    }
  }

  public importAll(data: Record<string, any[]>): void {
    if (!this.initialized) this.init();
    if (!data) return;

    if (this.isFallback) {
      for (const [coll, list] of Object.entries(data)) {
        if (!this.memoryFallbackStore[coll]) this.memoryFallbackStore[coll] = {};
        for (const item of list) {
          if (item && item.id) {
            this.memoryFallbackStore[coll][item.id] = item;
          }
        }
      }
      this.saveFallback();
      return;
    }

    try {
      this.db.exec('BEGIN TRANSACTION;');
      const stmt = this.db.prepare(`
        INSERT INTO store_records (collection, id, data, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(collection, id) DO UPDATE SET
          data = excluded.data,
          updated_at = excluded.updated_at;
      `);

      const now = Date.now();
      for (const [coll, list] of Object.entries(data)) {
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.id) {
              stmt.run(coll, String(item.id), JSON.stringify(item), now);
            }
          }
        }
      }
      this.db.exec('COMMIT;');
    } catch (e) {
      try {
        this.db.exec('ROLLBACK;');
      } catch {}
      console.error('[SQLite] Erreur importAll:', e);
    }
  }

  public getDatabasePath(): string {
    return this.dbPath;
  }
}
