import React from 'react';
import { 
  Boxes, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PlusCircle, 
  FileCheck, 
  Layers, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { InventoryItem, StockMovement, FinancialTransaction, CurrencyCode, CategoryName } from '../types';
import { FORMAT_CURRENCY, FORMAT_DATE, GET_STOCK_STATUS } from '../utils/formatters';

interface DashboardViewProps {
  items: InventoryItem[];
  movements: StockMovement[];
  transactions: FinancialTransaction[];
  currency: CurrencyCode;
  onNavigateTab: (tab: string) => void;
  onOpenAddItem: () => void;
  onOpenAddMovement: (type?: 'IN' | 'OUT') => void;
  onOpenAddTransaction: () => void;
  onGenerateReport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  items,
  movements,
  transactions,
  currency,
  onNavigateTab,
  onOpenAddItem,
  onOpenAddMovement,
  onOpenAddTransaction,
  onGenerateReport
}) => {
  // Calculations
  const totalValuation = items.reduce((acc, item) => acc + item.totalValue, 0);
  const totalItemTypes = items.length;
  const totalPhysicalUnits = items.reduce((acc, item) => acc + item.quantity, 0);

  const lowStockItems = items.filter(i => i.quantity <= i.minThreshold);
  const outOfStockCount = items.filter(i => i.quantity === 0).length;

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME' && t.status === 'PAYE')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE' && t.status === 'PAYE')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Asset Value Distribution per Category
  const categoriesList: CategoryName[] = [
    'Équipement Informatique',
    'Matériel Roulant & Transport',
    'Mobilier de Bureau',
    'Matériel Événementiel & Audiovisuel',
    'Consommables & Fournitures',
    'Secours & Kit Médical',
    'Outillage & Maintenance',
    'Autres Équipements'
  ];

  const categoryValueMap = categoriesList.map(cat => {
    const catItems = items.filter(i => i.category === cat);
    const catValue = catItems.reduce((acc, i) => acc + i.totalValue, 0);
    const catPercentage = totalValuation > 0 ? (catValue / totalValuation) * 100 : 0;
    return {
      category: cat,
      count: catItems.length,
      value: catValue,
      percentage: catPercentage
    };
  }).filter(c => c.count > 0).sort((a, b) => b.value - a.value);

  // Recent 6 Activity items (movements & transactions)
  const recentMovements = movements.slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SITE-AMM LOGISTIQUE & FINANCE
              </span>
              <span className="text-xs text-slate-400">
                • Mis à jour en temps réel
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Aperçu Général des Actifs & Trésorerie
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Suivi consolidé de l'inventaire matériel, des mouvements de stock inter-dépôts et du grand livre financier de l'Association SITE-AMM.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenAddMovement('IN')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
            >
              <ArrowDownLeft className="h-4 w-4" />
              <span>+ Entrée Stock</span>
            </button>
            <button
              onClick={() => onOpenAddMovement('OUT')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>+ Sortie Stock</span>
            </button>
            <button
              onClick={onGenerateReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold shadow-md transition-all"
            >
              <FileCheck className="h-4 w-4 text-indigo-400" />
              <span>Rapport PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Valuation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Valeur du Stock Actif
            </span>
            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {FORMAT_CURRENCY(totalValuation, currency)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>{totalItemTypes} références</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{totalPhysicalUnits} unités</span>
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Recettes Encaissées
            </span>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {FORMAT_CURRENCY(totalIncome, currency)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Subventions, Dons & Cotisations</span>
            <button 
              onClick={() => onNavigateTab('financial')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Voir Bilan
            </button>
          </div>
        </div>

        {/* Card 3: Total Expense */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Dépenses Réalisées
            </span>
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
            {FORMAT_CURRENCY(totalExpense, currency)}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Achats, Entretien, Transport</span>
            <button 
              onClick={() => onNavigateTab('financial')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Détails Dépenses
            </button>
          </div>
        </div>

        {/* Card 4: Net Balance / Stock Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Solde Net & Alertes Stock
            </span>
            <div className={`p-2 rounded-lg ${lowStockItems.length > 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {FORMAT_CURRENCY(netBalance, currency)}
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              {lowStockItems.length} article(s) sous le seuil
            </span>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Réapprovisionner
            </button>
          </div>
        </div>

      </div>

      {/* Main Section: Category Valuation Breakdown & Recent Movement Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Asset Value Distribution (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Répartition des Actifs par Catégorie</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Valorisation financière de l'équipement SITE-AMM en pourcentage de l'inventaire total
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Voir l'Inventaire</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {categoryValueMap.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {cat.category} ({cat.count} réf)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {cat.percentage.toFixed(1)}%
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {FORMAT_CURRENCY(cat.value, currency)}
                    </span>
                  </div>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, cat.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Urgent Stock Alert Reordering Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span>Réapprovisionnement Urgent</span>
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 rounded-full">
              {lowStockItems.length} Alerte(s)
            </span>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Aucune rupture ni stock bas !
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tous les articles sont au-dessus de leur seuil de sécurité.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {lowStockItems.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-200/60 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                        {item.code}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {item.name}
                      </h3>
                    </div>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      Qté: {item.quantity} / Min: {item.minThreshold}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-amber-200/50 dark:border-amber-900/40">
                    <span>Fournisseur: {item.supplierName}</span>
                    <button
                      onClick={() => onOpenAddMovement('IN')}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      + Passer commande
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Bottom Section: Recent Movement Audit Feed */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Historique Récent des Mouvements de Stock</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Journal des entrées, sorties et transferts inter-dépôts validés
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('movements')}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Voir tout l'historique →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-3 py-2.5 rounded-l-lg">Date & Temps</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Article</th>
                <th className="px-3 py-2.5 text-center">Qté</th>
                <th className="px-3 py-2.5 text-right">Total</th>
                <th className="px-3 py-2.5">Motif / Inscription</th>
                <th className="px-3 py-2.5 rounded-r-lg">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {recentMovements.map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all">
                  <td className="px-3 py-3 font-mono text-slate-500">
                    {FORMAT_DATE(mov.timestamp, true)}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      mov.type === 'IN'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : mov.type === 'OUT'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}>
                      {mov.type === 'IN' ? 'ENTRÉE (+)' : mov.type === 'OUT' ? 'SORTIE (-)' : mov.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-900 dark:text-white">
                    {mov.itemName}
                    <div className="text-[10px] text-slate-400 font-mono">{mov.itemCode}</div>
                  </td>
                  <td className="px-3 py-3 text-center font-bold">
                    {mov.quantity}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold">
                    {FORMAT_CURRENCY(mov.totalPrice, currency)}
                  </td>
                  <td className="px-3 py-3">
                    {mov.reason}
                    {mov.referenceDoc && (
                      <span className="block text-[10px] text-slate-400 font-mono">
                        Doc: {mov.referenceDoc}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-medium text-slate-600 dark:text-slate-400">
                    {mov.handlerName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
