/**
 * SERVEUR LAN PRINCIPAL (Phase 6, 7 & 8)
 * Service Node.js / Express indépendant pour réseau local Wi-Fi sans Internet.
 * Exécute l'autorité de synchronisation locale, gère l'appairage sécurisé des appareils,
 * la persistance locale sur disque, et la passerelle de synchronisation Firebase dès qu'Internet est disponible.
 */

import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import http from 'http';

const PORT = parseInt(process.env.LAN_PORT || process.env.PORT || '4000', 10);
const HOST = '0.0.0.0';
const DEFAULT_PIN = process.env.LAN_PIN || '123456';
const DB_FILE = path.join(process.cwd(), 'server', 'data', 'lan_db.json');
const FIREBASE_BASE_URL = 'https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app';

// Assure l'existence du dossier de données
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

interface LanDatabase {
  version: number;
  lastUpdated: number;
  devices: Record<string, {
    deviceId: string;
    name: string;
    platform: string;
    token: string;
    pairedAt: number;
    lastSeen: number;
    status: 'active' | 'revoked';
  }>;
  records: Record<string, Record<string, any>>; // collection -> { id -> data }
  pendingCloudOps: Array<{
    id: string;
    collection: string;
    recordId: string;
    opType: 'CREATE' | 'UPDATE' | 'DELETE';
    payload: any;
    timestamp: number;
  }>;
}

// Initialise ou charge la base de données persistante
function loadDatabase(): LanDatabase {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.warn('[LAN Server] Fichier base corrompu, réinitialisation:', e);
    }
  }

  const initial: LanDatabase = {
    version: 2,
    lastUpdated: Date.now(),
    devices: {},
    records: {},
    pendingCloudOps: []
  };
  saveDatabase(initial);
  return initial;
}

function saveDatabase(db: LanDatabase): void {
  db.lastUpdated = Date.now();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

let db = loadDatabase();

const app = express();
app.use(express.json({ limit: '50mb' }));

// Middleware CORS sans dépendance externe
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Device-Id');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Middleware d'authentification des requêtes LAN
function authenticateDevice(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const deviceId = req.headers['x-device-id'] as string;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Mode tolérant pour la découverte initiale
    return next();
  }

  const token = authHeader.substring(7);
  if (deviceId && db.devices[deviceId]) {
    const dev = db.devices[deviceId];
    if (dev.status === 'revoked') {
      res.status(403).json({ error: 'Appareil révoqué par l\'administrateur' });
      return;
    }
    dev.lastSeen = Date.now();
  }
  next();
}

// --- 1. ÉTAT DU SERVEUR LAN ---
app.get('/api/lan/status', (req: Request, res: Response) => {
  const activeDevices = Object.values(db.devices).filter(d => d.status === 'active').length;
  let totalRecords = 0;
  for (const coll of Object.values(db.records)) {
    totalRecords += Object.keys(coll).length;
  }

  res.json({
    status: 'online',
    serverName: 'Serveur Principal AMM (Wi-Fi Local)',
    version: '2.0.0-offline',
    port: PORT,
    activeDevices,
    totalRecords,
    pendingCloudOpsCount: db.pendingCloudOps.length,
    lastUpdated: db.lastUpdated,
    serverTime: new Date().toISOString()
  });
});

// --- 2. APPAIRAGE D'UN NOUVEL APPAREIL AVEC CODE PIN ---
app.post('/api/lan/pair', (req: Request, res: Response) => {
  const { deviceId, deviceName, platform, pin } = req.body;

  if (!deviceId || !pin) {
    res.status(400).json({ error: 'deviceId et pin sont obligatoires' });
    return;
  }

  if (pin !== DEFAULT_PIN) {
    res.status(401).json({ error: 'Code PIN de sécurité incorrect' });
    return;
  }

  const token = `LAN_AUTH_${Math.random().toString(36).substring(2)}_${Date.now()}`;
  db.devices[deviceId] = {
    deviceId,
    name: deviceName || 'Appareil Client',
    platform: platform || 'inconnu',
    token,
    pairedAt: Date.now(),
    lastSeen: Date.now(),
    status: 'active'
  };

  saveDatabase(db);
  console.log(`[LAN Server] Nouvel appareil appairé : ${deviceId} (${deviceName})`);

  res.json({
    success: true,
    token,
    message: 'Appareil appairé avec succès'
  });
});

// --- 3. LISTE DES APPAREILS APPAIRÉS ---
app.get('/api/lan/devices', (req: Request, res: Response) => {
  const list = Object.values(db.devices);
  res.json(list);
});

// --- 4. RÉVOCATION D'UN APPAREIL ---
app.delete('/api/lan/devices/:deviceId', (req: Request, res: Response) => {
  const { deviceId } = req.params;
  if (db.devices[deviceId]) {
    db.devices[deviceId].status = 'revoked';
    saveDatabase(db);
    console.log(`[LAN Server] Appareil révoqué : ${deviceId}`);
    res.json({ success: true, message: `Appareil ${deviceId} révoqué` });
    return;
  }
  res.status(404).json({ error: 'Appareil non trouvé' });
});

// --- 5. PUSH : RÉCEPTION DES MODIFICATIONS DEPUIS UN CLIENT ---
app.post('/api/lan/sync/push', authenticateDevice, (req: Request, res: Response) => {
  const { deviceId, operations } = req.body;

  if (!Array.isArray(operations)) {
    res.status(400).json({ error: 'Le champ operations doit être une liste' });
    return;
  }

  const acceptedIds: string[] = [];

  for (const op of operations) {
    const { id, collection, recordId, opType, payload, timestamp } = op;
    if (!collection || !recordId) continue;

    if (!db.records[collection]) {
      db.records[collection] = {};
    }

    if (opType === 'DELETE') {
      delete db.records[collection][recordId];
    } else {
      db.records[collection][recordId] = {
        ...payload,
        id: recordId,
        _lanModifiedAt: timestamp || Date.now()
      };
    }

    // Ajout dans la file d'attente pour synchronisation vers Firebase quand Internet sera disponible
    db.pendingCloudOps.push({
      id: id || `${collection}_${recordId}_${Date.now()}`,
      collection,
      recordId,
      opType,
      payload,
      timestamp: timestamp || Date.now()
    });

    acceptedIds.push(id);
  }

  saveDatabase(db);
  console.log(`[LAN Server] ${acceptedIds.length} modification(s) enregistrée(s) depuis l'appareil ${deviceId}`);

  // Tenter en arrière-plan d'envoyer vers Firebase si le serveur dispose d'une connexion Internet
  syncLanServerToFirebase().catch(() => {});

  res.json({
    success: true,
    acceptedIds,
    pendingCloudOpsCount: db.pendingCloudOps.length
  });
});

// --- 6. PULL : ENVOI DES MODIFICATIONS RÉCENTES VERS UN CLIENT ---
app.get('/api/lan/sync/pull', authenticateDevice, (req: Request, res: Response) => {
  const since = parseInt((req.query.since as string) || '0', 10);
  const result: Record<string, any[]> = {};

  for (const [collName, items] of Object.entries(db.records)) {
    const filtered = Object.values(items).filter((item: any) => {
      const mod = item._lanModifiedAt || 0;
      return mod >= since;
    });
    if (filtered.length > 0) {
      result[collName] = filtered;
    }
  }

  res.json({
    records: result,
    serverTimestamp: Date.now()
  });
});

// --- 7. SAUVEGARDE & RESTAURATION DU SERVEUR LAN ---
app.get('/api/lan/backup', (req: Request, res: Response) => {
  res.json(db);
});

app.post('/api/lan/restore', (req: Request, res: Response) => {
  const newDb = req.body;
  if (!newDb.version || !newDb.records) {
    res.status(400).json({ error: 'Format de base de données invalide' });
    return;
  }
  db = newDb;
  saveDatabase(db);
  res.json({ success: true, message: 'Base de données du serveur LAN restaurée' });
});

// --- 8. PASSERELLE DE SYNCHRONISATION LAN -> FIREBASE CLOUD ---
async function syncLanServerToFirebase() {
  if (db.pendingCloudOps.length === 0) return;

  const opsToProcess = [...db.pendingCloudOps];
  const successfulOps: string[] = [];

  for (const op of opsToProcess) {
    try {
      const url = `${FIREBASE_BASE_URL}/${op.collection}/${op.recordId}.json`;
      const res = op.opType === 'DELETE'
        ? await fetch(url, { method: 'DELETE' })
        : await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(op.payload)
          });

      if (res.ok) {
        successfulOps.push(op.id);
      }
    } catch {
      // Pas d'Internet sur le serveur, on garde la file d'attente
      break;
    }
  }

  if (successfulOps.length > 0) {
    db.pendingCloudOps = db.pendingCloudOps.filter(o => !successfulOps.includes(o.id));
    saveDatabase(db);
    console.log(`[LAN Server] ${successfulOps.length} opération(s) synchronisée(s) avec succès vers Firebase Cloud`);
  }
}

// Sonde périodique pour vider la file Cloud quand Internet est disponible
setInterval(() => {
  syncLanServerToFirebase().catch(() => {});
}, 30000);

// Démarrage du serveur
const server = http.createServer(app);
server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`  SERVEUR PRINCIPAL AMM - SYNCHRONISATION LOCALE WI-FI`);
  console.log(`  Port : ${PORT} | Hôte : ${HOST}`);
  console.log(`  Code PIN d'appairage par défaut : ${DEFAULT_PIN}`);
  console.log(`  Base locale persistante : ${DB_FILE}`);
  console.log('====================================================');
});
