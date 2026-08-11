import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JournalEntry, CompanyConfig, TrialBalanceRow, FixedAsset, Account } from '../types/accounting';

export function formatCurrency(amount: number, symbol: string = 'FCFA'): string {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + symbol;
}

function addHeader(doc: jsPDF, companyConfig: CompanyConfig, documentTitle: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(companyConfig.name.toUpperCase(), 14, 15);

  // Subtitle / Legal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`${companyConfig.legalForm} - NIF: ${companyConfig.taxId} | RCCM: ${companyConfig.rccm}`, 14, 21);
  doc.text(`${companyConfig.address} | Tél: ${companyConfig.phone} | ${companyConfig.email}`, 14, 26);

  // Document Title Badge Right Align
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text(documentTitle.toUpperCase(), pageWidth - 14, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Exercice: ${companyConfig.fiscalYear} | Date d'impression: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 14, 25, { align: 'right' });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 30, pageWidth - 14, 30);
}

function addFooter(doc: jsPDF, companyConfig: CompanyConfig) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    
    doc.text(`SITE-AMM COMPTABILITÉ © ${new Date().getFullYear()} - Document Financier Officiel`, 14, pageHeight - 7);
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
}

// 1. Export Single Voucher / Pièce Comptable PDF
export function exportPiecePDF(entry: JournalEntry, companyConfig: CompanyConfig) {
  const doc = new jsPDF();
  addHeader(doc, companyConfig, `PIÈCE COMPTABLE ${entry.pieceNumber}`);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Date : ${new Date(entry.date).toLocaleDateString('fr-FR')}`, 14, 38);
  doc.text(`Journal : ${entry.journalCode}`, 80, 38);
  doc.text(`Réf : ${entry.reference || 'N/A'}`, 140, 38);

  doc.setFont('helvetica', 'normal');
  doc.text(`Libellé : ${entry.label}`, 14, 45);

  const tableData = entry.lines.map((line) => [
    line.accountCode,
    line.accountLabel,
    line.memo || '-',
    line.thirdPartyName || '-',
    line.debit > 0 ? formatCurrency(line.debit, companyConfig.currencySymbol) : '-',
    line.credit > 0 ? formatCurrency(line.credit, companyConfig.currencySymbol) : '-',
  ]);

  const totalDebit = entry.lines.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = entry.lines.reduce((sum, l) => sum + l.credit, 0);

  tableData.push([
    'TOTAL',
    '',
    '',
    '',
    formatCurrency(totalDebit, companyConfig.currencySymbol),
    formatCurrency(totalCredit, companyConfig.currencySymbol),
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['Compte', 'Intitulé du Compte', 'Désignation / Note', 'Tiers', 'Débit', 'Crédit']],
    body: tableData,
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 },
    },
    theme: 'grid',
    styles: { fontSize: 8 },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 100;

  // Signatures section
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Le Comptable', 30, finalY + 20);
  doc.text('Le Chef Financier / DAF', 130, finalY + 20);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Visa & Signature :', 30, finalY + 26);
  doc.text('Visa & Signature :', 130, finalY + 26);

  addFooter(doc, companyConfig);
  doc.save(`Piece_Comptable_${entry.pieceNumber}.pdf`);
}

// 2. Export General Journal PDF
export function exportJournalPDF(entries: JournalEntry[], companyConfig: CompanyConfig, filterTitle: string = 'Journal Général') {
  const doc = new jsPDF('landscape');
  addHeader(doc, companyConfig, filterTitle);

  const tableData: any[] = [];
  let grandTotalDebit = 0;
  let grandTotalCredit = 0;

  entries.forEach((entry) => {
    entry.lines.forEach((line, idx) => {
      grandTotalDebit += line.debit;
      grandTotalCredit += line.credit;
      tableData.push([
        idx === 0 ? new Date(entry.date).toLocaleDateString('fr-FR') : '',
        idx === 0 ? entry.pieceNumber : '',
        idx === 0 ? entry.journalCode : '',
        line.accountCode,
        line.accountLabel,
        line.memo || entry.label,
        line.debit > 0 ? formatCurrency(line.debit, companyConfig.currencySymbol) : '-',
        line.credit > 0 ? formatCurrency(line.credit, companyConfig.currencySymbol) : '-',
      ]);
    });
  });

  autoTable(doc, {
    startY: 34,
    head: [['Date', 'N° Pièce', 'Jnl', 'Compte', 'Intitulé Compte', 'Libellé de l\'écriture', 'Débit', 'Crédit']],
    body: tableData,
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 25, fontStyle: 'bold' },
      2: { cellWidth: 12 },
      3: { cellWidth: 22, fontStyle: 'bold' },
      4: { cellWidth: 60 },
      5: { cellWidth: 'auto' },
      6: { halign: 'right', cellWidth: 32 },
      7: { halign: 'right', cellWidth: 32 },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`TOTAL GÉNÉRAL DÉBIT: ${formatCurrency(grandTotalDebit, companyConfig.currencySymbol)}  |  TOTAL GÉNÉRAL CRÉDIT: ${formatCurrency(grandTotalCredit, companyConfig.currencySymbol)}`, 14, finalY + 10);

  addFooter(doc, companyConfig);
  doc.save(`Journal_Comptable_${companyConfig.fiscalYear}.pdf`);
}

// 3. Export Trial Balance PDF (Balance 6 colonnes)
export function exportTrialBalancePDF(rows: TrialBalanceRow[], companyConfig: CompanyConfig) {
  const doc = new jsPDF('landscape');
  addHeader(doc, companyConfig, 'BALANCE GÉNÉRALE DES COMPTES');

  let totalPeriodDebit = 0;
  let totalPeriodCredit = 0;
  let totalEndingDebit = 0;
  let totalEndingCredit = 0;

  const tableData = rows.map((r) => {
    totalPeriodDebit += r.periodDebit;
    totalPeriodCredit += r.periodCredit;
    totalEndingDebit += r.endingDebit;
    totalEndingCredit += r.endingCredit;

    return [
      r.accountCode,
      r.accountLabel,
      r.periodDebit > 0 ? formatCurrency(r.periodDebit, '') : '-',
      r.periodCredit > 0 ? formatCurrency(r.periodCredit, '') : '-',
      r.endingDebit > 0 ? formatCurrency(r.endingDebit, '') : '-',
      r.endingCredit > 0 ? formatCurrency(r.endingCredit, '') : '-',
    ];
  });

  tableData.push([
    'TOTAL',
    'TOTAUX GÉNÉRAUX',
    formatCurrency(totalPeriodDebit, companyConfig.currencySymbol),
    formatCurrency(totalPeriodCredit, companyConfig.currencySymbol),
    formatCurrency(totalEndingDebit, companyConfig.currencySymbol),
    formatCurrency(totalEndingCredit, companyConfig.currencySymbol),
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['Compte', 'Intitulé du Compte', 'Mouvements Débit', 'Mouvements Crédit', 'Solde Fin Débit', 'Solde Fin Crédit']],
    body: tableData,
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: 'bold' },
      1: { cellWidth: 80 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 40 },
      4: { halign: 'right', cellWidth: 40 },
      5: { halign: 'right', cellWidth: 40 },
    },
  });

  addFooter(doc, companyConfig);
  doc.save(`Balance_Generale_${companyConfig.fiscalYear}.pdf`);
}

// 4. Export Bilan & Compte de Résultat PDF
export function exportFinancialStatementsPDF(
  actifLines: { code: string; label: string; amount: number }[],
  passifLines: { code: string; label: string; amount: number }[],
  produitLines: { code: string; label: string; amount: number }[],
  chargeLines: { code: string; label: string; amount: number }[],
  companyConfig: CompanyConfig
) {
  const doc = new jsPDF();
  addHeader(doc, companyConfig, 'ÉTATS FINANCIERS COMPTABLES');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('I. BILAN COMPTABLE SYNTHÉTIQUE', 14, 38);

  const totalActif = actifLines.reduce((s, l) => s + l.amount, 0);
  const totalPassif = passifLines.reduce((s, l) => s + l.amount, 0);

  const bilanTableData: any[] = [];
  const maxRows = Math.max(actifLines.length, passifLines.length);

  for (let i = 0; i < maxRows; i++) {
    const act = actifLines[i];
    const pas = passifLines[i];
    bilanTableData.push([
      act ? `${act.code} - ${act.label}` : '',
      act ? formatCurrency(act.amount, '') : '',
      pas ? `${pas.code} - ${pas.label}` : '',
      pas ? formatCurrency(pas.amount, '') : '',
    ]);
  }

  bilanTableData.push([
    'TOTAL ACTIF',
    formatCurrency(totalActif, companyConfig.currencySymbol),
    'TOTAL PASSIF',
    formatCurrency(totalPassif, companyConfig.currencySymbol),
  ]);

  autoTable(doc, {
    startY: 42,
    head: [['ACTIF (Emplois)', 'Montant', 'PASSIF (Ressources)', 'Montant']],
    body: bilanTableData,
    headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { halign: 'right', cellWidth: 30 },
      2: { cellWidth: 65 },
      3: { halign: 'right', cellWidth: 30 },
    },
  });

  const finalBilanY = (doc as any).lastAutoTable.finalY || 120;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('II. COMPTE DE RÉSULTAT DE L\'EXERCICE', 14, finalBilanY + 12);

  const totalProduits = produitLines.reduce((s, l) => s + l.amount, 0);
  const totalCharges = chargeLines.reduce((s, l) => s + l.amount, 0);
  const netResult = totalProduits - totalCharges;

  const crTableData: any[] = [];
  const maxCR = Math.max(produitLines.length, chargeLines.length);

  for (let i = 0; i < maxCR; i++) {
    const prd = produitLines[i];
    const chg = chargeLines[i];
    crTableData.push([
      prd ? `${prd.code} - ${prd.label}` : '',
      prd ? formatCurrency(prd.amount, '') : '',
      chg ? `${chg.code} - ${chg.label}` : '',
      chg ? formatCurrency(chg.amount, '') : '',
    ]);
  }

  crTableData.push([
    'TOTAL PRODUITS',
    formatCurrency(totalProduits, companyConfig.currencySymbol),
    'TOTAL CHARGES',
    formatCurrency(totalCharges, companyConfig.currencySymbol),
  ]);

  crTableData.push([
    'RÉSULTAT NET (Bénéfice/Perte)',
    formatCurrency(netResult, companyConfig.currencySymbol),
    '',
    '',
  ]);

  autoTable(doc, {
    startY: finalBilanY + 16,
    head: [['PRODUITS', 'Montant', 'CHARGES', 'Montant']],
    body: crTableData,
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
    theme: 'grid',
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { halign: 'right', cellWidth: 30 },
      2: { cellWidth: 65 },
      3: { halign: 'right', cellWidth: 30 },
    },
  });

  addFooter(doc, companyConfig);
  doc.save(`Etats_Financiers_${companyConfig.fiscalYear}.pdf`);
}
