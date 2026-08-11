import React from 'react';
import { FileSpreadsheet, Download, ShieldCheck, Boxes, ArrowLeftRight, Wallet, ShoppingCart, Sparkles } from 'lucide-react';
import { InventoryItem, StockMovement, FinancialTransaction, AssociationProfile, CurrencyCode } from '../types';
import { GENERATE_INVENTORY_REPORT, GENERATE_MOVEMENTS_REPORT, GENERATE_FINANCIAL_REPORT, GENERATE_REORDER_PURCHASE_ORDER } from '../utils/pdfGenerator';

interface PDFReportsViewProps {
  items: InventoryItem[];
  movements: StockMovement[];
  transactions: FinancialTransaction[];
  profile: AssociationProfile;
  currency: CurrencyCode;
}

export const PDFReportsView: React.FC<PDFReportsViewProps> = ({
  items,
  movements,
  transactions,
  profile,
  currency
}) => {
  const lowStockCount = items.filter(i => i.quantity <= i.minThreshold).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-400">
            <FileSpreadsheet className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Studio de Génération de Rapports PDF Imprimables
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Édition de documents officiels d'audit, de bilan financier et de bons de commande en format PDF certifié SITE-AMM.
            </p>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Report 1: Inventory */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Boxes className="h-6 w-6" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                A4 Paysage
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Rapport d'Inventaire Général & Valorisation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inventaire exhaustif de tous les équipements en stock, seuils d'alerte, prix unitaires, emplacements et valorisation financière totale des actifs AMM.
            </p>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2">
              Contient {items.length} références d'articles enregistrées.
            </div>
          </div>

          <button
            onClick={() => GENERATE_INVENTORY_REPORT(items, { profile, currency })}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger Rapport d'Inventaire PDF</span>
          </button>
        </div>

        {/* Report 2: Movements Audit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <ArrowLeftRight className="h-6 w-6" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                A4 Paysage
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Journal d'Audit des Mouvements de Stock
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historique complet et traçabilité des flux d'entrées, sorties, transferts inter-dépôts, motifs d'inscription, numéros de pièces justificatives et responsables.
            </p>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2">
              Contient {movements.length} mouvements horodatés.
            </div>
          </div>

          <button
            onClick={() => GENERATE_MOVEMENTS_REPORT(movements, { profile, currency })}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger Journal Mouvements PDF</span>
          </button>
        </div>

        {/* Report 3: Financial Ledger */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Wallet className="h-6 w-6" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                A4 Portrait
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Grand Livre Financier & Bilan des Recettes/Dépenses
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Document comptable consolidé détaillant les subventions, cotisations, dépenses d'acquisition de matériel, solde net et ventilation par compte bancaire/caisse.
            </p>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2">
              Contient {transactions.length} écritures financières validées.
            </div>
          </div>

          <button
            onClick={() => GENERATE_FINANCIAL_REPORT(transactions, { profile, currency })}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger Bilan Financier PDF</span>
          </button>
        </div>

        {/* Report 4: Purchase Requisition */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <span className="text-xs font-mono font-bold text-amber-500 font-bold">
                Urgences ({lowStockCount})
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Bon de Commande & Reconstitution Stock Bas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Génération automatique de la demande d'achat pour tous les articles en rupture ou sous leur seuil min, avec quantités suggérées, coût estimé et fournisseurs.
            </p>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 pt-2">
              {lowStockCount} article(s) nécessite(nt) un réapprovisionnement.
            </div>
          </div>

          <button
            onClick={() => GENERATE_REORDER_PURCHASE_ORDER(items, { profile, currency })}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger Demande de Commande PDF</span>
          </button>
        </div>

      </div>

    </div>
  );
};
