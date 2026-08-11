import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  FileText,
  PlusCircle,
  Scale,
} from 'lucide-react';
import { Account, JournalEntry, CompanyConfig } from '../types/accounting';
import { formatCurrency } from '../services/pdfGenerator';

interface DashboardViewProps {
  entries: JournalEntry[];
  accounts: Account[];
  companyConfig: CompanyConfig;
  onOpenNewEntry: () => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  entries,
  accounts,
  companyConfig,
  onOpenNewEntry,
  onNavigateTab,
}) => {
  // Compute Key Financial Metrics from entries
  let totalRevenues = 0; // Class 7
  let totalExpenses = 0; // Class 6
  let bankBalance = 0; // 5211
  let cashBalance = 0; // 5711
  let clientReceivables = 0; // 4111 (Debit - Credit)
  let supplierPayables = 0; // 4011 (Credit - Debit)

  // Sum from entries
  entries.forEach((entry) => {
    entry.lines.forEach((line) => {
      const code = line.accountCode;
      
      // Class 7 Revenue
      if (code.startsWith('7')) {
        totalRevenues += line.credit - line.debit;
      }
      // Class 6 Expense
      if (code.startsWith('6')) {
        totalExpenses += line.debit - line.credit;
      }
      // Bank 5211 / 5212
      if (code.startsWith('52')) {
        bankBalance += line.debit - line.credit;
      }
      // Cash 5711
      if (code.startsWith('57')) {
        cashBalance += line.debit - line.credit;
      }
      // Clients 411
      if (code.startsWith('411')) {
        clientReceivables += line.debit - line.credit;
      }
      // Fournisseurs 401
      if (code.startsWith('401')) {
        supplierPayables += line.credit - line.debit;
      }
    });
  });

  const netResult = totalRevenues - totalExpenses;
  const netCash = bankBalance + cashBalance;

  const kpiCards = [
    {
      title: 'Chiffre d\'Affaires (Produits 7)',
      amount: totalRevenues,
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60',
      badge: 'Ventes & Prestations',
      badgeColor: 'bg-emerald-900/60 text-emerald-300',
    },
    {
      title: 'Charges d\'Exploitation (Charges 6)',
      amount: totalExpenses,
      icon: TrendingDown,
      color: 'text-amber-400 bg-amber-950/50 border-amber-800/60',
      badge: 'Achats, Salaires & Loyers',
      badgeColor: 'bg-amber-900/60 text-amber-300',
    },
    {
      title: 'Résultat Net de l\'Exercice',
      amount: netResult,
      icon: DollarSign,
      color: netResult >= 0 ? 'text-blue-400 bg-blue-950/50 border-blue-800/60' : 'text-red-400 bg-red-950/50 border-red-800/60',
      badge: netResult >= 0 ? 'Bénéfice Comptable' : 'Déficit Comptable',
      badgeColor: netResult >= 0 ? 'bg-blue-900/60 text-blue-300' : 'bg-red-900/60 text-red-300',
    },
    {
      title: 'Trésorerie Globale (Banque + Caisse)',
      amount: netCash,
      icon: Wallet,
      color: 'text-purple-400 bg-purple-950/50 border-purple-800/60',
      badge: 'Disponible Immédiat',
      badgeColor: 'bg-purple-900/60 text-purple-300',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-600/30 text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30">
              Exercice Comptable {companyConfig.fiscalYear}
            </span>
            <span className="text-slate-400 text-xs">• SYSCOHADA / PCG</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Tableau de Bord Financier — {companyConfig.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Aperçu analytique en temps réel des flux de trésorerie, du compte de résultat, et des créances & dettes en cours.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenNewEntry}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-blue-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouvelle Écriture</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl border shadow-md flex flex-col justify-between ${kpi.color}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${kpi.badgeColor}`}>
                  {kpi.badge}
                </span>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4">
                <span className="text-xs text-slate-400 block font-medium">
                  {kpi.title}
                </span>
                <span className="text-xl font-black font-mono tracking-tight text-white mt-1 block">
                  {formatCurrency(kpi.amount, companyConfig.currencySymbol)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Receivables & Payables Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clients Receivables */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-800/50">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                Créances Clients (Compte 411)
              </span>
              <span className="text-lg font-bold font-mono text-white">
                {formatCurrency(clientReceivables, companyConfig.currencySymbol)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Règlements attendus des ventes à crédit
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('ledger')}
            className="text-xs text-blue-400 hover:underline font-semibold flex items-center space-x-1"
          >
            <span>Grand Livre</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Suppliers Payables */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-800/50">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                Dettes Fournisseurs (Compte 401)
              </span>
              <span className="text-lg font-bold font-mono text-white">
                {formatCurrency(supplierPayables, companyConfig.currencySymbol)}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Factures fournisseurs à régler
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('ledger')}
            className="text-xs text-blue-400 hover:underline font-semibold flex items-center space-x-1"
          >
            <span>Grand Livre</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Activity & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Entries */}
        <div className="lg:col-span-2 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">
                Dernières Écritures Comptables
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('journal')}
              className="text-xs text-blue-400 hover:underline font-medium"
            >
              Voir Tout le Journal ({entries.length})
            </button>
          </div>

          <div className="space-y-2">
            {entries.slice(0, 5).map((entry) => {
              const totalAmount = entry.lines.reduce((s, l) => s + l.debit, 0);
              return (
                <div
                  key={entry.id}
                  className="bg-slate-800/40 hover:bg-slate-800/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between transition-colors text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono bg-blue-950 text-blue-300 px-2 py-1 rounded font-bold border border-blue-800/40">
                      {entry.journalCode}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-200">
                        {entry.label}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {entry.pieceNumber} • {new Date(entry.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-white block">
                      {formatCurrency(totalAmount, companyConfig.currencySymbol)}
                    </span>
                    <span className="inline-flex items-center text-[10px] text-emerald-400 font-medium">
                      <CheckCircle className="w-3 h-3 mr-1" /> Validée
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Shortcuts */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">
            Accès Rapide & Rapports
          </h3>
          <div className="space-y-2.5">
            <button
              onClick={() => onNavigateTab('trialBalance')}
              className="w-full bg-slate-800/70 hover:bg-slate-800 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Balance Générale à 6 Colonnes</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => onNavigateTab('financialStatements')}
              className="w-full bg-slate-800/70 hover:bg-slate-800 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Bilan & Compte de Résultat</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </button>

            <button
              onClick={() => onNavigateTab('vat')}
              className="w-full bg-slate-800/70 hover:bg-slate-800 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span>Déclaration TVA (Collectée / Déductible)</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
