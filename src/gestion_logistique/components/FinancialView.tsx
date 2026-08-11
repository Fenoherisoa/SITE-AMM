import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  CreditCard, 
  Building, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  PieChart, 
  FileText,
  DollarSign
} from 'lucide-react';
import { FinancialTransaction, TransactionType, CurrencyCode, FinancialCategory, AccountName } from '../types';
import { FORMAT_CURRENCY, FORMAT_DATE } from '../utils/formatters';
import { INITIAL_BUDGETS } from '../data/initialData';

interface FinancialViewProps {
  transactions: FinancialTransaction[];
  currency: CurrencyCode;
  onOpenAddTransaction: (type?: TransactionType) => void;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  transactions,
  currency,
  onOpenAddTransaction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');

  // Summary Metrics
  const totalIncome = transactions
    .filter(t => t.type === 'INCOME' && t.status === 'PAYE')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE' && t.status === 'PAYE')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Account Balances
  const accountsList: AccountName[] = [
    'Compte Bancaire AMM',
    'Caisse Principale Siège',
    'Mobile Money AMM'
  ];

  const accountBalances = accountsList.map(acc => {
    const accTx = transactions.filter(t => t.account === acc && t.status === 'PAYE');
    const income = accTx.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const expense = accTx.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    return {
      account: acc,
      balance: income - expense
    };
  });

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.receiptRef && t.receiptRef.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = selectedType === 'ALL' || t.type === selectedType;
      const matchesAcc = selectedAccount === 'ALL' || t.account === selectedAccount;

      return matchesSearch && matchesType && matchesAcc;
    });
  }, [transactions, searchTerm, selectedType, selectedAccount]);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Gestion Financière & Bilan Comptable SITE-AMM</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Journal des encaissements (recettes), décaissements (dépenses) et suivi budgétaire
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenAddTransaction('INCOME')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <TrendingUp className="h-4 w-4" />
            <span>+ Saisir Recette</span>
          </button>
          <button
            onClick={() => onOpenAddTransaction('EXPENSE')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <TrendingDown className="h-4 w-4" />
            <span>+ Saisir Dépense</span>
          </button>
        </div>
      </div>

      {/* Top Financial KPI Cards & Account Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Recettes</span>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {FORMAT_CURRENCY(totalIncome, currency)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Subventions, dons & cotisations</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Dépenses</span>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {FORMAT_CURRENCY(totalExpense, currency)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Matériel, logistique & maintenance</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase">Solde Net Bilan</span>
          <div className={`text-xl font-black mt-1 ${netBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
            {FORMAT_CURRENCY(netBalance, currency)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Capacité d'autofinancement</span>
        </div>

      </div>

      {/* Account Balance Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-slate-100 shadow-md">
        <h2 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Building className="h-4 w-4 text-indigo-400" />
          <span>Comptes de Trésorerie & Caisses</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {accountBalances.map(acc => (
            <div key={acc.account} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
              <span className="text-xs text-slate-400 block font-medium">{acc.account}</span>
              <span className="text-lg font-mono font-bold text-white mt-1 block">
                {FORMAT_CURRENCY(acc.balance, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Progress Bars */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <PieChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <span>Suivi des Enveloppes Budgétaires Par Poste</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INITIAL_BUDGETS.map((b) => {
            const spent = transactions
              .filter(t => t.category === b.category && t.type === 'EXPENSE' && t.status === 'PAYE')
              .reduce((sum, t) => sum + t.amount, 0);

            const pct = Math.min(100, (spent / b.allocatedAmount) * 100);

            return (
              <div key={b.category} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{b.category}</span>
                  <span className="text-slate-500 font-mono">
                    {FORMAT_CURRENCY(spent, currency)} / {FORMAT_CURRENCY(b.allocatedAmount, currency)}
                  </span>
                </div>
                
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${pct > 85 ? 'bg-rose-500' : pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par libellé, catégorie, N° quittance/pièce..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
        >
          <option value="ALL">Tous les flux financiers</option>
          <option value="INCOME">Recettes Uniquement (+)</option>
          <option value="EXPENSE">Dépenses Uniquement (-)</option>
        </select>

        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
        >
          <option value="ALL">Tous les comptes</option>
          {accountsList.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Libellé & Catégorie</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3">Mode & Compte</th>
                <th className="px-4 py-3">N° Pièce / Recu</th>
                <th className="px-4 py-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Aucune transaction financière trouvée.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all">
                    <td className="px-4 py-3.5 font-mono text-slate-500">
                      {FORMAT_DATE(tx.date)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        tx.type === 'INCOME'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {tx.type === 'INCOME' ? 'RECETTE (+)' : 'DÉPENSE (-)'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {tx.title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {tx.category}
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 text-right font-mono font-bold text-sm ${
                      tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : '-'}{FORMAT_CURRENCY(tx.amount, currency)}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <div><b>{tx.paymentMethod}</b></div>
                      <div className="text-[10px] text-slate-400">{tx.account}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">
                      {tx.receiptRef || '-'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        PAYÉ
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
