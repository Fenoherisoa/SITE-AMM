import React, { useState } from 'react';
import {
  Landmark,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  RefreshCw,
} from 'lucide-react';
import { JournalEntry, CompanyConfig } from '../types/accounting';
import { formatCurrency } from '../services/pdfGenerator';

interface BankReconcileViewProps {
  entries: JournalEntry[];
  companyConfig: CompanyConfig;
}

export const BankReconcileView: React.FC<BankReconcileViewProps> = ({
  entries,
  companyConfig,
}) => {
  // Extract all Bank Journal entries (BQ / 5211)
  const bankEntries = entries.filter(
    (e) =>
      e.journalCode === 'BQ' ||
      e.lines.some((l) => l.accountCode.startsWith('52'))
  );

  const [matchedIds, setMatchedIds] = useState<Record<string, boolean>>({
    'entry-bq-1': true,
    'entry-bq-2': true,
  });

  const toggleMatch = (id: string) => {
    setMatchedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalBookDebit = bankEntries.reduce(
    (s, e) =>
      s + e.lines.filter((l) => l.accountCode.startsWith('52')).reduce((sum, l) => sum + l.debit, 0),
    0
  );

  const totalBookCredit = bankEntries.reduce(
    (s, e) =>
      s + e.lines.filter((l) => l.accountCode.startsWith('52')).reduce((sum, l) => sum + l.credit, 0),
    0
  );

  const clearedEntries = bankEntries.filter((e) => matchedIds[e.id]);
  const clearedDebit = clearedEntries.reduce(
    (s, e) =>
      s + e.lines.filter((l) => l.accountCode.startsWith('52')).reduce((sum, l) => sum + l.debit, 0),
    0
  );
  const clearedCredit = clearedEntries.reduce(
    (s, e) =>
      s + e.lines.filter((l) => l.accountCode.startsWith('52')).reduce((sum, l) => sum + l.credit, 0),
    0
  );

  const clearedBalance = clearedDebit - clearedCredit;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Landmark className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Rapprochement Bancaire (Compte 5211 BCP)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Lettrage et vérification de la concordance entre le Relevé Bancaire et le Journal de Banque.
          </p>
        </div>

        <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
          <span className="text-xs text-slate-400 block font-medium">Solde Rapproché</span>
          <span className="text-base font-mono font-bold text-emerald-400">
            {formatCurrency(clearedBalance, companyConfig.currencySymbol)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300">
            Mouvements en Banque ({bankEntries.length})
          </span>
          <span className="text-slate-400">
            {clearedEntries.length} sur {bankEntries.length} lettrés / rapprochés
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-semibold">
              <tr>
                <th className="p-3 w-12 text-center">Rapproché</th>
                <th className="p-3 w-28">Date</th>
                <th className="p-3 w-32">N° Pièce</th>
                <th className="p-3">Libellé de l'Écriture</th>
                <th className="p-3 w-32 text-right">Encaissement (Débit)</th>
                <th className="p-3 w-32 text-right">Décaissement (Crédit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {bankEntries.map((entry) => {
                const isCleared = !!matchedIds[entry.id];
                const bankLine = entry.lines.find((l) => l.accountCode.startsWith('52'));
                const debit = bankLine ? bankLine.debit : 0;
                const credit = bankLine ? bankLine.credit : 0;

                return (
                  <tr key={entry.id} className="hover:bg-slate-800/30">
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleMatch(entry.id)}
                        className={`p-1 rounded-lg transition-colors ${
                          isCleared
                            ? 'text-emerald-400 bg-emerald-950/60'
                            : 'text-slate-600 hover:text-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </td>
                    <td className="p-3 text-slate-300">
                      {new Date(entry.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-3 font-bold text-blue-400">
                      {entry.pieceNumber}
                    </td>
                    <td className="p-3 font-sans text-slate-200">
                      {entry.label}
                    </td>
                    <td className="p-3 text-right text-emerald-400 font-bold">
                      {debit > 0 ? formatCurrency(debit, '') : '-'}
                    </td>
                    <td className="p-3 text-right text-amber-400 font-bold">
                      {credit > 0 ? formatCurrency(credit, '') : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
