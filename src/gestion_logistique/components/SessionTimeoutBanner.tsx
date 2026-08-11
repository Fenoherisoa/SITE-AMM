import React from 'react';
import { Clock, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const SessionTimeoutBanner: React.FC = () => {
  const { sessionTimeLeft, extendSession, logout, isAuthenticated } = useAuth();

  // Only show warning when less than 120 seconds (2 mins) remain
  if (!isAuthenticated || sessionTimeLeft > 120) return null;

  const minutes = Math.floor(sessionTimeLeft / 60);
  const seconds = sessionTimeLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full bg-slate-900 border-2 border-amber-500 rounded-2xl p-4 shadow-2xl animate-bounce-short text-white text-xs">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-amber-950 text-amber-400 border border-amber-800 shrink-0">
          <AlertTriangle className="h-6 w-6 animate-pulse" />
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-amber-300">Avertissement d'Expiration de Session</h4>
            <span className="font-mono font-extrabold text-sm px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              {timeFormatted}
            </span>
          </div>

          <p className="text-slate-300 text-[11px] leading-relaxed">
            Votre session va fermer automatiquement suite à une inactivité. Voulez-vous prolonger votre session ?
          </p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={extendSession}
              className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Prolonger la Session</span>
            </button>

            <button
              onClick={() => logout('Déconnexion anticipée lors de l\'avertissement d\'inactivité')}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Quitter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
