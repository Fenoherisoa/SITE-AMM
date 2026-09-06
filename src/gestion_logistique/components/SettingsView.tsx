import React, { useState } from 'react';
import { Settings, Database, RefreshCw, ShieldCheck, Save, Download, Upload, CheckCircle2, AlertTriangle, Building2, HardDrive } from 'lucide-react';
import { AssociationProfile, CurrencyCode } from '../types';

interface SettingsViewProps {
  profile: AssociationProfile;
  onUpdateProfile: (profile: AssociationProfile) => void;
  isFirebaseConnected: boolean;
  onSeedDemoData: () => Promise<boolean>;
  onForceSync: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  isFirebaseConnected,
  onSeedDemoData,
  onForceSync
}) => {
  const [formData, setFormData] = useState<AssociationProfile>(profile);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<boolean | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSeedClick = async () => {
    if (!window.confirm("Voulez-vous réinitialiser et réensemencer les données de démonstration dans Firebase Realtime DB ?")) {
      return;
    }
    setIsSeeding(true);
    const success = await onSeedDemoData();
    setIsSeeding(false);
    setSeedSuccess(success);
    setTimeout(() => setSeedSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Paramètres de l'Organisation & Base de Données</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configuration du profil SITE-AMM, devises de valorisation et synchronisation Firebase Realtime Database
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Settings (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Profil Institutionnel & Entête de Document (SITE-AMM)</span>
          </h2>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Modifications du profil enregistrées avec succès !</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Nom de l'Organisation *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Sigle / Acronyme *</label>
                <input
                  type="text"
                  required
                  value={formData.acronym}
                  onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Sous-titre / Direction</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">N° Immatriculation / NINEA</label>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Devise de Valorisation Par Défaut</label>
                <select
                  value={formData.defaultCurrency}
                  onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value as CurrencyCode })}
                  className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                >
                  <option value="MGA">Ariary (MGA / Ar)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">Dollar ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Téléphone de Contact</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Email Logistique</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Adresse Géographique du Siège</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer les Paramètres</span>
            </button>
          </form>
        </div>

        {/* Firebase Realtime DB Control Panel (1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Statut Firebase Realtime DB</span>
          </h2>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                État de Connexion
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isFirebaseConnected 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {isFirebaseConnected ? 'Actif & Synchronisé' : 'Mode Hors-Ligne'}
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div>Project ID: <b>baseamm-9c2c7</b></div>
              <div>Database URL: <b className="text-[10px] break-all">baseamm-9c2c7-default-rtdb.europe-west1...</b></div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={onForceSync}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Rafraîchir la Synchro Firebase</span>
            </button>

            <button
              onClick={handleSeedClick}
              disabled={isSeeding}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <Database className={`h-4 w-4 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Réinitialisation...' : 'Réensemencer les Données de Démo'}</span>
            </button>

            {seedSuccess === true && (
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs text-center font-bold">
                Données de démonstration réinitialisées avec succès !
              </div>
            )}
            {seedSuccess === false && (
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-800 text-xs text-center font-bold">
                Mise à jour en local terminée (Firebase en attente).
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
