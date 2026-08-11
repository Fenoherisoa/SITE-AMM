import React, { useState } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Key, 
  LogOut, 
  Save, 
  Smartphone, 
  Lock, 
  Clock, 
  History, 
  CheckCircle2, 
  Sparkles,
  Building2,
  Mail,
  Phone,
  ShieldAlert
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { UserRole } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { 
    userProfile, 
    activeRole, 
    simulateRole, 
    updateUserProfile, 
    logout, 
    sessionTimeLeft, 
    extendSession,
    auditLogs 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile');
  
  // Profile Form state
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [department, setDepartment] = useState(userProfile?.department || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security Form state
  const [mfaEnabled, setMfaEnabled] = useState(userProfile?.mfaEnabled || false);

  if (!isOpen || !userProfile) return null;

  const currentRoleInfo = ROLE_LABELS[activeRole || 'AGENT'];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      displayName,
      department,
      phone
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleMfaToggle = async () => {
    const nextVal = !mfaEnabled;
    setMfaEnabled(nextVal);
    await updateUserProfile({ mfaEnabled: nextVal });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Filter audit logs for this user
  const userLogs = auditLogs.filter(l => l.userEmail === userProfile.email).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-6 my-8 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md overflow-hidden">
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt={userProfile.displayName} className="h-full w-full object-cover" />
              ) : (
                userProfile.displayName.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">{userProfile.displayName}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${currentRoleInfo.badgeClass}`}>
                  {activeRole}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {userProfile.email} • {userProfile.department}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Role Simulation Banner (Evaluation Mode) */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5 text-indigo-300">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Simulateur Dynamique de Rôle RBAC</span>
            </span>
            <span className="text-[10px] bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
              Test Instantané
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
            {(['ADMIN', 'LOGISTICS_MANAGER', 'FINANCIAL_OFFICER', 'AUDITOR', 'AGENT'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => simulateRole(r)}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                  activeRole === r 
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow' 
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {r.split('_')[0]}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-indigo-300/80">
            Habilitation active: <b>{currentRoleInfo.title}</b>
          </p>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profil Utilisateur</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Sécurité & MFA</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Mes Connexions</span>
          </button>
        </div>

        {/* TAB 1: PROFILE EDIT */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Modifications du profil enregistrées avec succès !</span>
              </div>
            )}

            <div>
              <label className="block font-semibold mb-1">Nom & Prénom *</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Direction / Service</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Téléphone Direct</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+221 77 000 00 00"
                  className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Adresse E-mail Institutionnelle</label>
              <input
                type="email"
                disabled
                value={userProfile.email}
                className="w-full px-3 py-2.5 rounded-xl border bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-md transition-all"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer le Profil</span>
            </button>
          </form>
        )}

        {/* TAB 2: SECURITY & SESSION */}
        {activeTab === 'security' && (
          <div className="space-y-4 text-xs">
            
            {/* Active session timer widget */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Temps Restant Avant Expiration Session</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Compte à rebours automatique suite au délai d'inactivité.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-extrabold text-base text-indigo-600 dark:text-indigo-400">
                  {formatTime(sessionTimeLeft)}
                </span>
                <button
                  onClick={extendSession}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Prolonger
                </button>
              </div>
            </div>

            {/* MFA Switch */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Authentification Double Facteur (MFA / 2FA)</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Exiger la saisie d'un code temporaire lors de chaque connexion.
                </p>
              </div>

              <button
                type="button"
                onClick={handleMfaToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  mfaEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    mfaEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-bold block">Statut Sécurité du Compte</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono">
                  Firebase Auth: <b className="text-emerald-500">Actif</b>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono">
                  Cryptage: <b className="text-emerald-500">AES-256 TLS</b>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: USER RECENT ACTIVITY LOGS */}
        {activeTab === 'activity' && (
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white">
              Dernières Opérations & Connexions de votre Compte
            </h3>

            <div className="space-y-2">
              {userLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{log.action}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{log.details}</p>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 text-right">
                    <div>{log.timestamp.slice(0, 10)}</div>
                    <div>{log.timestamp.slice(11, 16)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              logout('Déconnexion depuis le profil utilisateur');
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Fermer la Session</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-xs"
          >
            Fermer Panneau
          </button>
        </div>

      </div>
    </div>
  );
};
