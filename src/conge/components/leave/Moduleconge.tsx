import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { database } from '../../services/firebase';
import { ref, onValue } from 'firebase/database';
import { COLS } from '../../services/seedService';
import { 
  createLeaveRequest, 
  getPublicHolidays, 
  checkDepartmentCoverageConflict 
} from '../../services/dbService';
import { calculateWorkingDays } from '../../services/workingDays';
import { 
  LeaveRequest, 
  LeaveBalance, 
  LeaveType, 
  PublicHoliday, 
  LEAVE_TYPES_INFO 
} from '../../types';
import { StatCards } from '../dashboard/StatCards';
import { LeaveDetailsModal } from './LeaveDetailsModal';
import { SubmitLeaveModal } from './SubmitLeaveModal';
import { MyRequestsView } from './MyRequestsView';
import { 
  LayoutDashboard, 
  CalendarDays, 
  History, 
  User, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ShieldCheck, 
  Info, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Sparkles, 
  CreditCard, 
  Mail, 
  Phone, 
  Building2, 
  RefreshCw
} from 'lucide-react';

export type TabType = 'dashboard' | 'request' | 'history' | 'profile';

export const Moduleconge: React.FC = () => {
  const { profile, balance: authBalance, refreshUserData } = useAuth();

  // Active navigation tab state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Real-time Firebase data states
  const [userRequests, setUserRequests] = useState<LeaveRequest[]>([]);
  const [realtimeBalance, setRealtimeBalance] = useState<LeaveBalance | null>(authBalance);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [loadingRealtime, setLoadingRealtime] = useState<boolean>(true);

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);

  // Embedded Request Form State for 'request' tab
  const [leaveType, setLeaveType] = useState<LeaveType>('ANNUAL_PAID');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 86400000 * 11).toISOString().split('T')[0]
  );
  const [isHalfDayStart, setIsHalfDayStart] = useState<boolean>(false);
  const [isHalfDayEnd, setIsHalfDayEnd] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [coverageWarning, setCoverageWarning] = useState<string | null>(null);

  // Load public holidays once
  useEffect(() => {
    getPublicHolidays().then(setPublicHolidays);
  }, []);

  // 1. REAL-TIME FIREBASE SYNCHRONIZATION FOR LEAVE REQUESTS
  useEffect(() => {
    if (!database || !profile?.uid) {
      setLoadingRealtime(false);
      return;
    }

    const requestsRef = ref(database, COLS.REQUESTS);
    const unsubscribe = onValue(
      requestsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const allRequests: LeaveRequest[] = Object.values(val);
          // Filter ONLY for current connected applicant
          const filtered = allRequests.filter((req) => req.userId === profile.uid);
          // Sort descending by creation date
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setUserRequests(filtered);
        } else {
          setUserRequests([]);
        }
        setLoadingRealtime(false);
      },
      (err) => {
        console.error('Realtime requests error:', err);
        setLoadingRealtime(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid]);

  // 2. REAL-TIME FIREBASE SYNCHRONIZATION FOR LEAVE BALANCE
  useEffect(() => {
    if (!database || !profile?.uid) return;

    const balanceRef = ref(database, `${COLS.BALANCES}/${profile.uid}_2026`);
    const unsubscribe = onValue(
      balanceRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setRealtimeBalance(snapshot.val());
        } else if (authBalance) {
          setRealtimeBalance(authBalance);
        }
      },
      (err) => {
        console.error('Realtime balance error:', err);
      }
    );

    return () => unsubscribe();
  }, [profile?.uid, authBalance]);

  // Working days calculation for embedded request form
  const calculatedDays = calculateWorkingDays(
    startDate,
    endDate,
    publicHolidays,
    isHalfDayStart,
    isHalfDayEnd
  ).totalWorkingDays;

  // Credit availability calculation
  const getRemainingCredit = () => {
    const bal = realtimeBalance || authBalance;
    if (!bal) return 0;
    if (leaveType === 'ANNUAL_PAID') return bal.annualPaid.total - bal.annualPaid.used - bal.annualPaid.pending;
    if (leaveType === 'SICK_LEAVE') return bal.sickLeave.total - bal.sickLeave.used - bal.sickLeave.pending;
    if (leaveType === 'RTT') return bal.rtt.total - bal.rtt.used - bal.rtt.pending;
    return 999;
  };

  const remainingCredit = getRemainingCredit();
  const isCreditExceeded = leaveType !== 'UNPAID' && leaveType !== 'SPECIAL_LEAVE' && calculatedDays > remainingCredit;

  // Real-time coverage check for embedded form
  useEffect(() => {
    if (profile?.departmentId && startDate && endDate) {
      checkDepartmentCoverageConflict(profile.departmentId, startDate, endDate, profile.uid)
        .then((res) => {
          if (res.hasWarning && res.message) {
            setCoverageWarning(res.message);
          } else {
            setCoverageWarning(null);
          }
        });
    }
  }, [startDate, endDate, profile?.departmentId, profile?.uid]);

  // Handle embedded leave request submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (calculatedDays <= 0) {
      setFormError('Veuillez sélectionner une période valide contenant des jours ouvrés.');
      return;
    }

    if (isCreditExceeded) {
      setFormError(`Solde insuffisant: ${calculatedDays} jour(s) demandé(s) vs ${remainingCredit} jour(s) disponible(s).`);
      return;
    }

    if (!reason.trim()) {
      setFormError('Veuillez renseigner un motif explicatif pour votre demande.');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await createLeaveRequest(
        {
          userId: profile!.uid,
          userDisplayName: profile!.displayName,
          userEmail: profile!.email,
          departmentId: profile!.departmentId || 'dept-gen',
          departmentName: profile!.departmentName || 'Entreprise',
          leaveType,
          startDate,
          endDate,
          totalDays: calculatedDays,
          reason: reason.trim(),
          isHalfDayStart,
          isHalfDayEnd,
        },
        publicHolidays
      );

      if (res.success) {
        setFormSuccess('Votre demande de congé a été transmise avec succès !');
        setReason('');
        await refreshUserData();
        // Redirect to history tab after 1.5 seconds
        setTimeout(() => {
          setActiveTab('history');
          setFormSuccess(null);
        }, 1500);
      } else {
        setFormError(res.message || 'Échec de l’envoi de la demande.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Une erreur est survenue lors de la transmission.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenDetails = (req: LeaveRequest) => {
    setSelectedRequest(req);
    setIsDetailsModalOpen(true);
  };

  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Connexion requise pour accéder à l'espace demandeur.
      </div>
    );
  }

  // Calculate quick summary metrics
  const pendingCount = userRequests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = userRequests.filter((r) => r.status === 'APPROVED').length;
  const totalDaysTaken = userRequests
    .filter((r) => r.status === 'APPROVED')
    .reduce((acc, r) => acc + (r.totalDays || 0), 0);

  const permissionKeys = [
    { key: 'accounting', label: 'Comptabilité' },
    { key: 'adhesion', label: 'Adhésion' },
    { key: 'calendar', label: 'Calendrier' },
    { key: 'enquetes', label: 'Enquêtes' },
    { key: 'historique', label: 'Historique' },
    { key: 'historiquetrans', label: 'Historique Trans.' },
    { key: 'members', label: 'Membres' },
    { key: 'messenger', label: 'Messagerie' },
    { key: 'operations', label: 'Opérations' },
    { key: 'overview', label: 'Vue d’ensemble' },
    { key: 'parametre', label: 'Paramètres' },
    { key: 'security', label: 'Sécurité' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Module Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 rounded-xl">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Espace Demandeur (Mpangataka)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestion de vos congés, solde personnel et historique
            </p>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => setActiveTab('request')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'request'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Demande</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historique ({userRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mon Profil</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Session Demandeur • {profile.departmentName || 'Entreprise'}</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                Bonjour, {profile.displayName}
              </h2>
              <p className="text-xs text-slate-300 max-w-xl">
                Consultez vos soldes de congés en temps réel, suivez l’avancement de vos demandes et soumettez vos absences en toute simplicité.
              </p>
            </div>

            <div className="flex items-center gap-2.5 z-10 shrink-0">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Demander un Congé</span>
              </button>
            </div>
          </div>

          {/* Real-time StatCards Component */}
          <div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Vos Soldes de Congés Réels (Mise à Jour Firebase en Direct)</span>
            </div>
            <StatCards 
              balance={realtimeBalance || authBalance} 
              onNewRequest={() => setActiveTab('request')} 
            />
          </div>

          {/* Quick Metrics & Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Demandes</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {userRequests.length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Demandes enregistrées</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">En Attente de Validation</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {pendingCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">En cours d'examen manager</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Demandes Approuvées</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {approvedCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Congés accordés</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Jours Valider Pris</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {totalDaysTaken} j
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Total jours effectifs 2026</div>
            </div>
          </div>

          {/* Recent Requests Preview List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Dernières Demandes Soumises</h3>
              </div>
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1"
              >
                <span>Voir tout l'historique</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingRealtime ? (
              <div className="p-6 text-center text-xs text-slate-400">Chargement des données en temps réel...</div>
            ) : userRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Aucune demande enregistrée. Cliquez sur "Nouvelle Demande" pour effectuer votre première demande.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {userRequests.slice(0, 5).map((req, idx) => {
                  const info = LEAVE_TYPES_INFO[req.leaveType] || LEAVE_TYPES_INFO['ANNUAL_PAID'];
                  return (
                    <div
                      key={req.id ? `dash-req-${req.id}-${idx}` : `dash-req-${idx}`}
                      onClick={() => handleOpenDetails(req)}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 rounded-xl cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-0.5 rounded border ${info.badgeBg} ${info.badgeText} text-[10px] font-bold`}>
                          {info.frenchLabel}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            Du {req.startDate} au {req.endDate} ({req.totalDays}j)
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">{req.reason}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                          req.status === 'REJECTED' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                          req.status === 'CANCELLED' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' :
                          'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          {req.status === 'PENDING' ? 'En attente' :
                           req.status === 'APPROVED' ? 'Approuvé' :
                           req.status === 'REJECTED' ? 'Refusé' : 'Annulé'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REQUEST (NOUVELLE DEMANDE) */}
      {activeTab === 'request' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2.5 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Formulaire de Demande de Congé</h3>
              <p className="text-xs text-slate-500">Calcul automatique des jours ouvrés & vérification de solde en direct</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5 text-xs">
            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {coverageWarning && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <span className="font-semibold block">Attention à la couverture d'équipe :</span>
                  <span>{coverageWarning}</span>
                </div>
              </div>
            )}

            {/* Leave Type Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Type de Congé Souhaité
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(Object.keys(LEAVE_TYPES_INFO) as LeaveType[]).map((typeKey, idx) => {
                  const info = LEAVE_TYPES_INFO[typeKey];
                  const isSelected = leaveType === typeKey;
                  return (
                    <button
                      key={`leave-type-opt-${typeKey}-${idx}`}
                      type="button"
                      onClick={() => setLeaveType(typeKey)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200 ring-2 ring-cyan-500/30'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{info.frenchLabel}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{info.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Remaining Credit Display */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-slate-600 dark:text-slate-300">Crédit disponible pour ce type:</span>
              </div>
              <span className={`font-bold ${isCreditExceeded ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {leaveType === 'UNPAID' || leaveType === 'SPECIAL_LEAVE' ? 'Illimité / Sur dossier' : `${remainingCredit} jour(s)`}
              </span>
            </div>

            {/* Date Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date de Début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
                <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHalfDayStart}
                    onChange={(e) => setIsHalfDayStart(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Commencer l'après-midi (demi-journée)</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date de Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
                <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isHalfDayEnd}
                    onChange={(e) => setIsHalfDayEnd(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Terminer le midi (demi-journée)</span>
                </label>
              </div>
            </div>

            {/* Working Days Calculation Banner */}
            <div className="p-4 bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="font-bold text-cyan-900 dark:text-cyan-200 block text-xs">
                  Nombre de Jours Ouvrés Effectifs:
                </span>
                <span className="text-[11px] text-cyan-700 dark:text-cyan-300">
                  Calcul automatique (hors week-ends et jours fériés légaux)
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-cyan-700 dark:text-cyan-300">
                  {calculatedDays}
                </span>
                <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 block">
                  jour(s)
                </span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Motif explicatif / Justification
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Congés annuels d'été, obligations personnelles, RDV médical..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none text-xs"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={formSubmitting || isCreditExceeded}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {formSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Envoi en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>Soumettre ma Demande de Congé</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: HISTORY (HISTORIQUE) */}
      {activeTab === 'history' && (
        <MyRequestsView
          onOpenNewRequest={() => setActiveTab('request')}
          onSelectRequest={handleOpenDetails}
        />
      )}

      {/* TAB 4: PROFILE (PROFIL & PERMISSIONS) */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Profil Demandeur & Permissions</h3>
                <p className="text-xs text-slate-500">Données enregistrées en base Firebase Realtime</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-lg border border-indigo-200 dark:border-indigo-800">
              Rôle: {profile.role}
            </span>
          </div>

          {/* User Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-cyan-600" />
                Nom Complet
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {profile.displayName}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
                Numéro CIN
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {profile.cin || 'Non renseigné'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-cyan-600" />
                E-mail Professionnel
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {profile.email}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-cyan-600" />
                Numéro Téléphone
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {profile.phone || 'Non renseigné'}
              </div>
            </div>
          </div>

          {/* Department & Job Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                  Département
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {profile.departmentName || 'Direction Générale'}
                </div>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {profile.departmentId || 'dept-gen'}
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                  Identifiant Système (UID)
                </div>
                <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {profile.uid}
                </div>
              </div>
            </div>
          </div>

          {/* User Database Permissions Matrix */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Matrice des Permissions Système Attribuées</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {permissionKeys.map((p, idx) => {
                const isGranted = profile.permissions && profile.permissions[p.key] === true;
                return (
                  <div
                    key={`perm-key-${p.key}-${idx}`}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      isGranted
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-medium text-[11px] truncate">{p.label}</span>
                    {isGranted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 ml-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Leave Request Details & Cancellation Modal */}
      <LeaveDetailsModal
        request={selectedRequest}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedRequest(null);
        }}
        onRefresh={() => refreshUserData()}
      />

      {/* MODAL 2: New Leave Submission Modal */}
      <SubmitLeaveModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onRequestSubmitted={() => {
          refreshUserData();
          setActiveTab('history');
        }}
      />
    </div>
  );
};

export default Moduleconge;
