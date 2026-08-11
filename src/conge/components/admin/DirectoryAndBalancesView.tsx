import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  getAllUsers, 
  getAllBalances, 
  updateUserBalance, 
  saveUserProfile 
} from '../../services/dbService';
import { UserProfile, LeaveBalance, UserRole } from '../../types';
import { 
  Users, 
  Search, 
  Edit, 
  Check, 
  Plus, 
  UserPlus, 
  ShieldCheck, 
  Building2, 
  Award,
  Save,
  X
} from 'lucide-react';

export const DirectoryAndBalancesView: React.FC = () => {
  const { isHR, isSuperAdmin } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editBalance, setEditBalance] = useState<LeaveBalance | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('EMPLOYEE');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [uData, bData] = await Promise.all([
      getAllUsers(),
      getAllBalances(2026),
    ]);
    setUsers(uData);
    setBalances(bData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartEdit = (user: UserProfile) => {
    setEditingUserId(user.uid);
    setEditRole(user.role);
    const userBal = balances.find(b => b.userId === user.uid);
    if (userBal) {
      setEditBalance({ ...userBal });
    }
  };

  const handleSaveEdit = async (user: UserProfile) => {
    if (!editBalance) return;
    setSaving(true);

    // Update user profile role if changed
    if (editRole !== user.role) {
      await saveUserProfile({ ...user, role: editRole });
    }

    // Update user balance
    await updateUserBalance(editBalance);

    setSaving(false);
    setEditingUserId(null);
    await fetchData();
  };

  const filteredUsers = users.filter(u => {
    if (departmentFilter !== 'ALL' && u.departmentId !== departmentFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        u.displayName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.jobTitle.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Répertoire Salariés & Gestion des Crédits
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administration des comptes, rôles, et plafonds d'acquisition des congés
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher nom, email ou poste..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="ALL">Tous les départements</option>
          <option value="dept-eng">Engineering & Product</option>
          <option value="dept-hr">Human Resources</option>
          <option value="dept-mkt">Marketing & Sales</option>
          <option value="dept-fin">Finance & Operations</option>
        </select>
      </div>

      {/* Directory Cards Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Chargement des comptes collaborateurs...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Salarié</th>
                  <th className="py-3 px-4">Rôle</th>
                  <th className="py-3 px-4 text-center">Congés Payés (Aquis/Total)</th>
                  <th className="py-3 px-4 text-center">RTT (Total)</th>
                  <th className="py-3 px-4 text-center">Maladie (Total)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u, idx) => {
                  const bal = balances.find(b => b.userId === u.uid);
                  const isEditing = editingUserId === u.uid;

                  return (
                    <tr key={u.uid ? `dir-user-${u.uid}-${idx}` : `dir-user-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.displayName} className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                              {u.displayName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{u.displayName}</div>
                            <div className="text-[11px] text-slate-500">{u.email} • {u.jobTitle}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          >
                            <option value="EMPLOYEE">EMPLOYEE</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="HR">HR</option>
                            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {u.role}
                          </span>
                        )}
                      </td>

                      {/* Annual Paid Leave Total */}
                      <td className="py-3 px-4 text-center font-medium">
                        {isEditing && editBalance ? (
                          <input
                            type="number"
                            value={editBalance.annualPaid.total}
                            onChange={(e) => setEditBalance({
                              ...editBalance,
                              annualPaid: { ...editBalance.annualPaid, total: Number(e.target.value) }
                            })}
                            className="w-16 px-1.5 py-0.5 text-center rounded border border-slate-300 dark:border-slate-700 text-xs"
                          />
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {bal ? `${bal.annualPaid.total - bal.annualPaid.used} / ${bal.annualPaid.total}j` : '25j'}
                          </span>
                        )}
                      </td>

                      {/* RTT Total */}
                      <td className="py-3 px-4 text-center font-medium">
                        {isEditing && editBalance ? (
                          <input
                            type="number"
                            value={editBalance.rtt.total}
                            onChange={(e) => setEditBalance({
                              ...editBalance,
                              rtt: { ...editBalance.rtt, total: Number(e.target.value) }
                            })}
                            className="w-16 px-1.5 py-0.5 text-center rounded border border-slate-300 dark:border-slate-700 text-xs"
                          />
                        ) : (
                          <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                            {bal ? `${bal.rtt.total - bal.rtt.used} / ${bal.rtt.total}j` : '10j'}
                          </span>
                        )}
                      </td>

                      {/* Sick Leave Total */}
                      <td className="py-3 px-4 text-center font-medium">
                        {isEditing && editBalance ? (
                          <input
                            type="number"
                            value={editBalance.sickLeave.total}
                            onChange={(e) => setEditBalance({
                              ...editBalance,
                              sickLeave: { ...editBalance.sickLeave, total: Number(e.target.value) }
                            })}
                            className="w-16 px-1.5 py-0.5 text-center rounded border border-slate-300 dark:border-slate-700 text-xs"
                          />
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            {bal ? `${bal.sickLeave.total - bal.sickLeave.used} / ${bal.sickLeave.total}j` : '15j'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleSaveEdit(u)}
                              disabled={saving}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                              title="Enregistrer"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 font-medium ml-auto"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Ajuster</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
