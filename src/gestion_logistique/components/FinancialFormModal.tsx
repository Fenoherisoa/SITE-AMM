import React, { useState, useEffect } from 'react';
import { X, Wallet, Save, TrendingUp, TrendingDown } from 'lucide-react';
import { FinancialTransaction, TransactionType, FinancialCategory, PaymentMethod, AccountName } from '../types';

interface FinancialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: FinancialTransaction) => void;
  defaultType?: TransactionType;
}

export const FinancialFormModal: React.FC<FinancialFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultType = 'EXPENSE'
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(50000);
  const [category, setCategory] = useState<FinancialCategory>('Achat Matériel & Équipement');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Virement Bancaire');
  const [account, setAccount] = useState<AccountName>('Compte Bancaire AMM');
  const [receiptRef, setReceiptRef] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setType(defaultType);
    if (defaultType === 'INCOME') {
      setCategory('Subventions & Dons');
    } else {
      setCategory('Achat Matériel & Équipement');
    }
  }, [defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const newTx: FinancialTransaction = {
      id: `FIN-${Date.now().toString().slice(-4)}`,
      type,
      category,
      title,
      description,
      amount: Number(amount),
      date,
      paymentMethod,
      account,
      status: 'PAYE',
      receiptRef: receiptRef || `REC-${Date.now().toString().slice(-5)}`,
      createdByName: 'Gestionnaire Financier AMM',
      timestamp: new Date().toISOString()
    };

    onSave(newTx);
    onClose();
    setTitle('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Wallet className="h-5 w-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Saisie d'Écriture Comptable
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Type Selector */}
          <div>
            <label className="block font-semibold mb-1.5">Sens du Flux Financier *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('INCOME');
                  setCategory('Subventions & Dons');
                }}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  type === 'INCOME' ? 'bg-emerald-600 text-white border-emerald-500 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>+ RECETTE (Encaissement)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('EXPENSE');
                  setCategory('Achat Matériel & Équipement');
                }}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  type === 'EXPENSE' ? 'bg-rose-600 text-white border-rose-500 shadow' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                <span>- DÉPENSE (Décaissement)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Intitulé de la Transaction *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Subvention Partenaire Annuelle 2026"
              className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Montant *</label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-extrabold text-base outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Date d'Échéance / Règlement</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Poste Budgétaire / Catégorie *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FinancialCategory)}
              className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
            >
              {type === 'INCOME' ? (
                <>
                  <option value="Subventions & Dons">Subventions & Dons</option>
                  <option value="Cotisations Membres">Cotisations Membres</option>
                  <option value="Prestations & Événements">Prestations & Événements</option>
                  <option value="Divers">Divers / Recettes Annexes</option>
                </>
              ) : (
                <>
                  <option value="Achat Matériel & Équipement">Achat Matériel & Équipement</option>
                  <option value="Achat Consommables">Achat Consommables</option>
                  <option value="Maintenance & Réparations">Maintenance & Réparations</option>
                  <option value="Transport & Logistique">Transport & Logistique</option>
                  <option value="Frais Administratifs">Frais Administratifs</option>
                  <option value="Divers">Divers</option>
                </>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Mode de Paiement</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              >
                <option value="Virement Bancaire">Virement Bancaire</option>
                <option value="Chèque">Chèque</option>
                <option value="Espèces">Espèces</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Carte Bancaire">Carte Bancaire</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Compte / Caisse Impacté</label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value as AccountName)}
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              >
                <option value="Compte Bancaire AMM">Compte Bancaire AMM</option>
                <option value="Caisse Principale Siège">Caisse Principale Siège</option>
                <option value="Mobile Money AMM">Mobile Money AMM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">N° Quittance / Référence Chèque / Virement</label>
            <input
              type="text"
              value={receiptRef}
              onChange={(e) => setReceiptRef(e.target.value)}
              placeholder="ex: VIR-BNK-98231"
              className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 font-mono outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-semibold text-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
            >
              <Save className="h-4 w-4" />
              <span>Valider l'Écriture</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
