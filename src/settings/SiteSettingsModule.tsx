import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  ArrowLeft, 
  Building, 
  ShieldCheck, 
  Database, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { FirebaseService, requestRtdb } from '../gestion_membre/services/firebaseService';
import ParametresTab from '../gestion_membre/components/ParametresTab';

interface Props {
  onBackToDashboard: () => void;
}

export default function SiteSettingsModule({ onBackToDashboard }: Props) {
  const centralSession = (() => {
    try {
      const raw = localStorage.getItem('amm_authenticated_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const currentUserRole = centralSession?.role || 'NATIONAL_PRESIDENT';
  const loginUser = centralSession?.displayName || centralSession?.username || centralSession?.email || 'Admin';

  const [sysParams, setSysParams] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadParams = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = await FirebaseService.getParametres();
      if (params) {
        setSysParams(params);
      }
    } catch (e) {
      console.warn('Erreur chargement paramètres:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadParams();
  }, [loadParams]);

  const handleSaveParameters = async (newParams: any) => {
    try {
      await FirebaseService.saveParametres(newParams);
      setSysParams(newParams);
      alert('✅ Paramètres généraux du site enregistrés avec succès !');
    } catch (e) {
      console.error(e);
      alert('❌ Erreur lors de l’enregistrement des paramètres.');
    }
  };

  const handleResetEntireDatabase = async () => {
    const confirmation = window.prompt("⚠️ ATTENTION : Tapez 'REINITIALISER' pour confirmer l'effacement complet :");
    if (confirmation !== 'REINITIALISER') {
      alert('Opération annulée.');
      return;
    }

    try {
      await requestRtdb('/olona.json', { method: 'DELETE' });
      await requestRtdb('/enquetes.json', { method: 'DELETE' });
      await requestRtdb('/comptabilite.json', { method: 'DELETE' });
      await requestRtdb('/operationRequest.json', { method: 'DELETE' });
      alert('🧹 Base de données réinitialisée.');
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('❌ Erreur de réinitialisation.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-900 flex flex-col">
      {/* Module Header Bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Menu Principal</span>
            </button>
            <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">Portail AMM • Configuration Système</p>
              <h1 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                Paramètres Généraux du Site
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Administrateur Système ({loginUser})
            </span>
            <button
              onClick={loadParams}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
              title="Recharger les paramètres"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <ParametresTab
            currentParams={sysParams}
            currentUserRole={currentUserRole}
            onSaveParams={handleSaveParameters}
            onResetDatabase={handleResetEntireDatabase}
          />
        </div>
      </main>
    </div>
  );
}
