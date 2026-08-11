import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  UserCheck, 
  KeyRound, 
  Building2, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Sparkles, 
  Fingerprint, 
  Briefcase, 
  Globe, 
  Info,
  RefreshCw
} from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { UserRole } from '../types';

export const AuthScreen: React.FC = () => {
  const { 
    loginWithFirebase, 
    signupWithFirebase, 
    loginAsDemoRole, 
    resetPassword,
    mfaPending,
    mfaUser,
    verifyMfaCode,
    cancelMfa 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'demo' | 'signup' | 'forgot'>('demo');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupDepartment, setSignupDepartment] = useState('Service Logistique');
  const [signupRole, setSignupRole] = useState<UserRole>('LOGISTICS_MANAGER');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  // MFA State
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState(false);

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const res = await loginWithFirebase(loginEmail, loginPassword);
    setLoginLoading(false);

    if (!res.success && res.error) {
      setLoginError(res.error);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setSignupLoading(true);
    const res = await signupWithFirebase(
      signupEmail,
      signupPassword,
      signupName,
      signupRole,
      signupDepartment
    );
    setSignupLoading(false);

    if (!res.success && res.error) {
      setSignupError(res.error);
    } else {
      setSignupSuccess('Compte créé avec succès ! Authentification en cours...');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    const res = await resetPassword(forgotEmail);
    setForgotLoading(false);
    setForgotMessage(res.message);
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = verifyMfaCode(mfaCode);
    if (!ok) {
      setMfaError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* MFA Code Verification Modal Popup */}
      {mfaPending && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
                <Fingerprint className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Validation Double Facteur (MFA / 2FA)</h3>
                <p className="text-xs text-slate-400">Compte: {mfaUser?.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Veuillez saisir le code à 6 chiffres généré par votre application d'authentification ou le code de secours récapitulatif.
            </p>

            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={mfaCode}
                  onChange={(e) => {
                    setMfaCode(e.target.value);
                    setMfaError(false);
                  }}
                  placeholder="ex: 123456"
                  className="w-full text-center text-2xl font-mono tracking-[8px] py-3 px-4 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 outline-none focus:border-indigo-500"
                />
                {mfaError && (
                  <p className="text-xs text-rose-400 font-semibold mt-1 text-center">
                    Code de vérification non valide. Saisissez 6 chiffres.
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelMfa}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg"
                >
                  Valider Code 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Container Card */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        
        {/* Left Side Info Panel (4 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-0.5 shadow-lg flex items-center justify-center">
                <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
              <div>
                <h1 className="font-extrabold text-lg tracking-wider text-white">SITE-AMM</h1>
                <p className="text-[11px] text-indigo-400 font-semibold uppercase tracking-widest">Auth & Access Control</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white mb-2 leading-tight">
              Portail Sécurisé d'Habilitations Logistiques & Financières
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Plateforme d'authentification d'entreprise intégrant le contrôle d'accès basé sur les rôles (RBAC), Firebase Auth & Realtime DB.
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <ShieldAlert className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">Session Sécurisée ISO-27001</span>
                  <p className="text-[11px] text-slate-400">Expiration automatique en cas d'inactivité & traçabilité d'audit.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <UserCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200">5 Rôles d'Habilitation RBAC</span>
                  <p className="text-[11px] text-slate-400">Directeur, Logistique, Finance, Auditeur et Magasinier.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 mt-6">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Firebase Auth v10</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Realtime DB Ready
              </span>
            </div>
          </div>
        </div>

        {/* Right Side Auth Form (7 cols) */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          
          {/* Top Tabs Header */}
          <div>
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('demo')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'demo' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Accès Démo</span>
                </button>
                <button
                  onClick={() => setActiveTab('login')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeTab === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Se Connecter
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeTab === 'signup' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Créer un Compte
                </button>
              </div>
            </div>

            {/* TAB 1: QUICK DEMO LOGIN (EVALUATION MODE) */}
            {activeTab === 'demo' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-200 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Évaluation Immédiate des Rôles (Mode Démo)</span>
                    <p className="text-[11px] text-indigo-300/80 mt-0.5">
                      Cliquez sur un profil pour ouvrir la session avec les permissions RBAC correspondantes.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(['ADMIN', 'LOGISTICS_MANAGER', 'FINANCIAL_OFFICER', 'AUDITOR', 'AGENT'] as UserRole[]).map((role) => {
                    const info = ROLE_LABELS[role];
                    return (
                      <button
                        key={role}
                        onClick={() => loginAsDemoRole(role)}
                        className="w-full p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-indigo-500/50 text-left transition-all group flex items-center justify-between"
                      >
                        <div className="space-y-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${info.badgeClass}`}>
                              {role}
                            </span>
                            <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors">
                              {info.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {info.desc}
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-700/50 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white transition-all">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: FIREBASE LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Adresse E-mail Institutionnelle *
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="votre.nom@siteamm.org"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300">
                      Mot de Passe *
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('forgot')}
                      className="text-[11px] text-indigo-400 hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                >
                  {loginLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      <span>Se Connecter via Firebase Auth</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 3: CREATE ACCOUNT / SIGNUP */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
                {signupError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{signupError}</span>
                  </div>
                )}

                {signupSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{signupSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Nom & Prénom *</label>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="M. Ousmane Faye"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Direction / Service *</label>
                    <input
                      type="text"
                      required
                      value={signupDepartment}
                      onChange={(e) => setSignupDepartment(e.target.value)}
                      placeholder="Service Logistique"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Adresse E-mail *</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="ousmane.faye@siteamm.org"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Rôle & Habilitation Demandé *</label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="LOGISTICS_MANAGER">Responsable Logistique & Patrimoine</option>
                    <option value="FINANCIAL_OFFICER">Responsable Financier & Comptable</option>
                    <option value="AUDITOR">Auditeur Interne & Contrôleur</option>
                    <option value="AGENT">Magasinier / Agent Terrain</option>
                    <option value="ADMIN">Directeur Général (Administrateur SI)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Mot de Passe *</label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Confirmer Mot de Passe *</label>
                    <input
                      type="password"
                      required
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {signupPassword.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${
                        getPasswordStrength(signupPassword) >= 1 ? 'w-1/4 bg-rose-500' : 'w-0'
                      }`} />
                      <div className={`h-full transition-all ${
                        getPasswordStrength(signupPassword) >= 2 ? 'w-1/4 bg-amber-500' : 'w-0'
                      }`} />
                      <div className={`h-full transition-all ${
                        getPasswordStrength(signupPassword) >= 3 ? 'w-1/4 bg-blue-500' : 'w-0'
                      }`} />
                      <div className={`h-full transition-all ${
                        getPasswordStrength(signupPassword) >= 4 ? 'w-1/4 bg-emerald-500' : 'w-0'
                      }`} />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Sécurité: {['Invalide', 'Faible', 'Moyen', 'Bon', 'Excellent'][getPasswordStrength(signupPassword)]}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                >
                  {signupLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Créer le Compte Utilisateur</span>
                  )}
                </button>
              </form>
            )}

            {/* TAB 4: FORGOT PASSWORD */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  Saisissez l'adresse e-mail associée à votre compte SITE-AMM. Un lien sécurisé de réinitialisation vous sera transmis via Firebase.
                </p>

                {forgotMessage && (
                  <div className="p-3 rounded-xl bg-indigo-950/80 border border-indigo-800 text-indigo-200 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>{forgotMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Adresse E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="votre.email@siteamm.org"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Retour Connexion
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg"
                  >
                    {forgotLoading ? 'Envoi...' : 'Envoyer Instructions'}
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Footer Security Badges */}
          <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-400" />
              AES-256 Chiffrement TLS
            </span>
            <span>RGPD & ISO-27001</span>
          </div>

        </div>

      </div>

    </div>
  );
};
