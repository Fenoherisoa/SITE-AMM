import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  createLeaveRequest, 
  getPublicHolidays, 
  checkDepartmentCoverageConflict 
} from '../../services/dbService';
import { calculateWorkingDays } from '../../services/workingDays';
import { LeaveType, PublicHoliday, LEAVE_TYPES_INFO } from '../../types';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Send,
  FileText
} from 'lucide-react';

interface SubmitLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: () => void;
}

export const SubmitLeaveModal: React.FC<SubmitLeaveModalProps> = ({
  isOpen,
  onClose,
  onRequestSubmitted,
}) => {
  const { profile, balance, refreshUserData } = useAuth();

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

  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [coverageWarning, setCoverageWarning] = useState<string | null>(null);

  useEffect(() => {
    getPublicHolidays().then(setHolidays);
  }, []);

  // Compute working days in real time
  const calc = calculateWorkingDays(startDate, endDate, holidays, isHalfDayStart, isHalfDayEnd);

  // Check balance limits
  const getRemainingCredit = () => {
    if (!balance) return 0;
    if (leaveType === 'ANNUAL_PAID') return balance.annualPaid.total - balance.annualPaid.used - balance.annualPaid.pending;
    if (leaveType === 'SICK_LEAVE') return balance.sickLeave.total - balance.sickLeave.used - balance.sickLeave.pending;
    if (leaveType === 'RTT') return balance.rtt.total - balance.rtt.used - balance.rtt.pending;
    return 999;
  };

  const remainingCredit = getRemainingCredit();
  const isCreditExceeded = leaveType !== 'UNPAID' && leaveType !== 'SPECIAL_LEAVE' && calc.totalWorkingDays > remainingCredit;

  // Real-time department coverage check
  useEffect(() => {
    if (profile?.departmentId && startDate && endDate) {
      checkDepartmentCoverageConflict(profile.departmentId, startDate, endDate, profile.uid)
        .then(res => {
          if (res.hasWarning && res.message) {
            setCoverageWarning(res.message);
          } else {
            setCoverageWarning(null);
          }
        });
    }
  }, [startDate, endDate, profile?.departmentId, profile?.uid]);

  if (!isOpen || !profile) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (calc.totalWorkingDays <= 0) {
      setError('Please select a valid date range that includes working days.');
      return;
    }

    if (isCreditExceeded) {
      setError(`Cannot submit request: Exceeds remaining credit (${calc.totalWorkingDays} days requested vs ${remainingCredit} available).`);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a brief justification or reason for your request.');
      return;
    }

    setLoading(true);

    const res = await createLeaveRequest(
      {
        userId: profile.uid,
        userDisplayName: profile.displayName,
        userEmail: profile.email,
        departmentId: profile.departmentId,
        departmentName: profile.departmentName,
        leaveType,
        startDate,
        endDate,
        totalDays: calc.totalWorkingDays,
        reason: reason.trim(),
        isHalfDayStart,
        isHalfDayEnd,
      },
      holidays
    );

    setLoading(false);

    if (res.success) {
      await refreshUserData();
      onRequestSubmitted();
      onClose();
    } else {
      setError(res.message || 'Failed to submit leave request.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden transition-all my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Demander un Congé</h3>
              <p className="text-xs text-slate-400">Submit New Leave Request</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {coverageWarning && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <span className="font-semibold block mb-0.5">Avertissement de Couverture d'Équipe:</span>
                <span>{coverageWarning}</span>
              </div>
            </div>
          )}

          {/* Leave Type Grid Selection */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Type de Congé / Absence Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(LEAVE_TYPES_INFO) as LeaveType[]).map((typeKey, idx) => {
                const info = LEAVE_TYPES_INFO[typeKey];
                const isSelected = leaveType === typeKey;
                return (
                  <button
                    key={`modal-leave-type-${typeKey}-${idx}`}
                    type="button"
                    onClick={() => setLeaveType(typeKey)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-50/80 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200 ring-2 ring-cyan-500/30'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs">{info.frenchLabel}</div>
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

          {/* Date Picker Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date de Début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                required
              />
              <label className="mt-1.5 flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHalfDayStart}
                  onChange={(e) => setIsHalfDayStart(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Demi-journée (Après-midi uniquement)</span>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date de Fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                required
              />
              <label className="mt-1.5 flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHalfDayEnd}
                  onChange={(e) => setIsHalfDayEnd(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Demi-journée (Matin uniquement)</span>
              </label>
            </div>
          </div>

          {/* Working Days Calculation Summary */}
          <div className="p-3.5 bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="font-semibold text-cyan-900 dark:text-cyan-200 block">
                Total Jours Ouvrés Calculés:
              </span>
              <span className="text-[11px] text-cyan-700 dark:text-cyan-300">
                (Hors samedis, dimanches & jours fériés légaux)
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-cyan-700 dark:text-cyan-300">
                {calc.totalWorkingDays}
              </span>
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 block">
                jour(s)
              </span>
            </div>
          </div>

          {/* Reason Justification */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Motif / Description / Commentaire
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Précisez la raison de votre demande de congé..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none text-xs"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || isCreditExceeded}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Envoi en cours...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Soumettre la Demande</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
