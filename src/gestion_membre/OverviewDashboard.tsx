import React, { useMemo, useState } from 'react';
import { 
  Users, CheckSquare, Landmark, Activity, 
  ArrowUpRight, ArrowDownLeft, Terminal, Calendar, Menu
} from 'lucide-react';
import { Member, Enquete, Transaction, ActionLog } from '../types';
import Sidebar from './Sidebar'; // Ahitsio ny lalana raha ilaina
import AdhesionForm from './AdhesionForm';

interface Props {
  allMembers?: Member[];
  allEnquetes?: Enquete[];
  allTransactions?: Transaction[];
  logs?: ActionLog[];
  events?: any[];
  currentTab?: string;
  setCurrentTab: (tab: string) => void;
  currentUserRole?: string;
  userPermissions?: Record<string, boolean>;
  unreadCount?: number;
  onLogout?: () => void;
  loginUser?: string;
  
  // Props fanampiny ilaina ho an'ny AdhesionForm (raha misy)
  isEditMode?: boolean;
  selectedEditId?: string;
  formAnarana?: string;
  setFormAnarana?: (v: string) => void;
  formCin?: string;
  setFormCin?: (v: string) => void;
  formCinRecto?: string;
  setFormCinRecto?: (v: string) => void;
  formCinVerso?: string;
  setFormCinVerso?: (v: string) => void;
  formGenre?: string;
  setFormGenre?: (v: string) => void;
  formTelephone?: string;
  setFormTelephone?: (v: string) => void;
  formTetikasa?: string;
  setFormTetikasa?: (v: string) => void;
  formDateAdhesion?: string;
  setFormDateAdhesion?: (v: string) => void;
  formDateNaissance?: string;
  setFormDateNaissance?: (v: string) => void;
  formLieuNaissance?: string;
  setFormLieuNaissance?: (v: string) => void;
  formDateDelivrance?: string;
  setFormDateDelivrance?: (v: string) => void;
  formLieuDelivrance?: string;
  setFormLieuDelivrance?: (v: string) => void;
  formDateDuplicata?: string;
  setFormDateDuplicata?: (v: string) => void;
  formLieuDuplicata?: string;
  setFormLieuDuplicata?: (v: string) => void;
  formPhoto?: string;
  setFormPhoto?: (v: string) => void;
  formEmailNotification?: string;
  setFormEmailNotification?: (v: string) => void;
  selectedProv?: string;
  setSelectedProv?: (v: string) => void;
  selectedReg?: string;
  setSelectedReg?: (v: string) => void;
  selectedDist?: string;
  setSelectedDist?: (v: string) => void;
  selectedCom?: string;
  setSelectedCom?: (v: string) => void;
  selectedFok?: string;
  setSelectedFok?: (v: string) => void;
  handleSaveMember?: () => void;
  clearMemberForm?: () => void;
}

export default function OverviewDashboard({
  allMembers = [],
  allEnquetes = [],
  allTransactions = [],
  logs = [],
  events = [],
  currentTab = 'overview',
  setCurrentTab,
  currentUserRole = 'ADMIN',
  userPermissions = {
    overview: true,
    adhesion: true,
    members: true,
    enquetes: true,
    accounting: true,
    operations: true,
    historiquetrans: true,
    historique: true,
    calendar: true,
    messenger: true,
    security: true,
    parametre: true
  },
  unreadCount = 0,
  onLogout = () => {},
  loginUser = 'Utilisateur',
  
  // Default values ho an'ny AdhesionForm props
  isEditMode = false,
  selectedEditId = '',
  formAnarana = '',
  setFormAnarana = () => {},
  formCin = '',
  setFormCin = () => {},
  formCinRecto = '',
  setFormCinRecto = () => {},
  formCinVerso = '',
  setFormCinVerso = () => {},
  formGenre = '',
  setFormGenre = () => {},
  formTelephone = '',
  setFormTelephone = () => {},
  formTetikasa = '',
  setFormTetikasa = () => {},
  formDateAdhesion = '',
  setFormDateAdhesion = () => {},
  formDateNaissance = '',
  setFormDateNaissance = () => {},
  formLieuNaissance = '',
  setFormLieuNaissance = () => {},
  formDateDelivrance = '',
  setFormDateDelivrance = () => {},
  formLieuDelivrance = '',
  setFormLieuDelivrance = () => {},
  formDateDuplicata = '',
  setFormDateDuplicata = () => {},
  formLieuDuplicata = '',
  setFormLieuDuplicata = () => {},
  formPhoto = '',
  setFormPhoto = () => {},
  formEmailNotification = '',
  setFormEmailNotification = () => {},
  selectedProv = '',
  setSelectedProv = () => {},
  selectedReg = '',
  setSelectedReg = () => {},
  selectedDist = '',
  setSelectedDist = () => {},
  selectedCom = '',
  setSelectedCom = () => {},
  selectedFok = '',
  setSelectedFok = () => {},
  handleSaveMember = () => {},
  clearMemberForm = () => {}
}: Props) {
  // State ho an'ny Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Calculations
  const metrics = useMemo(() => {
    const membersList = Array.isArray(allMembers) ? allMembers : [];
    const enquetesList = Array.isArray(allEnquetes) ? allEnquetes : [];
    const transactionsList = Array.isArray(allTransactions) ? allTransactions : [];

    const totalMembers = membersList.length;
    const femaleCount = membersList.filter(m => m.genre === 'VAVY').length;
    const maleCount = membersList.filter(m => m.genre === 'LAHY').length;
    const femPct = totalMembers > 0 ? Math.round((femaleCount / totalMembers) * 100) : 0;
    const malePct = totalMembers > 0 ? Math.round((maleCount / totalMembers) * 100) : 0;

    const totalSurveys = enquetesList.length;
    const validatedSurveys = enquetesList.filter(e => e.status === 'VALIDATED').length;

    // Financial balance
    const totalMiditra = transactionsList
      .filter(t => t.karazana === 'MIDITRA')
      .reduce((sum, t) => sum + (t.vola || 0), 0);
    const totalMivoaka = transactionsList
      .filter(t => t.karazana === 'MIVOAKA')
      .reduce((sum, t) => sum + (t.vola || 0), 0);
    const netBalance = totalMiditra - totalMivoaka;

    return {
      totalMembers,
      femPct,
      malePct,
      totalSurveys,
      validatedSurveys,
      totalMiditra,
      totalMivoaka,
      netBalance
    };
  }, [allMembers, allEnquetes, allTransactions]);

  // Project distribution
  const projectStats = useMemo(() => {
    const membersList = Array.isArray(allMembers) ? allMembers : [];
    const counts: Record<string, number> = {};
    membersList.forEach(m => {
      const proj = m.tetikasa || 'Non spécifié';
      counts[proj] = (counts[proj] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: metrics.totalMembers > 0 ? Math.round((count / metrics.totalMembers) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }, [allMembers, metrics.totalMembers]);

  const logsList = Array.isArray(logs) ? logs : [];
  const eventsList = Array.isArray(events) ? events : [];

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col relative">
      {/* SIDEBAR COMPONENT */}
      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        currentUserRole={currentUserRole}
        userPermissions={userPermissions}
        unreadCount={unreadCount}
        onLogout={onLogout}
        loginUser={loginUser}
      />

      {/* RAHA ADHESION NO VOAFIDY */}
      {currentTab === 'adhesion' ? (
        <div className="flex-1 flex flex-col">
          {/* TOP NAVIGATION BAR FOR ADHESION */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-2"
                title="Ouvrir le Menu"
              >
                <Menu className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Menu</span>
              </button>
              <h1 className="text-lg font-extrabold text-slate-900">Fisoratana Anarana (Adhésion)</h1>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Connecté en tant que <span className="text-indigo-600 font-bold">{loginUser}</span>
            </div>
          </div>

          {/* ADHESION FORM CONTAINER */}
          <div className="p-6 flex-1">
            <AdhesionForm 
              isEditMode={isEditMode}
              selectedEditId={selectedEditId}
              formAnarana={formAnarana}
              setFormAnarana={setFormAnarana}
              formCin={formCin}
              setFormCin={setFormCin}
              formCinRecto={formCinRecto}
              setFormCinRecto={setFormCinRecto}
              formCinVerso={formCinVerso}
              setFormCinVerso={setFormCinVerso}
              formGenre={formGenre}
              setFormGenre={setFormGenre}
              formTelephone={formTelephone}
              setFormTelephone={setFormTelephone}
              formTetikasa={formTetikasa}
              setFormTetikasa={setFormTetikasa}
              formDateAdhesion={formDateAdhesion}
              setFormDateAdhesion={setFormDateAdhesion}
              formDateNaissance={formDateNaissance}
              setFormDateNaissance={setFormDateNaissance}
              formLieuNaissance={formLieuNaissance}
              setFormLieuNaissance={setFormLieuNaissance}
              formDateDelivrance={formDateDelivrance}
              setFormDateDelivrance={setFormDateDelivrance}
              formLieuDelivrance={formLieuDelivrance}
              setFormLieuDelivrance={setFormLieuDelivrance}
              formDateDuplicata={formDateDuplicata}
              setFormDateDuplicata={setFormDateDuplicata}
              formLieuDuplicata={formLieuDuplicata}
              setFormLieuDuplicata={setFormLieuDuplicata}
              formPhoto={formPhoto}
              setFormPhoto={setFormPhoto}
              formEmailNotification={formEmailNotification}
              setFormEmailNotification={setFormEmailNotification}
              selectedProv={selectedProv}
              setSelectedProv={setSelectedProv}
              selectedReg={selectedReg}
              setSelectedReg={setSelectedReg}
              selectedDist={selectedDist}
              setSelectedDist={setSelectedDist}
              selectedCom={selectedCom}
              setSelectedCom={setSelectedCom}
              selectedFok={selectedFok}
              setSelectedFok={setSelectedFok}
              handleSaveMember={handleSaveMember}
              clearMemberForm={clearMemberForm}
              setCurrentTab={setCurrentTab}
            />
          </div>
        </div>
      ) : (
        /* RAHATRA NY OVERVIEW TSARA NO ASEHO */
        <>
          {/* TOP NAVIGATION BAR WITH HAMBURGER BUTTON */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-2"
                title="Ouvrir le Menu"
              >
                <Menu className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Menu</span>
              </button>
              <h1 className="text-lg font-extrabold text-slate-900">Tableau de Bord Général</h1>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Connecté en tant que <span className="text-indigo-600 font-bold">{loginUser}</span>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="p-6 space-y-6 flex-1">
            {/* 1. TOP STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* MEMBERS CARD */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Adhérents</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{metrics.totalMembers}</h3>
                  </div>
                  <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    🧔 {metrics.malePct}% M
                  </span>
                  <span className="flex items-center gap-1">
                    👩 {metrics.femPct}% F
                  </span>
                </div>
              </div>

              {/* SURVEYS CARD */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Enquêtes Réalisées</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 mt-2">{metrics.totalSurveys}</h3>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                    <CheckSquare className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-4">
                  ✅ {metrics.validatedSurveys} enquêtes validées
                </p>
              </div>

              {/* CAISSE RESERVE CARD */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Solde Trésorerie AMM</p>
                    <h3 className="text-2xl font-extrabold text-emerald-600 mt-2.5">
                      {metrics.netBalance.toLocaleString()} Ar
                    </h3>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                    <Landmark className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-2.5">
                  <span className="text-emerald-700 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    Entrée : {metrics.totalMiditra.toLocaleString()}
                  </span>
                  <span className="text-rose-700 flex items-center gap-0.5">
                    <ArrowDownLeft className="h-3 w-3" />
                    Sortie : {metrics.totalMivoaka.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* HEALTH CARD */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">État Réseau AMM</p>
                    <h3 className="text-lg font-bold text-slate-900 mt-3 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>FONCTIONNEL</span>
                    </h3>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <Activity className="h-5 w-5 text-slate-500" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-4 uppercase font-mono tracking-wider">
                  Serveur Connecté (RTDB)
                </p>
              </div>
            </div>

            {/* 2. BODY CONTENT - CHARTS AND RECENT LOGS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* PROJECT DISTRIBUTION - LEFT */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1">
                <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide">
                  📁 Répartition par Projet
                </h4>
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {projectStats.map((stat) => (
                    <div key={stat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{stat.name}</span>
                        <span className="text-indigo-600">{stat.count} ({stat.pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-indigo-600" 
                          style={{ width: `${stat.pct}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {projectStats.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">Aucun membre enregistré.</p>
                  )}
                </div>
              </div>

              {/* SYSTEM AUDIT LOGS - RIGHT */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2 uppercase tracking-wide">
                    <Terminal className="h-4.5 w-4.5 text-slate-600" />
                    <span>Journaux d'Audit Système (Historique)</span>
                  </h4>
                  <button 
                    onClick={() => setCurrentTab("historique")} 
                    className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Voir tout ({logsList.length})
                  </button>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto font-mono text-[11px] text-slate-500 divide-y divide-slate-100">
                  {logsList.slice(0, 15).map((log) => (
                    <div key={log.id} className="pt-2 flex justify-between gap-4 items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-bold">[{log.operator}]</span>
                          <span className="bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded text-[9px]">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{log.details}</p>
                      </div>
                      <span className="text-slate-400 text-[10px] whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  ))}
                  {logsList.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-8">Aucun journal enregistré.</p>
                  )}
                </div>
              </div>

              {/* Calendar Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6 lg:col-span-3">
                <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Événements à venir (Calendrier)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {eventsList.length > 0 ? eventsList.map((evt) => (
                    <div key={evt.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50 hover:shadow-md transition-all">
                      <p className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-widest">{evt.date}</p>
                      <h5 className="text-md font-extrabold text-slate-950 mt-2 leading-tight">
                        {evt.title?.toUpperCase()}
                      </h5>
                      <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                        {evt.desc}
                      </p>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 italic py-10 text-center w-full">Aucun événement planifié pour le moment.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}