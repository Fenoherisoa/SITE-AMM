import React, { useState } from 'react';
import { Terminal, Trash2, ShieldCheck, MailCheck, Settings, Filter } from 'lucide-react';
import { ActionLog } from '../types';

interface Props {
  logs: ActionLog[];
  currentUserRole: string;
  onClearLogs: () => void;
  onDeleteLog: (id: string) => void;
}

export default function LogsList({
  logs,
  currentUserRole,
  onClearLogs,
  onDeleteLog
}: Props) {
  const [operatorFilter, setOperatorFilter] = useState("ALL");
  const [pageSize, setPageSize] = useState(50);

  // Group unique operators
  const operators = Array.from(new Set(logs.map(l => l.operator).filter(Boolean)));

  const filteredLogs = logs
    .filter(l => operatorFilter === "ALL" || l.operator === operatorFilter)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const displayedLogs = filteredLogs.slice(0, pageSize);

  const isPresident = currentUserRole === 'NATIONAL_PRESIDENT';

  return (
    <div className="flex flex-col h-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm m-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-4 border-b border-slate-150">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span className="p-1.5 bg-slate-900 rounded-lg text-white">
              <Terminal className="h-5 w-5" />
            </span>
            <span className="text-slate-900 uppercase tracking-wide">Journal d'Audit & Operations (Logs)</span>
          </h3>
          <p className="text-slate-500 text-xs mt-1">Traçabilité complète des transactions financières et modifications d'adhésion</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 select-none">
            <Filter className="h-4 w-4 text-slate-400" />
            <span>Opérateur:</span>
            <select
              value={operatorFilter}
              onChange={e => setOperatorFilter(e.target.value)}
              className="bg-transparent text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">Tout</option>
              {operators.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
          </div>

          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="text-xs text-slate-600 font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 cursor-pointer outline-none"
          >
            <option value={20}>20 lignes</option>
            <option value={50}>50 lignes</option>
            <option value={100}>100 lignes</option>
            <option value={500}>500 lignes</option>
          </select>

          {isPresident && (
            <button
              onClick={onClearLogs}
              className="text-rose-600 hover:bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all uppercase"
            >
              Vider l'historique
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100 font-mono text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white border-b border-slate-200 select-none">
              <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Timestamp</th>
              <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Opérateur</th>
              <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Action clé</th>
              <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Détails d'Audit d'Activité</th>
              <th className="p-3 font-bold uppercase tracking-wider text-[10px] text-center">Fafana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {displayedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="p-3 text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </td>
                <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                  {log.operator}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-50 border border-slate-200 font-bold text-slate-700">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 leading-relaxed break-words max-w-lg">
                  {log.details}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => log.id && onDeleteLog(log.id)}
                    disabled={!isPresident}
                    className="p-1 text-slate-400 hover:text-red-500 rounded transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Supprimer ce log précis"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {displayedLogs.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-xs">Aucun log trouvé dans le journal.</div>
        )}
      </div>
    </div>
  );
}
