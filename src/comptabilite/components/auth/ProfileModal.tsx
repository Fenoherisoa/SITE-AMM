import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  KeyRound,
  Lock,
  Mail,
  Building,
  Clock,
  CheckCircle2,
  XCircle,
  X,
  Save,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { updatePassword, updateProfile as updateFbProfile } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { db } from '../../lib/firebase';
import { ROLE_LABELS } from '../../types/auth';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, currentUser, permissions, logout, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'SECURITY' | 'PERMISSIONS'>('PROFILE');

  // Edit Profile fields
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [department, setDepartment] = useState(userProfile?.department || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Update fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMsg, setSecurityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  if (!isOpen || !userProfile) return null;

  const roleMeta = ROLE_LABELS[userProfile.role] || ROLE_LABELS['ASSISTANT COMPTABLE'];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      if (currentUser) {
        await updateFbProfile(currentUser, { displayName });
        await update(ref(db, `users/${userProfile.uid}`), {
          displayName,
          department,
        });
        await refreshProfile();
        setProfileMsg({ type: 'success', text: 'Profil mis à jour avec succès !' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Erreur de mise à jour.' });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityMsg(null);

    if (newPassword.length < 6) {
      setSecurityMsg({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (currentUser) {
        await updatePassword(currentUser, newPassword);
        setSecurityMsg({ type: 'success', text: 'Mot de passe modifié avec succès !' });
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error('[ProfileModal] Update password error:', err);
      let msg = 'Erreur lors du changement de mot de passe.';
      if (err.code === 'auth/requires-recent-login') {
        msg = 'Cette action nécessite une reconnexion récente pour des raisons de sécurité. Veuillez vous déconnecter et vous reconnecter.';
      }
      setSecurityMsg({ type: 'error', text: msg });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 border border-blue-400 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-600/20">
              {userProfile.displayName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-extrabold text-white">
                  {userProfile.displayName}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${roleMeta.badgeColor}`}>
                  {userProfile.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {userProfile.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-semibold px-6 pt-2">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'PROFILE'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Fiche Utilisateur</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'SECURITY'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Sécurité & Accès</span>
          </button>

          <button
            onClick={() => setActiveTab('PERMISSIONS')}
            className={`py-3 px-4 border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'PERMISSIONS'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Droits & Habilitations ({userProfile.role})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* Tab 1: Profile */}
          {activeTab === 'PROFILE' && (
            <div className="space-y-5">
              
              {/* Account Overview Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Statut du Compte</span>
                  <span className="inline-flex items-center text-emerald-400 font-semibold text-xs mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Actif & Autorisý
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">ID Unique Firebase</span>
                  <span className="font-mono text-slate-300 text-[11px] font-bold mt-0.5 block truncate">
                    {userProfile.uid}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Compte Créé Le</span>
                  <span className="text-slate-300 font-mono text-[11px] mt-0.5 block">
                    {new Date(userProfile.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Dernière Connexion</span>
                  <span className="text-slate-300 font-mono text-[11px] mt-0.5 block">
                    {userProfile.lastLoginAt ? new Date(userProfile.lastLoginAt).toLocaleString('fr-FR') : 'Actuelle'}
                  </span>
                </div>
              </div>

              {profileMsg && (
                <div className={`p-3 rounded-xl border ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                    : 'bg-red-950/80 border-red-800 text-red-200'
                }`}>
                  {profileMsg.text}
                </div>
              )}

              {/* Edit Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Nom Complet</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Département / Affectation</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer la Fiche</span>
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* Tab 2: Security */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-5">
              
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Modification du Mot de Passe</span>
                <p className="text-slate-400 text-[11px]">
                  Mettez à jour votre clé d'accès sécurisée Firebase Auth.
                </p>
              </div>

              {securityMsg && (
                <div className={`p-3 rounded-xl border ${
                  securityMsg.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                    : 'bg-red-950/80 border-red-800 text-red-200'
                }`}>
                  {securityMsg.text}
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Nouveau Mot de Passe</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Confirmer le Nouveau Mot de Passe</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl shadow-md"
                  >
                    {isUpdatingPassword ? 'Mise à jour...' : 'Changer le Mot de Passe'}
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* Tab 3: Permissions Matrix */}
          {activeTab === 'PERMISSIONS' && permissions && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                <h4 className="font-bold text-white text-xs mb-1">
                  Matrice des Habilitations : Rôle {userProfile.role}
                </h4>
                <p className="text-slate-400 text-[11px]">
                  {roleMeta.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                
                {[
                  { label: 'Accès Tableau de Bord', ok: permissions.canAccessDashboard },
                  { label: 'Journal Général', ok: permissions.canAccessJournal },
                  { label: 'Grand Livre', ok: permissions.canAccessLedger },
                  { label: 'Balance Générale', ok: permissions.canAccessTrialBalance },
                  { label: 'États Financiers (Bilan/CR)', ok: permissions.canAccessFinancialStatements },
                  { label: 'Plan Comptable', ok: permissions.canAccessChartOfAccounts },
                  { label: 'Immobilisations', ok: permissions.canAccessAssets },
                  { label: 'Rapprochement Bancaire', ok: permissions.canAccessBank },
                  { label: 'Déclarations TVA', ok: permissions.canAccessVat },
                  { label: 'Paramètres Entité', ok: permissions.canAccessSettings },
                  { label: 'Gestion Utilisateurs (Admin)', ok: permissions.canAccessUserManagement },
                  { label: 'Saisie Écritures Comptables', ok: permissions.canCreateEntries },
                  { label: 'Modification / Annulation', ok: permissions.canEditEntries },
                  { label: 'Comptabilisation Dotations', ok: permissions.canPostDepreciation },
                  { label: 'Réinitialisation Base', ok: permissions.canResetDatabase },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-slate-300 font-sans text-xs">{item.label}</span>
                    {item.ok ? (
                      <span className="text-emerald-400 text-[10px] font-bold flex items-center">
                        <Check className="w-3.5 h-3.5 mr-1" /> Autorisé
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px] flex items-center">
                        <X className="w-3.5 h-3.5 mr-1" /> Restreint
                      </span>
                    )}
                  </div>
                ))}

              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="text-red-400 hover:text-red-300 font-semibold text-xs transition-colors"
          >
            Se Déconnecter
          </button>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs px-4 py-2 rounded-xl"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
