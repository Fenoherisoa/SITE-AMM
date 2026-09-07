import React from 'react';
import { 
  BarChart2, UserPlus, FileText, CheckSquare, Landmark, 
  Terminal, ShieldCheck, Mail, Calendar, Settings, LogOut, X, Clock, HelpCircle, History
} from 'lucide-react';

interface Props {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  currentUserRole: string;
  userPermissions: Record<string, boolean>;
  unreadCount: number;
  onLogout: () => void;
  loginUser: string;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  isSidebarOpen,
  setIsSidebarOpen,
  currentUserRole,
  userPermissions,
  unreadCount,
  onLogout,
  loginUser
}: Props) {
  if (!isSidebarOpen) return null;

  const menuItems = [
    { id: "overview", label: "Overview", icon: BarChart2, perm: userPermissions.overview },
    { id: "adhesion", label: "Adhésion", icon: UserPlus, perm: userPermissions.adhesion },
    { id: "members", label: "Membres", icon: FileText, perm: userPermissions.members },
    { id: "enquetes", label: "Enquêtes", icon: CheckSquare, perm: userPermissions.enquetes },
    { id: "accounting", label: "Comptabilité", icon: Landmark, perm: userPermissions.accounting },
    { id: "operations", label: "Opérations / Caisse", icon: Clock, perm: userPermissions.operations },
    { id: "historiquetrans", label: "Transactions", icon: History, perm: userPermissions.historiquetrans || true },
    { id: "historique", label: "Logs", icon: Terminal, perm: userPermissions.historique },
    { id: "calendar", label: "Calendrier", icon: Calendar, perm: userPermissions.calendar },
    { id: "messenger", label: "Messenger", icon: Mail, perm: userPermissions.messenger, badge: unreadCount },
    { id: "security", label: "Sécurité", icon: ShieldCheck, perm: userPermissions.security },
    { id: "parametre", label: "Paramètres", icon: Settings, perm: userPermissions.parametre }
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col justify-between z-50 shadow-xl border-r border-slate-800 transition-all font-sans">
      {/* Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white cursor-pointer transition-colors">
            <X className="h-6 w-6" />
          </button>
          <span className="bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase">
            {currentUserRole}
          </span>
        </div>
        <h2 className="text-white text-lg font-bold tracking-tight text-center">AMM CONNECT</h2>
        <p className="text-slate-400 text-xs text-center mt-1 truncate">User: {loginUser}</p>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          if (!item.perm) return null;
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                active 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 cursor-pointer transition-all"
        >
          <LogOut className="h-4 w-4" />
          Deconnexion
        </button>
      </div>
    </div>
  );
}

// Inline fallback for History Icon to keep it fully self-contained and bullet-proof
function HistoryIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
