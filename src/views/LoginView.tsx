import React, { useState } from 'react';
import { PageRoute, UserMetadata } from '../types';
import { authService } from '../services/authService';
import { Lock, Mail, KeyRound, Shield, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onNavigate: (route: PageRoute) => void;
  onLoginSuccess: (user: UserMetadata) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authService.signIn(email, password);
      setLoading(false);
      onLoginSuccess(result.user);
    } catch (err: unknown) {
      setLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Impossible de se connecter. Veuillez vérifier vos identifiants.');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-200">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-serif font-bold text-2xl shadow-lg">
            AMM
          </div>
          <h1 className="text-xl font-serif font-extrabold text-slate-900 tracking-tight">
            ASSOCIATION MALAGASY MIRAY
          </h1>
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Accès Sécurisé Réservé
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse e-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-email@amm.mg"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? (
              <span>Vérification des identifiants...</span>
            ) : (
              <>
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Se Connecter</span>
              </>
            )}
          </button>
        </form>

        {/* Notice: Restrictive Access */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
            L'accès à cet espace est strictement restreint aux membres habilités et au personnel de l'Association Malagasy Miray via Firebase Authentication.
          </p>
        </div>

      </div>
    </div>
  );
};
