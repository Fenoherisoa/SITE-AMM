import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  UserCheck, 
  Calendar, 
  MapPin, 
  Download,
  Building2
} from 'lucide-react';
import { StockMovement, MovementType, CurrencyCode } from '../types';
import { FORMAT_CURRENCY, FORMAT_DATE } from '../utils/formatters';

interface StockMovementsViewProps {
  movements: StockMovement[];
  currency: CurrencyCode;
  onOpenAddMovement: (type?: MovementType) => void;
}

export const StockMovementsView: React.FC<StockMovementsViewProps> = ({
  movements,
  currency,
  onOpenAddMovement
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesSearch = 
        m.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.handlerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.referenceDoc && m.referenceDoc.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = selectedType === 'ALL' || m.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [movements, searchTerm, selectedType]);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Journal des Mouvements & Flux de Stock</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit complet des entrées, sorties, transferts inter-dépôts et régularisations
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>+ Sortie Stock</span>
          </button>
          <button
            onClick={() => onOpenAddMovement('TRANSFER')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>+ Transfert Dépôt</span>
          </button>
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
            placeholder="Rechercher par article, code, motif, N° bon/facture, responsable..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
        >
          <option value="ALL">Tous les types de mouvement</option>
          <option value="IN">Entrées (+ Achats, Dons)</option>
          <option value="OUT">Sorties (- Distribution, Casse)</option>
          <option value="TRANSFER">Transferts Inter-Dépôts</option>
          <option value="ADJUSTMENT">Ajustements d'Inventaire</option>
        </select>
      </div>

      {/* Table Log */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Horodatage</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Désignation Article</th>
                <th className="px-4 py-3 text-center">Quantité</th>
                <th className="px-4 py-3 text-right">Montant Total</th>
                <th className="px-4 py-3">Source → Cible</th>
                <th className="px-4 py-3">Motif & Ref Doc</th>
                <th className="px-4 py-3">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    Aucun mouvement trouvé dans l'historique.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all">
                    <td className="px-4 py-3.5 font-mono text-slate-500">
                      {FORMAT_DATE(mov.timestamp, true)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        mov.type === 'IN'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : mov.type === 'OUT'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                          : mov.type === 'TRANSFER'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {mov.type === 'IN' ? 'ENTRÉE (+)' : mov.type === 'OUT' ? 'SORTIE (-)' : mov.type === 'TRANSFER' ? 'TRANSFERT' : 'AJUSTEMENT'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {mov.itemName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {mov.itemCode}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center font-extrabold text-sm">
                      {mov.quantity}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {FORMAT_CURRENCY(mov.totalPrice, currency)}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {mov.sourceLocation && <div>De: {mov.sourceLocation}</div>}
                      {mov.targetLocation && <div>Vers: {mov.targetLocation}</div>}
                      {!mov.sourceLocation && !mov.targetLocation && '-'}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {mov.reason}
                      </div>
                      {mov.referenceDoc && (
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                          Ref: {mov.referenceDoc}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-400">
                      {mov.handlerName}
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
