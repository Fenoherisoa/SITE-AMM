import React, { useState } from 'react';
import { 
  Building2, 
  Boxes, 
  ArrowLeftRight, 
  Wallet, 
  Users, 
  FileSpreadsheet, 
  Settings, 
  Globe, 
  Database, 
  Plus, 
  Menu, 
  X, 
  Sparkles, 
  DollarSign, 
  Euro, 
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  LogOut,
  User,
  ShieldAlert
} from 'lucide-react';
import { CurrencyCode, AssociationProfile } from '../types';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { UserProfileModal } from './UserProfileModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  profile: AssociationProfile;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  isFirebaseConnected: boolean;
  onQuickAddItem: () => void;
  onQuickAddTransaction: () => void;
  onSyncFirebase: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  profile,
  currency,
  setCurrency,
  isFirebaseConnected,
  onQuickAddItem,
  onQuickAddTransaction,
  onSyncFirebase
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const { userProfile, activeRole, logout, hasPermission } = useAuth();

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await onSyncFirebase();
    setTimeout(() => setIsSyncing(false), 800);
  };

  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: Building2 },
    { id: 'inventory', label: 'Inventaire Actifs', icon: Boxes },
    { id: 'movements', label: 'Mouvements Stock', icon: ArrowLeftRight },
    { id: 'financial', label: 'Finance & Bilan', icon: Wallet },
    { id: 'suppliers', label: 'Fournisseurs', icon: Users },
    { id: 'reports', label: 'Rapports PDF', icon: FileSpreadsheet },
    { id: 'users', label: 'Sécurité & Habilitations', icon: ShieldCheck },
    { id: 'settings', label: 'Paramètres & Sync', icon: Settings },
  ];

  const currentRoleInfo = ROLE_LABELS[activeRole || 'AGENT'];

  return (
    <>
      <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
        {/* Top Status & Brand Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-emerald-500 p-0.5 shadow-md flex items-center justify-center">
                <div className="h-full w-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-wider text-white">
                    {profile.acronym}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-medium">
                    LOGISTIQUE & FINANCE
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  {profile.subtitle}
                </p>
              </div>
            </div>

            {/* Right Controls: User Profile Badge, Sync status, Currency switcher, Quick Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* User Profile Badge Button */}
              {userProfile && (
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 transition-all text-left group shadow-sm"
                  title="Cliquer pour gérer votre profil et tester les rôles RBAC"
                >
                  <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {userProfile.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt={userProfile.displayName} className="h-full w-full object-cover" />
                    ) : (
                      userProfile.displayName.charAt(0)
                    )}
                  </div>
                  <div className="hidden md:block">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                        {userProfile.displayName.split(' ')[0]}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold border ${currentRoleInfo.badgeClass}`}>
                        {activeRole}
                      </span>
                    </div>
                  </div>
                </button>
              )}

              {/* Realtime Firebase Sync Badge */}
              <button
                onClick={handleSyncClick}
                title="Cliquer pour forcer la synchronisation avec Firebase Realtime DB"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isFirebaseConnected 
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60' 
                    : 'bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900/60'
                }`}
              >
                <Database className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden xl:inline">
                  {isFirebaseConnected ? 'Firebase Synchro' : 'Mode Hors-Ligne'}
                </span>
                <span className={`h-2 w-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              </button>

              {/* Currency Switcher */}
              <div className="hidden sm:flex items-center rounded-lg bg-slate-800 p-1 border border-slate-700 text-xs">
                <button
                  onClick={() => setCurrency('XOF')}
                  className={`px-2 py-1 rounded-md font-semibold transition-all ${
                    currency === 'XOF' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  FCFA
                </button>
                <button
                  onClick={() => setCurrency('EUR')}
                  className={`px-2 py-1 rounded-md font-semibold transition-all ${
                    currency === 'EUR' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  EUR (€)
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-2 py-1 rounded-md font-semibold transition-all ${
                    currency === 'USD' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  USD ($)
                </button>
              </div>

              {/* Quick Add Dropdown / Action */}
              <div className="hidden xl:flex items-center gap-2">
                {hasPermission('inventory:write') && (
                  <button
                    onClick={onQuickAddItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Article</span>
                  </button>
                )}
                {hasPermission('financial:write') && (
                  <button
                    onClick={onQuickAddTransaction}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Finance</span>
                  </button>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={() => logout('Déconnexion depuis le bouton d\'en-tête')}
                title="Fermer la session"
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white lg:hidden border border-slate-700"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Main Tab Navigation Bar */}
        <nav className="hidden lg:block border-t border-slate-800/80 bg-slate-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-indigo-600/90 text-white shadow-md border border-indigo-500/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  onQuickAddItem();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold text-center"
              >
                + Nouvel Article
              </button>
              <button
                onClick={() => {
                  onQuickAddTransaction();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold text-center"
              >
                + Nouvelle Finance
              </button>
            </div>
          </div>
        )}
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};
