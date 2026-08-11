import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getLeaveRequests } from '../../services/dbService';
import { LeaveRequest, LEAVE_TYPES_INFO } from '../../types';
import { 
  CheckSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Building2, 
  ShieldAlert,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';

interface ApprovalManagementViewProps {
  onSelectRequest: (req: LeaveRequest) => void;
  onRefreshPendingCount: () => void;
}

export const ApprovalManagementView: React.FC<ApprovalManagementViewProps> = ({
  onSelectRequest,
  onRefreshPendingCount,
}) => {
  const { profile, isHR, isSuperAdmin } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string>('PENDING');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');

  const fetchRequests = async () => {
    setLoading(true);
    // If HR or Admin, fetch all. If Manager, filter by department or show all.
    const filterDept = (!isHR && !isSuperAdmin && profile?.departmentId) ? profile.departmentId : undefined;
    const data = await getLeaveRequests({ departmentId: filterDept });
    setRequests(data);
    setLoading(false);
    onRefreshPendingCount();
  };

  useEffect(() => {
    fetchRequests();
  }, [profile?.departmentId]);

  const filtered = requests.filter(r => {
    if (activeStatus !== 'ALL' && r.status !== activeStatus) return false;
    if (departmentFilter !== 'ALL' && r.departmentId !== departmentFilter) return false;
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Validation des Congés (Manager & RH)
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                {pendingCount} en attente
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Examinez, validez ou refusez les demandes de vos collaborateurs
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0 w-full sm:w-auto">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setActiveStatus(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeStatus === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st === 'PENDING' && 'En Attente de Validation'}
              {st === 'APPROVED' && 'Validés'}
              {st === 'REJECTED' && 'Refusés'}
              {st === 'ALL' && 'Historique Complet'}
            </button>
          ))}
        </div>

        {(isHR || isSuperAdmin) && (
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">Tous les départements</option>
            <option value="dept-eng">Engineering & Product</option>
            <option value="dept-hr">Human Resources</option>
            <option value="dept-mkt">Marketing & Sales</option>
            <option value="dept-fin">Finance & Operations</option>
          </select>
        )}
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Chargement des demandes à valider...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center mx-auto">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div className="font-semibold text-sm">Aucune demande dans cette catégorie</div>
            <p className="text-xs">Toutes les demandes ont été traitées.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((req, idx) => {
              const info = LEAVE_TYPES_INFO[req.leaveType] || LEAVE_TYPES_INFO['ANNUAL_PAID'];
              return (
                <div
                  key={req.id ? `app-req-${req.id}-${idx}` : `app-req-${idx}`}
                  onClick={() => onSelectRequest(req)}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                      {req.userDisplayName.charAt(0)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {req.userDisplayName}
                        </span>
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${info.badgeBg} ${info.badgeText}`}>
                          {info.frenchLabel}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          Du {req.startDate} au {req.endDate}
                        </span>
                        <span>•</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {req.totalDays} jour(s) ouvré(s)
                        </span>
                        <span>•</span>
                        <span className="text-slate-500">{req.departmentName}</span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic">
                        "{req.reason}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div>
                      {req.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          À Valider
                        </span>
                      )}
                      {req.status === 'APPROVED' && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          Approuvé
                        </span>
                      )}
                      {req.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          Refusé
                        </span>
                      )}
                    </div>

                    <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
