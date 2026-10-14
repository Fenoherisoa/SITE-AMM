import React, { useState, useEffect } from 'react';
import { networkManager } from '../network/networkManager';
import { syncEngine } from '../sync/syncEngine';
import { NetworkState, SyncState } from '../types';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Server, 
  Radio
} from 'lucide-react';

interface NetworkStatusBarProps {
  onOpenSyncCenter: () => void;
}

export const NetworkStatusBar: React.FC<NetworkStatusBarProps> = ({ onOpenSyncCenter }) => {
  const [networkState, setNetworkState] = useState<NetworkState>(networkManager.getState());
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    networkState: 'ONLINE',
    pendingCount: 0,
    syncedLanCount: 0,
    syncedCloudCount: 0,
    errorCount: 0,
    lastSyncTime: null,
    nextSyncTime: null,
    lastError: null
  });

  useEffect(() => {
    const unsubNet = networkManager.subscribe((state) => setNetworkState(state));
    const unsubSync = syncEngine.subscribe((state) => setSyncState(state));
    return () => {
      unsubNet();
      unsubSync();
    };
  }, []);

  // Détermination du badge réseau
  const getNetworkBadge = () => {
    switch (networkState) {
      case 'ONLINE':
        return (
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">En Ligne</span>
          </span>
        );
      case 'LAN_CONNECTED':
        return (
          <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <Server className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">Réseau Wi-Fi Local</span>
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="flex items-center gap-1.5 text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <WifiOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">Hors Ligne</span>
          </span>
        );
    }
  };

  // Détermination du badge synchronisation
  const getSyncBadge = () => {
    if (syncState.isSyncing) {
      return (
        <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-semibold animate-pulse">
          <RefreshCw className="w-3 h-3 text-blue-600 animate-spin shrink-0" />
          <span className="hidden md:inline">Synchronisation...</span>
        </span>
      );
    }

    if (syncState.errorCount > 0) {
      return (
        <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full text-[11px] font-semibold">
          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
          <span>{syncState.errorCount} erreur(s)</span>
        </span>
      );
    }

    if (syncState.pendingCount > 0) {
      return (
        <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-semibold">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span>{syncState.pendingCount} en attente</span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50/80 border border-emerald-200/60 px-2.5 py-1 rounded-full text-[11px] font-medium hidden lg:flex">
        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>À jour</span>
      </span>
    );
  };

  return (
    <button
      onClick={onOpenSyncCenter}
      title="Ouvrir le Centre de Synchronisation & Réseau Local"
      className="inline-flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer group"
    >
      {getNetworkBadge()}
      {getSyncBadge()}
    </button>
  );
};
