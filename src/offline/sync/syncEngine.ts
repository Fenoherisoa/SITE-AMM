/**
 * Moteur de synchronisation bidirectionnelle Firebase Realtime Database (Phase 4 & 5).
 * Cycle automatique 24h, reprise après reconnexion, opérations idempotentes, résolution de conflits.
 */

import { storageManager } from '../storage/StorageManager';
import { DataLayer } from '../dataLayer';
import { networkManager } from '../network/networkManager';
import { syncLogger } from './syncLogger';
import { SyncState, SyncOperation } from '../types';

type SyncListener = (state: SyncState) => void;

const SYNC_CYCLE_MS = 24 * 60 * 60 * 1000; // 24 heures

// Collections à synchroniser avec Firebase Realtime Database
const CLOUD_SYNC_COLLECTIONS: Record<string, string> = {
  olona: 'olona',
  enquetes: 'enquetes',
  comptes: 'comptes',
  comptabilite: 'comptabilite',
  events: 'events',
  operationRequest: 'operationRequest',
  token_pool: 'token_pool',
  logs: 'logs',
  users: 'users',
  parametres: 'parametres',
  employees: 'employees',
  departments: 'departments',
  positions: 'positions',
  leave_requests: 'leave_requests',
  payroll: 'payroll'
};

class SyncEngine {
  private state: SyncState = {
    isSyncing: false,
    networkState: 'ONLINE',
    pendingCount: 0,
    syncedLanCount: 0,
    syncedCloudCount: 0,
    errorCount: 0,
    lastSyncTime: null,
    nextSyncTime: null,
    lastError: null,
    currentProgress: 0
  };

  private listeners: Set<SyncListener> = new Set();
  private autoSyncTimer: any = null;
  private isProcessing = false;

  constructor() {
    this.init();
  }

  private async init() {
    // 1. Charger les derniers temps de synchronisation
    if (typeof localStorage !== 'undefined') {
      const savedLast = localStorage.getItem('amm_last_cloud_sync');
      if (savedLast) {
        this.state.lastSyncTime = parseInt(savedLast, 10);
        this.state.nextSyncTime = this.state.lastSyncTime + SYNC_CYCLE_MS;
      } else {
        this.state.nextSyncTime = Date.now() + SYNC_CYCLE_MS;
      }
    }

    // 2. Écouter les changements de réseau
    networkManager.subscribe(async (netState) => {
      this.state.networkState = netState;
      this.notify();

      // Si le réseau redevient en ligne, vérifier si synchro nécessaire
      if (netState === 'ONLINE' && !this.isProcessing) {
        const stats = await DataLayer.getOutboxStats();
        if (stats.pending > 0 || this.is24hCycleDue()) {
          syncLogger.log('info', 'Rétablissement de la connexion Internet — Lancement de la synchronisation automatique', 'CLOUD');
          this.syncAll();
        }
      }
    });

    // 3. Écouter les modifications locales (DataLayer)
    DataLayer.subscribe(() => {
      this.updateStats();
    });

    await this.updateStats();

    // 4. Planification du cycle régulier de 24 heures (avec vérification toutes les minutes)
    this.autoSyncTimer = setInterval(() => {
      if (this.is24hCycleDue() && networkManager.isOnline() && !this.isProcessing) {
        syncLogger.log('info', 'Déclencheur 24h atteint — Début de la synchronisation générale', 'CLOUD');
        this.syncAll();
      }
    }, 60000);
  }

  public is24hCycleDue(): boolean {
    if (!this.state.lastSyncTime) return true;
    return Date.now() - this.state.lastSyncTime >= SYNC_CYCLE_MS;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener({ ...this.state });
      } catch (err) {
        console.error('[SyncEngine] Listener error:', err);
      }
    }
  }

  public async updateStats(): Promise<void> {
    const stats = await DataLayer.getOutboxStats();
    this.state.pendingCount = stats.pending;
    this.state.syncedLanCount = stats.syncedLan;
    this.state.syncedCloudCount = stats.syncedCloud;
    this.state.errorCount = stats.failed;
    this.notify();
  }

  // Effectue une requête HTTP résiliente vers Firebase RTDB (via proxy si disponible, sinon direct)
  private async requestFirebase(path: string, options?: RequestInit): Promise<Response> {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      // 1. Essai avec le proxy même-origine
      const proxyRes = await fetch(`/api/rtdb${cleanPath}`, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (proxyRes.ok || proxyRes.status === 404) {
        return proxyRes;
      }
    } catch {
      // Fallback direct
    }

    // 2. Essai direct
    const directUrl = `https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app${cleanPath}`;
    return await fetch(directUrl, {
      ...options,
      signal: controller.signal
    });
  }

  // --- SYNCHRONISATION COMPLÈTE (PUSH OUTBOX + PULL FROM CLOUD) ---

  public async syncAll(): Promise<boolean> {
    if (this.isProcessing) return false;
    if (!networkManager.isOnline()) {
      syncLogger.log('warn', 'Impossible de synchroniser avec Firebase : appareil hors ligne', 'CLOUD');
      return false;
    }

    this.isProcessing = true;
    this.state.isSyncing = true;
    this.state.currentProgress = 10;
    this.state.lastError = null;
    this.notify();

    syncLogger.log('info', 'Démarrage du processus de synchronisation générale avec Firebase...', 'CLOUD');

    try {
      // Étape 1 : Envoyer les modifications locales en attente (PUSH)
      this.state.currentProgress = 25;
      this.notify();
      await this.pushPendingChanges();

      // Étape 2 : Télécharger les mises à jour distantes (PULL)
      this.state.currentProgress = 65;
      this.notify();
      await this.pullRemoteChanges();

      // Succès
      const now = Date.now();
      this.state.lastSyncTime = now;
      this.state.nextSyncTime = now + SYNC_CYCLE_MS;
      this.state.currentProgress = 100;
      this.state.isSyncing = false;

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('amm_last_cloud_sync', now.toString());
      }

      await this.updateStats();
      syncLogger.log('success', 'Synchronisation générale avec Firebase achevée avec succès !', 'CLOUD');
      this.notify();
      return true;
    } catch (err: any) {
      console.error('[SyncEngine] Erreur pendant la synchronisation:', err);
      this.state.lastError = err.message || 'Erreur inconnue';
      this.state.isSyncing = false;
      this.state.currentProgress = 0;
      syncLogger.log('error', `Échec de la synchronisation : ${this.state.lastError}`, 'CLOUD');
      this.notify();
      return false;
    } finally {
      this.isProcessing = false;
      setTimeout(() => {
        this.state.currentProgress = 0;
        this.notify();
      }, 3000);
    }
  }

  // --- PUSH : ENVOI DES MODIFICATIONS LOCALES (OUTBOX) ---

  public async pushPendingChanges(): Promise<number> {
    const ops = await DataLayer.getPendingOperations();
    if (ops.length === 0) {
      syncLogger.log('info', 'Aucune modification locale en attente dans la file Outbox', 'LOCAL');
      return 0;
    }

    syncLogger.log('info', `Envoi de ${ops.length} opération(s) locale(s) vers Firebase...`, 'CLOUD');
    let successCount = 0;

    for (const op of ops) {
      try {
        const remotePath = this.getRemotePathForOperation(op);
        let res: Response;

        if (op.opType === 'DELETE') {
          res = await this.requestFirebase(`${remotePath}.json`, {
            method: 'DELETE'
          });
        } else {
          // CREATE ou UPDATE
          res = await this.requestFirebase(`${remotePath}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(op.payload)
          });
        }

        if (res.ok) {
          await DataLayer.markOperationSynced(op.id, 'CLOUD');
          successCount++;
        } else {
          const errText = `HTTP ${res.status}`;
          await DataLayer.markOperationFailed(op.id, errText);
          syncLogger.log('error', `Échec pour l'opération ${op.collection}/${op.recordId} (${errText})`, 'CLOUD');
        }
      } catch (e: any) {
        await DataLayer.markOperationFailed(op.id, e.message || 'Erreur réseau');
        syncLogger.log('error', `Erreur réseau sur l'opération ${op.id} : ${e.message}`, 'CLOUD');
      }
    }

    await this.updateStats();
    syncLogger.log('info', `${successCount}/${ops.length} opération(s) synchronisée(s) vers Firebase`, 'CLOUD');
    return successCount;
  }

  // --- PULL : RÉCUPÉRATION DES MISES À JOUR CLOUD ---

  public async pullRemoteChanges(): Promise<void> {
    syncLogger.log('info', 'Téléchargement des données récentes depuis Firebase RTDB...', 'CLOUD');
    const adapter = await storageManager.getAdapter();
    const pendingOps = await DataLayer.getPendingOperations();
    const pendingRecordIds = new Set(pendingOps.map((op) => `${op.collection}:${op.recordId}`));

    for (const [localCollection, remoteEndpoint] of Object.entries(CLOUD_SYNC_COLLECTIONS)) {
      try {
        const res = await this.requestFirebase(`/${remoteEndpoint}.json`);
        if (!res.ok) continue;
        const data = await res.json();
        if (!data) continue;

        const entries: Array<{ id: string; data: any }> = [];

        if (typeof data === 'object' && !Array.isArray(data)) {
          for (const [key, val] of Object.entries(data)) {
            // Résolution de conflit : si l'enregistrement a une modification locale en attente, ne pas écraser
            if (pendingRecordIds.has(`${localCollection}:${key}`)) {
              continue;
            }
            if (val && typeof val === 'object') {
              entries.push({ id: key, data: { ...val, id: key } });
            }
          }
        } else if (Array.isArray(data)) {
          data.forEach((item, idx) => {
            if (item && item.id) {
              if (!pendingRecordIds.has(`${localCollection}:${item.id}`)) {
                entries.push({ id: item.id, data: item });
              }
            }
          });
        }

        if (entries.length > 0) {
          await adapter.putBatch(localCollection, entries);
        }
      } catch (err: any) {
        syncLogger.log('warn', `Avertissement lors de la récupération de '${localCollection}': ${err.message}`, 'CLOUD');
      }
    }
  }

  private getRemotePathForOperation(op: SyncOperation): string {
    const endpoint = CLOUD_SYNC_COLLECTIONS[op.collection] || op.collection;
    if (op.collection === 'parametres') {
      return `/${endpoint}`;
    }
    return `/${endpoint}/${op.recordId}`;
  }
}

export const syncEngine = new SyncEngine();
