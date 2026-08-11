import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem, StockMovement, FinancialTransaction, AssociationProfile, CurrencyCode } from '../types';
import { FORMAT_CURRENCY, FORMAT_DATE, GET_STOCK_STATUS } from './formatters';

interface GenerateReportOptions {
  profile: AssociationProfile;
  currency: CurrencyCode;
}

export const GENERATE_INVENTORY_REPORT = (
  items: InventoryItem[],
  options: GenerateReportOptions
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const { profile, currency } = options;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Navy slate
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name, 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.subtitle} | Date d'édition: ${FORMAT_DATE(new Date().toISOString(), true)}`, 14, 18);

  // Document Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("RAPPORT D'INVENTAIRE GÉNÉRAL & VALORISATION DES ACTIFS", 14, 33);

  // Calculate metrics
  const totalItems = items.length;
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalValue = items.reduce((acc, item) => acc + item.totalValue, 0);
  const lowStockCount = items.filter(i => i.quantity <= i.minThreshold).length;

  // Summary Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 37, 269, 16, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre de Références: `, 20, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalItems}`, 58, 46);

  doc.setFont('helvetica', 'normal');
  doc.text(`Quantité Totale en Stock: `, 85, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalQuantity} unités`, 128, 46);

  doc.setFont('helvetica', 'normal');
  doc.text(`Alerte Stock Bas / Rupture: `, 165, 46);
  doc.setFont('helvetica', 'bold');
  doc.text(`${lowStockCount} article(s)`, 212, 46);

  doc.setFont('helvetica', 'normal');
  doc.text(`Valeur Totale: `, 235, 46);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`${FORMAT_CURRENCY(totalValue, currency)}`, 256, 46);

  // Table Data
  const tableRows = items.map((item, index) => {
    const status = GET_STOCK_STATUS(item.quantity, item.minThreshold);
    const statusLabel = status === 'OUT_OF_STOCK' ? 'RUPTURE' : status === 'LOW' ? 'STOCK BAS' : 'OK';
    
    return [
      index + 1,
      item.code,
      item.name,
      item.category,
      item.quantity,
      item.minThreshold,
      FORMAT_CURRENCY(item.unitPrice, currency),
      FORMAT_CURRENCY(item.totalValue, currency),
      item.location,
      item.condition,
      statusLabel
    ];
  });

  autoTable(doc, {
    startY: 57,
    head: [['#', 'Code SKU', 'Désignation Article', 'Catégorie', 'Qté', 'Seuil', 'P.U.', 'Valeur Totale', 'Emplacement', 'État', 'Statut']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { cellWidth: 55 },
      3: { cellWidth: 35 },
      4: { halign: 'center', cellWidth: 12 },
      5: { halign: 'center', cellWidth: 12 },
      6: { halign: 'right', cellWidth: 25 },
      7: { halign: 'right', cellWidth: 30 },
      8: { cellWidth: 35 },
      9: { cellWidth: 20 },
      10: { halign: 'center', cellWidth: 18 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 10) {
        if (data.cell.raw === 'RUPTURE') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'STOCK BAS') {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // Footer Signatures
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 180;
  const signatureY = Math.min(finalY + 15, 170);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');

  doc.text('Le Responsable Logistique', 25, signatureY);
  doc.text('Le Trésorier Général', 125, signatureY);
  doc.text('Le Directeur Général', 225, signatureY);

  doc.setFont('helvetica', 'normal');
  doc.text('_______________________', 25, signatureY + 12);
  doc.text('_______________________', 125, signatureY + 12);
  doc.text('_______________________', 225, signatureY + 12);

  doc.save(`SITE-AMM_Inventaire_${new Date().toISOString().slice(0,10)}.pdf`);
};

export const GENERATE_MOVEMENTS_REPORT = (
  movements: StockMovement[],
  options: GenerateReportOptions
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const { profile, currency } = options;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name, 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`AUDIT DES MOUVEMENTS DE STOCK | Date d'édition: ${FORMAT_DATE(new Date().toISOString(), true)}`, 14, 18);

  // Table Data
  const tableRows = movements.map((m, index) => [
    index + 1,
    FORMAT_DATE(m.timestamp, true),
    m.type === 'IN' ? 'ENTRÉE (+)' : m.type === 'OUT' ? 'SORTIE (-)' : m.type === 'TRANSFER' ? 'TRANSFERT' : 'AJUSTEMENT',
    m.itemCode,
    m.itemName,
    m.quantity,
    FORMAT_CURRENCY(m.unitPrice, currency),
    FORMAT_CURRENCY(m.totalPrice, currency),
    m.reason,
    m.referenceDoc || '-',
    m.handlerName
  ]);

  autoTable(doc, {
    startY: 32,
    head: [['#', 'Date & Heure', 'Type', 'Code', 'Désignation', 'Qté', 'P.U.', 'Total', 'Motif / Inscription', 'N° Doc', 'Responsable']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { cellWidth: 32 },
      2: { halign: 'center', cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 50 },
      5: { halign: 'center', cellWidth: 12 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 25 },
      8: { cellWidth: 35 },
      9: { cellWidth: 20 },
      10: { cellWidth: 28 }
    }
  });

  doc.save(`SITE-AMM_Journal_Mouvements_${new Date().toISOString().slice(0,10)}.pdf`);
};

export const GENERATE_FINANCIAL_REPORT = (
  transactions: FinancialTransaction[],
  options: GenerateReportOptions
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { profile, currency } = options;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name, 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`GRAND LIVRE DES FINANCES & BILAN COMPTABLE | Édité le ${FORMAT_DATE(new Date().toISOString(), true)}`, 14, 18);

  const totalIncome = transactions.filter(t => t.type === 'INCOME' && t.status === 'PAYE').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAYE').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Financial Summary Cards
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 30, 182, 18, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.text(`Recettes Validées: ${FORMAT_CURRENCY(totalIncome, currency)}`, 18, 41);

  doc.setTextColor(225, 29, 72);
  doc.text(`Dépenses Effectuées: ${FORMAT_CURRENCY(totalExpense, currency)}`, 80, 41);

  doc.setTextColor(netBalance >= 0 ? 16 : 225, netBalance >= 0 ? 185 : 29, netBalance >= 0 ? 129 : 72);
  doc.text(`Solde Net Bilan: ${FORMAT_CURRENCY(netBalance, currency)}`, 142, 41);

  // Table
  const tableRows = transactions.map((t, index) => [
    index + 1,
    FORMAT_DATE(t.date),
    t.type === 'INCOME' ? 'RECETTE (+)' : 'DÉPENSE (-)',
    t.category,
    t.title,
    t.paymentMethod,
    FORMAT_CURRENCY(t.amount, currency),
    t.status
  ]);

  autoTable(doc, {
    startY: 53,
    head: [['#', 'Date', 'Type', 'Catégorie', 'Libellé de la Transaction', 'Paiement', 'Montant', 'Statut']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { halign: 'center', cellWidth: 22 },
      3: { cellWidth: 35 },
      4: { cellWidth: 42 },
      5: { cellWidth: 25 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'center', cellWidth: 10 }
    }
  });

  doc.save(`SITE-AMM_Bilan_Financier_${new Date().toISOString().slice(0,10)}.pdf`);
};

export const GENERATE_REORDER_PURCHASE_ORDER = (
  items: InventoryItem[],
  options: GenerateReportOptions
) => {
  const lowItems = items.filter(i => i.quantity <= i.minThreshold);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { profile, currency } = options;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(profile.name, 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`DEMANDE DE REAPPROVISIONNEMENT & BON DE COMMANDE | ${FORMAT_DATE(new Date().toISOString(), true)}`, 14, 18);

  let totalReorderCost = 0;

  const tableRows = lowItems.map((item, idx) => {
    const recommendedQty = Math.max((item.minThreshold * 2) - item.quantity, item.minThreshold + 1);
    const estimatedCost = recommendedQty * item.unitPrice;
    totalReorderCost += estimatedCost;

    return [
      idx + 1,
      item.code,
      item.name,
      item.quantity,
      item.minThreshold,
      recommendedQty,
      FORMAT_CURRENCY(item.unitPrice, currency),
      FORMAT_CURRENCY(estimatedCost, currency),
      item.supplierName
    ];
  });

  // Reorder summary
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`Articles Nécessitant Réapprovisionnement Urgent (${lowItems.length})`, 14, 33);

  autoTable(doc, {
    startY: 38,
    head: [['#', 'SKU', 'Désignation Article', 'Stock Actuel', 'Seuil Min', 'Qté Suggérée', 'P.U.', 'Coût Est.', 'Fournisseur']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [217, 119, 6], // Amber
      textColor: [255, 255, 255],
      fontSize: 8,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 22 },
      2: { cellWidth: 42 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'center', cellWidth: 15 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 22 },
      8: { cellWidth: 28 }
    }
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 150;

  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(14, finalY + 8, 182, 14, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.text(`BUDGET TOTAL ESTIMÉ POUR RÉAPPROVISIONNEMENT: ${FORMAT_CURRENCY(totalReorderCost, currency)}`, 20, finalY + 17);

  doc.save(`SITE-AMM_Demande_Reapprovisionnement_${new Date().toISOString().slice(0,10)}.pdf`);
};
