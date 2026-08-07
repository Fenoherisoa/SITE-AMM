import React from 'react';
import { PageRoute, UserMetadata } from '../types';
import { ShieldAlert, LogOut, ArrowLeft, Mail, Clock, ShieldX } from 'lucide-react';

interface AccessDeniedProps {
  currentUser: UserMetadata | null;
  onNavigate: (route: PageRoute) => void;
  onSignOut: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedProps> = ({
  currentUser,
  onNavigate,
  onSignOut
}) => {
  const getStatusMessage = () => {
    if (!currentUser) {
      return {
        title: 'Accès Réservé',
        subtitle: 'Authentification Requise',
        description: 'Vous devez être connecté avec un compte membre actif pour accéder à cet espace sécurisé.',
        badgeColor: 'bg-rose-100 text-rose-800'
      };
    }

    switch (currentUser.status) {
      case 'PENDING':
        return {
          title: 'Demande d\'Accès en Attente de Validation',
          subtitle: 'Statut : PENDING (En Cours d\'Examen)',
          description: 'Votre compte membre est actuellement en cours de vérification par les responsables habilités de l\'Association Malagasy Miray. Vous recevrez une notification dès que votre accès aura été approuvé.',
          badgeColor: 'bg-amber-100 text-amber-800'
        };
      case 'SUSPENDED':
        return {
          title: 'Compte Temporairement Suspendu',
          subtitle: 'Statut : SUSPENDED',
          description: 'L\'accès à cet espace a été temporairement suspendu par l\'administration. Pour toute réclamation ou mise à jour, veuillez contacter le secrétariat.',
          badgeColor: 'bg-rose-100 text-rose-800'
        };
      case 'REJECTED':
      case 'DISABLED':
      case 'ARCHIVED':
        return {
          title: 'Accès Non Autorisé',
          subtitle: `Statut : ${currentUser.status}`,
          description: 'Ce compte ne dispose pas des autorisations nécessaires pour accéder au portail interne.',
          badgeColor: 'bg-rose-100 text-rose-800'
        };
      default:
        return {
          title: 'Accès Refusé',
          subtitle: 'Autorisation Insuffisante',
          description: 'Vous n\'avez pas les droits suffisants pour consulter cette page.',
          badgeColor: 'bg-rose-100 text-rose-800'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900">
      <div className="max-w-lg w-full bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-200 text-center space-y-6">
        
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
          {currentUser?.status === 'PENDING' ? (
            <Clock className="w-8 h-8 text-amber-700" />
          ) : (
            <ShieldX className="w-8 h-8 text-rose-700" />
          )}
        </div>

        <div className="space-y-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusInfo.badgeColor}`}>
            {statusInfo.subtitle}
          </span>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            {statusInfo.title}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {statusInfo.description}
          </p>
        </div>

        {currentUser && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1 text-slate-700">
            <div><strong>Compte :</strong> {currentUser.displayName} ({currentUser.email})</div>
            <div><strong>Secteur :</strong> {currentUser.department || 'Général'}</div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('home')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retourner au site public</span>
          </button>

          {currentUser ? (
            <button
              onClick={onSignOut}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-50 text-rose-700 font-semibold text-xs hover:bg-rose-100 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Se Déconnecter</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800"
            >
              Se Connecter
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
