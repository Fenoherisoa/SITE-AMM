import React, { useState } from 'react';
import {
  Building,
  Plus,
  Calculator,
  Download,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { FixedAsset, JournalEntry, CompanyConfig } from '../types/accounting';
import { formatCurrency } from '../services/pdfGenerator';

interface AssetsViewProps {
  assets: FixedAsset[];
  companyConfig: CompanyConfig;
  onAddAsset: (asset: FixedAsset) => void;
  onPostDepreciationEntry: (entry: JournalEntry) => void;
}

export const AssetsView: React.FC<AssetsViewProps> = ({
  assets,
  companyConfig,
  onAddAsset,
  onPostDepreciationEntry,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(
    assets[0]?.id || null
  );

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);

  // Generate depreciation schedule for selected asset
  const calculateSchedule = (asset: FixedAsset) => {
    const schedule: {
      year: number;
      baseAmount: number;
      annuity: number;
      accumulated: number;
      netBookValue: number;
    }[] = [];

    const acqYear = new Date(asset.acquisitionDate).getFullYear();
    const depreciableBase = asset.acquisitionCost - asset.salvageValue;
    const yearlyAnnuity = Math.round(depreciableBase / asset.lifespanYears);

    let accum = 0;
    for (let i = 0; i < asset.lifespanYears; i++) {
      const year = acqYear + i;
      const annuity = i === asset.lifespanYears - 1 ? depreciableBase - accum : yearlyAnnuity;
      accum += annuity;
      const nbv = asset.acquisitionCost - accum;

      schedule.push({
        year,
        baseAmount: depreciableBase,
        annuity,
        accumulated: accum,
        netBookValue: Math.max(0, nbv),
      });
    }

    return schedule;
  };

  const currentSchedule = selectedAsset ? calculateSchedule(selectedAsset) : [];

  const handlePostDotation = (asset: FixedAsset, yearItem: any) => {
    const entry: JournalEntry = {
      id: `entry-dotation-${asset.id}-${yearItem.year}`,
      pieceNumber: `DOT-${yearItem.year}-${asset.code}`,
      date: `${yearItem.year}-12-31`,
      journalCode: 'OD',
      label: `Dotation aux amortissements ${yearItem.year} - ${asset.name}`,
      reference: `Tableau Amortissement ${asset.code}`,
      isPosted: true,
      createdAt: new Date().toISOString(),
      lines: [
        {
          id: 'l1',
          accountCode: asset.accountExpenseCode || '6813',
          accountLabel: 'Dotations aux amortissements des immobilisations',
          debit: yearItem.annuity,
          credit: 0,
          memo: `Dotation Annuelle ${yearItem.year}`,
        },
        {
          id: 'l2',
          accountCode: asset.accountDepreciationCode || '2844',
          accountLabel: 'Amortissement cumulé immobilisation',
          debit: 0,
          credit: yearItem.annuity,
          memo: `Amortissement ${asset.name}`,
        },
      ],
    };

    onPostDepreciationEntry(entry);
    alert(`Écriture de dotation (${formatCurrency(yearItem.annuity, companyConfig.currencySymbol)}) comptabilisée avec succès dans le Journal OD !`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Building className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Gestion des Immobilisations & Amortissements
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Suivi du parc d'actifs, calcul automatique des annuités et comptabilisation des dotations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Assets List */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            Registre des Immobilisations ({assets.length})
          </h3>

          <div className="space-y-2">
            {assets.map((asset) => {
              const isSelected = asset.id === selectedAssetId;
              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs ${
                    isSelected
                      ? 'bg-blue-950/60 border-blue-600 text-white shadow-md'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold text-blue-400 mb-1">
                    <span>{asset.code}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-sans">
                      {asset.category}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-100">{asset.name}</p>
                  <div className="flex justify-between items-center mt-2 text-[11px] text-slate-400 font-mono">
                    <span>Acquis le: {new Date(asset.acquisitionDate).toLocaleDateString('fr-FR')}</span>
                    <span className="font-bold text-white">
                      {formatCurrency(asset.acquisitionCost, companyConfig.currencySymbol)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule Detail */}
        <div className="lg:col-span-2 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-5">
          {selectedAsset ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {selectedAsset.code} — {selectedAsset.category}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {selectedAsset.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Valeur d'Acquisition</span>
                  <span className="text-lg font-mono font-bold text-emerald-400">
                    {formatCurrency(selectedAsset.acquisitionCost, companyConfig.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                  <Calculator className="w-4 h-4 text-blue-400" />
                  <span>Tableau d'Amortissement Linéaire ({selectedAsset.lifespanYears} Ans)</span>
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-semibold">
                      <tr>
                        <th className="p-3">Année</th>
                        <th className="p-3">Base Amortissable</th>
                        <th className="p-3 text-right">Annuité ({companyConfig.currencySymbol})</th>
                        <th className="p-3 text-right">Cumul Amort.</th>
                        <th className="p-3 text-right">VNC (Valeur Nette)</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {currentSchedule.map((item) => (
                        <tr key={item.year} className="hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-blue-400">{item.year}</td>
                          <td className="p-3 text-slate-300">
                            {formatCurrency(item.baseAmount, '')}
                          </td>
                          <td className="p-3 text-right text-emerald-400 font-bold">
                            {formatCurrency(item.annuity, '')}
                          </td>
                          <td className="p-3 text-right text-amber-400">
                            {formatCurrency(item.accumulated, '')}
                          </td>
                          <td className="p-3 text-right text-white font-bold">
                            {formatCurrency(item.netBookValue, '')}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handlePostDotation(selectedAsset, item)}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-sans text-[10px] font-semibold px-2.5 py-1 rounded transition-colors"
                            >
                              Comptabiliser
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500">
              Sélectionnez une immobilisation pour afficher son tableau d'amortissement.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
