/**
 * Types pour l'architecture Offline-First & Synchronisation Multiplateforme (AMM)
 */

export type SyncStatus = 'LOCAL' | 'LAN' | 'CLOUD';

export type OpType = 'CREATE' | 'UPDATE' | 'DELETE';

export type NetworkState = 'ONLINE' | 'OFFLINE' | 'LAN_CONNECTED' | 'LAN_UNAVAILABLE';

export interface SyncOperation {
  id: string; // Identifiant unique UUID
  collection: string; // Nom de la collection/table (ex: olona, enquetes, comptabilite)
  recordId: string; // ID de l'enregistrement concerné
  opType: OpType;
  payload?: any; // Données modifiées
  baseVersion?: number;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  syncLevel: SyncStatus; // LOCAL -> LAN -> CLOUD
  retryCount: number;
  lastError?: string;
}

export interface SyncState {
  isSyncing: boolean;
  networkState: NetworkState;
  pendingCount: number;
  syncedLanCount: number;
  syncedCloudCount: number;
  errorCount: number;
  lastSyncTime: number | null;
  nextSyncTime: number | null;
  lastError: string | null;
  currentProgress?: number; // 0 à 100
}

export type LogLevel = 'info' | 'warn' | 'error' | 'success';

export interface SyncLogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  source: 'LOCAL' | 'LAN' | 'CLOUD';
  details?: string;
}

export interface PairedDevice {
  deviceId: string;
  name: string;
  platform: 'windows' | 'android' | 'browser';
  ip?: string;
  pairedAt: number;
  lastSeen: number;
  status: 'active' | 'revoked';
  token?: string;
}

export interface LanServerConfig {
  serverIp: string;
  serverPort: number;
  deviceId: string;
  deviceName: string;
  authToken?: string;
  pairingPin?: string;
  autoSyncLan: boolean;
}

export interface OfflineCredential {
  uid: string;
  email: string;
  passwordHash: string;
  salt: string;
  displayName: string;
  role: string;
  status: string;
  permissions: string[];
  userData: any;
  cachedAt: number;
  offlineExpiresAt: number; // 30 jours par défaut
}

export interface BackupPayload {
  version: number;
  exportedAt: string;
  checksum: string;
  metadata: {
    app: string;
    totalRecords: number;
  };
  data: Record<string, any[]>;
}
