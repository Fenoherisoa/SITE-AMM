var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var import_path2 = __toESM(require("path"), 1);

// electron/sqliteEngine.ts
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var ElectronSqliteEngine = class {
  constructor(userDataPath) {
    this.db = null;
    this.dbPath = "";
    this.initialized = false;
    this.isFallback = false;
    this.memoryFallbackStore = {};
    if (!import_fs.default.existsSync(userDataPath)) {
      try {
        import_fs.default.mkdirSync(userDataPath, { recursive: true });
      } catch (e) {
        console.error("[SQLite] Impossible de cr\xE9er le r\xE9pertoire userData:", e);
      }
    }
    this.dbPath = import_path.default.join(userDataPath, "site_amm_database.sqlite");
  }
  init() {
    if (this.initialized) return;
    try {
      const { DatabaseSync } = require("node:sqlite");
      this.db = new DatabaseSync(this.dbPath);
      try {
        this.db.exec("PRAGMA journal_mode = WAL;");
        this.db.exec("PRAGMA synchronous = NORMAL;");
      } catch (pragmaErr) {
        console.warn("[SQLite] Avertissement PRAGMA:", pragmaErr);
      }
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS store_records (
          collection TEXT NOT NULL,
          id TEXT NOT NULL,
          data TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (collection, id)
        );
      `);
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_store_records_collection 
        ON store_records (collection);
      `);
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
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS sync_logs (
          id TEXT PRIMARY KEY,
          timestamp INTEGER NOT NULL,
          level TEXT NOT NULL,
          message TEXT NOT NULL,
          context TEXT
        );
      `);
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS meta_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
      this.initialized = true;
      console.log(`[SQLite Engine] Base de donn\xE9es SQLite active : ${this.dbPath}`);
    } catch (err) {
      console.warn("[SQLite Engine] node:sqlite indisponible ou erreur, bascule vers stockage persistant s\xE9curis\xE9 JSON-WAL:", err);
      this.initFallback();
    }
  }
  initFallback() {
    this.isFallback = true;
    const jsonPath = this.dbPath.replace(/\.sqlite$/, ".json");
    if (import_fs.default.existsSync(jsonPath)) {
      try {
        const raw = import_fs.default.readFileSync(jsonPath, "utf-8");
        this.memoryFallbackStore = JSON.parse(raw);
      } catch {
        this.memoryFallbackStore = {};
      }
    }
    this.initialized = true;
  }
  saveFallback() {
    if (!this.isFallback) return;
    try {
      const jsonPath = this.dbPath.replace(/\.sqlite$/, ".json");
      import_fs.default.writeFileSync(jsonPath, JSON.stringify(this.memoryFallbackStore, null, 2), "utf-8");
    } catch (e) {
      console.error("[SQLite Fallback] Erreur de sauvegarde:", e);
    }
  }
  get(collection, id) {
    if (!this.initialized) this.init();
    if (this.isFallback) {
      return this.memoryFallbackStore[collection]?.[id] || null;
    }
    try {
      const stmt = this.db.prepare("SELECT data FROM store_records WHERE collection = ? AND id = ?");
      const row = stmt.get(collection, id);
      if (!row || !row.data) return null;
      return JSON.parse(row.data);
    } catch (e) {
      console.error(`[SQLite] Erreur get (${collection}/${id}):`, e);
      return null;
    }
  }
  getAll(collection) {
    if (!this.initialized) this.init();
    if (this.isFallback) {
      const items = this.memoryFallbackStore[collection];
      return items ? Object.values(items) : [];
    }
    try {
      const stmt = this.db.prepare("SELECT data FROM store_records WHERE collection = ?");
      const rows = stmt.all(collection);
      return rows.map((r) => JSON.parse(r.data));
    } catch (e) {
      console.error(`[SQLite] Erreur getAll (${collection}):`, e);
      return [];
    }
  }
  put(collection, id, item) {
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
      if (collection === "outbox") {
        const op = item;
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
          op.collection || "",
          op.recordId || "",
          op.opType || "UPDATE",
          JSON.stringify(op.payload || {}),
          op.timestamp || now,
          op.status || "pending",
          op.syncLevel || "LOCAL",
          op.retryCount || 0,
          op.error || ""
        );
      }
    } catch (e) {
      console.error(`[SQLite] Erreur put (${collection}/${id}):`, e);
    }
  }
  putBatch(collection, items) {
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
      this.db.exec("BEGIN TRANSACTION;");
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
      this.db.exec("COMMIT;");
    } catch (e) {
      try {
        this.db.exec("ROLLBACK;");
      } catch {
      }
      console.error(`[SQLite] Erreur putBatch (${collection}):`, e);
    }
  }
  delete(collection, id) {
    if (!this.initialized) this.init();
    if (this.isFallback) {
      if (this.memoryFallbackStore[collection]) {
        delete this.memoryFallbackStore[collection][id];
        this.saveFallback();
      }
      return;
    }
    try {
      const stmt = this.db.prepare("DELETE FROM store_records WHERE collection = ? AND id = ?");
      stmt.run(collection, id);
      if (collection === "outbox") {
        const outboxStmt = this.db.prepare("DELETE FROM sync_outbox WHERE id = ?");
        outboxStmt.run(id);
      }
    } catch (e) {
      console.error(`[SQLite] Erreur delete (${collection}/${id}):`, e);
    }
  }
  clear(collection) {
    if (!this.initialized) this.init();
    if (this.isFallback) {
      this.memoryFallbackStore[collection] = {};
      this.saveFallback();
      return;
    }
    try {
      const stmt = this.db.prepare("DELETE FROM store_records WHERE collection = ?");
      stmt.run(collection);
      if (collection === "outbox") {
        this.db.exec("DELETE FROM sync_outbox;");
      }
    } catch (e) {
      console.error(`[SQLite] Erreur clear (${collection}):`, e);
    }
  }
  exportAll() {
    if (!this.initialized) this.init();
    const result = {};
    if (this.isFallback) {
      for (const [coll, map] of Object.entries(this.memoryFallbackStore)) {
        result[coll] = Object.values(map);
      }
      return result;
    }
    try {
      const collectionsStmt = this.db.prepare("SELECT DISTINCT collection FROM store_records");
      const collections = collectionsStmt.all();
      for (const col of collections) {
        result[col.collection] = this.getAll(col.collection);
      }
      return result;
    } catch (e) {
      console.error("[SQLite] Erreur exportAll:", e);
      return {};
    }
  }
  importAll(data) {
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
      this.db.exec("BEGIN TRANSACTION;");
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
      this.db.exec("COMMIT;");
    } catch (e) {
      try {
        this.db.exec("ROLLBACK;");
      } catch {
      }
      console.error("[SQLite] Erreur importAll:", e);
    }
  }
  getDatabasePath() {
    return this.dbPath;
  }
};

// electron/main.ts
var mainWindow = null;
var sqliteEngine = null;
var isDev = process.env.NODE_ENV === "development" || !import_electron.app.isPackaged;
function createWindow() {
  const userDataPath = import_electron.app.getPath("userData");
  sqliteEngine = new ElectronSqliteEngine(userDataPath);
  sqliteEngine.init();
  const iconPath = import_path2.default.join(__dirname, "../build/icon.ico");
  mainWindow = new import_electron.BrowserWindow({
    title: "SITE-AMM \u2014 Association Malagasy Miray",
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    icon: iconPath,
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: import_path2.default.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    },
    show: false
  });
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      import_electron.shell.openExternal(url);
    }
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (isDev && parsedUrl.origin === "http://localhost:3000") {
      return;
    }
    if (parsedUrl.protocol !== "file:") {
      event.preventDefault();
      import_electron.shell.openExternal(navigationUrl);
    }
  });
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = import_path2.default.join(__dirname, "../dist/index.html");
    mainWindow.loadFile(indexPath);
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  setupAppMenu();
}
function setupAppMenu() {
  const template = [
    {
      label: "Fichier",
      submenu: [
        {
          label: "Actualiser",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.webContents.reload()
        },
        {
          label: "Recharger sans cache",
          accelerator: "CmdOrCtrl+Shift+R",
          click: () => mainWindow?.webContents.reloadIgnoringCache()
        },
        { type: "separator" },
        {
          label: "Quitter SITE-AMM",
          accelerator: "Alt+F4",
          click: () => import_electron.app.quit()
        }
      ]
    },
    {
      label: "Affichage",
      submenu: [
        { role: "resetZoom", label: "Taille normale" },
        { role: "zoomIn", label: "Zoom avant" },
        { role: "zoomOut", label: "Zoom arri\xE8re" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Plein \xE9cran" },
        ...isDev ? [
          { type: "separator" },
          {
            label: "Outils de d\xE9veloppement",
            accelerator: "F12",
            click: () => mainWindow?.webContents.toggleDevTools()
          }
        ] : []
      ]
    },
    {
      label: "Aide",
      submenu: [
        {
          label: "\xC0 propos de SITE-AMM",
          click: () => {
            if (mainWindow) {
              import_electron.shell.openExternal("https://ass-malagasymiray.web.app");
            }
          }
        }
      ]
    }
  ];
  const menu = import_electron.Menu.buildFromTemplate(template);
  import_electron.Menu.setApplicationMenu(menu);
}
function registerIpcHandlers() {
  import_electron.ipcMain.handle("storage:get", (_event, collection, id) => {
    if (!sqliteEngine) return null;
    return sqliteEngine.get(collection, id);
  });
  import_electron.ipcMain.handle("storage:getAll", (_event, collection) => {
    if (!sqliteEngine) return [];
    return sqliteEngine.getAll(collection);
  });
  import_electron.ipcMain.handle("storage:put", (_event, collection, id, item) => {
    if (!sqliteEngine) return;
    sqliteEngine.put(collection, id, item);
  });
  import_electron.ipcMain.handle("storage:putBatch", (_event, collection, items) => {
    if (!sqliteEngine) return;
    sqliteEngine.putBatch(collection, items);
  });
  import_electron.ipcMain.handle("storage:delete", (_event, collection, id) => {
    if (!sqliteEngine) return;
    sqliteEngine.delete(collection, id);
  });
  import_electron.ipcMain.handle("storage:clear", (_event, collection) => {
    if (!sqliteEngine) return;
    sqliteEngine.clear(collection);
  });
  import_electron.ipcMain.handle("storage:exportAll", () => {
    if (!sqliteEngine) return {};
    return sqliteEngine.exportAll();
  });
  import_electron.ipcMain.handle("storage:importAll", (_event, data) => {
    if (!sqliteEngine) return;
    sqliteEngine.importAll(data);
  });
  import_electron.ipcMain.handle("app:getVersion", () => import_electron.app.getVersion());
  import_electron.ipcMain.handle("app:getPath", (_event, name) => import_electron.app.getPath(name));
  import_electron.ipcMain.on("window:minimize", () => mainWindow?.minimize());
  import_electron.ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  import_electron.ipcMain.on("window:close", () => mainWindow?.close());
}
import_electron.app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});
