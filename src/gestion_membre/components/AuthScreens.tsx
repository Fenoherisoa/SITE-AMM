import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Key, Mail, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';

interface Props {
  authScreen: string;
  setAuthScreen: (screen: string) => void;
  isAuthLoading: boolean;
  loginUser: string;
  setLoginUser: (v: string) => void;
  loginPass: string;
  setLoginPass: (v: string) => void;
  regUser: string;
  setRegUser: (v: string) => void;
  regPass: string;
  setRegPass: (v: string) => void;
  regToken: string;
  setRegToken: (v: string) => void;
  forgotUser: string;
  setForgotUser: (v: string) => void;
  tempCode: string;
  setTempCode: (v: string) => void;
  newPass: string;
  setNewPass: (v: string) => void;
  confirmPass: string;
  setConfirmPass: (v: string) => void;
  forgotStep: boolean | number;
  handleLogin: () => void;
  handleSelfRegister: () => void;
  handleForgotRequest: () => void;
  handleVerifyCode: () => void;
  handleResetFinal: () => void;
}

export default function AuthScreens({
  authScreen,
  setAuthScreen,
  isAuthLoading,
  loginUser,
  setLoginUser,
  loginPass,
  setLoginPass,
  regUser,
  setRegUser,
  regPass,
  setRegPass,
  regToken,
  setRegToken,
  forgotUser,
  setForgotUser,
  tempCode,
  setTempCode,
  newPass,
  setNewPass,
  confirmPass,
  setConfirmPass,
  forgotStep,
  handleLogin,
  handleSelfRegister,
  handleForgotRequest,
  handleVerifyCode,
  handleResetFinal,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center p-4 font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. LOGIN SCREEN */}
      {authScreen === "login" && (
        <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100 animate-fade-in-up">
          <img src={logo} className="w-20 h-20 mx-auto mb-4 object-contain" alt="Logo" />
          <h2 className="text-xl font-extrabold text-slate-900 text-center tracking-tight uppercase">AMM CONNECT</h2>
          <p className="text-slate-400 text-xs text-center mt-1 uppercase tracking-wider font-semibold">Web ERP Portal</p>
          
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Username / Identifiant</label>
              <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2.5 mt-1 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                <User className="h-5 w-5 text-slate-400 mr-2" />
                <input 
                  type="text" 
                  className="w-full bg-transparent text-sm text-slate-900 outline-none" 
                  placeholder="Entrer matricule ou login..." 
                  value={loginUser} 
                  onChange={e => setLoginUser(e.target.value)} 
                  autoCapitalize="none"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password / Teny Miafina</label>
              <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2.5 mt-1 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                <Lock className="h-5 w-5 text-slate-400 mr-2" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full bg-transparent text-sm text-slate-900 outline-none" 
                  placeholder="••••••••" 
                  value={loginPass} 
                  onChange={e => setLoginPass(e.target.value)} 
                />
                <button onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogin}
            disabled={isAuthLoading}
            className={`w-full py-3.5 rounded-lg text-sm font-bold text-white tracking-widest transition-all mt-6 shadow-md ${
              isAuthLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
            }`}
          >
            {isAuthLoading ? "CONNEXION EN COURS..." : "SE CONNECTER AU SYSTÈME"}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button onClick={() => setAuthScreen("register")} className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer">
              S'inscrire (Self-Register)
            </button>
            <button onClick={() => setAuthScreen("forgot")} className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer">
              Mot de passe oublié ?
            </button>
          </div>
        </div>
      )}

      {/* 2. REGISTER SCREEN */}
      {authScreen === "register" && (
        <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100 animate-fade-in-up">
          <h2 className="text-xl font-extrabold text-slate-900 text-center tracking-tight uppercase">S'INSCRIRE SUR AMM</h2>
          <p className="text-slate-400 text-xs text-center mt-1">Créez votre compte à l'aide d'un Token d'invitation libre</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Identifiant souhaité</label>
              <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2.5 mt-1 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                <User className="h-5 w-5 text-slate-400 mr-2" />
                <input 
                  type="text" 
                  className="w-full bg-transparent text-sm text-slate-900 outline-none" 
                  placeholder="Choisissez un login..." 
                  value={regUser} 
                  onChange={e => setRegUser(e.target.value)} 
                  autoCapitalize="none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mot de passe</label>
              <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2.5 mt-1 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                <Lock className="h-5 w-5 text-slate-400 mr-2" />
                <input 
                  type="password" 
                  className="w-full bg-transparent text-sm text-slate-900 outline-none" 
                  placeholder="Min. 6 caractères..." 
                  value={regPass} 
                  onChange={e => setRegPass(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Token d'activation</label>
              <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2.5 mt-1 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                <Key className="h-5 w-5 text-slate-400 mr-2" />
                <input 
                  type="text" 
                  className="w-full bg-transparent text-sm text-slate-900 outline-none" 
                  placeholder="AMM-LIBRE-XXXXXX" 
                  value={regToken} 
                  onChange={e => setRegToken(e.target.value)} 
                  autoCapitalize="none"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSelfRegister}
            disabled={isAuthLoading}
            className={`w-full py-3.5 rounded-lg text-sm font-bold text-white tracking-widest transition-all mt-6 shadow-md ${
              isAuthLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
            }`}
          >
            {isAuthLoading ? "CRÉATION EN COURS..." : "CRÉER MON COMPTE"}
          </button>

          <button onClick={() => setAuthScreen("login")} className="w-full text-center mt-4 text-xs text-indigo-600 font-bold hover:underline cursor-pointer">
            Retourner se connecter
          </button>
        </div>
      )}

      {/* 3. PASSWORD RESET (FORGOT) SCREEN */}
      {authScreen === "forgot" && (
        <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100 animate-fade-in-up">
          <h2 className="text-xl font-extrabold text-slate-900 text-center tracking-tight uppercase">MOT DE PASSE OUBLIÉ</h2>

          {/* Step 1: Request code via email */}
          {!forgotStep && (
            <div className="mt-4 space-y-4">
              <p className="text-slate-400 text-xs text-center leading-normal">
                Veuillez saisir votre identifiant/matricule de membre. Nous allons vous envoyer un code de réinitialisation unique à 6 chiffres par email.
              </p>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Votre Identifiant</label>
                <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2.5 mt-1 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                  <User className="h-5 w-5 text-slate-400 mr-2" />
                  <input 
                    type="text" 
                    className="w-full bg-transparent text-sm text-slate-900 outline-none" 
                    placeholder="Matricule, ex: AT-012..." 
                    value={forgotUser} 
                    onChange={e => setForgotUser(e.target.value)} 
                    autoCapitalize="none"
                  />
                </div>
              </div>
              <button 
                onClick={handleForgotRequest}
                disabled={isAuthLoading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold tracking-wider shadow-md cursor-pointer transition-all"
              >
                {isAuthLoading ? <span className="animate-pulse">DEMANDE EN COURS...</span> : "ENVOYER LE CODE DE SÉCURITÉ"}
              </button>
            </div>
          )}

          {/* Step 2: Verify received code */}
          {forgotStep === true && (
            <div className="mt-4 space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-800 text-xs text-center font-medium">
                Un code confidentiel de sécurité a été envoyé à votre adresse e-mail.
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Entrer le code à 6 chiffres</label>
                <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2.5 mt-1 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                  <Key className="h-5 w-5 text-slate-400 mr-2" />
                  <input 
                    type="text" 
                    className="w-full bg-transparent text-sm text-slate-900 outline-none font-mono tracking-widest text-center" 
                    placeholder="000 000" 
                    value={tempCode} 
                    onChange={e => setTempCode(e.target.value)} 
                    maxLength={6}
                  />
                </div>
              </div>
              <button 
                onClick={handleVerifyCode}
                disabled={isAuthLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold tracking-wider shadow-md cursor-pointer transition-all"
              >
                VERIFIER MON CODE
              </button>
            </div>
          )}

          {/* Step 3: Change Password */}
          {forgotStep === 2 && (
            <div className="mt-4 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-indigo-800 text-xs text-center font-medium">
                Code validé ! Veuillez configurer votre nouveau mot de passe.
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nouveau Mot de Passe</label>
                <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2.5 mt-1 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                  <Lock className="h-5 w-5 text-slate-400 mr-2" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="w-full bg-transparent text-sm text-slate-900 outline-none" 
                    placeholder="Nouveau mot de passe..." 
                    value={newPass} 
                    onChange={e => setNewPass(e.target.value)} 
                  />
                  <button onClick={() => setShowPassword(!showPassword)} className="focus:outline-none">
                    {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Confirmer le Mot de Passe</label>
                <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2.5 mt-1 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                  <Lock className="h-5 w-5 text-slate-400 mr-2" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="w-full bg-transparent text-sm text-slate-900 outline-none" 
                    placeholder="Confirmez à nouveau..." 
                    value={confirmPass} 
                    onChange={e => setConfirmPass(e.target.value)} 
                  />
                </div>
              </div>
              <button 
                onClick={handleResetFinal}
                disabled={isAuthLoading}
                className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-lg text-sm font-bold tracking-wider shadow-md cursor-pointer transition-all"
              >
                METTRE À JOUR LE MOT DE PASSE
              </button>
            </div>
          )}

          <button onClick={() => setAuthScreen("login")} className="w-full text-center mt-4 text-xs text-indigo-600 font-bold hover:underline cursor-pointer">
            Retourner se connecter
          </button>
        </div>
      )}
    </div>
  );
}
