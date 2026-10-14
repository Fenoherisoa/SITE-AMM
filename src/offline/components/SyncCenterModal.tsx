import React, { useState, useEffect } from 'react';
import { syncEngine } from '../sync/syncEngine';
import { lanSyncEngine } from '../sync/lanSyncEngine';
import { networkManager } from '../network/networkManager';
import { syncLogger } from '../sync/syncLogger';
import { DataLayer } from '../dataLayer';
import { BackupService } from '../storage/backupService';
import { storageManager } from '../storage/StorageManager';
import { 
  SyncState, 
  NetworkState, 
  SyncLogEntry, 
  PairedDevice, 
  LanServerConfig 
} from '../types';
import { 
  X, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  Wifi, 
  WifiOff, 
  Server, 
  ShieldCheck, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  HardDrive, 
  Smartphone, 
  Laptop, 
  Radio, 
  KeyRound, 
  FileCheck, 
  Info
} from 'lucide-react';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'lan' | 'backup'>('general');

  // États du moteur de synchronisation
  const [syncState, setSyncState] = useState<SyncState>({
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
  });

  const [networkState, setNetworkState] = useState<NetworkState>(networkManager.getState());
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [lanConfig, setLanConfig] = useState<LanServerConfig>(lanSyncEngine.getConfig());
  const [pairingPin, setPairingPin] = useState('');
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);
  const [lanTestResult, setLanTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingLan, setIsTestingLan] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const unsubSync = syncEngine.subscribe((st) => setSyncState(st));
    const unsubNet = networkManager.subscribe((st) => setNetworkState(st));
    const unsubLogs = syncLogger.subscribe((l) => setLogs(l));

    lanSyncEngine.fetchPairedDevices().then((devs) => setPairedDevices(devs));

    return () => {
      unsubSync();
      unsubNet();
      unsubLogs();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Formatage des dates
  const formatDate = (ts: number | null) => {
    if (!ts) return 'Aucune synchronisation enregistrée';
    return new Date(ts).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Actions de synchronisation Cloud
  const handleSyncAll = async () => {
    await syncEngine.syncAll();
  };

  const handlePushOnly = async () => {
    await syncEngine.pushPendingChanges();
  };

  const handlePullOnly = async () => {
    await syncEngine.pullRemoteChanges();
  };

  const handleRetryFailed = async () => {
    const count = await DataLayer.retryFailedOperations();
    syncLogger.log('info', `${count} opération(s) remise(s) en file d'attente`, 'LOCAL');
    await syncEngine.updateStats();
  };

  // Actions de synchronisation LAN
  const handleTestLan = async () => {
    setIsTestingLan(true);
    setLanTestResult(null);
    const result = await lanSyncEngine.testConnection();
    setIsTestingLan(false);
    setLanTestResult(result);
  };

  const handleSaveLanConfig = (e: React.FormEvent) => {
    e.preventDefault();
    lanSyncEngine.saveConfig(lanConfig);
    handleTestLan();
  };

  const handlePairDevice = async () => {
    if (!pairingPin) return;
    setIsPairing(true);
    const res = await lanSyncEngine.pairDevice(pairingPin);
    setIsPairing(false);
    setLanTestResult(res);
    if (res.success) {
      setPairingPin('');
      const devs = await lanSyncEngine.fetchPairedDevices();
      setPairedDevices(devs);
    }
  };

  const handleSyncWithLan = async () => {
    await lanSyncEngine.syncWithLan();
    await syncEngine.updateStats();
    const devs = await lanSyncEngine.fetchPairedDevices();
    setPairedDevices(devs);
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (window.confirm(`Confirmez-vous la révocation de l'appareil ${deviceId} ?`)) {
      await lanSyncEngine.revokeDevice(deviceId);
      const devs = await lanSyncEngine.fetchPairedDevices();
      setPairedDevices(devs);
    }
  };

  // Actions de sauvegarde & restauration
  const handleDownloadBackup = async () => {
    await BackupService.downloadBackup();
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await BackupService.restoreBackup(content);
      setRestoreFeedback(res);
      await syncEngine.updateStats();
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Centre de Synchronisation & Réseau Local
              </h2>
              <p className="text-xs text-slate-300">
                Architecture Offline-First • Firebase Cloud • Réseau Wi-Fi Local (Windows & Android)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fermer (Échap)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Synchronisation 24h & Cloud</span>
          </button>
          <button
            onClick={() => setActiveTab('lan')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'lan'
                ? 'bg-white text-amber-800 border-t-2 border-amber-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4 text-amber-600" />
            <span>Réseau Local (Wi-Fi LAN)</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white text-blue-800 border-t-2 border-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-blue-600" />
            <span>Sauvegarde & Sécurité</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* ============================================================== */}
          {/* TAB 1: SYNCHRONISATION GÉNÉRALE 24H & CLOUD */}
          {/* ============================================================== */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              
              {/* Statut Réseau & Cycle 24h */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-slate-200">
                    {networkState === 'ONLINE' ? (
                      <Wifi className="w-6 h-6 text-emerald-600" />
                    ) : networkState === 'LAN_CONNECTED' ? (
                      <Server className="w-6 h-6 text-amber-600" />
                    ) : (
                      <WifiOff className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      État du Réseau
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {networkState === 'ONLINE' && 'Internet disponible (Firebase RTDB actif)'}
                      {networkState === 'LAN_CONNECTED' && 'Connecté au Réseau Wi-Fi Local (LAN)'}
                      {networkState === 'OFFLINE' && 'Mode Hors Ligne (Persistance locale active)'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Les modifications sont systématiquement enregistrées sur cet appareil.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-white shadow-2xs border border-slate-200">
                    <Clock className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Cycle de Synchronisation (24h)
                    </div>
                    <div className="text-xs font-medium text-slate-700 mt-1">
                      Dernière synchro : <span className="font-bold text-slate-900">{formatDate(syncState.lastSyncTime)}</span>
                    </div>
                    <div className="text-xs font-medium text-slate-700 mt-0.5">
                      Prochaine synchro : <span className="font-bold text-slate-900">{formatDate(syncState.nextSyncTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barre de Progression (si active) */}
              {syncState.isSyncing && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      Synchronisation bidirectionnelle en cours...
                    </span>
                    <span>{syncState.currentProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${syncState.currentProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Métriques / Compteurs d'état */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-center">
                  <div className="text-2xl font-extrabold text-amber-700">{syncState.pendingCount}</div>
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mt-1">
                    En attente (Local)
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-center">
                  <div className="text-2xl font-extrabold text-blue-700">{syncState.syncedLanCount}</div>
                  <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wider mt-1">
                    Synchronisées LAN
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center">
                  <div className="text-2xl font-extrabold text-emerald-700">{syncState.syncedCloudCount}</div>
                  <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mt-1">
                    Synchronisées Firebase
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 text-center">
                  <div className="text-2xl font-extrabold text-rose-700">{syncState.errorCount}</div>
                  <div className="text-[11px] font-bold text-rose-900 uppercase tracking-wider mt-1">
                    Échecs / Erreurs
                  </div>
                </div>
              </div>

              {/* Boutons d'Action Fonctionnels */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleSyncAll}
                  disabled={syncState.isSyncing || networkState === 'OFFLINE'}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
                  <span>Synchroniser Maintenant</span>
                </button>

                <button
                  onClick={handlePushOnly}
                  disabled={syncState.isSyncing || networkState === 'OFFLINE' || syncState.pendingCount === 0}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Envoyer les modifications locales</span>
                </button>

                <button
                  onClick={handlePullOnly}
                  disabled={syncState.isSyncing || networkState === 'OFFLINE'}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors border border-slate-300 cursor-pointer"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Télécharger les mises à jour distantes</span>
                </button>

                {syncState.errorCount > 0 && (
                  <button
                    onClick={handleRetryFailed}
                    className="px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 transition-colors border border-rose-300 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-rose-700" />
                    <span>Relancer les opérations en erreur</span>
                  </button>
                )}
              </div>

              {/* Journal d'Audit Détaillé des Synchronisations */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Journal d'audit détaillé des synchronisations
                  </h3>
                  <button
                    onClick={() => syncLogger.clearLogs()}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Effacer le journal</span>
                  </button>
                </div>

                <div className="bg-slate-900 rounded-2xl p-4 text-xs font-mono text-slate-200 max-h-56 overflow-y-auto space-y-2 border border-slate-800">
                  {logs.length === 0 ? (
                    <div className="text-slate-500 italic py-2">Aucun événement enregistré.</div>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-500 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                          log.source === 'CLOUD' ? 'bg-blue-900/60 text-blue-300' :
                          log.source === 'LAN' ? 'bg-amber-900/60 text-amber-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {log.source}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                          log.level === 'success' ? 'bg-emerald-900/60 text-emerald-300' :
                          log.level === 'error' ? 'bg-rose-900/60 text-rose-300' :
                          log.level === 'warn' ? 'bg-amber-900/60 text-amber-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-slate-300 flex-1">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: RÉSEAU LOCAL (WI-FI LAN SANS INTERNET) */}
          {/* ============================================================== */}
          {activeTab === 'lan' && (
            <div className="space-y-6">

              {/* Bannière de résultat du test LAN */}
              {lanTestResult && (
                <div className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
                  lanTestResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {lanTestResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="font-semibold">{lanTestResult.message}</div>
                </div>
              )}

              {/* Configuration de l'Adresse du Serveur LAN */}
              <form onSubmit={handleSaveLanConfig} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Server className="w-4 h-4 text-amber-600" />
                    Connexion au Serveur LAN Wi-Fi
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                    Port par défaut : 4000
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Adresse IP du Serveur Windows (sur le Wi-Fi local)
                    </label>
                    <input
                      type="text"
                      value={lanConfig.serverIp}
                      onChange={(e) => setLanConfig({ ...lanConfig, serverIp: e.target.value })}
                      placeholder="Ex: 192.168.1.50"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Port d'écoute
                    </label>
                    <input
                      type="number"
                      value={lanConfig.serverPort}
                      onChange={(e) => setLanConfig({ ...lanConfig, serverPort: parseInt(e.target.value, 10) || 4000 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Enregistrer l'adresse
                  </button>

                  <button
                    type="button"
                    onClick={handleTestLan}
                    disabled={isTestingLan}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingLan ? 'animate-spin' : ''}`} />
                    <span>Tester la connexion</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncWithLan}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Synchroniser avec le serveur local</span>
                  </button>
                </div>
              </form>

              {/* Appairage de l'Appareil Actuel */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    Appairage Sécurisé de cet Appareil
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    ID Appareil : {lanConfig.deviceId}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Pour autoriser cet appareil (ordinateur portable ou smartphone Android) à échanger des données avec le serveur local Wi-Fi, saisissez le code PIN de sécurité défini sur le serveur.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="password"
                    maxLength={10}
                    value={pairingPin}
                    onChange={(e) => setPairingPin(e.target.value)}
                    placeholder="Code PIN (par défaut : 123456)"
                    className="px-3 py-2 rounded-xl border border-slate-300 text-xs tracking-widest font-mono w-64 focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="button"
                    onClick={handlePairDevice}
                    disabled={isPairing || !pairingPin}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Appairer cet appareil</span>
                  </button>

                  {lanConfig.authToken && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Appareil déjà authentifié
                    </span>
                  )}
                </div>
              </div>

              {/* Tableau des Appareils Appairés sur le Réseau Local */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-amber-600" />
                  Appareils autorisés sur le serveur LAN
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="px-4 py-3">Identifiant Appareil</th>
                        <th className="px-4 py-3">Nom</th>
                        <th className="px-4 py-3">Plateforme</th>
                        <th className="px-4 py-3">Dernière Connexion</th>
                        <th className="px-4 py-3">Statut</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {pairedDevices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-slate-400 italic">
                            Aucun appareil n'est encore enregistré sur le serveur LAN.
                          </td>
                        </tr>
                      ) : (
                        pairedDevices.map((dev) => (
                          <tr key={dev.deviceId} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono font-bold text-slate-900">{dev.deviceId}</td>
                            <td className="px-4 py-3 text-slate-700">{dev.name}</td>
                            <td className="px-4 py-3 capitalize">
                              <span className="flex items-center gap-1.5">
                                {dev.platform === 'android' ? (
                                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Laptop className="w-3.5 h-3.5 text-blue-600" />
                                )}
                                {dev.platform}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{formatDate(dev.lastSeen)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                dev.status === 'active' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {dev.status === 'active' ? 'Actif' : 'Révoqué'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {dev.status === 'active' && (
                                <button
                                  onClick={() => handleRevokeDevice(dev.deviceId)}
                                  className="text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                                >
                                  Révoquer
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions de Démarrage Rapide */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Info className="w-4 h-4 text-amber-700" />
                  Comment démarrer le Serveur LAN sur un ordinateur Windows ?
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li>Double-cliquez sur le fichier <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">start-lan-server.bat</code> sur le PC principal.</li>
                  <li>Ouvrez l'invite de commande et tapez <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">ipconfig</code> pour noter l'adresse IPv4 Wi-Fi (ex: 192.168.1.50).</li>
                  <li>Connectez vos téléphones Android sur le même Wi-Fi et indiquez cette adresse IP ci-dessus.</li>
                </ol>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: SAUVEGARDE & SÉCURITÉ */}
          {/* ============================================================== */}
          {activeTab === 'backup' && (
            <div className="space-y-6">

              {restoreFeedback && (
                <div className={`p-4 rounded-2xl text-xs flex items-start gap-3 border ${
                  restoreFeedback.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {restoreFeedback.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="font-semibold">{restoreFeedback.message}</div>
                </div>
              )}

              {/* Moteur de Stockage Actif */}
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    Moteur de Persistance Locale
                  </h3>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    storageManager.isElectronEnvironment()
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-800'
                  }`}>
                    {storageManager.isElectronEnvironment() ? 'SQLite Natif (Windows App)' : 'IndexedDB (Navigateur / Web)'}
                  </span>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  {storageManager.isElectronEnvironment() ? (
                    <>
                      L'application Windows exécute une base de données <strong>SQLite persistante avec journalisation WAL</strong> (Write-Ahead Logging). Vos modifications, transactions et la file de synchronisation (Outbox) restent garanties sur disque après fermeture et redémarrage de l'ordinateur.
                    </>
                  ) : (
                    <>
                      L'application s'exécute dans un navigateur standard et utilise la base de données transactionnelle <strong>IndexedDB</strong> locale pour stocker vos données et préparer la synchronisation.
                    </>
                  )}
                </p>
              </div>

              {/* Export Sauvegarde */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-600" />
                  Sauvegarde Complète de la Base Locale
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Générez un fichier JSON autonome contenant toutes vos données locales (membres, enquêtes, écritures comptables, événements). Le fichier intègre une somme de contrôle SHA-256 pour garantir son intégrité physique contre toute altération.
                </p>
                <div>
                  <button
                    onClick={handleDownloadBackup}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Télécharger la Sauvegarde Locale (.json)</span>
                  </button>
                </div>
              </div>

              {/* Import / Restauration */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  Restauration d'une Sauvegarde
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sélectionnez un fichier de sauvegarde AMM (.json). L'intégrité des tables et le format des collections seront vérifiés avant application.
                </p>
                <div>
                  <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer">
                    <Database className="w-4 h-4" />
                    <span>Sélectionner le fichier de sauvegarde</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Politique de Sécurité Hors Ligne */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Politique de Sécurité et d'Accès Hors Ligne
                </h3>
                <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                  <li>
                    <strong>Durée d'accès hors ligne :</strong> 30 jours maximum à compter de la dernière authentification vérifiée en ligne.
                  </li>
                  <li>
                    <strong>Protection des identifiants :</strong> Les mots de passe ne sont jamais conservés en clair sur l'appareil. Seul un sel cryptographique aléatoire associé à une empreinte SHA-256 est utilisé pour la validation hors ligne.
                  </li>
                  <li>
                    <strong>Révocation distante :</strong> Dès la reconnexion à Internet ou au serveur LAN, le statut de votre compte est automatiquement revalidé.
                  </li>
                </ul>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Version 2.0.0 • Architecture Offline-First Réseau Local AMM
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
