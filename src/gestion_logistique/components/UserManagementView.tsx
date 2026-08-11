import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  UserPlus, 
  History, 
  Search, 
  Filter, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Key, 
  Clock, 
  Download, 
  RefreshCw, 
  Building2, 
  Mail, 
  Phone, 
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  UserX,
  UserCheck
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { UserRole, UserStatus, AuditEventType } from '../types';

export const UserManagementView: React.FC = () => {
  const { 
    usersList, 
    auditLogs, 
    activeRole, 
    updateUserRoleAndStatus, 
    toggleMfaForUser, 
    addUserToOrg,
    sessionTimeoutSeconds,
    setSessionTimeout,
    hasPermission 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'policies'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('Service Logistique');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('AGENT');

  // Filter Users
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filter Audit Logs
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter(l => {
    const matchesSearch = l.userEmail.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          l.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
                          l.action.toLowerCase().includes(auditSearch.toLowerCase());
    const matchesSev = auditSeverityFilter === 'ALL' || l.severity === auditSeverityFilter;
    return matchesSearch && matchesSev;
  });

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    await addUserToOrg({
      displayName: newUserName,
      email: newUserEmail,
      department: newUserDepartment,
      phone: newUserPhone,
      role: newUserRole,
      status: 'ACTIVE',
      mfaEnabled: false
    });

    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  const exportAuditLogs = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Logs_SITE_AMM_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Sécurité, Habilitations & Console RBAC</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestion de l'annuaire des utilisateurs, contrôle des rôles d'accès et journal d'audit de sécurité
          </p>
        </div>

        {hasPermission('users:manage') && (
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Ajouter un Utilisateur</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Annuaire Utilisateurs & Rôles ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Journal d'Audit de Sécurité ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'policies'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Politiques de Session & Mot de Passe</span>
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm text-xs">
            
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher nom, email, service..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-semibold"
              >
                <option value="ALL">Tous les rôles ({usersList.length})</option>
                <option value="ADMIN">ADMIN (Directeur)</option>
                <option value="LOGISTICS_MANAGER">LOGISTICS_MANAGER</option>
                <option value="FINANCIAL_OFFICER">FINANCIAL_OFFICER</option>
                <option value="AUDITOR">AUDITOR (Auditeur)</option>
                <option value="AGENT">AGENT (Magasinier)</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Utilisateur & Contact</th>
                    <th className="p-3.5">Rôle & Habilitation RBAC</th>
                    <th className="p-3.5">Direction / Service</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5">2FA / MFA</th>
                    <th className="p-3.5">Dernière Connexion</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredUsers.map((user) => {
                    const roleInfo = ROLE_LABELS[user.role];
                    const isSelf = user.email === 'admin@siteamm.org';

                    return (
                      <tr key={user.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                              ) : (
                                user.displayName.charAt(0)
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{user.displayName}</span>
                              <span className="text-[11px] text-slate-400">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          {hasPermission('users:manage') ? (
                            <select
                              value={user.role}
                              onChange={(e) => updateUserRoleAndStatus(user.uid, e.target.value as UserRole, user.status)}
                              className={`px-2.5 py-1 rounded-full text-xs font-extrabold border outline-none cursor-pointer ${roleInfo.badgeClass}`}
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="LOGISTICS_MANAGER">LOGISTICS_MANAGER</option>
                              <option value="FINANCIAL_OFFICER">FINANCIAL_OFFICER</option>
                              <option value="AUDITOR">AUDITOR</option>
                              <option value="AGENT">AGENT</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${roleInfo.badgeClass}`}>
                              {user.role}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-slate-600 dark:text-slate-300">
                          {user.department}
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {user.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <button
                            disabled={!hasPermission('users:manage')}
                            onClick={() => toggleMfaForUser(user.uid, !user.mfaEnabled)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all ${
                              user.mfaEnabled 
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300' 
                                : 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <Lock className="h-3 w-3" />
                            <span>{user.mfaEnabled ? '2FA Actif' : 'Désactivé'}</span>
                          </button>
                        </td>

                        <td className="p-3.5 text-[11px] font-mono text-slate-400">
                          {user.lastLogin.includes('T') ? user.lastLogin.replace('T', ' ').slice(0, 16) : user.lastLogin}
                        </td>

                        <td className="p-3.5 text-right">
                          {hasPermission('users:manage') && !isSelf && (
                            <button
                              onClick={() => updateUserRoleAndStatus(
                                user.uid, 
                                user.role, 
                                user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                              )}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                user.status === 'ACTIVE'
                                  ? 'text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950'
                                  : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                              }`}
                              title={user.status === 'ACTIVE' ? 'Suspendre cet utilisateur' : 'Réactiver cet utilisateur'}
                            >
                              {user.status === 'ACTIVE' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Rechercher utilisateur, action, IP..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={auditSeverityFilter}
                onChange={(e) => setAuditSeverityFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none font-semibold"
              >
                <option value="ALL">Toutes sévérités ({auditLogs.length})</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <button
                onClick={exportAuditLogs}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Exporter Logs JSON</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">ID Log & Timestamp</th>
                    <th className="p-3.5">Événement & Sévérité</th>
                    <th className="p-3.5">Utilisateur & Rôle</th>
                    <th className="p-3.5">Détails de l'Opération</th>
                    <th className="p-3.5">Adresse IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-mono text-[11px]">
                        <span className="font-bold text-slate-900 dark:text-white block">{log.id}</span>
                        <span className="text-slate-400">{log.timestamp.slice(0, 10)} {log.timestamp.slice(11, 19)}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            log.severity === 'CRITICAL' 
                              ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300' 
                              : log.severity === 'WARNING'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {log.severity}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{log.userName}</span>
                          <span className="text-[11px] text-slate-400">{log.userEmail} ({log.userRole})</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-xs">
                        {log.details}
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        {log.ipAddress || '197.220.12.89'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: POLICIES */}
      {activeTab === 'policies' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 text-xs">
          
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Gestion du Délai d'Expiration de Session (Inactivité)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { label: '5 Minutes', val: 300 },
                { label: '15 Minutes (Recommandé)', val: 900 },
                { label: '30 Minutes', val: 1800 },
                { label: '60 Minutes', val: 3600 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setSessionTimeout(opt.val)}
                  className={`p-4 rounded-2xl border text-center font-bold transition-all ${
                    sessionTimeoutSeconds === opt.val
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>Paramètres de Connexion Firebase Realtime DB</span>
            </h2>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-[11px] space-y-1">
              <div>Project ID: <b>baseamm-9c2c7</b></div>
              <div>Auth Domain: <b>baseamm-9c2c7.firebaseapp.com</b></div>
              <div>Database URL: <b>https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app/</b></div>
            </div>
          </div>

        </div>
      )}

      {/* ADD USER MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <span>Nouveau Membre de l'Organisation</span>
              </h3>
              <button onClick={() => setIsAddUserOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nom & Prénom *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="M. Babacar Seck"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Adresse E-mail *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="babacar.seck@siteamm.org"
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Direction / Service</label>
                  <input
                    type="text"
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="+221 77..."
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Rôle & Habilitation RBAC *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800 outline-none"
                >
                  <option value="LOGISTICS_MANAGER">LOGISTICS_MANAGER</option>
                  <option value="FINANCIAL_OFFICER">FINANCIAL_OFFICER</option>
                  <option value="AUDITOR">AUDITOR (Auditeur Interne)</option>
                  <option value="AGENT">AGENT (Magasinier)</option>
                  <option value="ADMIN">ADMIN (Directeur Général)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Enregistrer Membre
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
