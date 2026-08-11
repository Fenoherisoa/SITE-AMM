import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import {
  JournalEntry,
  JournalCode,
  CompanyConfig,
  Account,
} from '../types/accounting';
import { JOURNAL_TYPES } from '../data/defaultData';
import { formatCurrency, exportJournalPDF, exportPiecePDF } from '../services/pdfGenerator';

interface JournalViewProps {
  entries: JournalEntry[];
  companyConfig: CompanyConfig;
  onOpenNewEntry: () => void;
  onEditEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  entries,
  companyConfig,
  onOpenNewEntry,
  onEditEntry,
  onDeleteEntry,
}) => {
  const [selectedJournal, setSelectedJournal] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Filtering entries
  const filteredEntries = entries.filter((entry) => {
    // Journal filter
    if (selectedJournal !== 'ALL' && entry.journalCode !== selectedJournal) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPiece = entry.pieceNumber.toLowerCase().includes(q);
      const matchLabel = entry.label.toLowerCase().includes(q);
      const matchRef = (entry.reference || '').toLowerCase().includes(q);
      const matchLines = entry.lines.some(
        (l) =>
          l.accountCode.includes(q) ||
          l.accountLabel.toLowerCase().includes(q) ||
          (l.thirdPartyName || '').toLowerCase().includes(q) ||
          (l.memo || '').toLowerCase().includes(q)
      );
      if (!matchPiece && !matchLabel && !matchRef && !matchLines) {
        return false;
      }
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedEntryId(expandedEntryId === id ? null : id);
  };

  const handleExportPDF = () => {
    const journalTitle =
      selectedJournal === 'ALL'
        ? 'Journal Général Complet'
        : `Journal des ${JOURNAL_TYPES.find((j) => j.code === selectedJournal)?.label || selectedJournal}`;
    exportJournalPDF(filteredEntries, companyConfig, journalTitle);
  };

  const totalFilteredDebit = filteredEntries.reduce(
    (sum, entry) => sum + entry.lines.reduce((s, l) => s + l.debit, 0),
    0
  );

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Journal Général des Écritures
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consultation, filtrage chronologique et gestion de toutes les pièces comptables.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Exporter Journal PDF</span>
          </button>

          <button
            onClick={onOpenNewEntry}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Saisir une Pièce</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-4">
        
        {/* Journal Code Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedJournal('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedJournal === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm font-semibold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Tous les Journaux ({entries.length})
          </button>
          {JOURNAL_TYPES.map((j) => {
            const count = entries.filter((e) => e.journalCode === j.code).length;
            const isSelected = selectedJournal === j.code;
            return (
              <button
                key={j.code}
                onClick={() => setSelectedJournal(j.code)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{j.code} - {j.label}</span>
                <span className="text-[10px] font-mono bg-slate-950/50 px-1.5 py-0.5 rounded text-slate-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par N° de pièce, libellé, client, fournisseur, ou N° de compte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

      </div>

      {/* Entries List / Table */}
      <div className="space-y-3">
        
        {filteredEntries.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-xs space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-300">Aucune écriture comptable trouvée</p>
            <p className="text-slate-500">Essayez de modifier votre filtre ou ajoutez une nouvelle pièce comptable.</p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isExpanded = expandedEntryId === entry.id;
            const entryTotalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
            const journalInfo = JOURNAL_TYPES.find((j) => j.code === entry.journalCode);

            return (
              <div
                key={entry.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700/80 transition-colors"
              >
                {/* Entry Header Row */}
                <div
                  onClick={() => toggleExpand(entry.id)}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none bg-slate-800/20 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${journalInfo?.color || 'bg-slate-800 text-slate-300'}`}>
                      {entry.journalCode}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">
                          {entry.pieceNumber}
                        </span>
                        {entry.reference && (
                          <span className="text-[11px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                            Réf: {entry.reference}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {entry.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-mono">
                        {new Date(entry.date).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        {formatCurrency(entryTotalDebit, companyConfig.currencySymbol)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => exportPiecePDF(entry, companyConfig)}
                        title="Imprimer Pièce Comptable PDF"
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditEntry(entry)}
                        title="Modifier l'Écriture"
                        className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        title="Supprimer"
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Lines Table */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/60 p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                          <tr>
                            <th className="p-2 w-28">N° Compte</th>
                            <th className="p-2">Intitulé du Compte</th>
                            <th className="p-2">Libellé Ligne / Note</th>
                            <th className="p-2 w-32">Tiers</th>
                            <th className="p-2 w-32 text-right">Débit</th>
                            <th className="p-2 w-32 text-right">Crédit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 font-mono">
                          {entry.lines.map((line, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="p-2 font-bold text-blue-400">
                                {line.accountCode}
                              </td>
                              <td className="p-2 font-sans font-medium text-slate-200">
                                {line.accountLabel}
                              </td>
                              <td className="p-2 font-sans text-slate-400 text-[11px]">
                                {line.memo || '-'}
                              </td>
                              <td className="p-2 font-sans text-slate-300">
                                {line.thirdPartyName || '-'}
                              </td>
                              <td className="p-2 text-right text-emerald-400 font-bold">
                                {line.debit > 0 ? formatCurrency(line.debit, '') : '-'}
                              </td>
                              <td className="p-2 text-right text-blue-400 font-bold">
                                {line.credit > 0 ? formatCurrency(line.credit, '') : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}

      </div>

      {/* Journal Total Summary */}
      <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 font-sans">
          Total Débit / Crédit du Filtre ({filteredEntries.length} écritures) :
        </span>
        <span className="font-bold text-emerald-400 text-sm">
          {formatCurrency(totalFilteredDebit, companyConfig.currencySymbol)}
        </span>
      </div>

    </div>
  );
};
