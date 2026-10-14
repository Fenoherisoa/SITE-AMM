/**
 * NetworkManager - Détecte l'état du réseau en temps réel (Internet, Hors ligne, Réseau Local LAN)
 */

import { NetworkState } from '../types';

type NetworkListener = (state: NetworkState) => void;

class NetworkManager {
  private currentState: NetworkState = 'ONLINE';
  private listeners: Set<NetworkListener> = new Set();
  private checkInterval: any = null;
  private lanServerUrl = 'http://192.168.1.50:4000';
  private isLanConfigured = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Chargement de l'URL du serveur LAN depuis le localStorage
    const savedLan = localStorage.getItem('amm_lan_server_url');
    if (savedLan) {
      this.lanServerUrl = savedLan;
      this.isLanConfigured = true;
    }

    this.currentState = navigator.onLine ? 'ONLINE' : 'OFFLINE';

    window.addEventListener('online', () => {
      this.checkConnectivity();
    });

    window.addEventListener('offline', () => {
      this.currentState = 'OFFLINE';
      this.notify();
      this.checkLanConnectivity();
    });

    // Sonde régulière toutes les 20 secondes
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, 20000);

    // Première vérification immédiate
    this.checkConnectivity();
  }

  public setLanServerUrl(url: string) {
    this.lanServerUrl = url.trim().replace(/\/$/, '');
    this.isLanConfigured = !!this.lanServerUrl;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('amm_lan_server_url', this.lanServerUrl);
    }
    this.checkConnectivity();
  }

  public getLanServerUrl(): string {
    return this.lanServerUrl;
  }

  public getState(): NetworkState {
    return this.currentState;
  }

  public isOnline(): boolean {
    return this.currentState === 'ONLINE';
  }

  public isLanConnected(): boolean {
    return this.currentState === 'LAN_CONNECTED';
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.currentState);
      } catch (err) {
        console.error('[NetworkManager] Erreur dans le listener:', err);
      }
    }
  }

  // Vérifie la connectivité réelle (Internet vs LAN)
  public async checkConnectivity(): Promise<NetworkState> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return await this.checkLanConnectivity();
    }

    // Test ping léger vers Firebase ou le proxy
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch('/api/rtdb/.json?shallow=true', {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok || res.status === 401 || res.status === 403) {
        this.currentState = 'ONLINE';
        this.notify();
        return 'ONLINE';
      }
    } catch {
      // Échec Internet, testons si le LAN est disponible
    }

    return await this.checkLanConnectivity();
  }

  // Teste si le serveur local est joignable sur le réseau Wi-Fi
  public async checkLanConnectivity(): Promise<NetworkState> {
    if (!this.lanServerUrl) {
      this.currentState = 'OFFLINE';
      this.notify();
      return 'OFFLINE';
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`${this.lanServerUrl}/api/lan/status`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.currentState = 'LAN_CONNECTED';
        this.notify();
        return 'LAN_CONNECTED';
      }
    } catch {
      // LAN injoignable
    }

    this.currentState = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    this.notify();
    return this.currentState;
  }
}

export const networkManager = new NetworkManager();
