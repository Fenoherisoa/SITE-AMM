import React, { useState } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
} from 'lucide-react';
import {
  Account,
  JournalEntry,
  CompanyConfig,
  TrialBalanceRow,
} from '../types/accounting';
import { formatCurrency, exportTrialBalancePDF } from '../services/pdfGenerator';

interface TrialBalanceViewProps {
  accounts: Account[];
  entries: JournalEntry[];
  companyConfig: CompanyConfig;
}

export const TrialBalanceView: React.FC<TrialBalanceViewProps> = ({
  accounts,
  entries,
  companyConfig,
}) => {
  const [selectedClass, setSelectedClass] = useState<number>(0);

  // Compute 6-column trial balance
  const balanceRows: TrialBalanceRow[] = accounts.map((acc) => {
    let pDebit = 0;
    let pCredit = 0;

    entries.forEach((e) => {
      e.lines.forEach((l) => {
        if (l.accountCode === acc.code) {
          pDebit += l.debit;
          pCredit += l.credit;
        }
      });
    });

    const totalDebit = pDebit;
    const totalCredit = pCredit;
    const net = totalDebit - totalCredit;

    const endingDebit = net > 0 ? net : 0;
    const endingCredit = net < 0 ? Math.abs(net) : 0;

    return {
      accountCode: acc.code,
      accountLabel: acc.label,
      accountClass: acc.classCode,
      initialDebit: 0,
      initialCredit: 0,
      periodDebit: pDebit,
      periodCredit: pCredit,
      totalDebit,
      totalCredit,
      endingDebit,
      endingCredit,
    };
  });

  // Filter rows with activity or non-zero balances, and class filter
  const activeRows = balanceRows.filter((r) => {
    if (selectedClass !== 0 && r.accountClass !== selectedClass) return false;
    return r.periodDebit > 0 || r.periodCredit > 0 || r.endingDebit > 0 || r.endingCredit > 0;
  });

  // Sort by Account Code
  activeRows.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

  // Compute Grand Totals
  const totalPeriodDebit = activeRows.reduce((s, r) => s + r.periodDebit, 0);
  const totalPeriodCredit = activeRows.reduce((s, r) => s + r.periodCredit, 0);
  const totalEndingDebit = activeRows.reduce((s, r) => s + r.endingDebit, 0);
  const totalEndingCredit = activeRows.reduce((s, r) => s + r.endingCredit, 0);

  const isPeriodBalanced = Math.abs(totalPeriodDebit - totalPeriodCredit) < 0.01;
  const isEndingBalanced = Math.abs(totalEndingDebit - totalEndingCredit) < 0.01;
  const isFullyBalanced = isPeriodBalanced && isEndingBalanced;

  const handleExportPDF = () => {
    exportTrialBalancePDF(activeRows, companyConfig);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-600/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Balance Générale des Comptes (6 Colonnes SYSCOHADA)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Contrôle d'équilibrage global des mouvements comptables et des soldes de clôture.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>Exporter Balance PDF</span>
        </button>
      </div>

      {/* Audit Banner & Class Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Status */}
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 md:col-span-2 ${
            isFullyBalanced
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
              : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
          }`}
        >
          {isFullyBalanced ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
          )}
          <div>
            <p className="font-bold text-xs sm:text-sm">
              {isFullyBalanced
                ? 'Balance Rigoureusement Équilibrée (Conforme SYSCOHADA)'
                : 'Attention : Écart Décelé sur les Soldes ou Mouvements !'}
            </p>
            <p className="text-[11px] opacity-80 mt-0.5">
              Cumul Mouvements Débit = Cumul Mouvements Crédit | Total Soldes Débiteurs = Total Soldes Créditeurs
            </p>
          </div>
        </div>

        {/* Class Filter */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(parseInt(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={0}>Toutes les Classes (1 à 7)</option>
            <option value={1}>Classe 1 - Ressources Durables</option>
            <option value={2}>Classe 2 - Actif Immobilisé</option>
            <option value={3}>Classe 3 - Stocks & En-cours</option>
            <option value={4}>Classe 4 - Comptes de Tiers</option>
            <option value={5}>Classe 5 - Trésorerie</option>
            <option value={6}>Classe 6 - Charges</option>
            <option value={7}>Classe 7 - Produits</option>
          </select>
        </div>

      </div>

      {/* Trial Balance Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/90 text-slate-300 text-[10px] uppercase font-bold border-b border-slate-700/60">
              <tr>
                <th className="p-3 w-24">Compte</th>
                <th className="p-3">Intitulé du Compte</th>
                <th className="p-3 w-32 text-right text-emerald-400">Mvt Débit</th>
                <th className="p-3 w-32 text-right text-blue-400">Mvt Crédit</th>
                <th className="p-3 w-36 text-right text-emerald-300">Solde Fin Débit</th>
                <th className="p-3 w-36 text-right text-blue-300">Solde Fin Crédit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {activeRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                    Aucun mouvement sur cette classe de comptes.
                  </td>
                </tr>
              ) : (
                activeRows.map((row) => (
                  <tr key={row.accountCode} className="hover:bg-slate-800/30">
                    <td className="p-3 font-bold text-blue-400">
                      {row.accountCode}
                    </td>
                    <td className="p-3 font-sans font-medium text-slate-200">
                      {row.accountLabel}
                    </td>
                    <td className="p-3 text-right text-slate-300">
                      {row.periodDebit > 0 ? formatCurrency(row.periodDebit, '') : '-'}
                    </td>
                    <td className="p-3 text-right text-slate-300">
                      {row.periodCredit > 0 ? formatCurrency(row.periodCredit, '') : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      {row.endingDebit > 0 ? formatCurrency(row.endingDebit, '') : '-'}
                    </td>
                    <td className="p-3 text-right font-bold text-blue-400">
                      {row.endingCredit > 0 ? formatCurrency(row.endingCredit, '') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Footer */}
            <tfoot className="bg-slate-950 font-mono text-xs font-bold border-t-2 border-slate-700">
              <tr>
                <td colSpan={2} className="p-4 text-slate-300 font-sans uppercase">
                  TOTAUX GÉNÉRAUX DE LA BALANCE :
                </td>
                <td className="p-4 text-right text-emerald-400">
                  {formatCurrency(totalPeriodDebit, companyConfig.currencySymbol)}
                </td>
                <td className="p-4 text-right text-blue-400">
                  {formatCurrency(totalPeriodCredit, companyConfig.currencySymbol)}
                </td>
                <td className="p-4 text-right text-emerald-300 text-sm">
                  {formatCurrency(totalEndingDebit, companyConfig.currencySymbol)}
                </td>
                <td className="p-4 text-right text-blue-300 text-sm">
                  {formatCurrency(totalEndingCredit, companyConfig.currencySymbol)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
