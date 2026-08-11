import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  LogOut, 
  User, 
  ShieldAlert, 
  ChevronDown, 
  Sparkles, 
  Sun, 
  Moon,
  CalendarDays
} from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenNewRequest: () => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, setDarkMode, onOpenNewRequest }) => {
  const { profile, logout, quickDemoLogin, isManager, isHR, isSuperAdmin } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const getRoleBadgeColor = (role?: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'HR': return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'MANAGER': return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
      default: return 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl text-white shadow-sm">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Plateforme de Congés
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
              Enterprise
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            Leave & Absence Management System
          </p>
        </div>
      </div>

      {/* Action Buttons & User Profile */}
      <div className="flex items-center space-x-3">
        {/* Quick New Request Button */}
        <button
          onClick={onOpenNewRequest}
          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Demander un Congé</span>
          <span className="md:hidden">Nouveau</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark/Light Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs">
                {profile?.displayName?.charAt(0) || 'U'}
              </div>
            )}

            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {profile?.displayName}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {profile?.jobTitle || profile?.departmentName}
              </div>
            </div>

            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getRoleBadgeColor(profile?.role)} hidden md:inline-block`}>
              {profile?.role}
            </span>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Persona Switcher Dropdown */}
          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{profile?.displayName}</p>
                <p className="text-slate-500 dark:text-slate-400 truncate">{profile?.email}</p>
                <p className="text-[11px] text-cyan-600 dark:text-cyan-400 mt-0.5">{profile?.departmentName}</p>
              </div>

              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Switch Demo Role Persona
              </div>

              <button
                onClick={() => { quickDemoLogin('EMPLOYEE'); setShowPersonaMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between text-slate-700 dark:text-slate-200"
              >
                <span>Thomas Dubois (Employee)</span>
                {profile?.role === 'EMPLOYEE' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />}
              </button>

              <button
                onClick={() => { quickDemoLogin('MANAGER'); setShowPersonaMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between text-slate-700 dark:text-slate-200"
              >
                <span>Sarah Jenkins (Manager)</span>
                {profile?.role === 'MANAGER' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </button>

              <button
                onClick={() => { quickDemoLogin('HR'); setShowPersonaMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between text-slate-700 dark:text-slate-200"
              >
                <span>Claire Moreau (HR Admin)</span>
                {profile?.role === 'HR' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </button>

              <button
                onClick={() => { quickDemoLogin('SUPER_ADMIN'); setShowPersonaMenu(false); }}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between text-slate-700 dark:text-slate-200"
              >
                <span>Alexandre Dupont (Super Admin)</span>
                {profile?.role === 'SUPER_ADMIN' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                onClick={() => { logout(); setShowPersonaMenu(false); }}
                className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-medium flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Portal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
