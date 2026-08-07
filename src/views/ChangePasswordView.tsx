import React, { useState } from 'react';
import { PageRoute } from '../types';
import { authService } from '../services/authService';
import { KeyRound, Shield, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

interface ChangePasswordProps {
  onNavigate: (route: PageRoute) => void;
}

export const ChangePasswordView: React.FC<ChangePasswordProps> = ({ onNavigate }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await authService.updateCurrentPassword(currentPassword, newPassword);
      setLoading(false);
      setSubmitted(true);
    } catch (err: unknown) {
      setLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Impossible de modifier le mot de passe. Veuillez vérifier le mot de passe actuel.');
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200/90 space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-slate-900">
              Modifier votre Mot de Passe
            </h1>
            <p className="text-xs text-slate-500 font-normal">
              Mettez à jour le mot de passe d'accès à votre espace membre.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Success View */}
        {submitted ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4 animate-in fade-in text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold font-serif text-lg">Mot de passe modifié !</h3>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              Votre mot de passe a été mis à jour avec succès.
            </p>
            <button
              onClick={() => onNavigate('espace')}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow-md"
            >
              Retourner à mon Espace Membre
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mot de Passe Actuel *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nouveau Mot de Passe *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="•••••••• (min 8 caractères)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmer le Nouveau Mot de Passe *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onNavigate('espace')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Annuler</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-sm"
              >
                {loading ? 'Mise à jour...' : 'Changer le Mot de Passe'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
