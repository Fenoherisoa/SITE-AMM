import React from 'react';
import {
  Percent,
  TrendingUp,
  TrendingDown,
  Calculator,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { JournalEntry, CompanyConfig } from '../types/accounting';
import { formatCurrency } from '../services/pdfGenerator';

interface VatViewProps {
  entries: JournalEntry[];
  companyConfig: CompanyConfig;
}

export const VatView: React.FC<VatViewProps> = ({
  entries,
  companyConfig,
}) => {
  let vatCollected = 0; // 4431
  let vatDeductiblePurchases = 0; // 4452
  let vatDeductibleAssets = 0; // 4453

  let salesTaxableBase = 0; // Class 7
  let purchasesTaxableBase = 0; // Class 6

  entries.forEach((e) => {
    e.lines.forEach((l) => {
      if (l.accountCode.startsWith('443')) {
        vatCollected += l.credit - l.debit;
      }
      if (l.accountCode === '4452') {
        vatDeductiblePurchases += l.debit - l.credit;
      }
      if (l.accountCode === '4453') {
        vatDeductibleAssets += l.debit - l.credit;
      }
      if (l.accountCode.startsWith('70')) {
        salesTaxableBase += l.credit - l.debit;
      }
      if (l.accountCode.startsWith('60')) {
        purchasesTaxableBase += l.debit - l.credit;
      }
    });
  });

  const totalVatDeductible = vatDeductiblePurchases + vatDeductibleAssets;
  const netVatPayable = vatCollected - totalVatDeductible;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
              <Percent className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Déclaration de la Taxe sur la Valeur Ajoutée (TVA {companyConfig.vatRate}%)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Liquidation mensuelle de la TVA : TVA Collectée (Facturée) vs TVA Déductible sur Achats.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* TVA Collectée */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">TVA Collectée (Facturée)</span>
            <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded font-mono">Compte 4431</span>
          </div>
          <span className="text-2xl font-bold font-mono text-blue-400 block">
            {formatCurrency(vatCollected, companyConfig.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-500 block">
            Base HT Ventes: {formatCurrency(salesTaxableBase, companyConfig.currencySymbol)}
          </span>
        </div>

        {/* TVA Déductible */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">TVA Déductible sur Achats</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono">Compte 4452/4453</span>
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-400 block">
            {formatCurrency(totalVatDeductible, companyConfig.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-500 block">
            Base HT Achats: {formatCurrency(purchasesTaxableBase, companyConfig.currencySymbol)}
          </span>
        </div>

        {/* TVA à Payer ou Crédit */}
        <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">
              {netVatPayable >= 0 ? 'Net TVA à Payer au Trésor' : 'Crédit de TVA à Reporter'}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
              netVatPayable >= 0 ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
            }`}>
              {netVatPayable >= 0 ? 'Dette Fiscale' : 'Créance Fiscale'}
            </span>
          </div>
          <span className={`text-2xl font-bold font-mono block ${
            netVatPayable >= 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {formatCurrency(Math.abs(netVatPayable), companyConfig.currencySymbol)}
          </span>
          <span className="text-[11px] text-slate-500 block">
            {netVatPayable >= 0
              ? 'À verser au service des impôts avant le 15 du mois'
              : 'Imputable sur les déclarations de TVA futures'}
          </span>
        </div>

      </div>

      {/* Detail Breakdown */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider">
          Fiche Récapitulative de Déclaration TVA
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-slate-800/40 rounded-xl flex justify-between">
            <span className="text-slate-300">1. TVA sur ventes de biens & services (4431)</span>
            <span className="font-mono font-bold text-blue-400">{formatCurrency(vatCollected, companyConfig.currencySymbol)}</span>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl flex justify-between">
            <span className="text-slate-300">2. (-) TVA déductible sur biens & services (4452)</span>
            <span className="font-mono font-bold text-emerald-400">-{formatCurrency(vatDeductiblePurchases, companyConfig.currencySymbol)}</span>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl flex justify-between">
            <span className="text-slate-300">3. (-) TVA déductible sur immobilisations (4453)</span>
            <span className="font-mono font-bold text-emerald-400">-{formatCurrency(vatDeductibleAssets, companyConfig.currencySymbol)}</span>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between font-bold text-sm mt-2">
            <span className="text-white uppercase">NET TVA NETTE À REGLER</span>
            <span className="font-mono text-amber-400">
              {formatCurrency(netVatPayable > 0 ? netVatPayable : 0, companyConfig.currencySymbol)}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
