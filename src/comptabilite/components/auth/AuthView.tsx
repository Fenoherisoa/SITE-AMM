import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, ROLE_LABELS } from '../../types/auth';

export const AuthView: React.FC = () => {
  const { login, resetPassword, error, clearError, isLoading } = useAuth();

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [localMessage, setLocalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);
    clearError();

    if (!email || !password) {
      setLocalMessage({ type: 'error', text: 'Veuillez remplir tous les champs obligatoires.' });
      return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      // Error handled by AuthContext or caught here
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    try {
      await resetPassword(resetEmail);
      setResetStatus('Un lien de réinitialisation sécurisé a été envoyé à votre adresse email.');
    } catch (err: any) {
      setResetStatus(err.message || "Erreur lors de l'envoi.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10 my-8">
        
        {/* Left Column: Brand & Role Identity */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-600/30 border border-blue-400">
              AMM
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                SITE-AMM AUTH
              </h1>
              <span className="text-xs text-blue-400 font-mono font-semibold tracking-wider uppercase">
                Contrôle d'Accès Sécurisé
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">
              Portail d'Authentification & Habilitations Entité
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Plateforme d'accès restreint pour la gestion logistique et la comptabilité financière SYSCOHADA. Authentification stricte via Firebase Auth & RBAC temps réel.
            </p>
          </div>

          {/* Security Badge */}
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-start space-x-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">Sécurité Renforcée (Zero Trust)</span>
              <span className="text-slate-400 text-[11px]">
                Validation réelle des identifiants et vérification dynamique des droits parmi les 5 rôles autorisés. Inscription publique désactivée.
              </span>
            </div>
          </div>

          {/* Roles Overview */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Rôles Réseau Autorisés (5 Habilitations)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {(['ADMIN', 'DIRECTEUR', 'COMPTABLE', 'GESTIONNAIRE', 'ASSISTANT COMPTABLE'] as UserRole[]).map((r) => {
                return (
                  <div
                    key={r}
                    className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center space-x-2"
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      r === 'ADMIN' ? 'bg-purple-400' :
                      r === 'DIRECTEUR' ? 'bg-indigo-400' :
                      r === 'COMPTABLE' ? 'bg-blue-400' :
                      r === 'GESTIONNAIRE' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`} />
                    <span className="text-slate-200 font-semibold">{r}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Form Card */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
              <Lock className="w-5 h-5" />
              <span>Connexion Sécurisée</span>
            </div>
            <span className="text-[10px] font-mono bg-slate-950 px-2.5 py-1 rounded-full text-slate-400 border border-slate-800">
              Accès Pré-provisionné Uniquement
            </span>
          </div>

          {/* Error / Warning Alert */}
          {(error || (localMessage && localMessage.type === 'error')) && (
            <div className="p-3.5 bg-red-950/80 border border-red-800/80 text-red-200 rounded-2xl text-xs flex items-start space-x-2 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{localMessage?.text || error}</span>
            </div>
          )}

          {/* Success Alert */}
          {localMessage && localMessage.type === 'success' && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 rounded-2xl text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{localMessage.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">
                Adresse Email Professionnelle *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-slate-300 font-semibold">
                  Mot de Passe *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetStatus(null);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all mt-2"
            >
              {isLoading ? (
                <span>Vérification Firebase Auth...</span>
              ) : (
                <>
                  <span>Se Connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">🔒 Remarque de Sécurité Administrateur</span>
            <p>
              Les créations de comptes en libre-service sont désactivées. Seul un administrateur système pré-provisionne les accès directement dans la base de données de l'entité.
            </p>
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500 font-mono">
            Firebase Authentication API • Realtime Database RBAC • SITE-AMM Enterprise
          </div>

        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-blue-400" />
              <span>Réinitialisation du Mot de Passe</span>
            </h3>

            <p className="text-xs text-slate-400">
              Saisissez l'adresse email professionnelle associée à votre compte. Un lien sécurisé vous sera envoyé par Firebase Authentication.
            </p>

            {resetStatus && (
              <div className="p-3 bg-slate-950 border border-slate-800 text-xs rounded-xl text-blue-300">
                {resetStatus}
              </div>
            )}

            <form onSubmit={handleSendReset} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Adresse Email Professionnelle
                </label>
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl"
                >
                  Envoyer le Lien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};