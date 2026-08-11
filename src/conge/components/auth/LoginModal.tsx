import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, 
  Lock, 
  User, 
  ShieldCheck, 
  AlertCircle,
  ArrowRight,
  KeyRound,
  X
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!identifier.trim() || !password.trim()) {
      setError('Veuillez saisir votre identifiant (E-mail, CIN, Téléphone ou Nom d’utilisateur) et mot de passe.');
      setLoading(false);
      return;
    }

    const res = await login(identifier, password);
    if (!res.success) {
      setError(res.error || 'Identifiants ou mot de passe incorrects.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all my-8 relative">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la fenêtre de connexion"
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center space-x-3 pr-8">
            <div className="p-3 bg-cyan-500/20 border border-cyan-400/30 rounded-xl text-cyan-400 shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Plateforme de Gestion de Congés</h2>
              <p className="text-xs text-slate-300 mt-0.5">Portail de Demande & Consultation</p>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-cyan-300">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Authentification Connexion Sécurisée
            </span>
            <span className="bg-cyan-500/10 border border-cyan-400/30 px-2 py-0.5 rounded text-[11px]">
              Firebase RTDB
            </span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Veuillez vous connecter avec vos identifiants enregistrés en base de données.</span>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Identifiant (E-mail / CIN / Téléphone / Nom d’utilisateur)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ex: raveloarison777@gmail.com, 313011041925 ou admin"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Vérification en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Se connecter au portail</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-400">
            Plateforme de Gestion des Congés • Accès Sécurisé
          </div>
        </form>
      </div>
    </div>
  );
};
