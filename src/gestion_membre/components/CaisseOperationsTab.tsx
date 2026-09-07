import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Printer, 
  Download, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Clock, 
  Building2,
  Trash2,
  Save,
  DollarSign
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { BASE_URL, requestRtdb } from '../services/firebaseService';

export interface CaisseMovement {
  id: string;
  date: string;
  type: 'ENCAISSEMENT' | 'DECAISSEMENT' | 'TRANSFERT' | 'OUVERTURE' | 'CLOTURE';
  accountCode: string; // e.g., '5711' (Caisse Principale)
  accountLabel: string;
  targetAccountCode?: string; // For transfers
  targetAccountLabel?: string;
  montant: number;
  motif: string;
  categorie: string;
  tiers?: string; // Bénéficiaire ou payeur
  pieceNumero?: string; // N° reçu, facture ou bon
  operator: string;
  status: 'CONFIRME' | 'BROUILLON' | 'ANNULE';
  notes?: string;
  createdAt: string;
}

interface Props {
  currentUser: string;
  currentUserRole: string;
  allMembers?: any[];
  allTransactions?: any[];
}

const CAISSE_ACCOUNTS = [
  { code: '5711', label: 'Caisse Principale Siège', default: true },
  { code: '5712', label: 'Caisse Menues Dépenses (Petty Cash)', default: false },
  { code: '5121', label: 'Compte Bancaire AMM (Liaison)', default: false },
  { code: '5171', label: 'Caisse Digitale / Mobile Money', default: false },
];

const CATEGORIES_ENCAISSEMENT = [
  'Cotisations & Adhésions Membres',
  'Dons & Subventions en Espèces',
  'Ventes de Produits / Artisanat',
  'Alimentation de Caisse (Retrait Banque)',
  'Remboursement d\'Avance',
  'Recettes Diverses'
];

const CATEGORIES_DECAISSEMENT = [
  'Achats Fournitures & Consommables',
  'Frais de Déplacement & Transport',
  'Frais de Mission & Restauration',
  'Aides d\'Urgence & Secours Solidaires',
  'Dépôt d\'Espèces en Banque',
  'Avance sur Salaire / Prime Journalière',
  'Entretien & Réparations Locaux',
  'Menues Dépenses de Fonctionnement'
];

export default function CaisseOperationsTab({ 
  currentUser, 
  currentUserRole,
  allMembers = [],
  allTransactions = []
}: Props) {
  const [operations, setOperations] = useState<CaisseMovement[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('5711');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for new cash operation
  const [formType, setFormType] = useState<'ENCAISSEMENT' | 'DECAISSEMENT' | 'TRANSFERT'>('ENCAISSEMENT');
  const [formAccount, setFormAccount] = useState<string>('5711');
  const [formTargetAccount, setFormTargetAccount] = useState<string>('5121');
  const [formMontant, setFormMontant] = useState<string>('');
  const [formMotif, setFormMotif] = useState<string>('');
  const [formCategorie, setFormCategorie] = useState<string>(CATEGORIES_ENCAISSEMENT[0]);
  const [formTiers, setFormTiers] = useState<string>('');
  const [formPiece, setFormPiece] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Load operations from Firebase
  const loadCaisseData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await requestRtdb('/caisse_operations.json');
      const data = await res.json();
      if (data) {
        const loadedOps: CaisseMovement[] = Object.entries(data).map(([id, val]: [string, any]) => ({
          ...val,
          id
        }));
        setOperations(loadedOps);
      } else {
        // If empty, look if there are cash transactions in general transactions to seed
        if (allTransactions && allTransactions.length > 0) {
          const mapped: CaisseMovement[] = allTransactions.slice(0, 15).map((t, idx) => ({
            id: `cpt_${idx}_${t.id || Date.now()}`,
            date: t.date ? t.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
            type: t.karazana === 'MIDITRA' ? 'ENCAISSEMENT' : 'DECAISSEMENT',
            accountCode: '5711',
            accountLabel: 'Caisse Principale Siège',
            montant: Number(t.vola || 0),
            motif: t.motif || 'Opération de caisse',
            categorie: t.karazana === 'MIDITRA' ? 'Cotisations & Adhésions Membres' : 'Menues Dépenses',
            tiers: t.memberName || t.matricule || 'Tiers AMM',
            pieceNumero: t.reference_transaction || `RC-${idx + 100}`,
            operator: t.operator || 'Caissier',
            status: 'CONFIRME',
            createdAt: t.date || new Date().toISOString()
          }));
          setOperations(mapped);
        } else {
          setOperations([]);
        }
      }
    } catch (e) {
      console.error('Error fetching caisse operations:', e);
    } finally {
      setIsLoading(false);
    }
  }, [allTransactions]);

  useEffect(() => {
    void loadCaisseData();
  }, [loadCaisseData]);

  // Handle operation type changes to update default category
  useEffect(() => {
    if (formType === 'ENCAISSEMENT') {
      setFormCategorie(CATEGORIES_ENCAISSEMENT[0]);
    } else if (formType === 'DECAISSEMENT') {
      setFormCategorie(CATEGORIES_DECAISSEMENT[0]);
    } else {
      setFormCategorie('Virement Interne de Trésorerie');
    }
  }, [formType]);

  // Compute Balances and Stats for the selected account
  const accountOperations = useMemo(() => {
    return operations
      .filter(op => {
        if (selectedAccount === 'ALL') return true;
        return op.accountCode === selectedAccount || (op.type === 'TRANSFERT' && op.targetAccountCode === selectedAccount);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [operations, selectedAccount]);

  // Add running balance to filtered list
  const operationsWithBalance = useMemo(() => {
    let running = 0;
    return accountOperations.map(op => {
      let change = 0;
      if (selectedAccount === 'ALL') {
        if (op.type === 'ENCAISSEMENT') change = op.montant;
        else if (op.type === 'DECAISSEMENT') change = -op.montant;
      } else {
        if (op.accountCode === selectedAccount) {
          if (op.type === 'ENCAISSEMENT' || op.type === 'OUVERTURE') change = op.montant;
          else if (op.type === 'DECAISSEMENT') change = -op.montant;
          else if (op.type === 'TRANSFERT') change = -op.montant; // Money left this account
        } else if (op.targetAccountCode === selectedAccount && op.type === 'TRANSFERT') {
          change = op.montant; // Money entered this account
        }
      }
      running += change;
      return { ...op, runningBalance: running, netImpact: change };
    });
  }, [accountOperations, selectedAccount]);

  // Stats
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    operationsWithBalance.forEach(op => {
      if (op.netImpact > 0) totalIn += op.netImpact;
      else if (op.netImpact < 0) totalOut += Math.abs(op.netImpact);
    });
    const currentSolde = totalIn - totalOut;
    return {
      currentSolde,
      totalIn,
      totalOut,
      count: operationsWithBalance.length
    };
  }, [operationsWithBalance]);

  // Filtered view table
  const displayedOperations = useMemo(() => {
    return [...operationsWithBalance]
      .reverse()
      .filter(op => {
        const matchesType = filterType === 'ALL' || op.type === filterType;
        const matchesDate = !dateFilter || op.date.startsWith(dateFilter);
        const query = searchQuery.toLowerCase();
        const matchesQuery = !query || 
          op.motif?.toLowerCase().includes(query) ||
          op.tiers?.toLowerCase().includes(query) ||
          op.pieceNumero?.toLowerCase().includes(query) ||
          op.categorie?.toLowerCase().includes(query);
        return matchesType && matchesDate && matchesQuery;
      });
  }, [operationsWithBalance, filterType, dateFilter, searchQuery]);

  // Create Cash Operation Handler
  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formMontant);
    if (!amount || amount <= 0) {
      setNotification({ type: 'error', text: 'Veuillez saisir un montant valide supérieur à 0.' });
      return;
    }

    if (!formMotif.trim()) {
      setNotification({ type: 'error', text: 'Veuillez renseigner le motif de l\'opération.' });
      return;
    }

    // Balance check for cash out
    if ((formType === 'DECAISSEMENT' || formType === 'TRANSFERT') && stats.currentSolde < amount) {
      if (!window.confirm(`Attention : Le solde en caisse (${stats.currentSolde.toLocaleString('fr-FR')} Ar) est inférieur au montant demandé (${amount.toLocaleString('fr-FR')} Ar). Confirmer tout de même le décaissement ?`)) {
        return;
      }
    }

    setIsProcessing(true);
    setNotification(null);

    const accountObj = CAISSE_ACCOUNTS.find(a => a.code === formAccount) || CAISSE_ACCOUNTS[0];
    const targetAccountObj = formType === 'TRANSFERT' ? (CAISSE_ACCOUNTS.find(a => a.code === formTargetAccount) || CAISSE_ACCOUNTS[1]) : undefined;

    const newOp: Omit<CaisseMovement, 'id'> = {
      date: formDate,
      type: formType,
      accountCode: formAccount,
      accountLabel: accountObj.label,
      targetAccountCode: targetAccountObj?.code,
      targetAccountLabel: targetAccountObj?.label,
      montant: amount,
      motif: formMotif.trim(),
      categorie: formCategorie,
      tiers: formTiers.trim() || 'Tiers Caisse',
      pieceNumero: formPiece.trim() || `CAISSE-${Date.now().toString().slice(-6)}`,
      operator: currentUser || 'Caissier',
      status: 'CONFIRME',
      createdAt: new Date().toISOString()
    };

    try {
      const res = await requestRtdb('/caisse_operations.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOp)
      });
      const savedData = await res.json();
      
      // Also sync to general transactions for accounting consistency
      try {
        await requestRtdb('/transactions.json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matricule: formAccount === '5711' ? 'CAISSE-SIEGE' : 'CAISSE-MENUES',
            memberName: newOp.tiers,
            karazana: formType === 'ENCAISSEMENT' ? 'MIDITRA' : 'MIVOAKA',
            vola: amount,
            motif: `[CAISSE ${formAccount}] ${formMotif.trim()}`,
            operator: currentUser || 'Caissier',
            reference_transaction: newOp.pieceNumero,
            date: new Date().toISOString(),
            createdBy: currentUser
          })
        });
      } catch (syncErr) {
        console.warn('Sync to transactions warning:', syncErr);
      }

      setNotification({ type: 'success', text: `Opération de ${formType.toLowerCase()} de ${amount.toLocaleString('fr-FR')} Ar validée avec succès !` });
      setShowModal(false);
      setFormMontant('');
      setFormMotif('');
      setFormTiers('');
      setFormPiece('');
      await loadCaisseData();
    } catch (err) {
      console.error('Error adding caisse operation:', err);
      setNotification({ type: 'error', text: 'Erreur lors de l\'enregistrement de l\'opération de caisse.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete Cash Operation Handler
  const handleDeleteOperation = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment annuler/supprimer cette opération de caisse ?')) return;
    try {
      await requestRtdb(`/caisse_operations/${id}.json`, { method: 'DELETE' });
      setNotification({ type: 'success', text: 'Opération supprimée du registre de caisse.' });
      await loadCaisseData();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  // Generate Official Reçu / Bon de Caisse PDF
  const handlePrintReceipt = (op: CaisseMovement) => {
    const doc = new jsPDF();
    const isIncome = op.type === 'ENCAISSEMENT';

    // Header
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 26, 'F');

    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text("ASSOCIATION MALAGASY MIRAY (SITE AMM)", 14, 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text("Direction des Opérations & Service de Caisse • Réf. Comptable : " + op.accountCode + " (" + op.accountLabel + ")", 14, 20);

    // Document Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isIncome ? 16 : 225, isIncome ? 149 : 29, isIncome ? 193 : 72);
    doc.text(isIncome ? "REÇU D'ENCAISSEMENT DE CAISSE" : "BON DE DÉCAISSEMENT DE CAISSE", 14, 40);

    // Document Meta
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° Pièce : ${op.pieceNumero || 'CAISSE-' + op.id.slice(0, 8)}`, 14, 48);
    doc.text(`Date d'opération : ${op.date}`, 100, 48);
    doc.text(`Statut : ${op.status}`, 160, 48);

    // Box Details
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 54, 182, 60, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Montant : ${op.montant.toLocaleString('fr-FR')} Ariary (MGA)`, 20, 64);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(`Nature de l'opération : ${op.type}`, 20, 72);
    doc.text(`Catégorie : ${op.categorie}`, 20, 80);
    doc.text(`Bénéficiaire / Déposant : ${op.tiers || 'Tiers'}`, 20, 88);
    doc.text(`Motif / Objet : ${op.motif}`, 20, 96);
    doc.text(`Opérateur / Caissier : ${op.operator}`, 20, 104);

    // Signatures
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text("Signature du Caissier :", 20, 130);
    doc.text("Émargement du Bénéficiaire / Déposant :", 115, 130);

    doc.setDrawColor(203, 213, 225);
    doc.line(20, 150, 85, 150);
    doc.line(115, 150, 185, 150);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text("Document comptable justificatif établi en double exemplaire conformément aux procédures AMM.", 14, 280);

    doc.save(`Recu_Caisse_${op.pieceNumero || op.id}.pdf`);
  };

  // Generate Grand Livre de Caisse PDF
  const handleExportJournalPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 26, 'F');

    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text("ASSOCIATION MALAGASY MIRAY - GRAND LIVRE DE CAISSE", 14, 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Compte : ${selectedAccount} • Édité le ${new Date().toLocaleDateString('fr-FR')} par ${currentUser || 'Admin'}`, 14, 20);

    const rows: any[] = displayedOperations.map(op => [
      op.date,
      op.pieceNumero || '—',
      op.motif,
      op.tiers || '—',
      op.type === 'ENCAISSEMENT' || (op.netImpact > 0) ? `${op.montant.toLocaleString('fr-FR')} Ar` : '',
      op.type === 'DECAISSEMENT' || (op.netImpact < 0) ? `${op.montant.toLocaleString('fr-FR')} Ar` : '',
      `${op.runningBalance.toLocaleString('fr-FR')} Ar`
    ]);

    ;(doc as any).autoTable({
      startY: 32,
      head: [['Date', 'N° Pièce', 'Motif / Libellé', 'Tiers', 'Entrée (Ar)', 'Sortie (Ar)', 'Solde (Ar)']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      columnStyles: {
        4: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'right', fontStyle: 'bold' }
      }
    });

    doc.save(`Journal_Caisse_${selectedAccount}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner & Account Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              Module Opérations & Trésorerie
            </span>
            <span className="text-xs text-slate-500">• Devise : MGA (Ariary)</span>
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-100 tracking-tight">
            Gestion de Caisse & Mouvements d'Espèces
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Account Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-transparent border-none text-white text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">Toutes les Caisses</option>
              {CAISSE_ACCOUNTS.map(acc => (
                <option key={acc.code} value={acc.code} className="bg-slate-900 text-white">
                  {acc.code} - {acc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export Journal Button */}
          <button
            type="button"
            onClick={handleExportJournalPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Grand Livre PDF
          </button>

          {/* New Operation Button */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Opération
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`p-3 rounded-2xl border text-xs flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-800 text-rose-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          <span className="font-semibold">{notification.text}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde Actuel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Solde Réel en Caisse</span>
            <span className={`h-2.5 w-2.5 rounded-full ${stats.currentSolde >= 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
          </div>
          <p className={`text-2xl font-extrabold ${stats.currentSolde >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {stats.currentSolde.toLocaleString('fr-FR')} Ar
          </p>
          <p className="text-[10px] text-slate-500">
            {selectedAccount === 'ALL' ? 'Toutes caisses consolidées' : CAISSE_ACCOUNTS.find(a => a.code === selectedAccount)?.label}
          </p>
        </div>

        {/* Total Encaissements */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Total Entrées (Encaissements)
          </span>
          <p className="text-2xl font-extrabold text-emerald-400">
            +{stats.totalIn.toLocaleString('fr-FR')} Ar
          </p>
          <p className="text-[10px] text-slate-500">Flux d'espèces entrants</p>
        </div>

        {/* Total Décaissements */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            Total Sorties (Décaissements)
          </span>
          <p className="text-2xl font-extrabold text-rose-400">
            -{stats.totalOut.toLocaleString('fr-FR')} Ar
          </p>
          <p className="text-[10px] text-slate-500">Flux d'espèces sortants</p>
        </div>

        {/* Total Opérations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Mouvements Enregistrés
          </span>
          <p className="text-2xl font-extrabold text-cyan-400">
            {stats.count}
          </p>
          <p className="text-[10px] text-slate-500">Transactions vérifiées et enregistrées</p>
        </div>
      </div>

      {/* Operations Ledger & Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Journal des Mouvements de Caisse ({displayedOperations.length})
            </h3>
            <p className="text-xs text-slate-400">Historique chronologique avec solde progressif et pièces justificatives</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrer par motif, tiers, n° pièce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">Tous les types</option>
              <option value="ENCAISSEMENT">Encaissements (+)</option>
              <option value="DECAISSEMENT">Décaissements (-)</option>
              <option value="TRANSFERT">Transferts</option>
            </select>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                ✕ Effacer date
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">N° Pièce</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Motif & Justification</th>
                <th className="py-2.5 px-3">Tiers</th>
                <th className="py-2.5 px-3 text-right text-emerald-400">Entrée (Ar)</th>
                <th className="py-2.5 px-3 text-right text-rose-400">Sortie (Ar)</th>
                <th className="py-2.5 px-3 text-right text-cyan-400">Solde (Ar)</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {displayedOperations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans text-xs">
                    Aucune opération de caisse trouvée pour ces critères.
                  </td>
                </tr>
              ) : (
                displayedOperations.map((op) => {
                  const isIncome = op.type === 'ENCAISSEMENT' || op.netImpact > 0;
                  const isExpense = op.type === 'DECAISSEMENT' || op.netImpact < 0;

                  return (
                    <tr key={op.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap font-sans text-[11px]">
                        {op.date}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-bold text-[10px]">
                        {op.pieceNumero || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          op.type === 'ENCAISSEMENT'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : op.type === 'DECAISSEMENT'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {op.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-200 font-medium">
                        <div>{op.motif}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{op.categorie}</div>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-300 text-[11px]">
                        {op.tiers || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        {isIncome ? `+${op.montant.toLocaleString('fr-FR')}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">
                        {isExpense ? `-${op.montant.toLocaleString('fr-FR')}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-cyan-300">
                        {op.runningBalance.toLocaleString('fr-FR')}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Receipt PDF */}
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(op)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition"
                            title="Télécharger le reçu de caisse"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete (Admin only) */}
                          {(currentUserRole === 'ADMIN' || currentUserRole === 'DIRECTEUR') && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOperation(op.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition"
                              title="Annuler / Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Modal: New Cash Operation Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-400" />
                Enregistrer un Mouvement de Caisse
              </h4>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOperation} className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFormType('ENCAISSEMENT')}
                  className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                    formType === 'ENCAISSEMENT' 
                      ? 'bg-emerald-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Encaissement
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('DECAISSEMENT')}
                  className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                    formType === 'DECAISSEMENT' 
                      ? 'bg-rose-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Décaissement
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('TRANSFERT')}
                  className={`py-2 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
                    formType === 'TRANSFERT' 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Transfert
                </button>
              </div>

              {/* Account & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Compte de Caisse Source *</label>
                  <select
                    value={formAccount}
                    onChange={(e) => setFormAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    {CAISSE_ACCOUNTS.map(a => (
                      <option key={a.code} value={a.code}>{a.code} - {a.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Date de l'opération *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Target account if transfer */}
              {formType === 'TRANSFERT' && (
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Compte Destinataire (Virement) *</label>
                  <select
                    value={formTargetAccount}
                    onChange={(e) => setFormTargetAccount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    {CAISSE_ACCOUNTS.filter(a => a.code !== formAccount).map(a => (
                      <option key={a.code} value={a.code}>{a.code} - {a.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Montant & Pièce */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Montant (Ariary - Ar) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="ex: 50000"
                    value={formMontant}
                    onChange={(e) => setFormMontant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-sm font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">N° Pièce / Reçu / Facture</label>
                  <input
                    type="text"
                    placeholder="ex: REÇU-2026-004"
                    value={formPiece}
                    onChange={(e) => setFormPiece(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Catégorie d'imputation */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Catégorie Comptable *</label>
                <select
                  value={formCategorie}
                  onChange={(e) => setFormCategorie(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {formType === 'ENCAISSEMENT' && CATEGORIES_ENCAISSEMENT.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {formType === 'DECAISSEMENT' && CATEGORIES_DECAISSEMENT.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {formType === 'TRANSFERT' && (
                    <option value="Virement Interne de Trésorerie">Virement Interne de Trésorerie</option>
                  )}
                </select>
              </div>

              {/* Tiers / Bénéficiaire */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">
                  {formType === 'ENCAISSEMENT' ? 'Déposant / Membre Payeur' : 'Bénéficiaire du Paiement'}
                </label>
                <input
                  type="text"
                  placeholder="Nom complet ou raison sociale..."
                  value={formTiers}
                  onChange={(e) => setFormTiers(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Motif */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Motif / Justificatif de l'opération *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Description détaillée de la dépense ou recette..."
                  value={formMotif}
                  onChange={(e) => setFormMotif(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`px-4 py-2 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 ${
                    formType === 'ENCAISSEMENT' 
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30' 
                      : formType === 'DECAISSEMENT'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  {isProcessing ? 'Enregistrement...' : `Confirmer l'${formType.toLowerCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
