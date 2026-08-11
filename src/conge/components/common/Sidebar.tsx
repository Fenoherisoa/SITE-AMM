import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  CalendarDays, 
  CheckSquare, 
  Users, 
  Settings, 
  ShieldCheck,
  Building2,
  HelpCircle
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'my-requests' 
  | 'submit-request' 
  | 'team-calendar' 
  | 'approvals' 
  | 'directory' 
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingApprovalCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  pendingApprovalCount 
}) => {
  const { isManager, isHR, isSuperAdmin, profile } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Tableau de bord',
      sublabel: 'Dashboard Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'my-requests' as ActiveTab,
      label: 'Mes Demandes',
      sublabel: 'My Leave History',
      icon: FileText,
      badge: null,
    },
    {
      id: 'team-calendar' as ActiveTab,
      label: 'Planning de l\'équipe',
      sublabel: 'Team Availability Calendar',
      icon: CalendarDays,
      badge: null,
    },
  ];

  const managerItems = isManager ? [
    {
      id: 'approvals' as ActiveTab,
      label: 'Validation des Congés',
      sublabel: 'Manager / HR Approvals',
      icon: CheckSquare,
      badge: pendingApprovalCount > 0 ? pendingApprovalCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
  ] : [];

  const adminItems = (isHR || isSuperAdmin) ? [
    {
      id: 'directory' as ActiveTab,
      label: 'Salariés & Crédits',
      sublabel: 'Employee Leave Balances',
      icon: Users,
      badge: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Jours Fériés & Logs',
      sublabel: 'Holidays & Audit Rules',
      icon: Settings,
      badge: null,
    },
  ] : [];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col justify-between shrink-0 hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Quick Action Button */}
        <button
          onClick={() => setActiveTab('submit-request')}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouvelle Demande</span>
        </button>

        {/* General Navigation */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
            Menu Principal
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-semibold border-l-4 border-cyan-500 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                    <div>
                      <div>{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.sublabel}</div>
                    </div>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Manager Navigation Section */}
        {managerItems.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-indigo-500" />
              Espace Manager
            </div>
            <nav className="space-y-1">
              {managerItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border-l-4 border-indigo-500 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                      <div>
                        <div>{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.sublabel}</div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Admin Navigation Section */}
        {adminItems.length > 0 && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
              Administration & RH
            </div>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border-l-4 border-emerald-500 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                      <div>
                        <div>{item.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{item.sublabel}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80">
        <div className="p-3 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-[11px] space-y-1">
          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-cyan-600" />
            {profile?.departmentName || 'Corporate HR'}
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-[10px]">
            Année 2026 • Convention Collective Syntec / Métallurgie
          </div>
        </div>
      </div>
    </aside>
  );
};
