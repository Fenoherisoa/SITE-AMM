import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Key,
  ShieldAlert,
  Clock,
  Briefcase,
  Mail,
  UserCheck,
  Activity,
  UserX,
} from 'lucide-react';
import { AuthService } from '../../services/authService';
import { UserProfile, UserRole, UserStatus, AuditLogEntry, ROLE_LABELS } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';

export const UserManagementView: React.FC = () => {
  const { userProfile: currentUserProfile, permissions } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'USERS' | 'AUDIT'>('USERS');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // New User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('COMPTABLE');
  const [newDept, setNewDept] = useState('Service Comptabilité');
  const [modalMessage, setModalMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Role Modal State
  const [selectedUserForRole, setSelectedUserForRole] = useState<UserProfile | null>(null);
  const [updatedRole, setUpdatedRole] = useState<UserRole>('COMPTABLE');

  useEffect(() => {
    const unsubUsers = AuthService.subscribeToUsers((data) => {
      setUsers(data);
    });

    const unsubLogs = AuthService.subscribeToAuditLogs((logs) => {
      setAuditLogs(logs);
    });

    return () => {
      unsubUsers();
      unsubLogs();
    };
  }, []);

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserProfile || !permissions?.canManageUsers) return;
    setModalMessage(null);
    setIsSubmitting(true);

    try {
      await AuthService.adminCreateUser(
        newEmail,
        newPass,
        newName,
        newRole,
        newDept,
        currentUserProfile
      );
      setModalMessage({ type: 'success', text: 'Nouvel utilisateur créé avec succès !' });
      setTimeout(() => {
        setShowAddModal(false);
        setNewEmail('');
        setNewPass('');
        setNewName('');
      }, 1200);
    } catch (err: any) {
      console.error('[UserManagement] Create user error:', err);
      let msg = 'Échec de la création d\'utilisateur.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Cet email est déjà utilisé par un autre compte.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Le mot de passe doit comporter au moins 6 caractères.';
      } else if (err.message) {
        msg = err.message;
      }
      setModalMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    if (!currentUserProfile || !permissions?.canManageUsers) return;
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const actionText = newStatus === 'DISABLED' ? 'désactiver' : 'réactiver';

    if (
      window.confirm(
        `Êtes-vous sûr de vouloir ${actionText} le compte de ${user.displayName} (${user.email}) ?`
      )
    ) {
      try {
        await AuthService.toggleUserStatus(
          user.uid,
          user.email,
          newStatus,
          currentUserProfile
        );
      } catch (err) {
        console.error('[UserManagement] Toggle status error:', err);
      }
    }
  };

  const handleSaveRoleChange = async () => {
    if (!selectedUserForRole || !currentUserProfile || !permissions?.canManageUsers) return;
    try {
      await AuthService.updateUserRole(
        selectedUserForRole.uid,
        selectedUserForRole.email,
        updatedRole,
        currentUserProfile
      );
      setSelectedUserForRole(null);
    } catch (err) {
      console.error('[UserManagement] Update role error:', err);
    }
  };

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const accountantCount = users.filter((u) => u.role === 'COMPTABLE' || u.role === 'ASSISTANT COMPTABLE').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-white">
              Gestion des Utilisateurs & Habilitations (RBAC)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Contrôle d'accès strict selon les 5 rôles autorisés (ADMIN, DIRECTEUR, COMPTABLE, GESTIONNAIRE, ASSISTANT COMPTABLE).
          </p>
        </div>

        {permissions?.canManageUsers && (
          <button
            onClick={() => {
              setModalMessage(null);
              setShowAddModal(true);
            }}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-md shadow-purple-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouveau Membre</span>
          </button>
        )}
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Utilisateurs Enregistrés</span>
            <span className="text-2xl font-extrabold text-white block mt-1 font-mono">{users.length}</span>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl text-slate-300">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Comptes Actifs</span>
            <span className="text-2xl font-extrabold text-emerald-400 block mt-1 font-mono">{activeCount}</span>
          </div>
          <div className="p-3 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-800/50">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Administrateurs</span>
            <span className="text-2xl font-extrabold text-purple-400 block mt-1 font-mono">{adminCount}</span>
          </div>
          <div className="p-3 bg-purple-950/60 text-purple-400 rounded-xl border border-purple-800/50">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase">Équipe Comptable</span>
            <span className="text-2xl font-extrabold text-blue-400 block mt-1 font-mono">{accountantCount}</span>
          </div>
          <div className="p-3 bg-blue-950/60 text-blue-400 rounded-xl border border-blue-800/50">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Content View with Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        
        {/* Navigation Tabs Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-950/50">
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'USERS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Répertoire des Comptes ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'AUDIT'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Journal d'Audit & Sécurité ({auditLogs.length})</span>
            </button>
          </div>

          {activeTab === 'USERS' && (
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2"
              >
                <option value="ALL">Tous les rôles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="DIRECTEUR">DIRECTEUR</option>
                <option value="COMPTABLE">COMPTABLE</option>
                <option value="GESTIONNAIRE">GESTIONNAIRE</option>
                <option value="ASSISTANT COMPTABLE">ASSISTANT COMPTABLE</option>
              </select>

              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Rechercher nom, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2"
                />
              </div>
            </div>
          )}

        </div>

        {/* Tab 1: Users List */}
        {activeTab === 'USERS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-700/60">
                <tr>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Email Pro</th>
                  <th className="p-3">Rôle & Habilitation</th>
                  <th className="p-3">Département</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3">Dernière Connexion</th>
                  <th className="p-3 text-right">Actions Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => {
                  const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS['ASSISTANT COMPTABLE'];
                  const isCurrent = u.uid === currentUserProfile?.uid;

                  return (
                    <tr key={u.uid} className="hover:bg-slate-800/30">
                      <td className="p-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                            {u.displayName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 block">
                              {u.displayName} {isCurrent && <span className="text-[10px] text-blue-400 font-normal">(Vous)</span>}
                            </span>
                            <span className="text-[10px] text-slate-500">ID: {u.uid.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-slate-300">
                        {u.email}
                      </td>

                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${roleMeta.badgeColor}`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="p-3 text-slate-400">
                        {u.department || 'Non spécifié'}
                      </td>

                      <td className="p-3">
                        {u.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center text-emerald-400 text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-400 text-[10px] bg-red-950/60 px-2 py-0.5 rounded border border-red-800/50">
                            <XCircle className="w-3 h-3 mr-1" /> Suspendu
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : 'Jamais'}
                      </td>

                      <td className="p-3 text-right">
                        {permissions?.canManageUsers && !isCurrent && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUserForRole(u);
                                setUpdatedRole(u.role);
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium"
                            >
                              Rôle
                            </button>

                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                                u.status === 'ACTIVE'
                                  ? 'bg-red-950/60 hover:bg-red-900/80 text-red-300 border-red-800'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-800'
                              }`}
                            >
                              {u.status === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Security Audit Logs */}
        {activeTab === 'AUDIT' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-800/80 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-700/60">
                <tr>
                  <th className="p-3 w-40">Horodatage</th>
                  <th className="p-3 w-36">Action</th>
                  <th className="p-3 w-48">Utilisateur</th>
                  <th className="p-3 w-28">Rôle</th>
                  <th className="p-3">Détails de l'Événement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="p-3 text-slate-400">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="p-3 font-bold text-purple-400">
                      {log.action}
                    </td>
                    <td className="p-3 text-slate-200">
                      {log.userName} ({log.userEmail})
                    </td>
                    <td className="p-3 text-slate-400">
                      {log.userRole}
                    </td>
                    <td className="p-3 font-sans text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal: Create User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-purple-400" />
              <span>Créer un Compte Utilisateur</span>
            </h3>

            {modalMessage && (
              <div className={`p-3 rounded-xl text-xs border ${
                modalMessage.type === 'error'
                  ? 'bg-red-950/80 border-red-800 text-red-200'
                  : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              }`}>
                {modalMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nom Complet *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alice Martin"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Email Professionnel *</label>
                <input
                  type="email"
                  required
                  placeholder="alice@entreprise.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Mot de Passe Initial *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Rôle & Droits d'Accès *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-semibold"
                >
                  <option value="ADMIN">ADMIN (Administrateur)</option>
                  <option value="DIRECTEUR">DIRECTEUR (Direction)</option>
                  <option value="COMPTABLE">COMPTABLE (Chef Comptable)</option>
                  <option value="GESTIONNAIRE">GESTIONNAIRE (Logistique)</option>
                  <option value="ASSISTANT COMPTABLE">ASSISTANT COMPTABLE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Département / Service</label>
                <input
                  type="text"
                  placeholder="Ex: Service Comptabilité"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md"
                >
                  {isSubmitting ? 'Création...' : 'Créer l\'Utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Role */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>Changer le Rôle Utilisateur</span>
            </h3>

            <div className="text-xs text-slate-300">
              Utilisateur : <span className="font-bold text-white">{selectedUserForRole.displayName}</span> ({selectedUserForRole.email})
            </div>

            <div>
              <label className="block text-slate-300 mb-1 text-xs font-semibold">
                Sélectionner le Nouveau Rôle
              </label>
              <select
                value={updatedRole}
                onChange={(e) => setUpdatedRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white text-xs font-semibold"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="DIRECTEUR">DIRECTEUR</option>
                <option value="COMPTABLE">COMPTABLE</option>
                <option value="GESTIONNAIRE">GESTIONNAIRE</option>
                <option value="ASSISTANT COMPTABLE">ASSISTANT COMPTABLE</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveRoleChange}
                className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2 rounded-lg"
              >
                Enregistrer le Rôle
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
