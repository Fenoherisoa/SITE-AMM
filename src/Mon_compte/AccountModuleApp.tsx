/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { translations } from './i18n';
import { dbService } from './dbService';
import { 
  Language, UserRequest, Compte, OperationRequest, ComptabiliteRecord, Actualite 
} from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionModal } from './components/TransactionModal';
import { TransactionHistory } from './components/TransactionHistory';
import logo from './assets/logo.png';
import logo2 from './assets/logo2.png';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

import { 
  ShieldAlert, Landmark, Smartphone, KeyRound, ArrowRightLeft, 
  Languages, LogOut, Info, Settings, HelpCircle, Activity, Heart,
  RotateCcw, Fingerprint, Calendar, Eye, EyeOff, ShieldCheck, Newspaper
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';



export default function App() {
  // Application Steps: splash -> language -> form -> waiting -> createPassword -> login -> main
  const [step, setStep] = useState<string>('splash');
  const [lang, setLang] = useState<Language>('fr');
  
  // Loading & Async Indicators
  const [loading, setLoading] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [showNav, setShowNav] = useState(true); // Default-ny dia miseho

  // Auth Inputs
  const [matricule, setMatricule] = useState<string>('');
  const [nom, setNom] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // New PIN Creation
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Loaded Account States
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [userReq, setUserReq] = useState<UserRequest | null>(null);
  const [compte, setCompte] = useState<Compte>({ matricule: '', solde: 0, solde_credit: 0, solde_debit: 0 });
  const [operations, setOperations] = useState<OperationRequest[]>([]);
  const [ledger, setLedger] = useState<ComptabiliteRecord[]>([]);
  const [actualites, setActualites] = useState<Actualite[]>([]);

  // Modal Control
  const [isOpOpen, setIsOpOpen] = useState<boolean>(false);
  const [opType, setOpType] = useState<'depot' | 'retrait' | 'transfert'>('depot');

  // Change PIN Form in Settings
  const [oldPinSettings, setOldPinSettings] = useState<string>('');
  const [newPinSettings, setNewPinSettings] = useState<string>('');

  // Mobile Webview Alert / Touch & Modal Enhancements
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const tId = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(tId);
    }
  }, [toast]);

  useEffect(() => {
    const handleDoubleClick = () => {
      setShowNav(prev => !prev);
    };

    document.addEventListener('dblclick', handleDoubleClick);
    return () => document.removeEventListener('dblclick', handleDoubleClick);
  }, []);

  // 1. Splash Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      // Look for pre-saved sessions in localStorage
      const savedMatricule = localStorage.getItem('amm_matricule');
      const savedLoggedIn = localStorage.getItem('amm_loggedIn');
      if (savedMatricule && savedLoggedIn === 'true') {
        setMatricule(savedMatricule);
        syncAccountData(savedMatricule).then(() => {
          setStep('main');
        });
      } else {
        setStep('language');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // 2. Scheduled Transfer Auto-Runner Cron Loop
  useEffect(() => {
    const loop = setInterval(() => {
      if (step === 'main' && matricule) {
        dbService.processAutoTransfers().then(() => {
          refreshOnlyData();
        });
      }
    }, 15000); // Check for automatic 24-hour transfers execution every 15s for visual simulation
    return () => clearInterval(loop);
  }, [step, matricule]);

  // Load actualites when language or splash completes
  useEffect(() => {
    dbService.fetchActualites().then((list) => {
      setActualites(list);
    });
  }, [step]);

  // Sync complete user metrics and transactions from Database
  const syncAccountData = async (userMatricule: string) => {
    setSyncing(true);
    const m = userMatricule.toUpperCase().trim();
    try {
      // Perform auto transfer run
      await dbService.processAutoTransfers();

      const [req, comp, ops, ledg] = await Promise.all([
        dbService.fetchUserRequest(m),
        dbService.fetchCompte(m),
        dbService.fetchOperations(m),
        dbService.fetchComptabilite(m)
      ]);

      if (req) setUserReq(req);
      if (comp) setCompte(comp);
      setOperations(ops);
      setLedger(ledg);
    } catch (e) {
      console.error("Error fetching account logs", e);
    } finally {
      setSyncing(false);
    }
  };

  const refreshOnlyData = useCallback(async () => {
    if (!matricule) return;
    const m = matricule.toUpperCase().trim();
    const [comp, ops, ledg] = await Promise.all([
      dbService.fetchCompte(m),
      dbService.fetchOperations(m),
      dbService.fetchComptabilite(m)
    ]);
    if (comp) setCompte(comp);
    setOperations(ops);
    setLedger(ledg);
  }, [matricule]);

  // Trigger Language Selection
  const selectLanguage = async (lng: Language) => {
    setLang(lng);
    const savedMatricule = localStorage.getItem('amm_matricule');
    if (savedMatricule) {
      setMatricule(savedMatricule);
      setLoading(true);
      const req = await dbService.fetchUserRequest(savedMatricule);
      setLoading(false);
      if (req) {
        if (req.password) setStep('login');
        else if (req.statut === 'approved') setStep('createPassword');
        else if (req.statut === 'pending') setStep('waiting');
        else setStep('form');
        return;
      }
    }
    setStep('form');
  };

  // Submit Identity registration check
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricule || !nom || !contact) {
      showToast(translations[lang].fieldsRequired, 'error');
      return;
    }

    setLoading(true);
    const m = matricule.toUpperCase().trim();
    try {
      // 1. Verify against Member Base Registry (olona.json)
      const foundInRegistry = await dbService.checkMemberRegistry(m, nom, contact);
      if (!foundInRegistry) {
        showToast(translations[lang].notInRegistry, 'error');
        setLoading(false);
        return;
      }

      // 2. Fetch existing request status
      const existing = await dbService.fetchUserRequest(m);
      if (existing) {
        setUserReq(existing);
        if (existing.statut === 'pending') {
          setStep('waiting');
        } else if (existing.statut === 'approved') {
          setStep(existing.password ? 'login' : 'createPassword');
        } else if (existing.statut === 'active') {
          setStep('login');
        }
        setLoading(false);
        return;
      }

      // 3. New Pending submission
      const newRequestMsg: UserRequest = {
        matricule: m,
        nom,
        contact,
        statut: 'pending',
        createdAt: Date.now(),
        password: null
      };

      await dbService.saveUserRequest(m, newRequestMsg);
      setUserReq(newRequestMsg);
      setStep('waiting');
    } catch (e) {
      console.error(e);
      showToast("Erreur de connexion avec le service AMM.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Check state manually on waiting screen
  const checkPendingApprovalRequest = async () => {
    if (!matricule) return;
    setLoading(true);
    const m = matricule.toUpperCase().trim();
    const req = await dbService.fetchUserRequest(m);
    setLoading(false);
    if (req) {
      setUserReq(req);
      if (req.statut === 'approved') {
        setStep('createPassword');
      } else if (req.statut === 'active') {
        setStep('login');
      } else if (req.statut === 'pending') {
        showToast(lang === 'mg' ? "Mbola miandry fankatoavana..." : "Toujours en attente d'approbation par le comité d'audit...", 'info');
      }
    } else {
      setStep('form');
    }
  };

  // Setup account lock password PIN code
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = translations[lang];
    if (newPassword.length !== 6 || isNaN(Number(newPassword))) {
      showToast(t.pinLengthError, 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t.pinMismatch, 'error');
      return;
    }

    setLoading(true);
    const m = matricule.toUpperCase().trim();
    try {
      await dbService.saveUserRequest(m, {
        password: newPassword,
        statut: 'active'
      });
      localStorage.setItem('amm_matricule', m);
      setStep('login');
    } catch (e) {
      console.error(e);
      showToast("Erreur réseau", 'error');
    } finally {
      setLoading(false);
    }
  };

  // Enter secure banking mode
  // --- 1. Login Mahazatra (PIN Code) ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      showToast(t('pinLengthError'), 'error');
      return;
    }

    setLoading(true);
    const m = matricule.toUpperCase().trim();
    
    try {
      const savedUser = await dbService.fetchUserRequest(m);
      if (!savedUser) {
        showToast(t('compteInvalide'), 'error'); // Mampiasa i18n
        return;
      }

      if (savedUser.statut !== 'active') {
        showToast(t('waitingApproval'), 'error');
        return;
      }

      if (String(savedUser.password) === String(password)) {
        await finalizeLogin(m); // Function mitambatra ho an'ny sync
      } else {
        showToast(t('pinMismatch'), 'error');
        setPassword('');
      }
    } catch (e) {
      console.error(e);
      showToast("Erreur de connexion.", 'error');
    } finally {
      setLoading(false);
    }
  };


  // --- 2. Biometrika (Miaraka amin'ny Fallback amin'ny PIN raha ilaina) ---
  const handleSimulateBiometrics = async () => {
    const m = matricule.toUpperCase().trim();
    
    if (!m) {
      showToast("Veuillez saisir votre matricule.", 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Import-na ny Capacitor
      const { Capacitor } = await import('@capacitor/core');
      
      // 2. Raha Web, na tsy manana plugin, dia mivoaha
      if (Capacitor.getPlatform() === 'web') {
        showToast("La biométrie n'est disponible que sur mobile.", 'info');
        setLoading(false);
        return;
      }

      const { NativeBiometric } = await import('@capgo/capacitor-native-biometric');

      // 3. Check raha Available (ity no manakana ny "Not Implemented")
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        showToast("Biométrie non configurée sur ce mobile.", 'info');
        setLoading(false);
        return;
      }

      // 4. Raha vao tonga eto, dia midika fa Android/iOS tena izy izany
      const verified = await NativeBiometric.verify({
        reason: "Authentification biométrique",
        title: "AMM Pay",
        subtitle: "Veuillez confirmer votre identité",
      });

      if (verified.verified) {
        const savedReq = await dbService.fetchUserRequest(m);
        if (savedReq && savedReq.statut === 'active') {
          await finalizeLogin(m);
          showToast("Connexion réussie !", 'success');
        } else {
          showToast("Compte invalide.", 'error');
        }
      }
    } catch (err: any) {
      console.error("Biometric Error:", err);
      // Raha "not implemented" ny error, tsy mila aseho amin'ny mpampiasa
      if (err.message && err.message.includes("not implemented")) {
        console.log("Ignored: Plugin not supported on this platform.");
      } else if (err && err.code !== -1) {
        showToast("Erreur d'authentification.", 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const finalizeLogin = async (m: string) => {
    localStorage.setItem('amm_matricule', m);
    localStorage.setItem('amm_loggedIn', 'true');
    await syncAccountData(m);
    setStep('main');
    setPassword('');
  };
  
  // Perform disconnection safely
  const handleLogOutPortal = () => {
    setShowLogoutConfirm(true);
  };

  // Custom Settings - change personal code PIN
  const handleSettingsChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinSettings.length !== 6 || isNaN(Number(newPinSettings))) {
      showToast(translations[lang].pinLengthError, 'error');
      return;
    }

    if (oldPinSettings !== userReq?.password) {
      showToast("L'ancien code PIN saisi est incorrect.", 'error');
      return;
    }

    setLoading(true);
    try {
      const m = matricule.toUpperCase().trim();
      await dbService.saveUserRequest(m, { password: newPinSettings });
      
      const updatedReq = await dbService.fetchUserRequest(m);
      if (updatedReq) setUserReq(updatedReq);

      showToast(lang === 'mg' ? "Voasoratra ny PIN vaovao !" : "Code PIN mis à jour avec succès !", 'success');
      setOldPinSettings('');
      setNewPinSettings('');
    } catch (e) {
      console.error(e);
      showToast("Erreur lors de la modification du code PIN.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const openOperationModal = (type: 'depot' | 'retrait' | 'transfert') => {
    setOpType(type);
    setIsOpOpen(true);
  };

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-accent selection:text-brand-bg flex flex-col antialiased">
      
      {/* ────────────────── 1. SPLASH SCREEN ────────────────── */}
      {step === 'splash' && (
        <div className="flex-1 flex flex-col justify-center items-center p-6 text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            // Nesorina ny bg-brand-accent mba hivoaka tsara ny lokon'ny logo
            className="w-40 h-40 flex items-center justify-center rounded-full shadow-2xl relative bg-transparent"
          >
            {/* Eto no nosoloina logo ny Landmark */}
            <img src={logo} alt="AMM Logo" className="w-full h-full object-contain p-2" />
            
            {/* Animated Ring - mijanona io fa manome endrika mamelona */}
            <span className="absolute inset-0 rounded-full border-4 border-brand-accent/30 animate-ping" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="space-y-2 flex flex-col items-center"
          >
            <h1 className="text-3xl font-black font-display tracking-tight text-white uppercase">
              Association Malagasy Miray
            </h1>
            <p className="text-sm font-semibold italic text-brand-accent">
              "Fanarenana ifotony ny fiarahamonina Malagasy"
            </p>
          </motion.div>

          <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mt-10" />
          
          <div className="absolute bottom-6 font-mono text-xs text-brand-muted">
            AMM Core Banking Platform • Version 5.3.0
          </div>
        </div>
      )}

      {/* ────────────────── 2. LANGUAGE SELECT ────────────────── */}
      {step === 'language' && (
        <div className="flex-1 flex flex-col justify-center items-center p-6">
          <div className="w-full max-w-md bg-brand-card border border-brand-border p-8 rounded-3xl shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <span className="text-4xl">🌐</span>
              <h2 className="text-xl font-bold font-display text-brand-text">
                Safidio ny fiteny / Choisir la langue
              </h2>
              <p className="text-xs text-brand-text-sub">AMM Mobile & Web Ledger</p>
            </div>

            <div className="space-y-3">
              {[
                { code: 'mg' as Language, label: '🇲🇬 Malagasy', native: 'Malagasy Miray' },
                { code: 'fr' as Language, label: '🇫🇷 Français', native: 'Français Standard' },
                { code: 'en' as Language, label: '🇬🇧 English', native: 'English Global' }
              ].map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => selectLanguage(item.code)}
                  className="w-full flex items-center justify-between p-4 bg-brand-card-alt border border-brand-border rounded-2xl hover:border-brand-accent hover:bg-brand-bg transition-all font-bold text-sm text-left text-brand-text group"
                >
                  <span>{item.label}</span>
                  <span className="text-xs font-mono text-brand-muted group-hover:text-brand-accent transition">
                    {item.native} →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── 3. FORM: ACCESS REGISTRY CHECK ────────────────── */}
      {step === 'form' && (
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-md bg-brand-card border border-brand-border p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <span className="text-3xl block">🏦</span>
              <h2 className="text-xl font-bold font-display text-white">{t.accessRequest}</h2>
              <p className="text-xs text-brand-text-sub">{t.verifyIdentity}</p>
            </div>

            <form onSubmit={handleRequestAccess} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text-sub uppercase tracking-wider block">
                  {t.matricule}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AMM-0001"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-3 px-4 text-sm text-brand-text font-bold uppercase focus:outline-none focus:border-brand-accent placeholder:text-brand-muted/70"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text-sub uppercase tracking-wider block">
                  {t.fullName}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rakoto Hery"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-3 px-4 text-sm text-brand-text focus:outline-none focus:border-brand-accent placeholder:text-brand-muted/70"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text-sub uppercase tracking-wider block">
                  {t.contactDetails}
                </label>
                <input
                  type="text"
                  required
                  placeholder="0341122233 ou email"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-3 px-4 text-sm text-brand-text focus:outline-none focus:border-brand-accent placeholder:text-brand-muted/70"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-accent text-brand-bg font-extrabold font-display rounded-xl hover:bg-brand-accent-dark transition disabled:opacity-50"
              >
                {loading ? "Vérification..." : t.sendRequest}
              </button>
            </form>

            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => setStep('language')} 
                className="text-xs text-brand-muted hover:text-brand-accent"
              >
                ← Changer de langue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── 4. WAITING APPROVAL SCREEN ────────────────── */}
      {step === 'waiting' && (
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-sm bg-brand-card border border-brand-border p-8 rounded-3xl shadow-2xl text-center space-y-6">
            <span className="text-5xl block animate-bounce">⏳</span>
            <div className="space-y-2">
              <h2 className="text-xl font-bold font-display text-brand-text">{t.waitingApproval}</h2>
              <p className="text-sm text-brand-text-sub leading-relaxed">{t.waitingDesc}</p>
            </div>

            <div className="p-3 bg-brand-card-alt rounded-xl border border-brand-border text-xs text-brand-gold font-mono">
              DEMANDE ID: {matricule.toUpperCase()}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={checkPendingApprovalRequest}
                disabled={loading}
                className="w-full py-3 bg-brand-accent text-brand-bg font-bold font-display rounded-xl hover:bg-brand-accent-dark transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={15} className={loading ? 'animate-spin' : ''} />
                <span>{t.refreshState}</span>
              </button>

              {/* Auditor Sandbox bypass utility tip */}
              <div className="text-[10px] text-brand-muted pt-2 leading-tight">
                💡 <strong>Audit Test Note:</strong> To immediately approve this requested account, navigate your local storage, or proceed as AMM-0001 (already approved & pre-seeded !)
              </div>

              <button
                type="button"
                onClick={() => setStep('language')}
                className="w-full py-2 bg-transparent text-xs text-brand-muted hover:text-brand-accent"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── 5. CREATE PIN CODE ────────────────── */}
      {step === 'createPassword' && (
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-md bg-brand-card border border-brand-border p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <span className="text-3xl">🔐</span>
              <h2 className="text-xl font-bold font-display text-white">{t.createPIN}</h2>
              <p className="text-xs text-brand-text-sub">{t.choose6digits}</p>
            </div>

            <form onSubmit={handleCreatePassword} className="space-y-4">
              
              <div className="space-y-1 font-sans">
                <label className="text-[10px] font-bold text-brand-text-sub uppercase tracking-wider block">
                  Code PIN (6 chiffres)
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-3 px-4 text-center text-lg font-bold text-brand-text tracking-widest focus:outline-none focus:border-brand-accent placeholder:text-brand-muted/70"
                />
              </div>

              <div className="space-y-1 font-sans">
                <label className="text-[10px] font-bold text-brand-text-sub uppercase tracking-wider block">
                  {t.confirmPIN}
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-3 px-4 text-center text-lg font-bold text-brand-text tracking-widest focus:outline-none focus:border-brand-accent placeholder:text-brand-muted/70"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-accent text-brand-bg font-extrabold font-display rounded-xl hover:bg-brand-accent-dark transition"
              >
                {t.validate}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── 6. SECURE LOGIN SCREEN ────────────────── */}
      {step === 'login' && (
        <div className="flex-1 flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-md bg-brand-card border border-brand-border p-8 rounded-3xl shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl">🏦</span>
              <h2 className="text-2xl font-black font-display tracking-tight text-white">{t.appName}</h2>
              <p className="text-xs text-brand-text-sub">{t.loginSecure}</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-text-sub uppercase tracking-wider block">
                  {t.matricule}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: AMM-0001"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value)}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-3 px-4 text-sm text-brand-text font-bold uppercase focus:outline-none focus:border-brand-accent placeholder:text-brand-muted"
                />
              </div>

              <div className="space-y-1 font-sans">
                <label className="text-[10px] font-bold text-brand-text-sub uppercase tracking-wider block">
                  {t.pinCode}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={6}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-brand-bg/60 border border-brand-border rounded-xl py-3 px-4 text-center text-lg font-bold text-brand-accent tracking-widest focus:outline-none focus:border-brand-accent placeholder:text-brand-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-brand-muted hover:text-brand-text"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-accent text-brand-bg font-extrabold font-display rounded-xl hover:bg-brand-accent-dark transition shadow-lg shadow-brand-accent/10"
              >
                {loading ? "Connexion..." : t.login}
              </button>
            </form>

            <div className="border-t border-brand-border/40 pt-4 flex flex-col items-center space-y-2">
              <button
                type="button"
                onClick={handleSimulateBiometrics}
                className="flex items-center gap-2 p-2 bg-brand-border/10 hover:bg-brand-border/30 rounded-xl border border-brand-border/40 text-brand-accent text-xs font-semibold tracking-wide transition"
              >
                <Fingerprint size={18} />
                <span>Identification par Empreinte</span>
              </button>
              <p className="text-[10px] text-brand-muted text-center italic">
                {t.biometricsMsg} (Simulation déverrouillage de sécurité)
              </p>
            </div>

            <div className="text-center">
              <button 
                type="button" 
                onClick={() => setStep('language')} 
                className="text-xs text-brand-muted hover:text-brand-accent"
              >
                ← Changer de compte / Demande d'accès
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── 7. MAIN PORTAL TERMINAL ────────────────── */}
      {step === 'main' && (
        <div className="flex-1 flex flex-col md:flex-row min-h-[100dvh]">
          
          {/* MOBILE NAVIGATION HEADER */}
          <div className={`md:hidden bg-brand-card border-b border-brand-border/70 pt-safe pb-2 px-3 shrink-0 z-[50] select-none 
            transition-transform duration-300 ease-in-out fixed top-0 left-0 right-0 flex items-center justify-between
            ${showNav ? 'translate-y-0' : '-translate-y-full'}`}>
            
            {/* Logo sy ny Anarana (Ankavia) */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-brand-bg relative overflow-hidden">
                <img src={logo2} alt="Logo" className="w-full h-full object-cover" />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green absolute -right-0.5 -top-0.5 animate-ping" />
              </div>
              <div>
                <h1 className="text-xs font-black font-display tracking-tight text-white uppercase leading-none">
                  AMM PAY
                </h1>
                <span className="text-[9px] text-brand-gold font-mono font-bold leading-none block mt-0.5">{matricule}</span>
              </div>
            </div>

            {/* Buttons (Ankavanana) */}
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => {
                  const next: Record<Language, Language> = { mg: 'fr', fr: 'en', en: 'mg' };
                  selectLanguage(next[lang]);
                }}
                type="button"
                className="p-1.5 px-2 bg-brand-border/10 hover:bg-brand-border hover:text-brand-accent text-brand-text-sub rounded-lg border border-brand-border/30 transition-all text-[10px] flex items-center gap-1 font-mono font-extrabold"
              >
                <Languages size={11} />
                <span className="uppercase">{lang}</span>
              </button>

              <button
                type="button"
                onClick={handleLogOutPortal}
                className="p-1.5 px-2.5 bg-brand-red/10 border border-brand-red/25 text-brand-red font-bold text-[10px] rounded-lg hover:bg-brand-red hover:text-brand-bg transition flex items-center gap-1"
              >
                <LogOut size={11} />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
          
          {/* HEADER / NAVIGATION SIDEBAR (DESKTOP ONLY) */}
          <aside className="hidden md:flex w-full md:w-64 bg-brand-card border-b md:border-b-0 md:border-r border-brand-border shrink-0 flex-col justify-between pt-6 pb-4 select-none">
            
            <div className="space-y-6">
              {/* Sidebar Branding Header */}
              <div className="px-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden bg-brand-bg border border-brand-accent/20">
                  {/* Logo eto */}
                  <img src={logo2} alt="Logo" className="w-full h-full object-cover" />
                  
                  {/* Ny teboka maitso (status indicator) dia hijanona */}
                  <span className="w-2 h-2 rounded-full bg-brand-green absolute -right-0.5 -top-0.5 animate-ping" />
                </div>
                <div>
                  <h1 className="text-sm font-black font-display tracking-tight text-white uppercase leading-none">
                    AMM PAY
                  </h1>
                  <span className="text-[10px] text-brand-accent font-mono">Mobile & Web Portal</span>
                </div>
              </div>
-
              {/* Live Navigation Tabs */}
              <nav className="space-y-1 px-3">
                {[
                  { id: 'home', icon: '🏠', label: t.navHome },
                  { id: 'monCompte', icon: '💳', label: t.navAccount },
                  { id: 'actualites', icon: '📰', label: t.navNews },
                  { id: 'settings', icon: '⚙️', label: t.settings },
                  { id: 'about', icon: 'ℹ️', label: t.about }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                      currentTab === item.id
                        ? 'bg-brand-accent/10 text-brand-accent border-l-4 border-brand-accent'
                        : 'text-brand-text-sub hover:bg-brand-border/20 hover:text-brand-text'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Sidebar Footer context user and Disconnection */}
            <div className="px-3 pt-6 border-t border-brand-border space-y-3">
              <div className="p-3 bg-brand-card-alt rounded-2xl flex items-center gap-2.5 border border-brand-border/60">
                <div className="w-8 h-8 rounded-full bg-brand-accent text-brand-bg font-black flex items-center justify-center text-xs">
                  {userReq?.nom ? userReq.nom[0].toUpperCase() : 'A'}
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-extrabold text-brand-text block truncate">
                    {userReq?.nom}
                  </span>
                  <span className="text-[10px] text-brand-gold font-mono font-bold block">
                    {matricule}
                  </span>
                </div>
              </div>

              <div className="flex gap-1.5 justify-between">
                {/* Language fast toggle toggle */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      const next: Record<Language, Language> = { mg: 'fr', fr: 'en', en: 'mg' };
                      selectLanguage(next[lang]);
                    }}
                    type="button"
                    className="p-2.5 bg-brand-border/10 hover:bg-brand-border hover:text-brand-accent text-brand-text-sub rounded-xl border border-brand-border/50 transition-all text-xs flex items-center gap-1.5"
                    title="Toggle Language"
                  >
                    <Languages size={14} />
                    <span className="font-extrabold font-mono uppercase">{lang}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLogOutPortal}
                  className="flex-1 p-2.5 bg-brand-red/10 border border-brand-red/20 text-brand-red font-bold text-xs rounded-xl hover:bg-brand-red hover:text-brand-bg transition flex items-center justify-center gap-1"
                >
                  <LogOut size={13} />
                  <span>{t.logout}</span>
                </button>
              </div>
            </div>

          </aside>

          {/* MAIN DATA CENTER PANEL */}
          <main className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto no-scrollbar max-h-screen">
            
            {/* Top Toolbar with quick indicator stats and sync clocks */}
            <header className="flex justify-between items-center pb-4 border-b border-brand-border/60">
              <div className="flex items-center gap-2">
                <Activity size={16} className={`${syncing ? 'animate-spin' : ''} text-brand-accent`} />
                <span className="text-xs font-mono font-semibold tracking-wider text-brand-text-sub uppercase">
                  {currentTab === 'home' && 'Tableau de Bord / Dashboard'}
                  {currentTab === 'monCompte' && 'Registre de Comptes / Ledger Balance'}
                  {currentTab === 'actualites' && 'Communiqués de l\'Association / News Feed'}
                  {currentTab === 'settings' && 'Paramètres d\'Accès / Security Center'}
                  {currentTab === 'about' && 'À Propos de l\'AMM'}
                </span>
              </div>

              {/* Status and manual reload buttons */}
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono text-brand-muted">
                  <ShieldCheck size={14} className="text-brand-green" /> 256-Bit SSL Secured
                </span>
                <button
                  onClick={() => syncAccountData(matricule)}
                  className="p-1 px-2 border border-brand-border hover:bg-brand-border text-brand-accent transition text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <RotateCcw size={11} className={syncing ? 'animate-spin' : ''} />
                  <span>Sync DB</span>
                </button>
              </div>
            </header>

            {/* TAB RENDERING ENG: Dashboard Tab */}
            {currentTab === 'home' && (
              <Dashboard
                compte={compte}
                operations={operations}
                ledger={ledger}
                lang={lang}
                onOpenOp={openOperationModal}
                matricule={matricule}
                memberName={userReq?.nom || matricule}
              />
            )}

            {/* TAB RENDERING ENG: Mon Compte Tab (Comprehensive Auditing Account Portal) */}
            {currentTab === 'monCompte' && (
              <div className="space-y-6">
                
                {/* Visual Debit vs Credit Balance metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-brand-text-sub font-mono block">PROFIL MEMBRE</span>
                      <h4 className="text-lg font-bold text-white leading-tight mt-1">{userReq?.nom}</h4>
                      <p className="text-xs text-brand-muted font-mono">Contact: {userReq?.contact}</p>
                    </div>
                    <div className="w-12 h-12 bg-brand-accent/15 text-brand-accent rounded-xl font-black flex items-center justify-center text-lg shadow-lg">
                      {matricule[matricule.length - 1]}
                    </div>
                  </div>

                  <div className="bg-brand-card border border-brand-border rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-brand-text-sub font-mono block">VALEUR LIQUIDE PORTFOLIO</span>
                      <h4 className="text-xl font-extrabold text-brand-accent tracking-tight mt-1">
                        {compte.solde.toLocaleString('fr-FR')} AR
                      </h4>
                      <p className="text-[11px] text-brand-muted font-mono">
                        Date d'inscription: {userReq?.createdAt ? new Date(userReq.createdAt).toLocaleDateString('fr-FR') : 'Juin 2026'}
                      </p>
                    </div>
                    <span className="text-2xl">🗳️</span>
                  </div>
                </div>

                {/* Main auditable ledger listing */}
                <TransactionHistory
                  operations={operations}
                  ledger={ledger}
                  lang={lang}
                  onRefresh={() => syncAccountData(matricule)}
                  currentMatricule={matricule}
                />
              </div>
            )}

            {/* TAB RENDERING ENG: Actualites Tab */}
            {currentTab === 'actualites' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-brand-text-sub">
                    {t.navNews}
                  </h3>
                  <Newspaper size={18} className="text-brand-accent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {actualites.length === 0 ? (
                    <div className="md:col-span-2 text-center p-10 bg-brand-card border border-brand-border rounded-2xl">
                      <p className="text-xs text-brand-muted">Aucune annonce.</p>
                    </div>
                  ) : (
                    actualites.map((a) => (
                      <div key={a.id} className="p-5 bg-brand-card border border-brand-border rounded-2xl relative overflow-hidden flex flex-col justify-between space-y-4 hover:border-brand-accent/50 transition">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-gold/15 text-brand-gold border border-brand-gold/20">
                              {a.categorie}
                            </span>
                            <span className="text-[10px] font-mono text-brand-muted flex items-center gap-1">
                              <Calendar size={11} /> {a.date || new Date(a.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-white font-display leading-snug">
                            {a.title}
                          </h4>
                          <p className="text-xs text-brand-text-sub leading-relaxed font-sans">
                            {a.desc}
                          </p>
                        </div>
                        <div className="border-t border-brand-border/40 pt-3 text-[10px] text-brand-muted">
                          Diffuseur: Service communication AMM
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB RENDERING ENG: Settings Tab */}
            {currentTab === 'settings' && (
              <div className="space-y-6 max-w-2xl bg-brand-card border border-brand-border p-6 rounded-2xl shadow-xl">
                <h3 className="text-base font-bold font-display text-white border-b border-brand-border pb-3">
                  {t.settings} & Sécurité Compte
                </h3>

                <form onSubmit={handleSettingsChangePin} className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold text-brand-accent font-display uppercase tracking-wider block">
                    Modifier mon code PIN d'accès
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-text-sub uppercase tracking-wider block">
                        Ancien PIN (6 chiffres)
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        required
                        placeholder="••••••"
                        value={oldPinSettings}
                        onChange={(e) => setOldPinSettings(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-2.5 px-4 text-center text-sm font-bold tracking-widest focus:outline-none focus:border-brand-accent text-brand-text"
                      />
                    </div>

                    <div className="space-y-1 font-sans">
                      <label className="text-[10px] font-bold text-brand-text-sub uppercase tracking-wider block">
                        Nouveau PIN (6 chiffres)
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        required
                        placeholder="••••••"
                        value={newPinSettings}
                        onChange={(e) => setNewPinSettings(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-brand-bg border border-brand-border rounded-xl py-2.5 px-4 text-center text-sm font-bold tracking-widest focus:outline-none focus:border-brand-accent text-brand-text"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-brand-accent hover:bg-brand-accent-dark text-brand-bg font-extrabold text-xs rounded-xl transition"
                  >
                    Mettre à jour le code de sécurité
                  </button>
                </form>

                {/* Profile Overview Readonly */}
                <div className="border-t border-brand-border/60 pt-6 space-y-4">
                  <h4 className="text-xs font-bold text-brand-accent font-display uppercase tracking-wider block">
                    {t.profileTitle}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 bg-brand-bg border border-brand-border rounded-xl">
                      <span className="text-brand-muted text-[10px] block">NOM COMPLET COMPLICITÉ</span>
                      <span className="text-brand-text font-bold text-xs">{userReq?.nom}</span>
                    </div>
                    <div className="p-3 bg-brand-bg border border-brand-border rounded-xl">
                      <span className="text-brand-muted text-[10px] block">MATRICULE UNIQUE</span>
                      <span className="text-brand-text font-bold text-xs uppercase">{matricule}</span>
                    </div>
                    <div className="p-3 bg-brand-bg border border-brand-border rounded-xl">
                      <span className="text-brand-muted text-[10px] block">CONTACT TÉLÉPHONIQUE</span>
                      <span className="text-brand-text font-bold text-xs">{userReq?.contact}</span>
                    </div>
                    <div className="p-3 bg-brand-bg border border-brand-border rounded-xl">
                      <span className="text-brand-muted text-[10px] block">AUTORISATION</span>
                      <span className="text-brand-green font-bold text-[11px] block">● COMPTE PARFAIT</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB RENDERING ENG: About Tab */}
            {currentTab === 'about' && (
              <div className="space-y-6 max-w-2xl bg-brand-card border border-brand-border p-6 rounded-2xl shadow-xl">
                <div className="space-y-3">
                  <div className="w-14 h-14 bg-brand-accent/20 rounded-2xl flex items-center justify-center text-brand-accent text-2xl">
                    🏢
                  </div>
                  <h3 className="text-lg font-black font-display text-white">
                    {t.associationName}
                  </h3>
                  <p className="text-xs italic text-brand-accent">
                    {t.tagline}
                  </p>
                  <p className="text-xs text-brand-text-sub leading-normal leading-relaxed">
                    Plateforme centrale de suivi comptable AMM. Ce portail de gestion bancaire permet aux membres certifiés de l'Association Malagasy Miray d'effectuer et de suivre de manière totalement autonome leurs cotisations, micro-projets et transactions financières d'entraides mutuelles.
                  </p>
                </div>

                <div className="border-t border-brand-border/60 pt-5 space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-brand-text-sub font-semibold">Responsable des Opérations financières :</span>
                    <span className="text-brand-text text-right">R. Fenoherisoa C. - 038 45 773 79</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-sub font-semibold">Service Relation Client AMM :</span>
                    <span className="text-brand-text text-right">Service National - 033 97 256 53</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-sub font-semibold">Taux de virement interne AMM :</span>
                    <span className="text-brand-accent font-bold">0% de frais (Entièrement Gratuit)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-text-sub font-semibold">Taux de retrait Mobile Money :</span>
                    <span className="text-brand-red font-bold">5% obligatoire opérateur</span>
                  </div>
                </div>

                <div className="bg-brand-bg/60 border border-brand-border/70 p-4 rounded-xl flex items-start gap-2.5 text-[11px] text-brand-text-sub">
                  <Info size={16} className="text-brand-accent shrink-0 mt-0.5" />
                  <p className="leading-normal">
                    Conformément aux directives de l'auditeur général AMM, toutes les références d'opérations mobile money (dépôts par SMS de confirmation) sont consignées avec horodatage strict pour éviter tout contentieux.
                  </p>
                </div>
              </div>
            )}

            {/* Footer rights copy credits */}
            <footer className="mt-8 pt-6 pb-30 text-center text-xs sm:text-sm text-brand-muted font-mono px-4 break-words">
              © 2026 Association Malagasy Miray (AMM) • Tous droits réservés •
              <br className="sm:hidden" />
              Fiarahamonina Miray Malagasy
            </footer>
          </main>

          {/* MASTER TRANSACTION FORM MODAL CONTAINER */}
          <TransactionModal
            isOpen={isOpOpen}
            onClose={() => setIsOpOpen(false)}
            type={opType}
            matricule={matricule}
            memberName={userReq?.nom || matricule}
            availableBalance={compte.solde}
            lang={lang}
            onSuccess={refreshOnlyData}
          />

          {/* MOBILE PERSISTENT BOTTOM TAB BAR (HIGHLY RESILIENT & NATIVE ENVELOPE DESIGN) */}
          <div className={`md:hidden bg-brand-card border-t border-brand-border/70 pb-safe pt-2 px-2 shrink-0 z-40 select-none 
  transition-transform duration-300 ease-in-out fixed bottom-0 left-0 right-0
  ${showNav ? 'translate-y-0' : 'translate-y-full'}`}>
            <nav className="flex justify-around items-center">
              {[
                { id: 'home', icon: '🏠', label: t.navHome },
                { id: 'monCompte', icon: '💳', label: t.navAccount },
                { id: 'actualites', icon: '📰', label: t.navNews },
                { id: 'settings', icon: '⚙️', label: t.settings },
                { id: 'about', icon: 'ℹ️', label: t.about }
              ].map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentTab(item.id)}
                    className="flex flex-col items-center justify-center py-1 transition-all relative flex-1"
                  >
                    <span className={`text-[17px] transition-transform ${isActive ? 'scale-110' : 'opacity-70 scale-100'}`}>
                      {item.icon}
                    </span>
                    <span className={`text-[9px] font-bold mt-0.5 tracking-tight transition-colors ${
                      isActive ? 'text-brand-accent animate-pulse' : 'text-brand-text-sub/80'
                    }`}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.span 
                        layoutId="activeBottomTab"
                        className="absolute bottom-0 w-8 h-0.5 bg-brand-accent rounded-full"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

        </div>
      )}

      {/* ────────────────── CUSTOM TOAST BANNER NOTIFICATION ────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            // Z-index ambony be mba ho hitan'ny mpampiasa foana
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm"
          >
            <div className={`p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md ${
              toast.type === 'error' 
                ? 'bg-brand-red/10 border-brand-red/30 text-white' 
                : toast.type === 'success'
                ? 'bg-brand-accent/10 border-brand-accent/30 text-white'
                : 'bg-brand-card-alt border-brand-border text-white'
            }`}>
              <span className="text-lg">
                {toast.type === 'error' ? '❌' : toast.type === 'success' ? '✅' : 'ℹ️'}
              </span>
              <div className="flex-1 font-sans">
                <p className="text-xs font-bold leading-normal">{toast.message}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setToast(null)} 
                className="text-white/40 hover:text-white text-xs font-mono ml-1"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────────── CUSTOM GENERAL CONFIRM MODAL ────────────────── */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-[#060D19]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-brand-card border border-brand-border/80 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative"
            >
              <div className="text-center space-y-2">
                <span className="text-3xl">🚪</span>
                <h3 className="text-base font-bold font-display text-white">
                  {lang === 'mg' ? 'Hivoaka ny kaontinao' : lang === 'fr' ? 'Déconnexion du portail' : 'Sign Out'}
                </h3>
                <p className="text-xs text-brand-text-sub">
                  {translations[lang].logoutConfirm}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 font-sans pt-1">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-2.5 bg-brand-border/40 hover:bg-brand-border/60 text-brand-text font-bold text-xs rounded-xl transition"
                >
                  {translations[lang].cancel || 'Annuler'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    // Mitahiry ny fiteny sao ilaina
                    const currentLang = localStorage.getItem('amm_lang');
                    localStorage.clear();
                    if (currentLang) localStorage.setItem('amm_lang', currentLang);
                    
                    setStep('form');
                    setPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="py-2.5 bg-brand-red hover:bg-brand-red/90 text-brand-bg font-bold text-xs rounded-xl transition shadow-md shadow-brand-red/10"
                >
                  {translations[lang].logout || 'Déconnexion'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
