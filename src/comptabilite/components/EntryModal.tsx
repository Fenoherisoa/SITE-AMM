import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import {
  Account,
  JournalEntry,
  EntryLine,
  JournalCode,
  CompanyConfig,
} from '../types/accounting';
import { JOURNAL_TYPES } from '../data/defaultData';
import { formatCurrency } from '../services/pdfGenerator';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: JournalEntry) => void;
  accounts: Account[];
  companyConfig: CompanyConfig;
  editingEntry?: JournalEntry | null;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  companyConfig,
  editingEntry,
}) => {
  const [journalCode, setJournalCode] = useState<JournalCode>('VT');
  const [date, setDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [pieceNumber, setPieceNumber] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [lines, setLines] = useState<EntryLine[]>([]);

  // TVA Assistant state
  const [showVatAssistant, setShowVatAssistant] = useState(false);
  const [vatType, setVatType] = useState<'VENTE' | 'ACHAT'>('VENTE');
  const [vatHtAmount, setVatHtAmount] = useState<number>(100000);
  const [vatRate, setVatRate] = useState<number>(companyConfig.vatRate || 18);
  const [thirdPartyName, setThirdPartyName] = useState<string>('');

  useEffect(() => {
    if (editingEntry) {
      setJournalCode(editingEntry.journalCode);
      setDate(editingEntry.date);
      setPieceNumber(editingEntry.pieceNumber);
      setLabel(editingEntry.label);
      setReference(editingEntry.reference || '');
      setLines(editingEntry.lines.map((l) => ({ ...l })));
    } else {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setJournalCode('VT');
      setDate(new Date().toISOString().split('T')[0]);
      setPieceNumber(`PIECE-${new Date().getFullYear()}-${randomNum}`);
      setLabel('');
      setReference('');
      // Default 2 empty lines
      setLines([
        {
          id: 'l-' + Date.now() + '-1',
          accountCode: '4111',
          accountLabel: 'Clients - Ventes de biens et services',
          debit: 0,
          credit: 0,
          memo: '',
        },
        {
          id: 'l-' + Date.now() + '-2',
          accountCode: '7061',
          accountLabel: 'Prestations de services informatiques & conseils',
          debit: 0,
          credit: 0,
          memo: '',
        },
      ]);
    }
  }, [editingEntry, isOpen]);

  if (!isOpen) return null;

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  const isBalanced = diff < 0.01 && totalDebit > 0;

  const handleAccountChange = (index: number, code: string) => {
    const acc = accounts.find((a) => a.code === code);
    const updated = [...lines];
    updated[index].accountCode = code;
    updated[index].accountLabel = acc ? acc.label : '';
    setLines(updated);
  };

  const handleLineChange = (
    index: number,
    field: keyof EntryLine,
    value: any
  ) => {
    const updated = [...lines];
    if (field === 'debit') {
      const val = parseFloat(value) || 0;
      updated[index].debit = val;
      if (val > 0) updated[index].credit = 0; // double entry safety
    } else if (field === 'credit') {
      const val = parseFloat(value) || 0;
      updated[index].credit = val;
      if (val > 0) updated[index].debit = 0; // double entry safety
    } else {
      (updated[index] as any)[field] = value;
    }
    setLines(updated);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        id: 'l-' + Date.now() + '-' + (lines.length + 1),
        accountCode: accounts[0]?.code || '5211',
        accountLabel: accounts[0]?.label || 'Banque',
        debit: 0,
        credit: 0,
        memo: '',
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      alert('Une écriture comptable doit comporter au moins 2 lignes.');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const applyVatAssistant = () => {
    if (!vatHtAmount || vatHtAmount <= 0) return;

    const vatAmount = Math.round((vatHtAmount * vatRate) / 100);
    const ttcAmount = vatHtAmount + vatAmount;

    if (vatType === 'VENTE') {
      // Vente:
      // Debit Client (4111) = TTC
      // Credit Vente (7011 or 7061) = HT
      // Credit TVA Facturee (4431) = TVA
      setJournalCode('VT');
      setLines([
        {
          id: 'vat-1',
          accountCode: '4111',
          accountLabel: 'Clients - Ventes de biens et services',
          debit: ttcAmount,
          credit: 0,
          thirdPartyName: thirdPartyName || 'Client SOGEDI',
          memo: 'Facture TTC Client',
        },
        {
          id: 'vat-2',
          accountCode: '7061',
          accountLabel: 'Prestations de services informatiques & conseils',
          debit: 0,
          credit: vatHtAmount,
          memo: 'Produit HT',
        },
        {
          id: 'vat-3',
          accountCode: '4431',
          accountLabel: 'État - TVA facturée sur ventes (18%)',
          debit: 0,
          credit: vatAmount,
          memo: `TVA Facturée ${vatRate}%`,
        },
      ]);
      setLabel(`Facture Vente Prestation Client ${thirdPartyName || 'Client'}`);
    } else {
      // Achat:
      // Debit Charge (6011 or 6051) = HT
      // Debit TVA Deductible (4452) = TVA
      // Credit Fournisseur (4011) = TTC
      setJournalCode('AC');
      setLines([
        {
          id: 'vat-1',
          accountCode: '6051',
          accountLabel: 'Fournitures de bureau non stockables',
          debit: vatHtAmount,
          credit: 0,
          memo: 'Achat Charge HT',
        },
        {
          id: 'vat-2',
          accountCode: '4452',
          accountLabel: 'État - TVA déductible sur achats (18%)',
          debit: vatAmount,
          credit: 0,
          memo: `TVA Déductible ${vatRate}%`,
        },
        {
          id: 'vat-3',
          accountCode: '4011',
          accountLabel: 'Fournisseurs - Achats de biens et services',
          debit: 0,
          credit: ttcAmount,
          thirdPartyName: thirdPartyName || 'Fournisseur TECH-PLUS',
          memo: 'Facture Fournisseur TTC',
        },
      ]);
      setLabel(`Facture Achat Fournisseur ${thirdPartyName || 'Fournisseur'}`);
    }

    setShowVatAssistant(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('L\'écriture n\'est pas équilibrée ! Total Débit doit égaler Total Crédit.');
      return;
    }
    if (!label.trim()) {
      alert('Veuillez saisir un libellé général pour la pièce comptable.');
      return;
    }

    const entryToSave: JournalEntry = {
      id: editingEntry ? editingEntry.id : 'entry-' + Date.now(),
      pieceNumber: pieceNumber || `PIECE-${Date.now()}`,
      date,
      journalCode,
      label,
      reference,
      lines,
      isPosted: true,
      createdAt: editingEntry ? editingEntry.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(entryToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {editingEntry ? 'Modifier l\'Écriture Comptable' : 'Saisie d\'Écriture Comptable'}
              </h2>
              <p className="text-xs text-slate-400">
                Principe de Partie Double (SYSCOHADA) : Total Débit = Total Crédit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowVatAssistant(!showVatAssistant)}
              className="flex items-center space-x-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Assistant TVA</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TVA Assistant Panel */}
        {showVatAssistant && (
          <div className="bg-indigo-950/40 border-b border-indigo-800/50 p-4 px-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-400" />
                Générateur Automatique Facture & TVA
              </span>
              <span className="text-[11px] text-indigo-400">
                Calcule automatiquement le Débit/Crédit HT, TVA ({vatRate}%), et TTC
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-slate-300 mb-1 block font-medium">Type de Flux</label>
                <select
                  value={vatType}
                  onChange={(e) => setVatType(e.target.value as 'VENTE' | 'ACHAT')}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="VENTE">Vente Client (TVA Facturée 4431)</option>
                  <option value="ACHAT">Achat Fournisseur (TVA Déductible 4452)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 mb-1 block font-medium">Montant HT ({companyConfig.currencySymbol})</label>
                <input
                  type="number"
                  value={vatHtAmount}
                  onChange={(e) => setVatHtAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 mb-1 block font-medium">Taux TVA (%)</label>
                <input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(parseFloat(e.target.value) || 18)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 mb-1 block font-medium">Nom du Tiers</label>
                <input
                  type="text"
                  placeholder="Ex: SOGEDI SA"
                  value={thirdPartyName}
                  onChange={(e) => setThirdPartyName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={applyVatAssistant}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1 transition-colors"
                >
                  <span>Générer Lignes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Journal
              </label>
              <select
                value={journalCode}
                onChange={(e) => setJournalCode(e.target.value as JournalCode)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                {JOURNAL_TYPES.map((j) => (
                  <option key={j.code} value={j.code}>
                    {j.code} - {j.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date de la Pièce
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                N° de Pièce / Facture
              </label>
              <input
                type="text"
                placeholder="Ex: FAC-2026-005"
                value={pieceNumber}
                onChange={(e) => setPieceNumber(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Référence Interne / Bon
              </label>
              <input
                type="text"
                placeholder="Ex: BC-8812 / Vir BCP"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Libellé Général de l'Opération *
              </label>
              <input
                type="text"
                placeholder="Ex: Facture d'Achat Fournitures Informatiques et Licences Cloud"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Double Entry Lines Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lignes d'Écriture (Ventilation Comptable)
              </h3>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-semibold bg-blue-950/50 hover:bg-blue-900/60 px-3 py-1.5 rounded-lg border border-blue-800/50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une Ligne</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-800/80 text-slate-400 text-[11px] uppercase font-semibold border-b border-slate-700/60">
                  <tr>
                    <th className="p-3 w-44">N° Compte</th>
                    <th className="p-3">Intitulé du Compte</th>
                    <th className="p-3">Désignation / Note</th>
                    <th className="p-3 w-36">Tiers (Optionnel)</th>
                    <th className="p-3 w-32 text-right">Débit ({companyConfig.currencySymbol})</th>
                    <th className="p-3 w-32 text-right">Crédit ({companyConfig.currencySymbol})</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                  {lines.map((line, idx) => (
                    <tr key={line.id || idx} className="hover:bg-slate-800/30">
                      {/* Account Code Select */}
                      <td className="p-2.5">
                        <select
                          value={line.accountCode}
                          onChange={(e) => handleAccountChange(idx, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-white font-mono rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        >
                          {accounts.map((acc) => (
                            <option key={acc.code} value={acc.code}>
                              {acc.code} - {acc.label.substring(0, 22)}...
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Account Label */}
                      <td className="p-2.5 font-medium text-slate-300 text-xs">
                        {line.accountLabel || 'Sélectionner un compte'}
                      </td>

                      {/* Memo */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          placeholder="Note particulière..."
                          value={line.memo || ''}
                          onChange={(e) => handleLineChange(idx, 'memo', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Third Party */}
                      <td className="p-2.5">
                        <input
                          type="text"
                          placeholder="Client/Fournisseur"
                          value={line.thirdPartyName || ''}
                          onChange={(e) => handleLineChange(idx, 'thirdPartyName', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Debit */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={line.debit || ''}
                          onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-semibold text-right rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Credit */}
                      <td className="p-2.5">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={line.credit || ''}
                          onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-blue-400 font-mono font-semibold text-right rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Delete */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Balance Control Bar */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
              isBalanced
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {isBalanced ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              )}
              <div>
                <p className="font-bold">
                  {isBalanced
                    ? 'Écriture Équilibrée (Prête à être comptabilisée)'
                    : 'Déséquilibre Débit/Crédit !'}
                </p>
                <p className="text-[11px] opacity-80">
                  {isBalanced
                    ? 'Les sommes au Débit et au Crédit sont rigoureusement égales.'
                    : `Écart à corriger: ${formatCurrency(diff, companyConfig.currencySymbol)}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 font-mono font-bold text-sm bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 text-xs font-sans mr-2">Total Débit:</span>
                <span className="text-emerald-400">{formatCurrency(totalDebit, companyConfig.currencySymbol)}</span>
              </div>
              <span className="text-slate-600">|</span>
              <div>
                <span className="text-slate-400 text-xs font-sans mr-2">Total Crédit:</span>
                <span className="text-blue-400">{formatCurrency(totalCredit, companyConfig.currencySymbol)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2.5 rounded-lg text-xs transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isBalanced}
              className={`font-semibold px-5 py-2.5 rounded-lg text-xs shadow-md transition-all ${
                isBalanced
                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              Valider & Comptabiliser
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
