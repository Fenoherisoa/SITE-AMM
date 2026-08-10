import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Printer, Database, ArrowUpRight, ArrowDownLeft, UserCheck } from 'lucide-react';
import { Transaction, Member } from '../types';
import { BASE_URL } from '../services/firebaseService';

interface Props {
  allMembers: Member[];
  allTransactions: Transaction[];
  currentUser: string;
  currentUserRole: string;
  parametres?: any;
}

export default function MemberAccountDashboard({ 
  allMembers, 
  allTransactions, 
  currentUser, 
  currentUserRole,
  parametres 
}: Props) {
  // Select active member via simple dropdown selection
  const [selectedMatricule, setSelectedMatricule] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [memberAccount, setMemberAccount] = useState<{ solde: number; solde_credit: number; solde_debit: number } | null>(null);

  // Auto select first member if available on mount
  useEffect(() => {
    if (allMembers.length > 0 && !selectedMatricule) {
      setSelectedMatricule(allMembers[0].matricule);
    }
  }, [allMembers, selectedMatricule]);

  // Find the fully details member object matches selected identifier
  const activeMember = useMemo(() => {
    return allMembers.find(m => m.matricule === selectedMatricule) || null;
  }, [allMembers, selectedMatricule]);

  useEffect(() => {
    if (selectedMatricule) {
      setMemberAccount(null);
      fetch(`${BASE_URL}/comptes/${selectedMatricule}.json`)
        .then(res => res.json())
        .then(val => {
          setMemberAccount(val || { solde: 0, solde_credit: 0, solde_debit: 0 });
        })
        .catch(err => {
          console.error("Error loading account balances:", err);
          setMemberAccount({ solde: 0, solde_credit: 0, solde_debit: 0 });
        });
    }
  }, [selectedMatricule]);

  const accountData = useMemo(() => {
    const myTrans = allTransactions
      .filter(t => t.matricule === selectedMatricule)
      .filter(t => {
        const descMatch = t.motif?.toLowerCase().includes(searchTerm.toLowerCase());
        const modeMatch = t.id?.toLowerCase().includes(searchTerm.toLowerCase());
        const refMatch = t.reference_transaction?.toLowerCase().includes(searchTerm.toLowerCase());
        return descMatch || modeMatch || refMatch;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    const historyWithBalance = myTrans.map(t => {
      const amt = Number(t.vola || 0);
      runningBalance += t.karazana === 'MIDITRA' ? amt : -amt;
      return { ...t, currentBalance: runningBalance };
    });

    const miditra = Number(memberAccount?.solde_credit || 0);
    const mivoaka = Number(memberAccount?.solde_debit || 0);
    const net = Number(memberAccount?.solde || 0);

    return {
      miditra,
      mivoaka,
      net,
      history: historyWithBalance.reverse()
    };
  }, [allTransactions, selectedMatricule, searchTerm, memberAccount]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handlePrint = useCallback(() => {
    const toPrint = accountData.history.filter(t => t.id && selectedIds.includes(t.id));
    if (toPrint.length === 0) {
      alert("❌ Tsy nisy transaction voafantina!");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const today = new Date().toLocaleDateString('fr-FR');
    const memberName = activeMember?.anarana || "";
    const memberMatricule = activeMember?.matricule || "";

    const content = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', Arial, sans-serif; padding: 25px; color: #1e293b; }
            .header { text-align: center; border-bottom: 3px double #0d3373; padding-bottom: 12px; margin-bottom: 20px; }
            .asso-name { font-size: 20px; font-weight: bold; text-transform: uppercase; color: #0d3373; }
            .info-block { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #f1f5f9; border: 1px solid #94a3b8; padding: 10px; text-align: left; font-size: 12px; }
            td { border: 1px solid #e2e8f0; padding: 10px; font-size: 12px; }
            .total-row { font-weight: bold; background-color: #f8fafc; }
            .sign-section { margin-top: 50px; display: flex; justify-content: space-between; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="asso-name">${parametres?.nom_association || 'ASSOCIATION MALAGASY MIRAY (AMM)'}</div>
            <p style="margin:4px 0 0 0;font-size:12px;">${parametres?.siege_social || ''} - ${parametres?.lieu || ''}</p>
            <h3 style="margin:10px 0 0 0;font-size:15px;color:#0d3373">RELEVÉ DES OPÉRATIONS DE CAISSE</h3>
          </div>

          <div class="info-block">
            <div><b>Mpikambana:</b> ${memberName}<br/><b>Matricule:</b> ${memberMatricule}</div>
            <div><b>Daty:</b> ${today}<br/><b>Mpitantana:</b> ${currentUser}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date / Heure</th>
                <th>ID Opération</th>
                <th>Nature</th>
                <th>Désignation / Motif</th>
                <th style="text-align:right">Montant (Ar)</th>
              </tr>
            </thead>
            <tbody>
              ${toPrint.map(t => `
                <tr>
                  <td>${new Date(t.date).toLocaleString('fr-FR')}</td>
                  <td>${t.id || '-'}</td>
                  <td>${t.karazana}</td>
                  <td>${t.motif}</td>
                  <td style="text-align:right;font-weight:bold;color:${t.karazana === 'MIDITRA' ? 'green' : 'red'}">
                    ${t.karazana === 'MIDITRA' ? '+' : '-'} ${t.vola.toLocaleString()}
                  </td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4" style="text-align:right">TOTAL DES OPÉRATIONS SÉLECTIONNÉES</td>
                <td style="text-align:right;color:#0d3373;font-size:13px">
                  ${toPrint.reduce((acc, t) => acc + (t.karazana === 'MIDITRA' ? t.vola : -t.vola), 0).toLocaleString()} Ar
                </td>
              </tr>
            </tbody>
          </table>

          <div class="sign-section">
            <div style="text-align:center;">Sonia sy Visan'ny Mpikambana<br/><br/>__________________</div>
            <div style="text-align:center;">Ny Caisse / Mpitantana AMM<br/><br/>__________________</div>
          </div>

          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  }, [accountData.history, selectedIds, activeMember, parametres, currentUser]);

  return (
    <div className="w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm m-6 max-w-5xl">
      {/* 0. MEMBER SELECTOR DROPDOWN */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-indigo-600" />
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Fifantenana Mpikambana</h4>
            <p className="text-[10px] text-slate-500">Mba hijerena momba ny kaonty caisse manokana</p>
          </div>
        </div>

        <select
          value={selectedMatricule}
          onChange={e => setSelectedMatricule(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-800 outline-none w-full md:w-80 shadow-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- Safidio eto ny mpikambana --</option>
          {allMembers.map(m => (
            <option key={m.matricule} value={m.matricule}>
              {m.anarana} ({m.matricule})
            </option>
          ))}
        </select>
      </div>

      {/* 1. SELECTION & ACTIONS BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Mitady motif na ID opération..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            onChange={e => setSearchTerm(e.target.value)}
            value={searchTerm}
          />
        </div>
        <button
          onClick={handlePrint}
          disabled={selectedIds.length === 0}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all ${
            selectedIds.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow-sm' : 'bg-slate-300 cursor-not-allowed'
          }`}
        >
          <Printer className="h-4 w-4" />
          Imprimer le Relevé ({selectedIds.length})
        </button>
      </div>

      {/* 2. RECAP BALANCES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Miditra</span>
            <h4 className="text-sm font-bold text-emerald-900">
              {memberAccount ? accountData.miditra.toLocaleString() : "..."} Ar
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-rose-50/50 border border-rose-100 rounded-xl p-4">
          <div className="p-3 bg-rose-100 text-rose-700 rounded-lg">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Total Mivoaka</span>
            <h4 className="text-sm font-bold text-rose-900">
              {memberAccount ? accountData.mivoaka.toLocaleString() : "..."} Ar
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4">
          <div className="p-3 bg-slate-200 text-slate-700 rounded-lg">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Solde Actuel</span>
            <h4 className="text-sm font-bold text-slate-900">
              {memberAccount ? accountData.net.toLocaleString() : "..."} Ar
            </h4>
          </div>
        </div>
      </div>

      {/* 3. TRANSACTION LIST TABLE */}
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white select-none text-[11px] font-bold">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={accountData.history.length > 0 && selectedIds.length === accountData.history.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      const ids = accountData.history.map(h => h.id).filter((id): id is string => typeof id === 'string');
                      setSelectedIds(ids);
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="accent-slate-300 h-3.5 w-3.5 cursor-pointer"
                  title="Safidio ny rehetra"
                />
              </th>
              <th className="p-3 uppercase tracking-wider">Date & Heure</th>
              <th className="p-3 uppercase tracking-wider">ID Operation</th>
              <th className="p-3 uppercase tracking-wider">Nature</th>
              <th className="p-3 uppercase tracking-wider">Désignation / Motif</th>
              <th className="p-3 uppercase tracking-wider text-right">Montant</th>
              <th className="p-3 uppercase tracking-wider text-right">Solde Progressif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {accountData.history.map((t, idx) => (
              <tr key={t.id} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={t.id ? selectedIds.includes(t.id) : false}
                    onChange={() => t.id && toggleSelection(t.id)}
                    className="accent-slate-900 h-3.5 w-3.5 cursor-pointer"
                  />
                </td>
                <td className="p-3 text-slate-500 whitespace-nowrap">
                  {new Date(t.date).toLocaleString('fr-FR')}
                </td>
                <td className="p-3 font-semibold text-slate-900 whitespace-nowrap">
                  {t.id}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    t.karazana === 'MIDITRA' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                  }`}>
                    {t.karazana}
                  </span>
                </td>
                <td className="p-3 text-slate-600 max-w-xs truncate">
                  {t.motif}
                </td>
                <td className={`p-3 font-bold text-right whitespace-nowrap ${
                  t.karazana === 'MIDITRA' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {t.karazana === 'MIDITRA' ? '+' : '-'} {t.vola.toLocaleString()} Ar
                </td>
                <td className="p-3 font-semibold text-right text-slate-700 whitespace-nowrap">
                  {t.currentBalance?.toLocaleString()} Ar
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {accountData.history.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400">
            Tsy misy operation hita ho an'ity mpikambana ity.
          </div>
        )}
      </div>
    </div>
  );
}
