import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginModal } from './components/auth/LoginModal';
import { Moduleconge } from './components/leave/Moduleconge';
import { 
  Building2, 
  LogOut, 
  Moon, 
  Sun
} from 'lucide-react';

function UnifiedPortal() {
  const { user, profile, loading, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  // Dark mode handler
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 space-y-4">
        <div className="p-3 bg-cyan-500/20 border border-cyan-400/30 rounded-2xl text-cyan-400">
          <Building2 className="w-8 h-8 animate-bounce" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold">Plateforme de Gestion de Congés</h2>
          <p className="text-xs text-slate-400 mt-1">Chargement du portail unifié SITE-AMM...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <LoginModal isOpen={true} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/20 border border-cyan-400/30 rounded-xl text-cyan-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">Portail de Gestion des Congés (SITE-AMM)</h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">Espace Utilisateur & Demandes de Congés</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* User Profile Pill */}
            <div className="flex items-center space-x-2.5 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs uppercase">
                {profile.displayName ? profile.displayName.charAt(0) : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-slate-100 text-xs truncate max-w-[140px]">{profile.displayName}</div>
                <div className="text-[10px] text-cyan-400 font-medium">{profile.role}</div>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
              title="Changer de thème"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - Module Conge */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Moduleconge />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UnifiedPortal />
    </AuthProvider>
  );
}
