import React, { useState } from 'react';
import {
  Library,
  Search,
  Download,
  ArrowRightLeft,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Account,
  JournalEntry,
  CompanyConfig,
} from '../types/accounting';
import { formatCurrency } from '../services/pdfGenerator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface LedgerViewProps {
  accounts: Account[];
  entries: JournalEntry[];
  companyConfig: CompanyConfig;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  accounts,
  entries,
  companyConfig,
}) => {
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>('5211');
  const [searchAccount, setSearchAccount] = useState<string>('');

  const selectedAccount = accounts.find((a) => a.code === selectedAccountCode);

  // Extract all lines for selected account across all entries
  const accountLines: {
    entryDate: string;
    pieceNumber: string;
    journalCode: string;
    label: string;
    memo?: string;
    thirdParty?: string;
    debit: number;
    credit: number;
  }[] = [];

  entries.forEach((entry) => {
    entry.lines.forEach((line) => {
      if (line.accountCode === selectedAccountCode) {
        accountLines.push({
          entryDate: entry.date,
          pieceNumber: entry.pieceNumber,
          journalCode: entry.journalCode,
          label: entry.label,
          memo: line.memo,
          thirdParty: line.thirdPartyName,
          debit: line.debit,
          credit: line.credit,
        });
      }
    });
  });

  // Sort chronologically
  accountLines.sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );

  let runningBalance = 0;
  let totalDebit = 0;
  let totalCredit = 0;

  accountLines.forEach((l) => {
    totalDebit += l.debit;
    totalCredit += l.credit;
  });

  const finalBalance = totalDebit - totalCredit;

  const handleExportPDF = () => {
    if (!selectedAccount) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(companyConfig.name.toUpperCase(), 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text(`GRAND LIVRE DES COMPTES — COMPTE ${selectedAccount.code}`, pageWidth - 14, 15, { align: 'right' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Intitulé: ${selectedAccount.label} | Exercice: ${companyConfig.fiscalYear}`, 14, 22);

    doc.line(14, 26, pageWidth - 14, 26);

    let bal = 0;
    const tableData = accountLines.map((l) => {
      bal += l.debit - l.credit;
      return [
        new Date(l.entryDate).toLocaleDateString('fr-FR'),
        l.pieceNumber,
        l.journalCode,
        l.memo || l.label,
        l.thirdParty || '-',
        l.debit > 0 ? formatCurrency(l.debit, '') : '-',
        l.credit > 0 ? formatCurrency(l.credit, '') : '-',
        formatCurrency(bal, ''),
      ];
    });

    tableData.push([
      'TOTAL',
      '',
      '',
      'TOTAUX & SOLDE FINAL',
      '',
      formatCurrency(totalDebit, companyConfig.currencySymbol),
      formatCurrency(totalCredit, companyConfig.currencySymbol),
      formatCurrency(finalBalance, companyConfig.currencySymbol),
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Date', 'N° Pièce', 'Jnl', 'Libellé de l\'opération', 'Tiers', 'Débit', 'Crédit', 'Solde Progressif']],
      body: tableData,
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      theme: 'grid',
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 25, fontStyle: 'bold' },
        2: { cellWidth: 12 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 25 },
        5: { halign: 'right', cellWidth: 25 },
        6: { halign: 'right', cellWidth: 25 },
        7: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
      },
    });

    doc.save(`GrandLivre_Compte_${selectedAccountCode}.pdf`);
  };

  const filteredAccountsList = accounts.filter(
    (a) =>
      a.code.includes(searchAccount) ||
      a.label.toLowerCase().includes(searchAccount.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Library className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Grand Livre des Comptes
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Relevé chronologique détaillé des mouvements Débit / Crédit par compte.
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 text-blue-400" />
          <span>Exporter ce Compte en PDF</span>
        </button>
      </div>

      {/* Account Selector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Accounts Navigation list */}
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Sélectionner un Compte
          </span>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Chercher N° ou nom..."
              value={searchAccount}
              onChange={(e) => setSearchAccount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1">
            {filteredAccountsList.map((acc) => {
              const isSelected = acc.code === selectedAccountCode;
              return (
                <button
                  key={acc.code}
                  onClick={() => setSelectedAccountCode(acc.code)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="font-mono">{acc.code}</span>
                  <span className="truncate ml-2 text-[11px] opacity-90">{acc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Account Transactions Detail Table */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Account Title Banner */}
          {selectedAccount && (
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold bg-blue-950 text-blue-300 px-2.5 py-1 rounded border border-blue-800">
                  Compte Classe {selectedAccount.classCode}
                </span>
                <h3 className="text-lg font-bold text-white mt-2">
                  {selectedAccount.code} — {selectedAccount.label}
                </h3>
                <p className="text-xs text-slate-400">
                  Catégorie : {selectedAccount.category} | Solde Habituel : {selectedAccount.normalBalance}
                </p>
              </div>

              {/* Total Balance Badge */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right">
                <span className="text-xs text-slate-400 block font-medium">Solde Actuel</span>
                <span
                  className={`text-xl font-bold font-mono ${
                    finalBalance >= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {formatCurrency(finalBalance, companyConfig.currencySymbol)}
                </span>
                <span className="text-[10px] text-slate-500 block uppercase font-mono mt-0.5">
                  {finalBalance >= 0 ? 'Solde Débiteur' : 'Solde Créditeur'}
                </span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-700/60">
                  <tr>
                    <th className="p-3 w-24">Date</th>
                    <th className="p-3 w-28">N° Pièce</th>
                    <th className="p-3 w-12">Jnl</th>
                    <th className="p-3">Libellé de l'opération</th>
                    <th className="p-3 w-28">Tiers</th>
                    <th className="p-3 w-32 text-right">Débit ({companyConfig.currencySymbol})</th>
                    <th className="p-3 w-32 text-right">Crédit ({companyConfig.currencySymbol})</th>
                    <th className="p-3 w-36 text-right">Solde Progressif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {accountLines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                        Aucun mouvement comptable enregistré sur ce compte pour cet exercice.
                      </td>
                    </tr>
                  ) : (
                    accountLines.map((line, idx) => {
                      runningBalance += line.debit - line.credit;
                      return (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-3 text-slate-400">
                            {new Date(line.entryDate).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="p-3 font-bold text-white">
                            {line.pieceNumber}
                          </td>
                          <td className="p-3 font-sans text-slate-400 font-bold">
                            {line.journalCode}
                          </td>
                          <td className="p-3 font-sans text-slate-200">
                            {line.memo || line.label}
                          </td>
                          <td className="p-3 font-sans text-slate-300">
                            {line.thirdParty || '-'}
                          </td>
                          <td className="p-3 text-right text-emerald-400 font-bold">
                            {line.debit > 0 ? formatCurrency(line.debit, '') : '-'}
                          </td>
                          <td className="p-3 text-right text-blue-400 font-bold">
                            {line.credit > 0 ? formatCurrency(line.credit, '') : '-'}
                          </td>
                          <td className="p-3 text-right text-white font-bold">
                            {formatCurrency(runningBalance, '')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Totals */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
              <span className="font-sans font-bold text-slate-300 uppercase">
                Cumul des Mouvements :
              </span>
              <div className="flex items-center space-x-6 font-bold">
                <div>
                  <span className="text-slate-400 font-sans mr-2">Débit:</span>
                  <span className="text-emerald-400">{formatCurrency(totalDebit, companyConfig.currencySymbol)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans mr-2">Crédit:</span>
                  <span className="text-blue-400">{formatCurrency(totalCredit, companyConfig.currencySymbol)}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
