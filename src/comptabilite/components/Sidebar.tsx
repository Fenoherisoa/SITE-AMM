import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Library,
  Scale,
  FileText,
  ListTree,
  Building,
  Landmark,
  Percent,
  Settings,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type TabType =
  | 'dashboard'
  | 'journal'
  | 'ledger'
  | 'trialBalance'
  | 'financialStatements'
  | 'chartOfAccounts'
  | 'assets'
  | 'bank'
  | 'vat'
  | 'settings'
  | 'userManagement';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  entriesCount: number;
  accountsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  entriesCount,
  accountsCount,
}) => {
  const { permissions, userProfile } = useAuth();

  const allMenuItems: {
    id: TabType;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    requiredPermission?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, requiredPermission: permissions?.canAccessDashboard },
    { id: 'journal', label: 'Journal Général', icon: BookOpen, badge: entriesCount, requiredPermission: permissions?.canAccessJournal },
    { id: 'ledger', label: 'Grand Livre', icon: Library, requiredPermission: permissions?.canAccessLedger },
    { id: 'trialBalance', label: 'Balance Générale', icon: Scale, requiredPermission: permissions?.canAccessTrialBalance },
    { id: 'financialStatements', label: 'États Financiers', icon: FileText, requiredPermission: permissions?.canAccessFinancialStatements },
    { id: 'chartOfAccounts', label: 'Plan Comptable', icon: ListTree, badge: accountsCount, requiredPermission: permissions?.canAccessChartOfAccounts },
    { id: 'assets', label: 'Immobilisations', icon: Building, requiredPermission: permissions?.canAccessAssets },
    { id: 'bank', label: 'Rapprochement Bancaire', icon: Landmark, requiredPermission: permissions?.canAccessBank },
    { id: 'vat', label: 'Gestion TVA', icon: Percent, requiredPermission: permissions?.canAccessVat },
    { id: 'settings', label: 'Configuration', icon: Settings, requiredPermission: permissions?.canAccessSettings },
    { id: 'userManagement', label: 'Gestion Utilisateurs', icon: Users, requiredPermission: permissions?.canAccessUserManagement },
  ];

  // Filter menu items by permissions
  const menuItems = allMenuItems.filter((item) => item.requiredPermission !== false);

  return (
    <aside className="w-full md:w-64 bg-slate-900/95 text-slate-300 border-r border-slate-800 flex-shrink-0 min-h-[calc(100vh-4rem)] p-3">
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
        <span>Menu Principal</span>
        {userProfile && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-blue-400 font-bold border border-slate-700">
            {userProfile.role}
          </span>
        )}
      </div>
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* SYSCOHADA Standard Info Footer */}
      <div className="mt-8 pt-4 border-t border-slate-800 px-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">Norme Comptable</p>
        <p className="text-[11px] mt-0.5">SYSCOHADA Révisé / PCG Général</p>
        <div className="mt-2 text-[10px] text-slate-600 font-mono">
          Système Minimal de Trésorerie & Normalisé
        </div>
      </div>
    </aside>
  );
};
