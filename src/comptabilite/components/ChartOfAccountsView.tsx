import React, { useState } from 'react';
import {
  ListTree,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  FolderTree,
} from 'lucide-react';
import { Account, AccountClass, AccountCategory } from '../types/accounting';

interface ChartOfAccountsViewProps {
  accounts: Account[];
  onAddAccount: (account: Account) => void;
}

export const ChartOfAccountsView: React.FC<ChartOfAccountsViewProps> = ({
  accounts,
  onAddAccount,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New account form state
  const [newCode, setNewCode] = useState<string>('');
  const [newLabel, setNewLabel] = useState<string>('');
  const [newClass, setNewClass] = useState<AccountClass>(1);
  const [newCategory, setNewCategory] = useState<AccountCategory>('CAPITAUX');
  const [newBalance, setNewBalance] = useState<'DEBIT' | 'CREDIT'>('DEBIT');

  const filteredAccounts = accounts.filter((acc) => {
    if (selectedClassFilter !== 0 && acc.classCode !== selectedClassFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        acc.code.includes(q) ||
        acc.label.toLowerCase().includes(q) ||
        acc.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filteredAccounts.sort((a, b) => a.code.localeCompare(b.code));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newLabel) {
      alert('Veuillez renseigner le code et l\'intitulé du compte.');
      return;
    }
    if (accounts.some((a) => a.code === newCode)) {
      alert('Un compte avec ce numéro existe déjà dans le plan comptable.');
      return;
    }

    const created: Account = {
      code: newCode.trim(),
      label: newLabel.trim(),
      classCode: newClass,
      category: newCategory,
      normalBalance: newBalance,
      active: true,
    };

    onAddAccount(created);
    setShowAddModal(false);
    setNewCode('');
    setNewLabel('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <ListTree className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Plan Comptable Général & SYSCOHADA
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Nomenclature officielle des comptes divisée en 8 classes normalisées.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Compte</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Class Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto text-xs pb-1">
          <button
            onClick={() => setSelectedClassFilter(0)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              selectedClassFilter === 0
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Toutes ({accounts.length})
          </button>
          {[1, 2, 3, 4, 5, 6, 7].map((c) => {
            const count = accounts.filter((a) => a.classCode === c).length;
            return (
              <button
                key={c}
                onClick={() => setSelectedClassFilter(c)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedClassFilter === c
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Classe {c} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Chercher N° ou intitulé..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

      </div>

      {/* Accounts List Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-700/60">
              <tr>
                <th className="p-3 w-28">N° Compte</th>
                <th className="p-3">Intitulé du Compte</th>
                <th className="p-3 w-24">Classe</th>
                <th className="p-3 w-44">Catégorie</th>
                <th className="p-3 w-28">Solde Normal</th>
                <th className="p-3 w-20 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAccounts.map((acc) => (
                <tr key={acc.code} className="hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold text-blue-400 text-xs">
                    {acc.code}
                  </td>
                  <td className="p-3 font-medium text-slate-200">
                    {acc.label}
                  </td>
                  <td className="p-3 font-mono text-slate-400">
                    Classe {acc.classCode}
                  </td>
                  <td className="p-3 text-slate-400 text-[11px]">
                    <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {acc.category}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-semibold text-xs">
                    <span
                      className={
                        acc.normalBalance === 'DEBIT'
                          ? 'text-emerald-400'
                          : 'text-blue-400'
                      }
                    >
                      {acc.normalBalance}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center text-emerald-400 text-[10px]">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Actif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FolderTree className="w-5 h-5 text-blue-400" />
              <span>Ajouter un Compte Comptable</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Numéro de Compte (ex: 6053) *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 6053"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Intitulé du Compte *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Achats de fournitures de sécurité"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Classe Comptable
                </label>
                <select
                  value={newClass}
                  onChange={(e) => setNewClass(parseInt(e.target.value) as AccountClass)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value={1}>Classe 1 - Ressources Durables</option>
                  <option value={2}>Classe 2 - Actif Immobilisé</option>
                  <option value={3}>Classe 3 - Stocks & En-cours</option>
                  <option value={4}>Classe 4 - Tiers (Clients, Fournisseurs, État)</option>
                  <option value={5}>Classe 5 - Trésorerie (Banque, Caisse)</option>
                  <option value={6}>Classe 6 - Charges</option>
                  <option value={7}>Classe 7 - Produits</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Sens Normal du Solde
                </label>
                <select
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value as 'DEBIT' | 'CREDIT')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="DEBIT">DÉBIT (Actif ou Charge)</option>
                  <option value="CREDIT">CRÉDIT (Passif ou Produit)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Créer Compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
