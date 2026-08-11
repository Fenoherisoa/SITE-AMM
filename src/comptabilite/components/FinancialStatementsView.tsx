import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  PieChart,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  Account,
  JournalEntry,
  CompanyConfig,
} from '../types/accounting';
import { formatCurrency, exportFinancialStatementsPDF } from '../services/pdfGenerator';

interface FinancialStatementsViewProps {
  accounts: Account[];
  entries: JournalEntry[];
  companyConfig: CompanyConfig;
}

export const FinancialStatementsView: React.FC<FinancialStatementsViewProps> = ({
  accounts,
  entries,
  companyConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'BILAN' | 'RESULTAT' | 'RATIOS'>('BILAN');

  // Compute Account Balances
  const accountBalances: Record<string, number> = {};
  accounts.forEach((a) => (accountBalances[a.code] = 0));

  entries.forEach((entry) => {
    entry.lines.forEach((line) => {
      if (!accountBalances[line.accountCode]) {
        accountBalances[line.accountCode] = 0;
      }
      accountBalances[line.accountCode] += line.debit - line.credit;
    });
  });

  // Helper function to sum codes starting with prefix
  const getSum = (prefix: string): number => {
    let sum = 0;
    Object.keys(accountBalances).forEach((code) => {
      if (code.startsWith(prefix)) {
        sum += accountBalances[code];
      }
    });
    return sum;
  };

  // 1. ACTIF (Assets)
  // Immobilisations Brutes (Classe 2 sans 28)
  const immobilisationsBrutes = Object.keys(accountBalances)
    .filter((c) => c.startsWith('2') && !c.startsWith('28'))
    .reduce((s, c) => s + accountBalances[c], 0);

  // Amortissements (28)
  const amortissementsCumul = Math.abs(
    Object.keys(accountBalances)
      .filter((c) => c.startsWith('28'))
      .reduce((s, c) => s + accountBalances[c], 0)
  );

  const immobilisationsNettes = Math.max(0, immobilisationsBrutes - amortissementsCumul);

  const stocks = getSum('3'); // Classe 3
  const creancesClients = Math.max(0, getSum('411')); // 411
  const tvaDeductible = Math.max(0, getSum('445')); // 445

  const tresorerieBanque = Math.max(0, getSum('52')); // 52
  const tresorerieCaisse = Math.max(0, getSum('57')); // 57
  const tresorerieActif = tresorerieBanque + tresorerieCaisse;

  const totalActif =
    immobilisationsNettes +
    stocks +
    creancesClients +
    tvaDeductible +
    tresorerieActif;

  // 2. PASSIF (Liabilities & Equity)
  const capitalSocial = Math.abs(getSum('101'));
  const reportANouveau = Math.abs(getSum('111'));
  const empruntsFinanciers = Math.abs(getSum('162'));

  // Compute Net Income Result (Produits - Charges)
  let totalProduits = 0;
  let totalCharges = 0;

  Object.keys(accountBalances).forEach((code) => {
    if (code.startsWith('7')) {
      totalProduits += Math.abs(accountBalances[code]);
    }
    if (code.startsWith('6')) {
      totalCharges += accountBalances[code];
    }
  });

  const netResult = totalProduits - totalCharges;

  const capitauxPropres = capitalSocial + reportANouveau + (netResult > 0 ? netResult : 0);

  const dettesFournisseurs = Math.abs(getSum('401'));
  const dettesSociales = Math.abs(getSum('421')) + Math.abs(getSum('431'));
  const tvaFacturee = Math.abs(getSum('443'));

  const totalPassif =
    capitauxPropres +
    empruntsFinanciers +
    dettesFournisseurs +
    dettesSociales +
    tvaFacturee +
    (netResult < 0 ? Math.abs(netResult) : 0); // If loss, balance equity adjustment

  // Financial Indicators (FRNG, BFR, TN)
  const ressourcesDurables = capitauxPropres + empruntsFinanciers;
  const emploisStables = immobilisationsNettes;
  const frng = ressourcesDurables - emploisStables; // Fond de Roulement Net Global

  const actifCirculantExploitation = stocks + creancesClients + tvaDeductible;
  const passifCirculantExploitation = dettesFournisseurs + dettesSociales + tvaFacturee;
  const bfr = actifCirculantExploitation - passifCirculantExploitation; // Besoin en Fonds de Roulement

  const tresorerieNette = frng - bfr; // TN = FRNG - BFR

  // Lines for PDF export
  const actifLines = [
    { code: '21/24', label: 'Immobilisations Brutes', amount: immobilisationsBrutes },
    { code: '28', label: 'Amortissements Cumulés', amount: -amortissementsCumul },
    { code: '31/32', label: 'Stocks de Marchandises & Matières', amount: stocks },
    { code: '411', label: 'Créances Clients & Compte Rattachés', amount: creancesClients },
    { code: '445', label: 'État - TVA Déductible', amount: tvaDeductible },
    { code: '52/57', label: 'Trésorerie Actif (Banque & Caisse)', amount: tresorerieActif },
  ];

  const passifLines = [
    { code: '101', label: 'Capital Social Souscrit', amount: capitalSocial },
    { code: '131', label: 'Résultat Net de l\'Exercice (Bénéfice)', amount: netResult > 0 ? netResult : 0 },
    { code: '162', label: 'Emprunts auprès Établissements de Crédit', amount: empruntsFinanciers },
    { code: '401', label: 'Dettes Fournisseurs d\'Exploitation', amount: dettesFournisseurs },
    { code: '421/431', label: 'Dettes Personnel & CNSS', amount: dettesSociales },
    { code: '443', label: 'État - TVA Facturée', amount: tvaFacturee },
  ];

  const produitLines = [
    { code: '7011', label: 'Ventes de Marchandises', amount: Math.abs(getSum('701')) },
    { code: '7061', label: 'Prestations de Services Informatiques & Conseils', amount: Math.abs(getSum('706')) },
    { code: '7710', label: 'Produits Financiers & Intérêts', amount: Math.abs(getSum('771')) },
  ];

  const chargeLines = [
    { code: '6011', label: 'Achats de Marchandises & Matières', amount: getSum('601') },
    { code: '6051', label: 'Fournitures de Bureau & Énergie', amount: getSum('605') },
    { code: '61/62', label: 'Services Extérieurs & Honoraires', amount: getSum('61') + getSum('62') },
    { code: '6410', label: 'Salaires & Charges Sociales Personnel', amount: getSum('64') },
    { code: '6813', label: 'Dotations Amortissements Immobilisations', amount: getSum('68') },
  ];

  const handleExportPDF = () => {
    exportFinancialStatementsPDF(
      actifLines,
      passifLines,
      produitLines,
      chargeLines,
      companyConfig
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">
              États Financiers de Synthèse (SYSCOHADA)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Présentation normalisée du Bilan Comptable, Compte de Résultat et Ratios de Gestion.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>Imprimer États Financiers PDF</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('BILAN')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'BILAN'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          I. Bilan Comptable (Actif / Passif)
        </button>
        <button
          onClick={() => setActiveTab('RESULTAT')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'RESULTAT'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          II. Compte de Résultat (Produits / Charges)
        </button>
        <button
          onClick={() => setActiveTab('RATIOS')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'RATIOS'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          III. Ratios & Équilibre Financier (FRNG / BFR)
        </button>
      </div>

      {/* 1. BILAN COMPTABLE */}
      {activeTab === 'BILAN' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* ACTIF */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                <span>ACTIF (Emplois)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-emerald-300">
                Total: {formatCurrency(totalActif, companyConfig.currencySymbol)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-800/40 p-3 rounded-xl space-y-1">
                <span className="font-bold text-slate-200 block">ACTIF IMMOBILISÉ</span>
                <div className="flex justify-between text-slate-400">
                  <span>Immobilisations corporelles & matériel</span>
                  <span className="font-mono text-slate-200">{formatCurrency(immobilisationsBrutes, companyConfig.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>(-) Amortissements cumulés</span>
                  <span className="font-mono text-amber-400">-{formatCurrency(amortissementsCumul, companyConfig.currencySymbol)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-slate-700/50">
                  <span>Net Actif Immobilisé</span>
                  <span className="font-mono">{formatCurrency(immobilisationsNettes, companyConfig.currencySymbol)}</span>
                </div>
              </div>

              <div className="bg-slate-800/40 p-3 rounded-xl space-y-1">
                <span className="font-bold text-slate-200 block">ACTIF CIRCULANT</span>
                <div className="flex justify-between text-slate-400">
                  <span>Stocks de marchandises & fournitures</span>
                  <span className="font-mono text-slate-200">{formatCurrency(stocks, companyConfig.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Créances Clients & Comptes rattachés</span>
                  <span className="font-mono text-slate-200">{formatCurrency(creancesClients, companyConfig.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>État - TVA Déductible</span>
                  <span className="font-mono text-slate-200">{formatCurrency(tvaDeductible, companyConfig.currencySymbol)}</span>
                </div>
              </div>

              <div className="bg-slate-800/40 p-3 rounded-xl space-y-1">
                <span className="font-bold text-slate-200 block">TRÉSORERIE ACTIF</span>
                <div className="flex justify-between text-slate-400">
                  <span>Disponibilités en Banque (BCP / Ecobank)</span>
                  <span className="font-mono text-slate-200">{formatCurrency(tresorerieBanque, companyConfig.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Disponibilités en Caisse Siège</span>
                  <span className="font-mono text-slate-200">{formatCurrency(tresorerieCaisse, companyConfig.currencySymbol)}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-950/60 p-4 rounded-xl border border-emerald-800/80 flex items-center justify-between font-bold text-sm">
              <span className="text-emerald-200 uppercase">TOTAL GÉNÉRAL ACTIF</span>
              <span className="text-emerald-400 font-mono">
                {formatCurrency(totalActif, companyConfig.currencySymbol)}
              </span>
            </div>
          </div>

          {/* PASSIF */}
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-blue-400 uppercase tracking-wider flex items-center space-x-2">
                <span>PASSIF (Ressources)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-blue-300">
                Total: {formatCurrency(totalPassif, companyConfig.currencySymbol)}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-800/40 p-3 rounded-xl space-y-1">
                <span className="font-bold text-slate-200 block">CAPITAUX PROPRES</span>
                <div className="flex justify-between text-slate-400">
                  <span>Capital Social Souscrit</span>
                  <span className="font-mono text-slate-200">{formatCurrency(capitalSocial, companyConfig.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Résultat Net de l'Exercice</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(netResult, companyConfig.currencySymbol)}</span>
                </div>
              </div>

              <div className="bg-slate-800/40 p-3 rounded-xl space-y-1">
                <span className="font-bold text-slate-200 block">DETTES FINANCIÈRES</span>
                <div className="flex justify-between text-slate-400">
                  <span>Emprunts à Long & Moyen Terme (BCP)</span>
                  <span className="font-mono text-slate-200">{formatCurrency(empruntsFinanciers, companyConfig.currencySymbol)}</span>
                </div>
              </div>

              <div className="bg-slate-800/40 p-3 rounded-xl space-y-1">
                <span className="font-bold text-slate-200 block">PASSIF CIRCULANT (Dettes Courantes)</span>
                <div className="flex justify-between text-slate-400">
                  <span>Fournisseurs d'Exploitation</span>
                  <span className="font-mono text-slate-200">{formatCurrency(dettesFournisseurs, companyConfig.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Personnel & Organismes Sociaux (CNSS)</span>
                  <span className="font-mono text-slate-200">{formatCurrency(dettesSociales, companyConfig.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>État - TVA Facturée</span>
                  <span className="font-mono text-slate-200">{formatCurrency(tvaFacturee, companyConfig.currencySymbol)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-950/60 p-4 rounded-xl border border-blue-800/80 flex items-center justify-between font-bold text-sm">
              <span className="text-blue-200 uppercase">TOTAL GÉNÉRAL PASSIF</span>
              <span className="text-blue-400 font-mono">
                {formatCurrency(totalPassif, companyConfig.currencySymbol)}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* 2. COMPTE DE RÉSULTAT */}
      {activeTab === 'RESULTAT' && (
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">
              Compte de Résultat de l'Exercice {companyConfig.fiscalYear}
            </h3>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Résultat Net Comptable</span>
              <span
                className={`text-lg font-mono font-bold ${
                  netResult >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatCurrency(netResult, companyConfig.currencySymbol)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* PRODUITS */}
            <div className="space-y-3">
              <h4 className="font-bold text-emerald-400 uppercase border-b border-emerald-900/50 pb-1">
                Produits d'Exploitation (Classe 7)
              </h4>
              <div className="space-y-2">
                {produitLines.map((p, i) => (
                  <div key={i} className="flex justify-between p-2.5 bg-slate-800/40 rounded-lg">
                    <span className="text-slate-300">{p.code} - {p.label}</span>
                    <span className="font-mono font-bold text-emerald-400">{formatCurrency(p.amount, companyConfig.currencySymbol)}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-800/50 flex justify-between font-bold">
                <span className="text-emerald-200">TOTAL PRODUITS</span>
                <span className="font-mono text-emerald-400">{formatCurrency(totalProduits, companyConfig.currencySymbol)}</span>
              </div>
            </div>

            {/* CHARGES */}
            <div className="space-y-3">
              <h4 className="font-bold text-amber-400 uppercase border-b border-amber-900/50 pb-1">
                Charges d'Exploitation (Classe 6)
              </h4>
              <div className="space-y-2">
                {chargeLines.map((c, i) => (
                  <div key={i} className="flex justify-between p-2.5 bg-slate-800/40 rounded-lg">
                    <span className="text-slate-300">{c.code} - {c.label}</span>
                    <span className="font-mono font-bold text-amber-400">{formatCurrency(c.amount, companyConfig.currencySymbol)}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-amber-950/50 rounded-xl border border-amber-800/50 flex justify-between font-bold">
                <span className="text-amber-200">TOTAL CHARGES</span>
                <span className="font-mono text-amber-400">{formatCurrency(totalCharges, companyConfig.currencySymbol)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RATIOS FINANCIERS */}
      {activeTab === 'RATIOS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
              1. Fond de Roulement Net Global (FRNG)
            </span>
            <span className="text-2xl font-bold font-mono text-white block">
              {formatCurrency(frng, companyConfig.currencySymbol)}
            </span>
            <p className="text-xs text-slate-400">
              Ressources Durables - Emplois Stables. Mesure l'excédent de ressources stables disponible pour financer l'exploitation.
            </p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              2. Besoin en Fonds de Roulement (BFR)
            </span>
            <span className="text-2xl font-bold font-mono text-white block">
              {formatCurrency(bfr, companyConfig.currencySymbol)}
            </span>
            <p className="text-xs text-slate-400">
              Actif Circulant Exploitation - Passif Circulant Exploitation. Besoins financiers nés du décalage entre ventes et règlements fournisseurs.
            </p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              3. Trésorerie Nette (TN)
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400 block">
              {formatCurrency(tresorerieNette, companyConfig.currencySymbol)}
            </span>
            <p className="text-xs text-slate-400">
              TN = FRNG - BFR. Solde réel immédiatement disponible dans les caisses et banques après couverture du BFR.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};
