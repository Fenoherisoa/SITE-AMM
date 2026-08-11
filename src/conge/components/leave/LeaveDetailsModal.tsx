import React, { useState } from 'react';
import { LeaveRequest, LEAVE_TYPES_INFO } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  approveLeaveRequest, 
  rejectLeaveRequest, 
  cancelLeaveRequest, 
  checkDepartmentCoverageConflict 
} from '../../services/dbService';
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  MessageSquare, 
  ShieldCheck, 
  Trash2,
  Building2
} from 'lucide-react';

interface LeaveDetailsModalProps {
  request: LeaveRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({
  request,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { profile, isManager, isHR, isSuperAdmin, refreshUserData } = useAuth();
  
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverageInfo, setCoverageInfo] = useState<{ hasWarning: boolean; message?: string } | null>(null);

  React.useEffect(() => {
    if (request && request.status === 'PENDING') {
      checkDepartmentCoverageConflict(request.departmentId, request.startDate, request.endDate, request.userId)
        .then(res => setCoverageInfo({ hasWarning: res.hasWarning, message: res.message }));
    }
  }, [request]);

  if (!isOpen || !request || !profile) return null;

  const info = LEAVE_TYPES_INFO[request.leaveType];
  const isOwner = request.userId === profile.uid;
  const canApproveOrReject = isManager && (!isOwner || isHR || isSuperAdmin) && request.status === 'PENDING';
  const canCancel = (isOwner || isHR || isSuperAdmin) && (request.status === 'PENDING' || request.status === 'APPROVED');

  const handleApprove = async () => {
    setError(null);
    setLoading(true);
    const res = await approveLeaveRequest(request.id, profile.uid, profile.displayName, comment);
    setLoading(false);

    if (res.success) {
      await refreshUserData();
      onRefresh();
      onClose();
    } else {
      setError(res.message || 'Failed to approve request.');
    }
  };

  const handleReject = async () => {
    if (!comment.trim()) {
      setError('Please provide a reason or comment for rejecting this request.');
      return;
    }
    setError(null);
    setLoading(true);
    const res = await rejectLeaveRequest(request.id, profile.uid, profile.displayName, comment);
    setLoading(false);

    if (res.success) {
      await refreshUserData();
      onRefresh();
      onClose();
    } else {
      setError(res.message || 'Failed to reject request.');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this leave request? Leave balance will be restored.')) return;
    setError(null);
    setLoading(true);
    const res = await cancelLeaveRequest(request.id, profile.uid, profile.displayName);
    setLoading(false);

    if (res.success) {
      await refreshUserData();
      onRefresh();
      onClose();
    } else {
      setError(res.message || 'Failed to cancel request.');
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Approuvé (Approved)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Refusé (Rejected)
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Annulé (Cancelled)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> En Attente (Pending Review)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transition-all my-8 text-xs">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${info.badgeBg} ${info.badgeText}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">{info.frenchLabel} ({info.label})</h3>
              <p className="text-xs text-slate-400">Demande #{request.id.substring(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {coverageInfo?.hasWarning && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>{coverageInfo.message}</span>
            </div>
          )}

          {/* User Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-sm">
                {request.userDisplayName.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{request.userDisplayName}</div>
                <div className="text-slate-500 text-[11px] flex items-center gap-2">
                  <span>{request.userEmail}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-cyan-500" />
                    {request.departmentName}
                  </span>
                </div>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Dates & Working Days Box */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">Période de Congé</div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                Du {request.startDate} au {request.endDate}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {request.isHalfDayStart ? 'Début: Après-midi' : 'Début: Matin'} • {request.isHalfDayEnd ? 'Fin: Matin' : 'Fin: Soir'}
              </div>
            </div>

            <div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px]">Nombre de Jours Ouvrés</div>
              <div className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
                {request.totalDays} jour(s)
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Motif / Justification:</div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed italic">
              "{request.reason}"
            </div>
          </div>

          {/* Reviewer Comment if exists */}
          {request.reviewerComment && (
            <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl">
              <div className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 mb-1">
                <MessageSquare className="w-3.5 h-3.5" />
                Commentaire de Validation ({request.reviewerName || 'Manager'}):
              </div>
              <div className="text-indigo-950 dark:text-indigo-100 italic">
                "{request.reviewerComment}"
              </div>
              {request.reviewedAt && (
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1">
                  Revu le {new Date(request.reviewedAt).toLocaleString('fr-FR')}
                </div>
              )}
            </div>
          )}

          {/* Manager Action Form */}
          {canApproveOrReject && (
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-300 dark:border-slate-700 space-y-3">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                Décision de Validation Manager / RH
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Commentaire Manager (Requis pour refus):
                </label>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ajouter une note de validation ou la raison du refus..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Refuser</span>
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approuver</span>
                </button>
              </div>
            </div>
          )}

          {/* Owner Cancel Button */}
          {canCancel && request.status !== 'CANCELLED' && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl border border-rose-200 dark:border-rose-800 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Annuler ma Demande</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
