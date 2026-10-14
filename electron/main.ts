/**
 * Processus Principal Electron pour SITE-AMM (Application Windows).
 * Gère le cycle de vie de la fenêtre native, le stockage local SQLite sécurisé,
 * la politique de sécurité stricte (contextIsolation: true, nodeIntegration: false)
 * et le fonctionnement offline autonome sans serveur web.
 */

import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron';
import path from 'path';
import { ElectronSqliteEngine } from './sqliteEngine';

let mainWindow: BrowserWindow | null = null;
let sqliteEngine: ElectronSqliteEngine | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
  // Initialisation du moteur SQLite dans le dossier de données de l'application
  const userDataPath = app.getPath('userData');
  sqliteEngine = new ElectronSqliteEngine(userDataPath);
  sqliteEngine.init();

  const iconPath = path.join(__dirname, '../build/icon.ico');

  mainWindow = new BrowserWindow({
    title: 'SITE-AMM — Association Malagasy Miray',
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    icon: iconPath,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    },
    show: false
  });

  // Affichage fluide dès que la fenêtre est prête
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Politique de sécurité de navigation stricte
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Si c'est un lien externe (http/https hors application), l'ouvrir dans le navigateur système par défaut
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    // Empêcher toute navigation arbitraire hors de l'application
    const parsedUrl = new URL(navigationUrl);
    if (isDev && parsedUrl.origin === 'http://localhost:3000') {
      return;
    }
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Chargement de l'interface :
  // En mode packagé / production : charge directement le fichier statique dist/index.html sans aucun serveur !
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupAppMenu();
}

// Menu professionnel pour Windows
function setupAppMenu(): void {
  const template: any[] = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Actualiser',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.reload()
        },
        {
          label: 'Recharger sans cache',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow?.webContents.reloadIgnoringCache()
        },
        { type: 'separator' },
        {
          label: 'Quitter SITE-AMM',
          accelerator: 'Alt+F4',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'resetZoom', label: 'Taille normale' },
        { role: 'zoomIn', label: 'Zoom avant' },
        { role: 'zoomOut', label: 'Zoom arrière' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' },
        ...(isDev
          ? [
              { type: 'separator' },
              {
                label: 'Outils de développement',
                accelerator: 'F12',
                click: () => mainWindow?.webContents.toggleDevTools()
              }
            ]
          : [])
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos de SITE-AMM',
          click: () => {
            if (mainWindow) {
              shell.openExternal('https://ass-malagasymiray.web.app');
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// --- GESTIONNAIRES IPC : STOCKAGE SQLITE SÉCURISÉ ---

function registerIpcHandlers(): void {
  ipcMain.handle('storage:get', (_event, collection: string, id: string) => {
    if (!sqliteEngine) return null;
    return sqliteEngine.get(collection, id);
  });

  ipcMain.handle('storage:getAll', (_event, collection: string) => {
    if (!sqliteEngine) return [];
    return sqliteEngine.getAll(collection);
  });

  ipcMain.handle('storage:put', (_event, collection: string, id: string, item: any) => {
    if (!sqliteEngine) return;
    sqliteEngine.put(collection, id, item);
  });

  ipcMain.handle('storage:putBatch', (_event, collection: string, items: Array<{ id: string; data: any }>) => {
    if (!sqliteEngine) return;
    sqliteEngine.putBatch(collection, items);
  });

  ipcMain.handle('storage:delete', (_event, collection: string, id: string) => {
    if (!sqliteEngine) return;
    sqliteEngine.delete(collection, id);
  });

  ipcMain.handle('storage:clear', (_event, collection: string) => {
    if (!sqliteEngine) return;
    sqliteEngine.clear(collection);
  });

  ipcMain.handle('storage:exportAll', () => {
    if (!sqliteEngine) return {};
    return sqliteEngine.exportAll();
  });

  ipcMain.handle('storage:importAll', (_event, data: Record<string, any[]>) => {
    if (!sqliteEngine) return;
    sqliteEngine.importAll(data);
  });

  // Infos système & fenêtre
  ipcMain.handle('app:getVersion', () => app.getVersion());
  ipcMain.handle('app:getPath', (_event, name: any) => app.getPath(name));

  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on('window:close', () => mainWindow?.close());
}

// Initialisation de l'application Electron
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
