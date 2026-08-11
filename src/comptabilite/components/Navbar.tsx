import React, { useState } from 'react';
import {
  PlusCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { CompanyConfig } from '../types/accounting';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../types/auth';

interface NavbarProps {
  companyConfig: CompanyConfig;
  onOpenNewEntry: () => void;
  onOpenProfile: () => void;
  onOpenUserManagement: () => void;
  isSyncing: boolean;
  syncError?: string | null;
  activeEntriesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  companyConfig,
  onOpenNewEntry,
  onOpenProfile,
  onOpenUserManagement,
  isSyncing,
  syncError,
  activeEntriesCount,
}) => {
  const { userProfile, permissions, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const roleMeta = userProfile ? (ROLE_LABELS[userProfile.role] || ROLE_LABELS['ASSISTANT COMPTABLE']) : null;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-inner border border-blue-400">
            AMM
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                {companyConfig.name}
              </h1>
              <span className="bg-blue-900/80 text-blue-300 text-[10px] px-2 py-0.5 rounded border border-blue-700/50 font-mono hidden sm:inline-block">
                COMPTABILITÉ
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span>{companyConfig.legalForm}</span>
              <span>•</span>
              <span className="font-mono text-slate-300">NIF: {companyConfig.taxId}</span>
            </p>
          </div>
        </div>

        {/* Center: Fiscal Year & Realtime Firebase Status */}
        <div className="hidden lg:flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Exercice:</span>
            <span className="font-semibold text-slate-200">{companyConfig.fiscalYear}</span>
            <span className="text-slate-500">({companyConfig.currencySymbol})</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
            {syncError ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">Mode Local</span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span className="text-blue-300">Sync Firebase...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Firebase Temps Réel</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Actions & User Profile Menu */}
        <div className="flex items-center space-x-3">
          
          {/* New Entry Button (restricted if role cannot create entries) */}
          {permissions?.canCreateEntries && (
            <button
              onClick={onOpenNewEntry}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nouvelle Écriture</span>
            </button>
          )}

          {/* User Profile Pill */}
          {userProfile && (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 p-1.5 pr-2.5 rounded-xl transition-all focus:outline-none"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center border border-blue-400">
                  {userProfile.displayName.substring(0, 2).toUpperCase()}
                </div>

                <div className="text-left hidden md:block">
                  <span className="text-xs font-bold text-slate-100 block leading-tight">
                    {userProfile.displayName}
                  </span>
                  <span className="text-[10px] text-blue-400 font-mono font-semibold block">
                    {userProfile.role}
                  </span>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 animate-fadeIn">
                  
                  <div className="p-2.5 border-b border-slate-800">
                    <span className="font-bold text-white block">{userProfile.displayName}</span>
                    <span className="text-slate-400 font-mono text-[11px] block">{userProfile.email}</span>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${roleMeta?.badgeColor}`}>
                      {userProfile.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors font-medium text-left"
                  >
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Mon Profil & Session</span>
                  </button>

                  {permissions?.canAccessUserManagement && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenUserManagement();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-purple-300 hover:text-white hover:bg-purple-950/60 rounded-xl transition-colors font-medium text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>Gestion des Utilisateurs</span>
                    </button>
                  )}

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-xl transition-colors font-medium text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Se Déconnecter</span>
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
