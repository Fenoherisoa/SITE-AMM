/**
 * Moteur de synchronisation Réseau Local (Wi-Fi LAN) sans Internet (Phase 6, 7 & 8).
 * Permet l'échange de données entre ordinateurs Windows et téléphones Android sur le même Wi-Fi.
 */

import { storageManager } from '../storage/StorageManager';
import { DataLayer } from '../dataLayer';
import { networkManager } from '../network/networkManager';
import { syncLogger } from './syncLogger';
import { getOrCreateDeviceId } from '../security/cryptoUtils';
import { PairedDevice, LanServerConfig } from '../types';

class LanSyncEngine {
  private config: LanServerConfig = {
    serverIp: '192.168.1.50',
    serverPort: 4000,
    deviceId: getOrCreateDeviceId(),
    deviceName: 'Poste ' + (typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Android') ? 'Android' : 'Windows') : 'Client'),
    authToken: '',
    autoSyncLan: true
  };

  private isSyncing = false;
  private pairedDevices: PairedDevice[] = [];

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem('amm_lan_config');
    if (saved) {
      try {
        this.config = { ...this.config, ...JSON.parse(saved) };
      } catch {}
    }
  }

  public saveConfig(newConfig: Partial<LanServerConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('amm_lan_config', JSON.stringify(this.config));
    }
    const fullUrl = `http://${this.config.serverIp}:${this.config.serverPort}`;
    networkManager.setLanServerUrl(fullUrl);
  }

  public getConfig(): LanServerConfig {
    return { ...this.config };
  }

  public getBaseUrl(): string {
    return `http://${this.config.serverIp}:${this.config.serverPort}`;
  }

  // --- TEST DE CONNEXION AU SERVEUR LOCAL ---

  public async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    const url = `${this.getBaseUrl()}/api/lan/status`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        syncLogger.log('success', `Serveur LAN détecté et opérationnel : ${data.serverName || 'Serveur Principal'}`, 'LAN');
        return { success: true, message: 'Serveur LAN en ligne et réactif', data };
      }
      return { success: false, message: `Erreur HTTP ${res.status} du serveur local` };
    } catch (err: any) {
      return {
        success: false,
        message: `Impossible de contacter le serveur local sur ${this.getBaseUrl()} (${err.message || 'Délai d’attente dépassé'})`
      };
    }
  }

  // --- PROCÉDURE D'APPAIRAGE AVEC LE SERVEUR LOCAL ---

  public async pairDevice(pin: string): Promise<{ success: boolean; message: string }> {
    const url = `${this.getBaseUrl()}/api/lan/pair`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.config.deviceId,
          deviceName: this.config.deviceName,
          platform: typeof navigator !== 'undefined' && navigator.userAgent.includes('Android') ? 'android' : 'windows',
          pin
        })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        this.saveConfig({ authToken: data.token });
        syncLogger.log('success', `Appareil ${this.config.deviceId} appairé avec succès sur le serveur LAN !`, 'LAN');
        return { success: true, message: 'Appareil appairé avec succès.' };
      }
      return { success: false, message: data.error || 'Code PIN invalide.' };
    } catch (err: any) {
      return { success: false, message: `Échec d'appairage : ${err.message}` };
    }
  }

  // --- SYNCHRONISATION BIDIRECTIONNELLE LAN SANS INTERNET ---

  public async syncWithLan(): Promise<boolean> {
    if (this.isSyncing) return false;
    const test = await this.testConnection();
    if (!test.success) {
      syncLogger.log('warn', 'Serveur LAN injoignable pour la synchronisation locale', 'LAN');
      return false;
    }

    this.isSyncing = true;
    syncLogger.log('info', 'Début de la synchronisation Wi-Fi locale avec le serveur LAN...', 'LAN');

    try {
      // 1. PUSH : Envoyer les opérations locales vers le serveur LAN
      await this.pushOperationsToLan();

      // 2. PULL : Récupérer les modifications validées depuis le serveur LAN
      await this.pullUpdatesFromLan();

      syncLogger.log('success', 'Synchronisation locale Wi-Fi terminée avec succès !', 'LAN');
      return true;
    } catch (err: any) {
      syncLogger.log('error', `Erreur lors de la synchronisation locale : ${err.message}`, 'LAN');
      return false;
    } finally {
      this.isSyncing = false;
    }
  }

  // PUSH des opérations de l'outbox vers le serveur LAN
  private async pushOperationsToLan(): Promise<number> {
    const ops = await DataLayer.getPendingOperations();
    if (ops.length === 0) return 0;

    const url = `${this.getBaseUrl()}/api/lan/sync/push`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.authToken || 'anonymous'}`,
        'X-Device-Id': this.config.deviceId
      },
      body: JSON.stringify({
        deviceId: this.config.deviceId,
        operations: ops
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} lors de l'envoi vers le serveur LAN`);
    }

    const data = await res.json();
    const acceptedIds: string[] = data.acceptedIds || [];

    for (const id of acceptedIds) {
      // Marquer comme synchronisé au niveau LAN (mais pas encore forcément Cloud)
      await DataLayer.markOperationSynced(id, 'LAN');
    }

    syncLogger.log('info', `${acceptedIds.length}/${ops.length} opération(s) enregistrée(s) sur le serveur LAN`, 'LAN');
    return acceptedIds.length;
  }

  // PULL des modifications globales depuis le serveur LAN
  private async pullUpdatesFromLan(): Promise<void> {
    const lastPullTime = parseInt(localStorage.getItem('amm_last_lan_pull') || '0', 10);
    const url = `${this.getBaseUrl()}/api/lan/sync/pull?since=${lastPullTime}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.config.authToken || 'anonymous'}`,
        'X-Device-Id': this.config.deviceId
      }
    });

    if (!res.ok) return;

    const data = await res.json();
    const records = data.records || {};
    const adapter = await storageManager.getAdapter();

    for (const [collection, list] of Object.entries(records)) {
      if (Array.isArray(list) && list.length > 0) {
        const batch = list.map((item: any) => ({ id: item.id, data: item }));
        await adapter.putBatch(collection, batch);
      }
    }

    localStorage.setItem('amm_last_lan_pull', Date.now().toString());
  }

  // --- GESTION DES APPAREILS APPAIRÉS SUR LE SERVEUR LAN ---

  public async fetchPairedDevices(): Promise<PairedDevice[]> {
    const url = `${this.getBaseUrl()}/api/lan/devices`;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.config.authToken || ''}`,
          'X-Device-Id': this.config.deviceId
        }
      });
      if (res.ok) {
        const list = await res.json();
        this.pairedDevices = list;
        return list;
      }
    } catch {}
    return this.pairedDevices;
  }

  public async revokeDevice(deviceId: string): Promise<boolean> {
    const url = `${this.getBaseUrl()}/api/lan/devices/${deviceId}`;
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.config.authToken || ''}`,
          'X-Device-Id': this.config.deviceId
        }
      });
      if (res.ok) {
        this.pairedDevices = this.pairedDevices.filter((d) => d.deviceId !== deviceId);
        syncLogger.log('warn', `Appareil révoqué : ${deviceId}`, 'LAN');
        return true;
      }
    } catch {}
    return false;
  }
}

export const lanSyncEngine = new LanSyncEngine();
