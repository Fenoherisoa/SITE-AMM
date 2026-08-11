/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { translations } from '../i18n';
import { Language, MobileOperator, OperationType } from '../types';
import { dbService } from '../dbService';
import { X, Info, CreditCard, Send, Smartphone, Hash, AlertTriangle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: OperationType;
  matricule: string;
  memberName: string;
  availableBalance: number;
  lang: Language;
  onSuccess: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  type,
  matricule,
  memberName,
  availableBalance,
  lang,
  onSuccess,
}) => {
  const t = translations[lang];

  // Form Fields
  const [amount, setAmount] = useState('');
  const [operator, setOperator] = useState<MobileOperator | ''>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reference, setReference] = useState('');
  const [motif, setMotif] = useState('');
  const [recipient, setRecipient] = useState('');
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculators
  const parsedAmount = Math.max(0, parseInt(amount) || 0);
  const withdrawalFee = type === 'retrait' ? Math.round(parsedAmount * 0.05) : 0;
  const netWithdrawalAmount = Math.max(0, parsedAmount - withdrawalFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Common Val
    if (parsedAmount <= 0) {
      setErrorMsg(t.invalidAmount);
      return;
    }

    // Withdrawal Balance Checks
    if (type === 'retrait' && parsedAmount > availableBalance) {
      setErrorMsg(t.insufficientBalance);
      return;
    }

    setLoading(true);

    try {
      if (type === 'transfert') {
        const cleanedRecipient = recipient.toUpperCase().trim();
        if (!cleanedRecipient) {
          setErrorMsg(t.fieldsRequired);
          setLoading(false);
          return;
        }

        if (cleanedRecipient === matricule.toUpperCase().trim()) {
          setErrorMsg(t.selfTransferError);
          setLoading(false);
          return;
        }

        if (parsedAmount > availableBalance) {
          setErrorMsg(t.insufficientBalance);
          setLoading(false);
          return;
        }

        // Check if recipient account exists
        const recipientUser = await dbService.fetchUserRequest(cleanedRecipient);
        if (!recipientUser || recipientUser.statut !== 'active') {
          setErrorMsg(t.recipientActiveRequired);
          setLoading(false);
          return;
        }

        // Book pending transfer (executeAfter is 24h later)
        await dbService.submitOperation({
          matricule,
          memberName,
          type: 'transfert',
          montant: parsedAmount,
          motif: motif || '',
          destinataire: cleanedRecipient,
          executeAfter: Date.now() + 24 * 3600 * 1000,
          traitement: '24h (auto)'
        });

      } else if (type === 'depot') {
        if (!operator) {
          setErrorMsg(t.fieldsRequired + ": Operator");
          setLoading(false);
          return;
        }
        if (!phoneNumber.trim()) {
          setErrorMsg(t.phoneRequired);
          setLoading(false);
          return;
        }
        if (!reference.trim()) {
          setErrorMsg(t.referenceRequired);
          setLoading(false);
          return;
        }

        // Save detailed Deposit
        await dbService.submitOperation({
          matricule,
          memberName,
          type: 'depot',
          montant: parsedAmount,
          operator,
          numero_telephone: phoneNumber,
          reference_transaction: reference.trim().toUpperCase(),
          motif: motif || '',
          traitement: '72h (admin)'
        });

      } else if (type === 'retrait') {
        if (!operator) {
          setErrorMsg(t.fieldsRequired + ": Operator");
          setLoading(false);
          return;
        }
        if (!phoneNumber.trim()) {
          setErrorMsg(t.phoneRequired);
          setLoading(false);
          return;
        }

        // Save detailed Withdrawal
        await dbService.submitOperation({
          matricule,
          memberName,
          type: 'retrait',
          montant: parsedAmount,
          frais: withdrawalFee,
          operator,
          numero_telephone: phoneNumber,
          motif: motif || '',
          traitement: '72h (admin)'
        });
      }

      // Done
      setLoading(false);
      onSuccess();
      onClose();
      
      // Reset form fields
      setAmount('');
      setOperator('');
      setPhoneNumber('');
      setReference('');
      setMotif('');
      setRecipient('');
    } catch (e) {
      console.error(e);
      setErrorMsg("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const OPERATEURS = [
    { name: 'Mvola' as MobileOperator, color: 'Green', dotColor: 'bg-brand-green', pillClass: 'border-brand-green/20 text-brand-green hover:bg-brand-green/10' },
    { name: 'Orange Money' as MobileOperator, color: 'Orange', dotColor: 'bg-orange-500', pillClass: 'border-orange-500/20 text-orange-200 hover:bg-orange-950/30' },
    { name: 'Airtel Money' as MobileOperator, color: 'Red', dotColor: 'bg-red-500', pillClass: 'border-red-500/20 text-red-200 hover:bg-red-950/30' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div id="operation_modal_card" className="w-full max-w-lg bg-brand-card border border-brand-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-brand-border bg-brand-card-alt">
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {type === 'depot' ? '⬆️' : type === 'retrait' ? '⬇️' : '↔️'}
            </span>
            <h2 className="text-lg font-bold font-display text-brand-text">
              {type === 'depot' ? t.deposit : type === 'retrait' ? t.withdrawal : t.transfer}
            </h2>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 px-2 text-brand-muted hover:text-brand-accent hover:bg-brand-border rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-brand-red/10 border border-brand-red/30 rounded-lg flex items-start gap-2 text-brand-red text-sm">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Subheading Notice Box */}
          <div className="p-3.5 bg-brand-card-alt border-l-4 border-brand-gold rounded-r-lg text-xs space-y-1">
            <div className="font-semibold text-brand-gold flex items-center gap-1.5">
              <Info size={14} />
              <span>{type === 'transfert' ? t.transfer : t.about}</span>
            </div>
            <p className="text-brand-text-sub leading-relaxed">
              {type === 'depot' && t.pendingAdmin72}
              {type === 'retrait' && `${t.feeNotice} — ${t.pendingAdmin72}`}
              {type === 'transfert' && t.transferNotice}
            </p>
          </div>

          {/* Form Fields: Recipient for Transfers */}
          {type === 'transfert' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-text-sub uppercase tracking-wider block">
                {t.destMatricule} <span className="text-brand-red">*</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-3 text-brand-muted" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Ex: AMM-0002"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-2.5 pl-11 pr-4 text-brand-text text-sm focus:outline-none focus:border-brand-accent uppercase placeholder:text-brand-muted/70"
                />
              </div>
            </div>
          )}

          {/* Form Fields: Operators for Deposits & Withdrawals */}
          {(type === 'depot' || type === 'retrait') && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-text-sub uppercase tracking-wider block">
                {t.operatorSelect} <span className="text-brand-red">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {OPERATEURS.map((op) => (
                  <button
                    key={op.name}
                    type="button"
                    onClick={() => setOperator(op.name)}
                    className={`flex items-center gap-1.5 justify-center p-2.5 border rounded-xl text-xs font-bold transition-all ${
                      operator === op.name
                        ? 'border-brand-accent bg-brand-accent/10 text-brand-accent shadow-md shadow-brand-accent/5'
                        : `border-brand-border bg-brand-bg/40 ${op.pillClass}`
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${op.dotColor}`} />
                    <span>{op.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Field: Phone Number */}
          {(type === 'depot' || type === 'retrait') && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-text-sub uppercase tracking-wider block">
                {t.phoneUsed} <span className="text-brand-red">*</span>
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-3 text-brand-muted" size={18} />
                <input
                  type="tel"
                  required
                  placeholder="Ex: 034 11 222 33"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-2.5 pl-11 pr-4 text-brand-text text-sm focus:outline-none focus:border-brand-accent placeholder:text-brand-muted/70"
                />
              </div>
            </div>
          )}

          {/* Form Field: Transaction Reference Number (CRITICAL requirement for deposit references!) */}
          {type === 'depot' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-text-sub uppercase tracking-wider block">
                {t.txnRef} <span className="text-brand-red">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-3 text-brand-muted" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Ex: 859402947 ou Ref_Mvola"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-2.5 pl-11 pr-4 text-brand-text text-sm font-semibold focus:outline-none focus:border-brand-accent uppercase placeholder:text-brand-muted/70"
                />
              </div>
              <p className="text-[11px] text-brand-muted leading-relaxed italic">
                Saisissez la référence SMS reçue de votre opérateur pour vérification par l'auditeur AMM.
              </p>
            </div>
          )}

          {/* Form Field: Amount */}
          <div className="space-y-1.5 font-sans">
            <label className="text-xs font-semibold text-brand-text-sub uppercase tracking-wider block">
              {t.amountAr} <span className="text-brand-red">*</span>
            </label>
            <div className="relative">
              <span className="absolute right-4 top-3 text-brand-muted font-bold text-xs">ARIARY</span>
              <input
                type="number"
                required
                min="500"
                step="100"
                placeholder="Ex : 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-2.5 pl-4 pr-16 text-brand-text text-sm font-bold focus:outline-none focus:border-brand-accent placeholder:text-brand-muted/70"
              />
            </div>
          </div>

          {/* Withdrawals Live Fee Breakout Visualization */}
          {type === 'retrait' && parsedAmount > 0 && (
            <div className="p-4 bg-brand-card-alt border border-brand-border rounded-xl space-y-2 text-xs font-sans">
              <div className="flex justify-between text-brand-text-sub">
                <span>Montant à débiter</span>
                <span className="font-semibold">{parsedAmount.toLocaleString('fr-FR')} AR</span>
              </div>
              <div className="flex justify-between text-brand-red/90">
                <span>{t.fraisOperateur}</span>
                <span className="font-semibold">- {withdrawalFee.toLocaleString('fr-FR')} AR</span>
              </div>
              <div className="border-t border-brand-border/60 my-2 pt-2 flex justify-between items-center">
                <span className="text-brand-accent font-semibold">{t.payoutText}</span>
                <span className="text-brand-accent font-extrabold text-base">
                  {netWithdrawalAmount.toLocaleString('fr-FR')} AR
                </span>
              </div>
            </div>
          )}

          {/* Form Field: Reason Motif */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-text-sub uppercase tracking-wider block">
              {t.reasonOptional}
            </label>
            <input
              type="text"
              placeholder="Ex: Frais d'adhésion, Achat bétail..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-2.5 px-4 text-brand-text text-sm focus:outline-none focus:border-brand-accent placeholder:text-brand-muted/70"
            />
          </div>

          {/* Balance display for safety */}
          <div className="text-[11px] text-brand-muted flex justify-between font-mono pt-1">
            <span>Solde AMM actuel:</span>
            <span className="font-bold text-brand-text">{availableBalance.toLocaleString('fr-FR')} AR</span>
          </div>

          {/* Submit Action Block */}
          <div className="pt-4 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-accent text-brand-bg rounded-xl font-bold font-display hover:bg-brand-accent-dark transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-accent/10"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
                  <span>Traitement...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <Send size={15} />
                  <span>{t.confirmRequest}</span>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 bg-transparent border border-brand-border text-brand-text hover:bg-brand-border/30 rounded-xl font-semibold text-xs transition"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
