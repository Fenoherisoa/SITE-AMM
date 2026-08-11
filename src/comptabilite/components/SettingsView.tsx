import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Download,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { CompanyConfig } from '../types/accounting';

interface SettingsViewProps {
  companyConfig: CompanyConfig;
  onSaveConfig: (config: CompanyConfig) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  companyConfig,
  onSaveConfig,
  onResetData,
}) => {
  const [formData, setFormData] = useState<CompanyConfig>({ ...companyConfig });

  const handleChange = (field: keyof CompanyConfig, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    alert('Configuration de l\'entreprise mise à jour et enregistrée sur Firebase !');
  };

  const handleReset = () => {
    if (
      window.confirm(
        'ATTENTION : Êtes-vous sûr de vouloir réinitialiser la base de données comptable au jeu de données exemple initial (SYSCOHADA) ?'
      )
    ) {
      onResetData();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Configuration du Système & Paramètres Entité
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Informations légales de l'entreprise, devise de tenue de compte, et gestion de la base de données.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Form */}
        <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-5">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center space-x-2">
            <Building className="w-4 h-4 text-blue-400" />
            <span>Fiche Signalétique de l'Entreprise</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Raison Sociale / Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Forme Juridique</label>
                <input
                  type="text"
                  value={formData.legalForm}
                  onChange={(e) => handleChange('legalForm', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Numéro d'Identification Fiscale (NIF)</label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Registre de Commerce (RCCM)</label>
                <input
                  type="text"
                  value={formData.rccm}
                  onChange={(e) => handleChange('rccm', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Devise Comptable</label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={(e) => handleChange('currencySymbol', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Exercice Comptable</label>
                <input
                  type="text"
                  value={formData.fiscalYear}
                  onChange={(e) => handleChange('fiscalYear', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 mb-1 font-semibold">Adresse Siège Social</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer la Configuration</span>
              </button>
            </div>
          </form>
        </div>

        {/* Database & System Maintenance */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-5">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Maintenance & Données</span>
          </h3>

          <div className="space-y-3 text-xs">
            <p className="text-slate-400">
              Restaurez les données comptables d'exemple conformes au SYSCOHADA ou réinitialisez le système.
            </p>

            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center space-x-2 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/80 font-semibold p-3 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Réinitialiser la Base au Seed SYSCOHADA</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
