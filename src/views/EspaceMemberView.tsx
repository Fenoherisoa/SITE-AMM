import React, { useState } from 'react';
import { PageRoute, UserMetadata } from '../types';
import { MemberManagement } from '../components/MemberManagement';
import { Shield, User, FileText, Calendar, KeyRound, LogOut, CheckCircle2, Lock, Users, Award } from 'lucide-react';

interface EspaceMemberViewProps {
  currentUser: UserMetadata;
  onNavigate: (route: PageRoute) => void;
  onSignOut: () => void;
}

export const EspaceMemberView: React.FC<EspaceMemberViewProps> = ({
  currentUser,
  onNavigate,
  onSignOut
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'members' | 'documents' | 'activities'>('profile');

  const canManageMembers =
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'COORDINATOR' ||
    currentUser.permissions?.includes('members.read') ||
    currentUser.permissions?.includes('members.create');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/90 text-emerald-300 text-xs font-semibold border border-emerald-700">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Portail Institutionnel Authentifié (Firebase Auth)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            Bienvenue, {currentUser.displayName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-normal max-w-2xl">
            Compte authentifié auprès de l'Association Malagasy Miray. Identifiant unique Firebase UID : <span className="font-mono text-emerald-400 text-xs">{currentUser.uid}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Statut : {currentUser.status}
          </span>
          <button
            onClick={onSignOut}
            className="p-2.5 bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 rounded-xl transition-colors"
            title="Se Déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Nav Actions */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Mon Profil Authentifié</span>
            </button>

            {canManageMembers && (
              <button
                onClick={() => setActiveTab('members')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === 'members'
                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Gestion des Membres</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'documents'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Mes Documents</span>
            </button>

            <button
              onClick={() => setActiveTab('activities')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'activities'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Mes Activités</span>
            </button>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => onNavigate('change-password')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span>Changer le Mot de Passe</span>
              </button>

              <button
                onClick={onSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Se Déconnecter</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Lock className="w-4 h-4" />
              <span>Firebase Auth & RTDB</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
              Accès protégé avec vérification stricte du rôle ({currentUser.role}) et isolation des mots de passe.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">
                    Fiche Utilisateur Authentifiée
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Données d'identité extraites de Firebase Auth et du nœud sécurisé Realtime Database /users/{currentUser.uid}.
                  </p>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-mono font-semibold rounded-lg">
                  UID: {currentUser.uid}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium">Nom complet / Identifiant :</span>
                  <div className="font-bold text-slate-900 text-sm">{currentUser.displayName}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium">Adresse E-mail Authentifiée :</span>
                  <div className="font-bold text-slate-900 text-sm">{currentUser.email}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium">Rôle Système (RBAC) :</span>
                  <div className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>{currentUser.role}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium">Statut du compte :</span>
                  <div className="font-bold text-slate-900 text-sm">{currentUser.status}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium">Numéro CIN :</span>
                  <div className="font-bold text-slate-900 text-sm font-mono">{currentUser.cin || 'Non renseigné'}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium">Téléphone :</span>
                  <div className="font-bold text-slate-900 text-sm">{currentUser.phone || 'Non renseigné'}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium">Département / Secteur :</span>
                  <div className="font-bold text-slate-900 text-sm">{currentUser.department || 'Général'}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium">Ancienneté / Inscription :</span>
                  <div className="font-bold text-slate-900 text-sm">{currentUser.memberSince || '2026'}</div>
                </div>
              </div>

              {/* Explicit Permissions list */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Habilitations & Permissions Attribuées :</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {currentUser.permissions && currentUser.permissions.length > 0 ? (
                    currentUser.permissions.map((p, i) => (
                      <span key={i} className="px-2.5 py-1 rounded bg-slate-800 text-emerald-300 font-mono text-[11px] border border-slate-700">
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs italic">Permissions par défaut du rôle {currentUser.role}</span>
                  )}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'members' && canManageMembers && (
            <MemberManagement currentUser={currentUser} />
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-serif font-bold text-slate-900">
                  Mes Documents & Attestations
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Espace documentaire officiel (Charte, attestations de membre, relevés).
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-700" />
                    <div>
                      <div className="font-bold text-slate-900">Charte de l'Association Malagasy Miray</div>
                      <div className="text-[10px] text-slate-500">PDF • Document Officiel</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">Disponible</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-serif font-bold text-slate-900">
                  Suivi des Activités & Participations
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Historique de vos inscriptions aux rencontres et formations AMM.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">Statut de participation :</div>
                <p className="text-slate-600">Votre profil est actif et habilité à participer à l'ensemble des activités de l'association.</p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
