import React, { useState } from 'react';
import { PageRoute } from '../types';
import { authService } from '../services/authService';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForgotPasswordProps {
  onNavigate: (route: PageRoute) => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.sendResetPasswordEmail(email);
      setLoading(false);
      setSent(true);
    } catch (err: unknown) {
      setLoading(false);
      setError('Impossible d\'envoyer le lien de réinitialisation. Veuillez vérifier votre adresse e-mail.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-lg">
            <Mail className="w-6 h-6 text-emerald-700" />
          </div>
          <h1 className="text-xl font-serif font-bold text-slate-900">
            Mot de passe oublié ?
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Saisissez votre adresse e-mail enregistrée. Nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Success View */}
        {sent ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <h3 className="font-bold text-sm">Lien d'accès envoyé</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              Un e-mail contenant les instructions de réinitialisation a été transmis à <strong>{email}</strong>. Veuillez consulter votre boîte de réception.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => onNavigate('reset-password')}
                className="w-full py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-xs"
              >
                Poursuivre vers la réinitialisation
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-800 font-semibold text-xs hover:bg-slate-200"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="votre.email@amm.mg"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <span>Traitement...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Envoyer le Lien de Réinitialisation</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la page de connexion</span>
          </button>
        </div>

      </div>
    </div>
  );
};
