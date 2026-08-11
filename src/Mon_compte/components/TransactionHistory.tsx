/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { translations } from '../i18n';
import { Language, OperationRequest, ComptabiliteRecord } from '../types';
import { dbService } from '../dbService';
import { toPng } from 'html-to-image';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { Capacitor } from '@capacitor/core';
import { 
  Search, CheckCircle2, XCircle, AlertCircle, Clock, 
  Download, Calendar, Tag, Smartphone, Hash, Info, RefreshCw, Cpu
} from 'lucide-react';

interface TransactionHistoryProps {
  operations: OperationRequest[];
  ledger: ComptabiliteRecord[];
  lang: Language;
  onRefresh: () => void;
  currentMatricule: string;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  operations,
  ledger,
  lang,
  onRefresh,
  currentMatricule,
}) => {
  const t = translations[lang];
  const allData = [
    ...operations,
    ...ledger.map((item) => ({
      id: item.customId || "unknown", // Map customId to id
      type: item.karazana === 'MIDITRA' ? 'depot' : 'retrait',           // Map karazana to type
      montant: item.vola,            // Map vola to montant
      createdAt: item.date,          // Map date to createdAt
      matricule: item.matricule,
      memberName: item.memberName,
      motif: item.motif,
      // Ampio ireo field hafa raha ilaina, na asio null raha tsy misy
      statut: 'completed',           // Ny ao amin'ny comptabilite dia efa vita
      operator: item.operator,
      reference_transaction: item.reference_transaction,
      destinataire: null,
      numero_telephone: item.numero_telephone
    }))
  ];

  // Filters & State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL'); // ALL, depot, retrait, transfert
  const [selectedOp, setSelectedOp] = useState<OperationRequest | null>(null);
  const [simloading, setSimLoading] = useState<string | null>(null);

  // Status badges builders
  const getStatusBadge = (status: OperationRequest['statut']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-green/10 text-brand-green border border-brand-green/20">
            <CheckCircle2 size={12} />
            <span>{lang === 'mg' ? 'Mankato' : 'Validé'}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-muted/15 text-brand-muted border border-brand-border">
            <XCircle size={12} />
            <span>Annulé</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-red/10 text-brand-red border border-brand-red/20">
            <XCircle size={12} />
            <span>Refusé</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold/10 text-brand-gold border border-brand-gold/30 animate-pulse">
            <Clock size={12} />
            <span>En attente</span>
          </span>
        );
    }
  };

  // Manala ireo item null na undefined raha misy
  const cleanData = allData.filter(item => item && item.type);

  // Filter Operations List
  const filteredOps = cleanData.filter((op) => {
    // 1. Type Filter (Safe check)
    if (typeFilter !== 'ALL' && op.type !== typeFilter) return false;

    // 2. Text Search
    if (search.trim()) {
      const q = search.toLowerCase();
      
      // Mampiasa (field || '') mba hanova ny null/undefined ho string banga
      const refMatch = (op.reference_transaction || '').toLowerCase().includes(q);
      const motifMatch = (op.motif || '').toLowerCase().includes(q);
      const opMatch = (op.operator || '').toLowerCase().includes(q);
      const idMatch = (op.id || '').toString().toLowerCase().includes(q); // .toString() raha ohatra ka isa ny id
      const descMatch = (op.destinataire || '').toLowerCase().includes(q);
      
      return refMatch || motifMatch || opMatch || idMatch || descMatch;
    }

    return true;
  });

  // Import-o ao anaty function foana (Dynamic import)
  const exportToDevice = async (dataUrl: string, fileName: string, type: 'csv' | 'image') => {
    if (!Capacitor.isNativePlatform()) {
      // Raha Web/PC, manao ilay download mahazatra
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = fileName;
      link.click();
      return;
    }

    try {
      // 1. Manala ny lohany (data:image/png;base64,...)
      const base64Data = dataUrl.split(',')[1];

      // 2. Mitahiry ny rakitra ao amin'ny Documents directory (Android)
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
      });

      // 3. Raha sary, tehirizo ao amin'ny Gallery ihany koa
      if (type === 'image') {
        await Media.savePhoto({ path: result.uri });
      }

      alert(`Voatahiry tao amin'ny Documents: ${fileName}`);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Tsy afaka nitahiry ny rakitra.");
    }
  };

  // --- Fampiharana amin'ny CSV ---
  const exportToCSV = () => {
    const headers = ['ID Op', 'Type', 'Membre', 'Montant', 'Frais', 'Opérateur', 'Numéro', 'Réf', 'Motif', 'Dest', 'Statut', 'Date'];
    const rows = filteredOps.map(op => [op.id, op.type.toUpperCase(), op.memberName, op.montant, op.frais || 0, op.operator, op.numero_telephone, op.reference_transaction, op.motif, op.destinataire, op.statut, new Date(op.createdAt).toLocaleString()]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    exportToDevice(csvContent, `AMM_EXPORT_${Date.now()}.csv`, 'csv');
  };

  // --- Fampiharana amin'ny Image ---
  const downloadReceiptAsImage = () => {
    const node = document.getElementById('receipt_panel_card');
    if (node) {
      toPng(node).then((dataUrl) => {
        exportToDevice(dataUrl, `Recu_${selectedOp?.id || 'AMM'}.png`, 'image');
      });
    }
  };

  // Administration simulator bypass (Sandbox validation)
  const handleSimulateApproval = async (opId: string, decision: 'approve' | 'reject') => {
    setSimLoading(opId);
    try {
      await dbService.simulateAdminAction(opId, decision);
      onRefresh();
      // If the selected operation was the active detail, update it
      if (selectedOp && selectedOp.id === opId) {
        const freshOps = await dbService.fetchOperations(selectedOp.matricule);
        const match = freshOps.find(o => o.id === opId);
        if (match) setSelectedOp(match);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(null);
    }
  };

  const handleCancelTransfer = async (opId: string) => {
    if (window.confirm("Voulez-vous annuler ce virement programmé ?")) {
      try {
        await dbService.cancelOperation(opId);
        onRefresh();
        if (selectedOp && selectedOp.id === opId) {
          setSelectedOp(null);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-6">

      {/* Filter and Search Action Station */}
      <div className="bg-brand-card border border-brand-border p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-brand-muted" size={18} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-2 px-10 text-xs text-brand-text placeholder:text-brand-muted/70 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30"
          />
        </div>

        {/* Type selection pill group */}
        <div className="flex gap-1 overflow-x-auto w-full md:w-auto p-1 bg-brand-bg/80 border border-brand-border/60 rounded-xl no-scrollbar">
          {['ALL', 'depot', 'retrait', 'transfert'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTypeFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize shrink-0 ${
                typeFilter === f
                  ? 'bg-brand-accent text-brand-bg font-bold'
                  : 'text-brand-text-sub hover:text-brand-text hover:bg-brand-card'
              }`}
            >
              {f === 'ALL' ? t.allOps : f === 'depot' ? 'Dépôt' : f === 'retrait' ? 'Retrait' : 'Transfert'}
            </button>
          ))}
        </div>

        {/* Export and Sync Station */}
        <div className="flex gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={exportToCSV}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-border/60 border border-brand-border hover:bg-brand-border text-brand-text text-xs font-semibold rounded-xl transition"
          >
            <Download size={14} />
            <span>Excel / CSV</span>
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 bg-brand-border/40 hover:bg-brand-border text-brand-accent border border-brand-border/50 rounded-xl transition"
            title="Rafraîchir"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Grid Container split into Main Ledger Table and receipt detailed preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEDGER LIST (Take 2 cols on lg screens) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold font-display uppercase tracking-wider text-brand-text-sub">
              {typeFilter === 'ALL' ? t.recentOps : `${typeFilter} logs`} ({filteredOps.length})
            </h3>
            <span className="text-[11px] text-brand-muted font-mono bg-brand-card/50 border border-brand-border/60 px-2 py-0.5 rounded-md">
              Rapprochement auto activé
            </span>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-xl">
            {filteredOps.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
                <span className="text-4xl text-brand-muted opacity-40">📭</span>
                <p className="text-sm text-brand-muted font-sans">{t.noOpsYet}</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-border/65">
                {filteredOps.map((op) => {
                  const isIncoming = op.type === 'depot' || (op.type === 'transfert' && op.destinataire === op.matricule);
                  const isSelected = selectedOp && selectedOp.id === op.id;

                  return (
                    <div
                      key={op.id}
                      onClick={() => setSelectedOp(op)}
                      className={`p-4 transition cursor-pointer flex items-center justify-between hover:bg-brand-card-alt/50 ${
                        isSelected ? 'bg-brand-card-alt border-l-4 border-brand-accent' : 'border-l-4 border-transparent'
                      }`}
                    >
                      {/* Left: Indicator Symbol + Names */}
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
                          op.type === 'depot' 
                            ? 'bg-brand-green/10 text-brand-green' 
                            : op.type === 'retrait' 
                            ? 'bg-brand-red/10 text-brand-red' 
                            : 'bg-brand-gold/15 text-brand-gold'
                        }`}>
                          {op.type === 'depot' ? '＋' : op.type === 'retrait' ? '－' : '⇄'}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-brand-text">
                              {op.type.toUpperCase()}
                            </span>
                            {op.operator && (
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-brand-bg border border-brand-border text-brand-text-sub rounded-md">
                                {op.operator}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-brand-text-sub">
                            {op.reference_transaction ? (
                              <span className="font-semibold text-brand-accent/90">Ref: {op.reference_transaction}</span>
                            ) : op.destinataire ? (
                              <span>Pour : <span className="font-mono font-bold text-brand-gold">{op.destinataire}</span></span>
                            ) : (
                              <span>{op.motif || op.id}</span>
                            )}
                            <span className="text-brand-muted/70">•</span>
                            <span className="text-brand-muted">
                              {new Date(op.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Balance amount and Status Capsule */}
                      <div className="text-right space-y-1">
                        <div className={`text-sm font-bold font-sans ${
                          isIncoming ? 'text-brand-green' : 'text-brand-red'
                        }`}>
                          {isIncoming ? '+' : '-'}{op.montant.toLocaleString('fr-FR')} AR
                        </div>
                        <div>
                          {getStatusBadge(op.statut)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* DETAILED TRANSACTION RECEIPT CARD VIEW */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold font-display uppercase tracking-wider text-brand-text-sub">
            {t.detailsTitle}
          </h3>

          {selectedOp ? (
            <div id="receipt_panel_card" className="bg-brand-card-alt border border-brand-border rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-5 animate-slide-up">
              
              {/* Receipt Background Branding Watermark Accent */}
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-7xl select-none opacity-5">
                AMM
              </div>

              {/* Receipt Heading */}
              <div className="border-b border-brand-border/60 pb-4 text-center">
                <span className="text-xs font-mono text-brand-muted uppercase">Association Malagasy Miray</span>
                <h4 className="text-base font-extrabold font-display text-brand-text mt-0.5">
                  REÇU FINANCIER DIGITAL
                </h4>
                <p className="text-[10px] text-brand-accent font-mono tracking-widest mt-1">
                  ID: {selectedOp.id}
                </p>
              </div>

              {/* Status and Payout Overview */}
              <div className="bg-brand-bg/60 border border-brand-border/60 rounded-xl p-4 text-center space-y-1">
                <span className="text-[10px] text-brand-text-sub uppercase font-semibold">Montant Opérationnel</span>
                <h5 className="text-2xl font-black text-brand-text font-sans">
                  {selectedOp.montant.toLocaleString('fr-FR')} <span className="text-sm text-brand-accent">AR</span>
                </h5>
                <div className="pt-1.5">
                  {getStatusBadge(selectedOp.statut)}
                </div>
              </div>

              {/* Table of Recorded Audit Parameters */}
              <div className="space-y-3 text-xs">
                
                <div className="flex justify-between border-b border-brand-border/30 pb-2">
                  <span className="text-brand-text-sub font-medium flex items-center gap-1">
                    <Calendar size={13} className="text-brand-muted" /> Date demande
                  </span>
                  <span className="text-brand-text font-mono">
                    {new Date(selectedOp.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>

                {selectedOp.executedAt && (
                  <div className="flex justify-between border-b border-brand-border/30 pb-2">
                    <span className="text-brand-green font-medium flex items-center gap-1">
                      <CheckCircle2 size={13} /> Traitement effectif
                    </span>
                    <span className="text-brand-green font-mono">
                      {new Date(selectedOp.executedAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                )}

                {selectedOp.operator && (
                  <div className="flex justify-between border-b border-brand-border/30 pb-2">
                    <span className="text-brand-text-sub font-medium flex items-center gap-1">
                      <Tag size={13} className="text-brand-muted" /> Opérateur
                    </span>
                    <span className="text-brand-text font-bold text-brand-accent">
                      {selectedOp.operator}
                    </span>
                  </div>
                )}

                {selectedOp.numero_telephone && (
                  <div className="flex justify-between border-b border-brand-border/30 pb-2">
                    <span className="text-brand-text-sub font-medium flex items-center gap-1">
                      <Smartphone size={13} className="text-brand-muted" /> Numéro de traçabilité
                    </span>
                    <span className="text-brand-text font-mono font-bold">
                      {selectedOp.numero_telephone}
                    </span>
                  </div>
                )}

                {/* CRITICAL REFERENCE NUMBER LOGGING */}
                {selectedOp.reference_transaction ? (
                  <div className="bg-brand-accent/5 p-3 rounded-lg border border-brand-accent/15 space-y-1">
                    <span className="text-[10px] text-brand-accent font-bold uppercase block tracking-wide">
                      Référence mobile money enregistrée
                    </span>
                    <span className="text-sm font-mono font-extrabold text-brand-text select-all block">
                      {selectedOp.reference_transaction}
                    </span>
                  </div>
                ) : selectedOp.type === 'depot' && (
                  <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded-lg text-brand-red text-[11px] leading-snug">
                    <AlertCircle size={14} className="inline mr-1" /> Aucune référence Mobile Money saisie !
                  </div>
                )}

                {selectedOp.destinataire && (
                  <div className="flex justify-between border-b border-brand-border/30 pb-2">
                    <span className="text-brand-text-sub font-medium flex items-center gap-1">
                      <Hash size={13} className="text-brand-muted" /> Destinataire interne
                    </span>
                    <span className="text-brand-gold font-mono font-bold">
                      {selectedOp.destinataire}
                    </span>
                  </div>
                )}

                {selectedOp.motif && (
                  <div className="space-y-1 pt-1.5">
                    <span className="text-brand-text-sub font-medium block">Description / Motif :</span>
                    <p className="bg-brand-bg/40 border border-brand-border/50 p-2.5 rounded-lg text-brand-text leading-relaxed italic text-[11px]">
                      "{selectedOp.motif}"
                    </p>
                  </div>
                )}

                {selectedOp.note && (
                  <div className="p-3 bg-brand-gold/5 border border-brand-gold/15 rounded-lg text-brand-gold text-[11px] leading-relaxed italic">
                    <Info size={13} className="inline mr-1.5 shrink-0 align-text-bottom" />
                    <strong>Note Admin:</strong> {selectedOp.note}
                  </div>
                )}
              </div>

              {/* Ny Receipt-nao dia efa misy id="receipt_panel_card" ka hitan'ilay fonction izany */}

              <button
                type="button"
                onClick={downloadReceiptAsImage}
                className="w-full flex items-center justify-center gap-2 py-2 mt-4 bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent border border-brand-accent/30 font-bold text-xs rounded-xl transition"
              >
                <Download size={14} />
                Enregistrer le ticket (PNG)
              </button>

              {/* ACTION BLOCK FOR TRANSFERS OR DEVELOPER SIMULATOR SANDBOX */}
              <div className="pt-2 space-y-2">
                {/* Cancel transfer internally prior to 24h escrow */}
                {selectedOp.type === 'transfert' && selectedOp.statut === 'pending' && selectedOp.matricule !== selectedOp.destinataire && (
                  <button
                    type="button"
                    onClick={() => handleCancelTransfer(selectedOp.id)}
                    className="w-full py-2 bg-brand-red/20 hover:bg-brand-red/30 text-brand-red border border-brand-red/40 font-bold text-xs rounded-xl transition"
                  >
                    Demander l'annulation immédiate
                  </button>
                )}

                {/* Developer / Auditor validation sandbox bypass (highly professional workflow testing tool) */}
                {selectedOp.statut === 'pending' && (
                  currentMatricule?.toUpperCase().trim() === 'AMM-0001' ? (
                    <div className="mt-4 p-4 bg-brand-bg/90 border border-brand-border/70 rounded-xl space-y-3">
                      <div className="flex items-center gap-1.5 text-brand-gold">
                        <Cpu size={14} className="animate-spin text-brand-gold" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{t.simTitle}</span>
                      </div>
                      <p className="text-[10px] text-brand-text-sub leading-snug">
                        {t.simDesc}
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1 font-sans">
                        <button
                          type="button"
                          disabled={simloading !== null}
                          onClick={() => handleSimulateApproval(selectedOp.id, 'approve')}
                          className="py-2 bg-brand-green text-brand-bg hover:bg-brand-green/90 font-bold text-xs rounded-lg transition shadow-md shadow-brand-green/5"
                        >
                          {simloading === selectedOp.id ? '...' : lang === 'mg' ? 'Mankato' : 'Approuver'}
                        </button>
                        <button
                          type="button"
                          disabled={simloading !== null}
                          onClick={() => handleSimulateApproval(selectedOp.id, 'reject')}
                          className="py-2 border border-brand-red/45 hover:bg-brand-red/10 text-brand-red font-bold text-xs rounded-lg transition"
                        >
                          {simloading === selectedOp.id ? '...' : lang === 'mg' ? 'Gada' : 'Rejeter'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-brand-bg/50 border border-brand-border/60 rounded-xl text-center space-y-2">
                      <div className="text-xl">🔒</div>
                      <p className="text-[11px] text-brand-text-sub font-semibold">
                        Validation réservée aux Responsables des Opérations
                      </p>
                      <p className="text-[10px] text-brand-muted leading-relaxed">
                        Seul le responsable des opérations (Matricule : <span className="font-mono font-bold text-brand-accent">AMM-0001</span>) est habilité à approuver ou rejeter les transactions en attente d'audit.
                      </p>
                    </div>
                  )
                )}
              </div>

            </div>
          ) : (
            <div className="bg-brand-card/45 border border-brand-border border-dashed p-10 text-center rounded-2xl flex flex-col items-center justify-center space-y-2 h-72">
              <span className="text-3xl text-brand-muted opacity-30 select-none">💳</span>
              <p className="text-xs text-brand-muted max-w-[200px] leading-relaxed">
                Cliquez sur n'importe quelle transaction de l'historique pour afficher le reçu d'audit complet de l'opérateur et sa référence.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
