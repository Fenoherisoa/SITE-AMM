// electron/preload.ts
var import_electron = require("electron");
var VALID_COLLECTION_REGEX = /^[a-zA-Z0-9_\-]+$/;
function sanitizeCollection(collection) {
  if (!collection || typeof collection !== "string" || !VALID_COLLECTION_REGEX.test(collection)) {
    throw new Error(`Nom de collection non valide: ${collection}`);
  }
  return collection;
}
var electronAPI = {
  isElectron: true,
  platform: process.platform,
  version: process.versions.electron,
  // Pont vers le stockage SQLite natif du processus principal
  storage: {
    get: async (collection, id) => {
      return await import_electron.ipcRenderer.invoke("storage:get", sanitizeCollection(collection), String(id));
    },
    getAll: async (collection) => {
      return await import_electron.ipcRenderer.invoke("storage:getAll", sanitizeCollection(collection));
    },
    put: async (collection, id, item) => {
      return await import_electron.ipcRenderer.invoke("storage:put", sanitizeCollection(collection), String(id), item);
    },
    putBatch: async (collection, items) => {
      if (!Array.isArray(items)) throw new Error("items doit \xEAtre un tableau");
      return await import_electron.ipcRenderer.invoke("storage:putBatch", sanitizeCollection(collection), items);
    },
    delete: async (collection, id) => {
      return await import_electron.ipcRenderer.invoke("storage:delete", sanitizeCollection(collection), String(id));
    },
    clear: async (collection) => {
      return await import_electron.ipcRenderer.invoke("storage:clear", sanitizeCollection(collection));
    },
    exportAll: async () => {
      return await import_electron.ipcRenderer.invoke("storage:exportAll");
    },
    importAll: async (data) => {
      return await import_electron.ipcRenderer.invoke("storage:importAll", data);
    }
  },
  // Contrôles de la fenêtre et informations système
  app: {
    getVersion: async () => {
      return await import_electron.ipcRenderer.invoke("app:getVersion");
    },
    getPath: async (name) => {
      return await import_electron.ipcRenderer.invoke("app:getPath", name);
    },
    minimize: () => {
      import_electron.ipcRenderer.send("window:minimize");
    },
    maximize: () => {
      import_electron.ipcRenderer.send("window:maximize");
    },
    close: () => {
      import_electron.ipcRenderer.send("window:close");
    }
  }
};
import_electron.contextBridge.exposeInMainWorld("electronAPI", electronAPI);
