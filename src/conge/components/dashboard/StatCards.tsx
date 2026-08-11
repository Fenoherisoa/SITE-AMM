import React from 'react';
import { LeaveBalance } from '../../types';
import { Calendar, Stethoscope, Clock, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

interface StatCardsProps {
  balance: LeaveBalance | null;
  onNewRequest: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ balance, onNewRequest }) => {
  if (!balance) return null;

  const annualPaidRemaining = balance.annualPaid.total - balance.annualPaid.used - balance.annualPaid.pending;
  const sickLeaveRemaining = balance.sickLeave.total - balance.sickLeave.used - balance.sickLeave.pending;
  const rttRemaining = balance.rtt.total - balance.rtt.used - balance.rtt.pending;

  const cards = [
    {
      title: 'Congé Payé (Annual Leave)',
      total: balance.annualPaid.total,
      used: balance.annualPaid.used,
      pending: balance.annualPaid.pending,
      remaining: Math.max(0, annualPaidRemaining),
      color: 'emerald',
      bgGrad: 'from-emerald-500/10 to-emerald-600/5',
      borderColor: 'border-emerald-200 dark:border-emerald-900',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
      progressColor: 'bg-emerald-500',
      icon: Calendar,
    },
    {
      title: 'RTT (Time Off)',
      total: balance.rtt.total,
      used: balance.rtt.used,
      pending: balance.rtt.pending,
      remaining: Math.max(0, rttRemaining),
      color: 'cyan',
      bgGrad: 'from-cyan-500/10 to-cyan-600/5',
      borderColor: 'border-cyan-200 dark:border-cyan-900',
      iconBg: 'bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400',
      progressColor: 'bg-cyan-500',
      icon: Clock,
    },
    {
      title: 'Congé Maladie (Sick Leave)',
      total: balance.sickLeave.total,
      used: balance.sickLeave.used,
      pending: balance.sickLeave.pending,
      remaining: Math.max(0, sickLeaveRemaining),
      color: 'rose',
      bgGrad: 'from-rose-500/10 to-rose-600/5',
      borderColor: 'border-rose-200 dark:border-rose-900',
      iconBg: 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400',
      progressColor: 'bg-rose-500',
      icon: Stethoscope,
    },
    {
      title: 'Congé Sans Solde (Unpaid)',
      total: 'N/A',
      used: balance.unpaid.used,
      pending: 0,
      remaining: 'Illimité',
      color: 'amber',
      bgGrad: 'from-amber-500/10 to-amber-600/5',
      borderColor: 'border-amber-200 dark:border-amber-900',
      iconBg: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
      progressColor: 'bg-amber-500',
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const totalNum = typeof card.total === 'number' ? card.total : 1;
        const usedNum = typeof card.used === 'number' ? card.used : 0;
        const usedPercent = Math.min(100, Math.round((usedNum / (totalNum || 1)) * 100));

        return (
          <div
            key={`stat-card-${card.color}-${idx}`}
            className={`p-4 rounded-2xl bg-gradient-to-br ${card.bgGrad} bg-white dark:bg-slate-900 border ${card.borderColor} shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {card.remaining}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {typeof card.remaining === 'number' ? 'jours restants' : ''}
                </span>
              </div>

              {/* Progress bar */}
              {typeof card.total === 'number' && (
                <div className="mt-3 space-y-1">
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                    <div
                      className={`h-full ${card.progressColor}`}
                      style={{ width: `${usedPercent}%` }}
                    />
                    {card.pending > 0 && (
                      <div
                        className="h-full bg-amber-400 opacity-70 animate-pulse"
                        style={{ width: `${Math.min(100 - usedPercent, (card.pending / card.total) * 100)}%` }}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    <span>Utilisé: {card.used}j</span>
                    {card.pending > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        En attente: {card.pending}j
                      </span>
                    )}
                    <span>Total: {card.total}j</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
