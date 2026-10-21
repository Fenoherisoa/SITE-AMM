import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Wallet, 
  ArrowLeftRight, 
  Clock, 
  Users, 
  BookOpen, 
  Terminal, 
  RefreshCw, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ShieldCheck
} from 'lucide-react';

import { 
  Member, 
  Transaction, 
  OperationRequest, 
  ActionLog 
} from '../gestion_membre/types';
import { FirebaseService, requestRtdb } from '../gestion_membre/services/firebaseService';

// Subcomponents
import CaisseOperationsTab from '../gestion_membre/components/CaisseOperationsTab';
import MemberAccountDashboard from '../gestion_membre/components/MemberAccountDashboard';
import TransactionsFormAndLog from '../gestion_membre/components/TransactionsFormAndLog';
import LogsList from '../gestion_membre/components/LogsList';

interface Props {
  onBackToDashboard: () => void;
}

export default function OperationsAppModule({ onBackToDashboard }: Props) {
  // Session info
  const centralSession = (() => {
    try {
      const raw = localStorage.getItem('amm_authenticated_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const loginUser = centralSession?.displayName || centralSession?.username || centralSession?.email || 'Admin';
  const currentUserRole = centralSession?.role || 'NATIONAL_PRESIDENT';

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<'caisse' | 'demandes' | 'comptes' | 'journal' | 'audit'>('caisse');

  // Core Data
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [operationRequests, setOperationRequests] = useState<Record<string, OperationRequest>>({});
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [sysParams, setSysParams] = useState<any>({ appName: 'AMM CONNECT', currency: 'MGA' });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load database
  const loadOperationsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [membersRes, txRes, reqRes, logsRes, paramsRes] = await Promise.allSettled([
        FirebaseService.getMembers(),
        FirebaseService.getAccounting(),
        FirebaseService.getOperationRequests(),
        FirebaseService.getLogs(),
        FirebaseService.getParametres()
      ]);

      if (membersRes.status === 'fulfilled' && membersRes.value) setAllMembers(membersRes.value);
      if (txRes.status === 'fulfilled' && txRes.value) setAllTransactions(txRes.value);
      if (reqRes.status === 'fulfilled' && reqRes.value) setOperationRequests(reqRes.value);
      if (logsRes.status === 'fulfilled' && logsRes.value) setLogs(logsRes.value);
      if (paramsRes.status === 'fulfilled' && paramsRes.value) setSysParams(paramsRes.value);
    } catch (e) {
      console.warn('Erreur lors du chargement des données opérations:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOperationsData();
  }, [loadOperationsData]);

  // Log action helper
  const saveActionLog = async (action: string, details: string) => {
    const newLog: ActionLog = {
      operator: loginUser,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    try {
      await FirebaseService.pushLog(newLog);
      setLogs(prev => [newLog, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  // Transaction handlers
  const handleAddTransaction = async (tx: Transaction) => {
    try {
      await FirebaseService.addAccounting(tx);
      await saveActionLog('TRANSACTION_ADD', `Mouvement ${tx.karazana}: ${tx.vola} MGA pour ${tx.memberName}`);
      
      // Update member account balance
      const delta = tx.karazana === 'MIDITRA' ? tx.vola : -tx.vola;
      const creditDelta = tx.karazana === 'MIDITRA' ? tx.vola : 0;
      const debitDelta = tx.karazana === 'MIVOAKA' ? tx.vola : 0;

      const acc = await FirebaseService.getMemberAccount(tx.matricule);
      const newSolde = (acc?.solde || 0) + delta;
      const newCredit = (acc?.solde_credit || 0) + creditDelta;
      const newDebit = (acc?.solde_debit || 0) + debitDelta;

      await FirebaseService.patchMemberAccount(tx.matricule, {
        solde: newSolde,
        solde_credit: newCredit,
        solde_debit: newDebit
      });

      alert('✅ Transaction enregistrée avec succès !');
      await loadOperationsData();
    } catch (e) {
      console.error(e);
      alert('❌ Erreur lors de l’enregistrement de la transaction.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer cette transaction ?')) return;
    try {
      await FirebaseService.deleteAccounting(id);
      await saveActionLog('TRANSACTION_DELETE', `Suppression transaction ${id}`);
      alert('✅ Transaction supprimée.');
      await loadOperationsData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveRequest = async (key: string, req: OperationRequest) => {
    try {
      const tx: Transaction = {
        memberId: req.id || 'MEM',
        matricule: req.matricule,
        memberName: req.memberName,
        karazana: req.type === 'MIDITRA' ? 'MIDITRA' : 'MIVOAKA',
        vola: req.montant,
        motif: `Approbation 72h: ${req.motif}`,
        operator: loginUser,
        date: new Date().toISOString(),
        numero_telephone: req.numero_telephone,
        reference_transaction: req.reference_transaction
      };

      await FirebaseService.addAccounting(tx);
      await FirebaseService.deleteOperationRequest(key);
      await saveActionLog('REQUEST_APPROVED', `Approbation demande ${req.type} de ${req.montant} MGA pour ${req.memberName}`);

      // Update account
      const delta = tx.karazana === 'MIDITRA' ? tx.vola : -tx.vola;
      const acc = await FirebaseService.getMemberAccount(req.matricule);
      await FirebaseService.patchMemberAccount(req.matricule, {
        solde: (acc?.solde || 0) + delta
      });

      alert('✅ Demande approuvée et enregistrée en caisse !');
      await loadOperationsData();
    } catch (e) {
      console.error(e);
      alert('❌ Erreur lors de l’approbation.');
    }
  };

  const handleRejectRequest = async (key: string, req: OperationRequest) => {
    if (!window.confirm('⚠️ Rejeter cette demande ?')) return;
    try {
      await FirebaseService.deleteOperationRequest(key);
      await saveActionLog('REQUEST_REJECTED', `Rejet demande ${req.montant} MGA pour ${req.memberName}`);
      alert('Demande rejetée.');
      await loadOperationsData();
    } catch (e) {
      console.error(e);
    }
  };

  const exportTransactionsPDF = (transactionsList: Transaction[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('❌ Veuillez autoriser les popups pour imprimer le PDF.');
      return;
    }

    const rowsHtml = transactionsList.map((t, i) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">${new Date(t.date).toLocaleString('fr-FR')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: bold;">${t.id || '---'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${t.memberName} (${t.matricule})</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: ${t.karazana === 'MIDITRA' ? '#15803d' : '#b45309'};">${t.karazana}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${t.motif || '---'} (${t.operator || 'Admin'})</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; text-align: right; color: ${t.karazana === 'MIDITRA' ? 'green' : 'red'};">${t.karazana === 'MIDITRA' ? '+' : '-'} ${t.vola.toLocaleString()} MGA</td>
      </tr>
    `).join('');

    const miditraTotal = transactionsList.filter(t => t.karazana === 'MIDITRA').reduce((sum, t) => sum + t.vola, 0);
    const mivoakaTotal = transactionsList.filter(t => t.karazana === 'MIVOAKA').reduce((sum, t) => sum + t.vola, 0);
    const balance = miditraTotal - mivoakaTotal;

    const reportHtml = `
      <html>
        <head>
          <title>Grand Journal des Opérations - AMM Connect</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; background: white; }
            .header { border-bottom: 3px double #0d3373; padding-bottom: 15px; margin-bottom: 30px; text-align: center; }
            .title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #0d3373; }
            .meta { font-size: 11px; color: #64748b; margin-top: 5px; }
            .recap-box { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 30px; }
            .recap-item { text-align: center; }
            .recap-val { font-size: 16px; font-weight: bold; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #0d3373; color: white; padding: 10px; font-size: 11px; text-transform: uppercase; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">ASSOCIATION MALAGASY MIRAY — GRAND LIVRE DES OPÉRATIONS</div>
            <div class="meta">Généré le ${new Date().toLocaleString('fr-FR')} • Nombre de mouvements: ${transactionsList.length}</div>
          </div>
          <div class="recap-box">
            <div class="recap-item">
              <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b;">Total Entrées</span>
              <div class="recap-val" style="color: #15803d;">+ ${miditraTotal.toLocaleString()} MGA</div>
            </div>
            <div class="recap-item">
              <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b;">Total Sorties</span>
              <div class="recap-val" style="color: #b45309;">- ${mivoakaTotal.toLocaleString()} MGA</div>
            </div>
            <div class="recap-item">
              <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b;">Solde Net Trésorerie</span>
              <div class="recap-val" style="color: #0d3373;">${balance.toLocaleString()} MGA</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>ID</th>
                <th>Membre (Matricule)</th>
                <th style="text-align: center;">Flux</th>
                <th>Motif & Opérateur</th>
                <th style="text-align: right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  // Financial summary metrics
  const financialMetrics = useMemo(() => {
    const miditra = allTransactions.filter(t => t.karazana === 'MIDITRA').reduce((sum, t) => sum + (Number(t.vola) || 0), 0);
    const mivoaka = allTransactions.filter(t => t.karazana === 'MIVOAKA').reduce((sum, t) => sum + (Number(t.vola) || 0), 0);
    const pendingCount = Object.keys(operationRequests).length;
    return {
      miditra,
      mivoaka,
      solde: miditra - mivoaka,
      pendingCount
    };
  }, [allTransactions, operationRequests]);

  const requestsList = useMemo(() => {
    return Object.entries(operationRequests).map(([key, req]) => {
      const item = (typeof req === 'object' && req !== null) ? (req as OperationRequest) : ({} as Partial<OperationRequest>);
      return {
        key,
        id: item.id,
        matricule: item.matricule || '',
        memberName: item.memberName || 'Membre',
        type: item.type || 'MIDITRA',
        montant: item.montant || 0,
        motif: item.motif || '',
        numero_telephone: item.numero_telephone,
        operator: item.operator,
        reference_transaction: item.reference_transaction,
        createdAt: item.createdAt || new Date().toISOString(),
        statut: item.statut || 'PENDING'
      };
    });
  }, [operationRequests]);

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-900 flex flex-col">
      {/* Top Navigation Bar with Clear Separation */}
      <div className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Menu Principal</span>
            </button>
            <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Portail AMM • Module Autonome</p>
              <h1 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-400" />
                Gestion des Opérations & Caisse
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              {currentUserRole} ({loginUser})
            </span>
            <button
              onClick={loadOperationsData}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer border border-slate-700"
              title="Actualiser les données"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Financial KPI Banner */}
        <div className="bg-slate-950/80 border-t border-slate-800 px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Total Entrées</p>
                <p className="font-bold text-emerald-400">+{financialMetrics.miditra.toLocaleString()} MGA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Total Sorties</p>
                <p className="font-bold text-rose-400">-{financialMetrics.mivoaka.toLocaleString()} MGA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Trésorerie Nette</p>
                <p className="font-bold text-indigo-300">{financialMetrics.solde.toLocaleString()} MGA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-slate-400 text-[10px] uppercase">Demandes en attente</p>
                <p className="font-bold text-amber-300">{financialMetrics.pendingCount} en attente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Distinct Module Tabs Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-2 border-t border-slate-800/60 py-2">
          <button
            onClick={() => setCurrentTab('caisse')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'caisse'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Registre & Gestion de Caisse
          </button>

          <button
            onClick={() => setCurrentTab('demandes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'demandes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            Demandes & Validations (72h)
            {financialMetrics.pendingCount > 0 && (
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                {financialMetrics.pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('comptes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'comptes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Comptes Opérationnels Membres
          </button>

          <button
            onClick={() => setCurrentTab('journal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'journal'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Grand Journal des Transactions
          </button>

          <button
            onClick={() => setCurrentTab('audit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              currentTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Audit & Traçabilité Opérations
          </button>
        </div>
      </div>

      {/* Main Workspace for Operations */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6">
        {isLoading && (
          <div className="mb-4 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Synchronisation des écritures de caisse et opérations...
          </div>
        )}

        {/* Tab 1: Caisse */}
        {currentTab === 'caisse' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <CaisseOperationsTab
              currentUser={loginUser}
              currentUserRole={currentUserRole}
              allMembers={allMembers}
              allTransactions={allTransactions}
            />
          </div>
        )}

        {/* Tab 2: Demandes & Validations */}
        {currentTab === 'demandes' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Demandes d'Opérations & Validation Sous 72 Heures
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Les agents de terrain soumettent des demandes d'entrées/sorties de fonds nécessitant la validation de la direction financière.
              </p>
            </div>

            {requestsList.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-700">Aucune demande en attente de validation</p>
                <p className="text-xs mt-1">Toutes les opérations de caisse soumises ont été traitées.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Membre Rattaché</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Montant</th>
                      <th className="px-4 py-3">Motif & Justification</th>
                      <th className="px-4 py-3">Demandeur</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requestsList.map((req) => (
                      <tr key={req.key} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-500 font-mono">
                          {new Date(req.createdAt).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800">{req.memberName}</span>
                          <span className="block text-[11px] text-slate-400 font-mono">{req.matricule}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.type === 'MIDITRA' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {req.type === 'MIDITRA' ? 'ENTRÉE' : 'SORTIE'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {Number(req.montant).toLocaleString()} MGA
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {req.motif}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {req.operator || 'Agent'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => void handleApproveRequest(req.key, req)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Valider
                            </button>
                            <button
                              onClick={() => void handleRejectRequest(req.key, req)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg border border-rose-200 transition cursor-pointer flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Rejeter
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Member Operational Accounts */}
        {currentTab === 'comptes' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <MemberAccountDashboard
              allMembers={allMembers}
              allTransactions={allTransactions}
              currentUser={loginUser}
              currentUserRole={currentUserRole}
              parametres={sysParams}
            />
          </div>
        )}

        {/* Tab 4: Transactions Log */}
        {currentTab === 'journal' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
            <TransactionsFormAndLog
              allMembers={allMembers}
              allTransactions={allTransactions}
              accountingRequests={operationRequests}
              currentUserRole={currentUserRole}
              loginUser={loginUser}
              onAddTransaction={handleAddTransaction}
              onApproveRequest={handleApproveRequest}
              onRejectRequest={handleRejectRequest}
              onDeleteTransaction={handleDeleteTransaction}
              exportTransactionsPDF={exportTransactionsPDF}
            />
          </div>
        )}

        {/* Tab 5: Audit & Security Logs */}
        {currentTab === 'audit' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <LogsList
              logs={logs}
              currentUserRole={currentUserRole}
              onClearLogs={async () => {
                if (!window.confirm('⚠️ Effacer le journal d’audit des opérations ?')) return;
                await requestRtdb('/logs.json', { method: 'DELETE' });
                await saveActionLog('LOGS_PURGE', 'Journal des opérations réinitialisé.');
                await loadOperationsData();
              }}
              onDeleteLog={async (id) => {
                await FirebaseService.deleteLog(id);
                await loadOperationsData();
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
