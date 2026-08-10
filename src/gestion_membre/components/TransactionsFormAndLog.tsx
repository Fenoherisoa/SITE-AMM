import React, { useState, useMemo } from 'react';
import { Landmark, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, UserCheck, Trash2, Printer } from 'lucide-react';
import { Transaction, Member, OperationRequest } from '../types';

interface Props {
  allMembers: Member[];
  allTransactions: Transaction[];
  accountingRequests: Record<string, OperationRequest>;
  currentUserRole: string;
  loginUser: string;
  onAddTransaction: (t: Transaction) => void;
  onApproveRequest: (key: string, req: OperationRequest) => void;
  onRejectRequest: (key: string, req: OperationRequest) => void;
  onDeleteTransaction: (id: string) => void;
  exportTransactionsPDF: (transactions: Transaction[]) => void;
}

export default function TransactionsFormAndLog({
  allMembers,
  allTransactions,
  accountingRequests,
  currentUserRole,
  loginUser,
  onAddTransaction,
  onApproveRequest,
  onRejectRequest,
  onDeleteTransaction,
  exportTransactionsPDF
}: Props) {
  // --- FORM STATE ---
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [karazana, setKarazana] = useState<"MIDITRA" | "MIVOAKA">("MIDITRA");
  const [vola, setVola] = useState("");
  const [motif, setMotif] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");

  const selectedMember = useMemo(() => {
    return allMembers.find(m => m.id === selectedMemberId) || null;
  }, [allMembers, selectedMemberId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      alert("❌ Safidio aloha ilay mpikambana mpanao transaksiona!");
      return;
    }
    if (!vola || Number(vola) <= 0) {
      alert("❌ Ampidiro ny sorabola manan-kery!");
      return;
    }
    if (!motif.trim()) {
      alert("❌ Fenoy ny motif na dizaniana!");
      return;
    }

    const valueNum = Number(vola);
    const dateObj = new Date();

    const newTrans: Transaction = {
      memberId: selectedMemberId,
      matricule: selectedMember?.matricule || "",
      memberName: selectedMember?.anarana || "",
      karazana,
      vola: valueNum,
      motif: motif.trim(),
      operator: loginUser,
      numero_telephone: phone.trim() || undefined,
      reference_transaction: reference.trim() || undefined,
      date: dateObj.toISOString()
    };

    onAddTransaction(newTrans);

    // Reset Form
    setVola("");
    setMotif("");
    setPhone("");
    setReference("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 m-6">
      {/* 1. TRANSACTION INSERTION FORM */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
        <h3 className="text-base font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Landmark className="h-5 w-5 text-indigo-600" />
          <span>VAOVAO TRANS-AMM</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Mpitantana / Mpikambana *</label>
            <select
              value={selectedMemberId}
              onChange={e => setSelectedMemberId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Misafidiana Mpikambana --</option>
              {allMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.matricule} - {m.anarana}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Karazam-bola (MIDITRA / MIVOAKA) *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKarazana("MIDITRA")}
                className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                  karazana === 'MIDITRA'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                📥 MIDITRA (Depot)
              </button>
              <button
                type="button"
                onClick={() => setKarazana("MIVOAKA")}
                className={`py-2 px-4 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                  karazana === 'MIVOAKA'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                📤 MIVOAKA (Retrait)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Sorabola (Ar) *</label>
            <input
              type="number"
              value={vola}
              onChange={e => setVola(e.target.value)}
              placeholder="Ex: 50000"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Motif / Désignation de l'opération *</label>
            <input
              type="text"
              value={motif}
              onChange={e => setMotif(e.target.value)}
              placeholder="Ex: Fidinam-bola na remboursement kely..."
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Telephone finday raha misy Mobile Money</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ex: 034 56 123 45 na 032 ..."
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Référence Transaction raiki-tampisaka</label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Ex: MV-234234234"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-sm transition-all cursor-pointer uppercase tracking-wider"
          >
            Enregistrer l'opération
          </button>
        </form>
      </div>

      {/* 2. TRANSACTIONS LOGS / OPERATIONS APPROVALS LIST */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 space-y-6">
        {/* SECTION A: PENDING 72H APPROVAL REQUESTS (Operations queue) */}
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Demandes d'Opérations en attente (Contrôle 72H)</span>
            </h4>
            <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {Object.keys(accountingRequests).length} Demandes
            </span>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto">
            {Object.entries(accountingRequests).map(([key, req]) => (
              <div key={key} className="p-3 border border-slate-100 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between bg-slate-50/50 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{req.memberName}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                      {req.matricule}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Request {req.type} : <span className="font-semibold text-indigo-600">{req.montant.toLocaleString()} Ar</span> • {req.motif}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Créé par: {req.operator || 'Admin'} • le {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-end md:self-center">
                  <button
                    onClick={() => onApproveRequest(key, req)}
                    disabled={currentUserRole !== 'PROVINCIAL_CHIEF' && currentUserRole !== 'NATIONAL_PRESIDENT'}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg text-white transition-all cursor-pointer ${
                      (currentUserRole === 'PROVINCIAL_CHIEF' || currentUserRole === 'NATIONAL_PRESIDENT')
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Valide (Approve)
                  </button>
                  <button
                    onClick={() => onRejectRequest(key, req)}
                    disabled={currentUserRole !== 'PROVINCIAL_CHIEF' && currentUserRole !== 'NATIONAL_PRESIDENT'}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg text-white transition-all cursor-pointer ${
                      (currentUserRole === 'PROVINCIAL_CHIEF' || currentUserRole === 'NATIONAL_PRESIDENT')
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Hala
                  </button>
                </div>
              </div>
            ))}
            {Object.keys(accountingRequests).length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400">
                Tsy misy demande d'opération miandry fankatoavana amin'izao fotoana izao.
              </div>
            )}
          </div>
        </div>

        {/* SECTION B: RECENT TRANSACTIONS LEDGER */}
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-emerald-600" />
              <span>Historique Récent des Mouvements de Caisse</span>
            </h4>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                {allTransactions.length} Txs
              </span>
              <button 
                onClick={() => exportTransactionsPDF(allTransactions)}
                className="bg-slate-900 hover:bg-black text-white p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Printy Journal Ledger"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Journal Ledger</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider">Date & Heure</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider">Matricule & Nom</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-center">Type</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider">Désignation</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-right">Montant</th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allTransactions.slice(0, 50).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(t.date).toLocaleString('fr-FR', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 max-w-[150px] truncate">
                      <div className="font-semibold text-xs text-slate-900">{t.memberName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.matricule}</div>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded ${
                        t.karazana === 'MIDITRA' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                      }`}>
                        {t.karazana}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-500 truncate max-w-[120px]">
                      {t.motif}
                    </td>
                    <td className={`p-3 text-xs font-bold text-right whitespace-nowrap ${
                      t.karazana === 'MIDITRA' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {t.karazana === 'MIDITRA' ? '+' : '-'} {t.vola.toLocaleString()} Ar
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => t.id && onDeleteTransaction(t.id)}
                        disabled={currentUserRole !== 'NATIONAL_PRESIDENT'}
                        className={`p-1 rounded text-red-500 hover:bg-red-50/50 transition-all cursor-pointer ${
                          currentUserRole === 'NATIONAL_PRESIDENT' ? '' : 'opacity-30 cursor-not-allowed'
                        }`}
                        title="Fafana ity transaction ity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allTransactions.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                Tsy misy transaction hita.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
