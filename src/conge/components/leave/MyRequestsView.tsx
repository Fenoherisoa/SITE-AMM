import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getLeaveRequests } from '../../services/dbService';
import { LeaveRequest, LeaveStatus, LEAVE_TYPES_INFO } from '../../types';
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Plus, 
  ChevronRight 
} from 'lucide-react';

interface MyRequestsViewProps {
  onOpenNewRequest: () => void;
  onSelectRequest: (req: LeaveRequest) => void;
}

export const MyRequestsView: React.FC<MyRequestsViewProps> = ({
  onOpenNewRequest,
  onSelectRequest,
}) => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRequests = async () => {
    if (!profile) return;
    setLoading(true);
    const data = await getLeaveRequests({ userId: profile.uid });
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [profile?.uid]);

  const filtered = requests.filter(r => {
    if (activeStatus !== 'ALL' && r.status !== activeStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        r.reason.toLowerCase().includes(term) ||
        r.leaveType.toLowerCase().includes(term) ||
        r.startDate.includes(term) ||
        r.endDate.includes(term)
      );
    }
    return true;
  });

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Approuvé
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            Refusé
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            Annulé
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            En Attente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Mes Demandes de Congés
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historique personnel, statut de validation et solde restant
          </p>
        </div>

        <button
          onClick={onOpenNewRequest}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Demande</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 md:pb-0">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeStatus === st
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st === 'ALL' && 'Toutes'}
              {st === 'PENDING' && 'En Attente'}
              {st === 'APPROVED' && 'Approuvées'}
              {st === 'REJECTED' && 'Refusées'}
              {st === 'CANCELLED' && 'Annulées'}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher dans mes demandes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Table of Requests */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span>Chargement de l'historique...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div className="font-semibold text-sm">Aucune demande de congé trouvée</div>
            <p className="text-xs max-w-sm mx-auto">
              {searchTerm || activeStatus !== 'ALL'
                ? 'Essayez de réinitialiser vos filtres de recherche.'
                : 'Vous n\'avez pas encore soumis de demande de congé pour l\'année 2026.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Dates / Période</th>
                  <th className="py-3 px-4 text-center">Jours Ouvrés</th>
                  <th className="py-3 px-4">Motif</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((req, idx) => {
                  const info = LEAVE_TYPES_INFO[req.leaveType] || LEAVE_TYPES_INFO['ANNUAL_PAID'];
                  return (
                    <tr
                      key={req.id ? `my-req-${req.id}-${idx}` : `my-req-${idx}`}
                      onClick={() => onSelectRequest(req)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <span className={`px-2 py-0.5 rounded border ${info.badgeBg} ${info.badgeText} text-[11px]`}>
                          {info.frenchLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <div className="font-medium">
                          Du {req.startDate} au {req.endDate}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {req.isHalfDayStart ? 'Début après-midi' : ''} {req.isHalfDayEnd ? 'Fin matin' : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {req.totalDays}j
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {req.reason}
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(req.status)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 inline-block" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
