import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Search, 
  Filter, 
  Plus, 
  QrCode, 
  Edit3, 
  Trash2, 
  Download, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  MapPin, 
  Tag, 
  Building, 
  LayoutGrid, 
  List, 
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import { InventoryItem, CategoryName, CurrencyCode } from '../types';
import { FORMAT_CURRENCY, GET_STOCK_STATUS, GET_STOCK_STATUS_BADGE } from '../utils/formatters';

interface InventoryViewProps {
  items: InventoryItem[];
  currency: CurrencyCode;
  onOpenAddItem: () => void;
  onOpenEditItem: (item: InventoryItem) => void;
  onOpenQRModal: (item: InventoryItem) => void;
  onOpenQuickStockModal: (item: InventoryItem) => void;
  onDeleteItem: (itemId: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  currency,
  onOpenAddItem,
  onOpenEditItem,
  onOpenQRModal,
  onOpenQuickStockModal,
  onDeleteItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const categories: CategoryName[] = [
    'Équipement Informatique',
    'Matériel Roulant & Transport',
    'Mobilier de Bureau',
    'Matériel Événementiel & Audiovisuel',
    'Consommables & Fournitures',
    'Secours & Kit Médical',
    'Outillage & Maintenance',
    'Autres Équipements'
  ];

  const locations = Array.from(new Set(items.map(i => i.location))).filter(Boolean);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesLoc = selectedLocation === 'ALL' || item.location === selectedLocation;

      const status = GET_STOCK_STATUS(item.quantity, item.minThreshold);
      const matchesStatus = 
        selectedStatus === 'ALL' ||
        (selectedStatus === 'LOW' && status === 'LOW') ||
        (selectedStatus === 'OUT_OF_STOCK' && status === 'OUT_OF_STOCK') ||
        (selectedStatus === 'NORMAL' && status === 'NORMAL');

      return matchesSearch && matchesCat && matchesLoc && matchesStatus;
    });
  }, [items, searchTerm, selectedCategory, selectedLocation, selectedStatus]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Code SKU', 'Désignation', 'Catégorie', 'Quantité', 'Seuil Min', 'Prix Unitaire', 'Valeur Totale', 'Emplacement', 'État', 'Fournisseur'];
    const rows = filteredItems.map(i => [
      `"${i.code}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      i.quantity,
      i.minThreshold,
      i.unitPrice,
      i.totalValue,
      `"${i.location}"`,
      `"${i.condition}"`,
      `"${i.supplierName}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SITE-AMM_Inventaire_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Catalogue de l'Inventaire & Actifs Matériels</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filteredItems.length} référence(s) affichée(s) sur {items.length} au total
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vue Tableau"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vue Cartes"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={onOpenAddItem}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>+ Nouvel Article</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Control Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par désignation, Code SKU, emplacement, fournisseur..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
          >
            <option value="ALL">Tous les emplacements ({locations.length})</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
          >
            <option value="ALL">Tous les statuts de stock</option>
            <option value="NORMAL">Disponible / Normal</option>
            <option value="LOW">Stock Bas (Alerte)</option>
            <option value="OUT_OF_STOCK">Rupture de Stock</option>
          </select>

        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Toutes Catégories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content View: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Code SKU</th>
                  <th className="px-4 py-3">Désignation Article</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3 text-center">Quantité</th>
                  <th className="px-4 py-3 text-right">Prix Unitaire</th>
                  <th className="px-4 py-3 text-right">Valeur Totale</th>
                  <th className="px-4 py-3">Emplacement</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                      Aucun article ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const status = GET_STOCK_STATUS(item.quantity, item.minThreshold);
                    const badge = GET_STOCK_STATUS_BADGE(status);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.code}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {item.description}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-sm">
                          {item.quantity}
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Min: {item.minThreshold}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-medium">
                          {FORMAT_CURRENCY(item.unitPrice, currency)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {FORMAT_CURRENCY(item.totalValue, currency)}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {item.location}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenQuickStockModal(item)}
                              title="Ajuster le Stock"
                              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all"
                            >
                              <ArrowUpDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenQRModal(item)}
                              title="Afficher Code-Barres / QR Code"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenEditItem(item)}
                              title="Éditer Fiche Article"
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteItem(item.id)}
                              title="Supprimer Article"
                              className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Mode Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const status = GET_STOCK_STATUS(item.quantity, item.minThreshold);
            const badge = GET_STOCK_STATUS_BADGE(status);

            return (
              <div 
                key={item.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                      {item.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {item.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {item.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Quantité en Stock</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-base">
                      {item.quantity} <span className="text-xs font-normal text-slate-400">(Min: {item.minThreshold})</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Valeur Totale</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {FORMAT_CURRENCY(item.totalValue, currency)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>État: <b>{item.condition}</b></span>
                    <span>Fournisseur: <b>{item.supplierName}</b></span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onOpenQuickStockModal(item)}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>Ajuster Stock</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenQRModal(item)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenEditItem(item)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
