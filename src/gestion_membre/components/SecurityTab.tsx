import React, { useState } from 'react';
import { ShieldCheck, Plus, Key, Trash2, ShieldAlert } from 'lucide-react';
import { UserAccount } from '../types';

interface Props {
  tokens: Record<string, { role: string; token_miasa: string }>;
  users: Record<string, UserAccount>;
  currentUserRole: string;
  loginUser: string;
  onCreateToken: (role: string, customToken?: string) => void;
  onDeleteToken: (key: string) => void;
  onUpdateUserPermissions: (username: string, permissions: Record<string, boolean>) => void;
  onDeleteUser: (username: string) => void;
}

export default function SecurityTab({
  tokens,
  users,
  currentUserRole,
  loginUser,
  onCreateToken,
  onDeleteToken,
  onUpdateUserPermissions,
  onDeleteUser
}: Props) {
  const [selectedRole, setSelectedRole] = useState("ENQUETEUR");
  const [customToken, setCustomToken] = useState("");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateToken(selectedRole, customToken.trim() || undefined);
    setCustomToken("");
  };

  const handlePermissionChange = (username: string, resource: string, checked: boolean) => {
    const user = users[username];
    if (!user) return;
    const currentPerms = user.permissions || {};
    const updatedPerms = { ...currentPerms, [resource]: checked };
    onUpdateUserPermissions(username, updatedPerms);
  };

  const isPresident = currentUserRole === 'NATIONAL_PRESIDENT';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 m-6">
      {/* 1. SEED INVITATION TOKENS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-1 space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Key className="h-5 w-5 text-indigo-600" />
            <span>CRÉATEUR TOKENS</span>
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Désignation du Rôle *</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ENQUETEUR">ENQUETEUR</option>
                <option value="PROVINCIAL_CHIEF">PROVINCIAL CHIEF</option>
                <option value="NATIONAL_PRESIDENT">NATIONAL PRESIDENT / ADMIN</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Code Token personnalisé (Optionnel)</label>
              <input
                type="text"
                value={customToken}
                onChange={e => setCustomToken(e.target.value)}
                placeholder="Laisser vide pour auto-générer..."
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={!isPresident}
              className={`w-full py-3 text-white font-bold rounded-lg text-sm transition-all focus:outline-none flex items-center justify-center gap-2 ${
                isPresident 
                  ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer shadow-sm' 
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Générer le Token Libre</span>
            </button>
          </form>
        </div>

        {/* ACTIVE TOKENS TABLE */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 select-none">
            🔑 Pool de Tokens actifs ({Object.keys(tokens).length})
          </h4>
          <div className="max-h-[220px] overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
            {Object.entries(tokens).map(([val, info]) => (
              <div key={val} className="p-3 flex items-center justify-between text-xs bg-slate-50/50">
                <div>
                  <code className="font-bold text-indigo-600 font-mono text-[11px] select-all bg-indigo-50 px-1 py-0.5 rounded">
                    {info.token_miasa}
                  </code>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Rôle: {info.role}</p>
                </div>
                <button
                  onClick={() => onDeleteToken(val)}
                  disabled={!isPresident}
                  className="p-1 rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {Object.keys(tokens).length === 0 && (
              <p className="p-4 text-center text-xs text-slate-400">Tsy misy tokens aktiva.</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. MANAGE SYSTEM USER ACCOUNTS */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
        <h3 className="text-base font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-indigo-400" />
          <span>AUTORISATIONS SYSTÈME & PERMISSIONS</span>
        </h3>

        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white select-none">
                <th className="p-3 text-xs font-bold uppercase tracking-wider">Compte Identifiant</th>
                <th className="p-3 text-xs font-bold uppercase tracking-wider">Rôle</th>
                <th className="p-3 text-xs font-bold uppercase tracking-wider text-center">Enquêtes</th>
                <th className="p-3 text-xs font-bold uppercase tracking-wider text-center">Caisse</th>
                <th className="p-3 text-xs font-bold uppercase tracking-wider text-center">Sécurité</th>
                <th className="p-3 text-xs font-bold uppercase tracking-wider text-center">Fafana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(users).map(([username, user]) => {
                const perms = user.permissions || {};
                const isUserPresident = user.role === 'NATIONAL_PRESIDENT';
                return (
                  <tr key={username} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-xs text-slate-900">
                      {username} {username === loginUser && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-bold">(Ianao)</span>}
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-150 text-slate-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perms.enquetes || false}
                        disabled={!isPresident || isUserPresident}
                        onChange={e => handlePermissionChange(username, 'enquetes', e.target.checked)}
                        className="h-3.5 w-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perms.accounting || false}
                        disabled={!isPresident || isUserPresident}
                        onChange={e => handlePermissionChange(username, 'accounting', e.target.checked)}
                        className="h-3.5 w-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={perms.security || false}
                        disabled={!isPresident || isUserPresident}
                        onChange={e => handlePermissionChange(username, 'security', e.target.checked)}
                        className="h-3.5 w-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onDeleteUser(username)}
                        disabled={!isPresident || isUserPresident || username === loginUser}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Détruire le compte"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
