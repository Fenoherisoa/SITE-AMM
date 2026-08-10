import React, { useMemo } from 'react';
import { 
  Users, CheckSquare, Landmark, Clock, Activity, 
  ArrowUpRight, ArrowDownLeft, Terminal, ShieldCheck, Calendar
} from 'lucide-react';
import { Member, Enquete, Transaction, ActionLog } from '../types';

interface Props {
  allMembers: Member[];
  allEnquetes: Enquete[];
  allTransactions: Transaction[];
  logs: ActionLog[];
  events: any[];
  setCurrentTab: (tab: string) => void;
}

export default function OverviewDashboard({
  allMembers,
  allEnquetes,
  allTransactions,
  logs,
  events,
  setCurrentTab
}: Props) {
  // Calculations
  const metrics = useMemo(() => {
    const totalMembers = allMembers.length;
    const femaleCount = allMembers.filter(m => m.genre === 'VAVY').length;
    const maleCount = allMembers.filter(m => m.genre === 'LAHY').length;
    const femPct = totalMembers > 0 ? Math.round((femaleCount / totalMembers) * 100) : 0;
    const malePct = totalMembers > 0 ? Math.round((maleCount / totalMembers) * 100) : 0;

    const totalSurveys = allEnquetes.length;
    const validatedSurveys = allEnquetes.filter(e => e.status === 'VALIDATED').length;

    // Financial balance
    const totalMiditra = allTransactions
      .filter(t => t.karazana === 'MIDITRA')
      .reduce((sum, t) => sum + t.vola, 0);
    const totalMivoaka = allTransactions
      .filter(t => t.karazana === 'MIVOAKA')
      .reduce((sum, t) => sum + t.vola, 0);
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
    const counts: Record<string, number> = {};
    allMembers.forEach(m => {
      const proj = m.tetikasa || 'Tsy fantatra';
      counts[proj] = (counts[proj] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: metrics.totalMembers > 0 ? Math.round((count / metrics.totalMembers) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  }, [allMembers, metrics.totalMembers]);

  return (
    <div className="p-6 space-y-6">
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

        {/* CAISSERESERVE CARD */}
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
              In: {metrics.totalMiditra.toLocaleString()}
            </span>
            <span className="text-rose-700 flex items-center gap-0.5">
              <ArrowDownLeft className="h-3 w-3" />
              Out: {metrics.totalMivoaka.toLocaleString()}
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
            📁 Répartition par Projet / Tetikasa
          </h4>
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {projectStats.map((stat, i) => (
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
              <p className="text-xs text-slate-400 text-center py-8">Tsy misy mpikambana voasoratra.</p>
            )}
          </div>
        </div>

        {/* SYSTEM AUDIT LOGS - RIGHT */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-950 flex items-center gap-2 uppercase tracking-wide">
              <Terminal className="h-4.5 w-4.5 text-slate-600" />
              <span>Système Audit Logs (Historique)</span>
            </h4>
            <button 
              onClick={() => setCurrentTab("historique")} 
              className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Voir tout ({logs.length})
            </button>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto font-mono text-[11px] text-slate-500 divide-y divide-slate-100">
            {logs.slice(0, 15).map((log) => (
              <div key={log.id} className="pt-2 flex justify-between gap-4 items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 font-bold">[{log.operator}]</span>
                    <span className="bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.2 rounded text-[9px]">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{log.details}</p>
                </div>
                <span className="text-slate-400 text-[10px] whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Tsy misy logs voarakitra.</p>
            )}
          </div>
        </div>

        {/* Calendar Section - Atambaro ho col-span-3 mba ho lava be */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6 lg:col-span-3">
          <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wide flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Hetsika ho avy (Calendar)
          </h4>
          
          {/* Amboary ho grid misy column maromaro kokoa mba ho ngeza */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {events.length > 0 ? events.map((evt) => (
              <div key={evt.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50 hover:shadow-md transition-all">
                {/* Date: Omeo loko mampiavaka */}
                <p className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-widest">{evt.date}</p>
                
                {/* Title: Omeo habe lehibe kokoa */}
                <h5 className="text-md font-extrabold text-slate-950 mt-2 leading-tight">
                  {evt.title.toUpperCase()}
                </h5>
                
                {/* Desc: Asio toerana malalaka kokoa */}
                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {evt.desc}
                </p>
              </div>
            )) : (
              <p className="text-sm text-slate-400 italic py-10 text-center w-full">Tsy misy hetsika voalahatra amin'izao fotoana izao.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
