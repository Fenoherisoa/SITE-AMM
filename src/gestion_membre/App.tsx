import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Menu, Bell, User, Key, CheckCircle, HelpCircle, 
  X, Printer, Clock, FileText, ArrowRight 
} from 'lucide-react';

// Types & Config
import { 
  Member, Enquete, UserAccount, ActionLog, 
  Transaction, CalendarEvent, OperationRequest, ChatMessage 
} from './types';
import { FirebaseService } from './services/firebaseService';
import { 
  PROJECT_PREFIX, BASE_URL, QUESTIONS_LIST, base64Logo 
} from './constants';

// Subcomponents
import Sidebar from './components/Sidebar';
import AuthScreens from './components/AuthScreens';
import OverviewDashboard from './components/OverviewDashboard';
import AdhesionForm from './components/AdhesionForm';
import MembersList from './components/MembersList';
import EnquetesList from './components/EnquetesList';
import TransactionsFormAndLog from './components/TransactionsFormAndLog';
import MemberAccountDashboard from './components/MemberAccountDashboard';
import CalendarTab from './components/CalendarTab';
import MessengerTab from './components/MessengerTab';
import SecurityTab from './components/SecurityTab';
import ParametresTab from './components/ParametresTab';
import LogsList from './components/LogsList';
import SplashScreen from './components/SplashScreen';

export default function App() {
  // --- NAVIGATION & CONTROL STATES ---
  const [isSplash, setIsSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(false);

  // --- AUTH/SESSION STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("ENQUETEUR");
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({
    overview: true,
    adhesion: true,
    members: true,
    enquetes: true,
    accounting: false,
    operations: false,
    historique: false,
    calendar: true,
    messenger: true,
    security: false,
    parametre: false
  });
  const [authScreen, setAuthScreen] = useState<string>("login"); // "login", "register", "forgot"
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Login inputs
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register inputs
  const [regUser, setRegUser] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regToken, setRegToken] = useState("");

  // Forgot password inputs
  const [forgotUser, setForgotUser] = useState("");
  const [tempCode, setTempCode] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [forgotStep, setForgotStep] = useState<number | boolean>(false); // false, true (step 2), 2 (step 3)

  // --- CORE SYSTEM DATA ---
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allEnquetes, setAllEnquetes] = useState<Enquete[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [allUsers, setAllUsers] = useState<Record<string, UserAccount>>({});
  const [tokens, setTokens] = useState<Record<string, { role: string; token_miasa: string }>>({});
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [operationRequests, setOperationRequests] = useState<Record<string, OperationRequest>>({});
  const [logs, setLogs] = useState<ActionLog[]>([]);

  // System general config parameters
  const [sysParams, setSysParams] = useState({
    appName: "AMM CONNECT",
    currency: "Ar",
    adminContact: "+261 34 29 845 23",
    alertThreshold: 15,
    logoBase64: base64Logo
  });

  // --- LOCAL FORM TEMPORARY STATES (Adhésion Form) ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEditId, setSelectedEditId] = useState("");
  const [formAnarana, setFormAnarana] = useState("");
  const [formCin, setFormCin] = useState("");
  const [formCinRecto, setFormCinRecto] = useState("");
  const [formCinVerso, setFormCinVerso] = useState("");
  const [formGenre, setFormGenre] = useState("");
  const [formTelephone, setFormTelephone] = useState("");
  const [formTetikasa, setFormTetikasa] = useState("AVOTRA MALAGASY");
  const [formDateAdhesion, setFormDateAdhesion] = useState("");
  const [formDateNaissance, setFormDateNaissance] = useState("");
  const [formLieuNaissance, setFormLieuNaissance] = useState("");
  const [formDateDelivrance, setFormDateDelivrance] = useState("");
  const [formLieuDelivrance, setFormLieuDelivrance] = useState("");
  const [formDateDuplicata, setFormDateDuplicata] = useState("");
  const [formLieuDuplicata, setFormLieuDuplicata] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formEmailNotification, setFormEmailNotification] = useState("");

  // Regions selectors
  const [selectedProv, setSelectedProv] = useState("");
  const [selectedReg, setSelectedReg] = useState("");
  const [selectedDist, setSelectedDist] = useState("");
  const [selectedCom, setSelectedCom] = useState("");
  const [selectedFok, setSelectedFok] = useState("");

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [surveyQuery, setSurveyQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Detail Popups modales
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [modalMemberDetail, setModalMemberDetail] = useState(false);
  const [selectedEnquete, setSelectedEnquete] = useState<Enquete | null>(null);
  const [modalEnqueteDetail, setModalEnqueteDetail] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // --- SYSTEM LOGS TRIGGER SCRIPT ---
  const saveActionLog = async (activity: string, desc: string) => {
    const freshLog: ActionLog = {
      operator: loginUser || "Anonymous",
      action: activity,
      details: desc,
      timestamp: new Date().toISOString()
    };
    try {
      await FirebaseService.pushLog(freshLog);
      // Reload logs locally
      const updatedLogs = await FirebaseService.getLogs();
      setLogs(updatedLogs);
    } catch (e) {
      console.error(e);
    }
  };

  // --- FETCH REFRESH SYSTEM DATA ---
  const loadSystemDatabase = useCallback(async () => {
    setIsAppLoading(true);
    try {
      const [
        memberData, enqueteData, accountingData, usersData, 
        tokensData, eventsData, logsData, opRequests, paramsData
      ] = await Promise.all([
        FirebaseService.getMembers(),
        FirebaseService.getEnquetes(),
        FirebaseService.getAccounting(),
        FirebaseService.getUsers(),
        FirebaseService.getTokens(),
        FirebaseService.getEvents(),
        FirebaseService.getLogs(),
        FirebaseService.getOperationRequests(),
        FirebaseService.getParametres()
      ]);

      setAllMembers(memberData);
      setAllEnquetes(enqueteData);
      setAllTransactions(accountingData);
      setAllUsers(usersData);
      setTokens(tokensData);
      setEvents(eventsData);
      setLogs(logsData);
      setOperationRequests(opRequests);

      if (paramsData) {
        setSysParams(prev => ({ ...prev, ...paramsData }));
      }
    } catch (e) {
      console.error("Critical: Failed to sync database with baseamm", e);
    } finally {
      setIsAppLoading(false);
    }
  }, []);

  // --- SYNC MESSENGER REAL-TIME CHANNEL ---
  useEffect(() => {
    if (!isLoggedIn) return;

    // Fast polling fallback simulation for RTDB messaging channel
    const fetchChatMessages = async () => {
      try {
        const res = await fetch(`${BASE_URL}/messenger.json`);
        if (res.ok) {
          const raw = await res.json();
          if (raw) {
            const parsed: ChatMessage[] = Object.keys(raw).map(key => ({ id: key, ...raw[key] }));
            setMessages(parsed.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
          } else {
            setMessages([]);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchChatMessages();
    const interval = setInterval(fetchChatMessages, 5000); // 5s fast syncing
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Load database once user logs in
  useEffect(() => {
    if (isLoggedIn) {
      loadSystemDatabase();
    }
  }, [isLoggedIn, loadSystemDatabase]);

  // --- SECURITY AUTHENTICATION HANDLERS ---
  const handleLogin = async () => {
    if (!loginUser.trim() || !loginPass) {
      alert("⚠️ Ampidiro ny solonanarana sy ny teny miafina feno!");
      return;
    }
    setIsAuthLoading(true);
    try {
      const userObj = await FirebaseService.getUser(loginUser.trim());
      if (!userObj) {
        alert("❌ Tsy misy io matricule/utilisateur io ao amin'ny systeme!");
        setIsAuthLoading(false);
        return;
      }
      if (userObj.password !== loginPass) {
        alert("❌ Diso ny teny miafina napitrinao!");
        setIsAuthLoading(false);
        return;
      }

      // Successful login
      setLoginUser(loginUser.trim());
      setCurrentUserRole(userObj.role || "ENQUETEUR");
      
      // Load standard permissions
      if (userObj.role === 'NATIONAL_PRESIDENT') {
        setUserPermissions({
          overview: true, adhesion: true, members: true, enquetes: true,
          accounting: true, operations: true, historique: true, calendar: true,
          messenger: true, security: true, parametre: true
        });
      } else if (userObj.role === 'PROVINCIAL_CHIEF') {
        setUserPermissions({
          overview: true, adhesion: true, members: true, enquetes: true,
          accounting: true, operations: true, historique: true, calendar: true,
          messenger: true, security: false, parametre: false
        });
      } else {
        // ENQUETEUR
        const defaultEnqueteurPerms = userObj.permissions || {
          overview: true, adhesion: true, members: true, enquetes: true,
          accounting: false, operations: false, historique: false, calendar: true,
          messenger: true, security: false, parametre: false
        };
        setUserPermissions(defaultEnqueteurPerms);
      }

      setIsLoggedIn(true);
      await saveActionLog("CONNEXION_OK", `Mpandray anjara '${loginUser}' niditra tamin'ny rafitra. Role: ${userObj.role}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSelfRegister = async () => {
    if (!regUser.trim() || !regPass || !regToken.trim()) {
      alert("⚠️ Fenoy daholo ny saha rehetra mba ahafahana misoratra anarana!");
      return;
    }
    if (regPass.length < 6) {
      alert("⚠️ Ny password dia tokony ho farafahakeliny 6 caractères!");
      return;
    }

    setIsAuthLoading(true);
    try {
      // 1. Check if token is free and exists in pool
      const freshTokens = await FirebaseService.getTokens();
      const tokenEntry = Object.entries(freshTokens).find(
        ([_, info]) => info.token_miasa === regToken.trim()
      );

      if (!tokenEntry) {
        alert("❌ Diso na efa nampiasaina ny Token-nao!");
        setIsAuthLoading(false);
        return;
      }

      const [tokenKey, tokenInfo] = tokenEntry;

      // 2. Check if user already exists
      const existingUser = await FirebaseService.getUser(regUser.trim());
      if (existingUser) {
        alert("❌ Efa misy mampiasa io solonanarana (Login identifier) io!");
        setIsAuthLoading(false);
        return;
      }

      // 3. Save new user account and delete token
      const newUser: UserAccount = {
        username: regUser.trim(),
        password: regPass,
        role: tokenInfo.role,
        permissions: {
          overview: true,
          adhesion: true,
          members: true,
          enquetes: true,
          accounting: tokenInfo.role !== "ENQUETEUR",
          operations: tokenInfo.role !== "ENQUETEUR",
          historique: tokenInfo.role !== "ENQUETEUR",
          calendar: true,
          messenger: true,
          security: tokenInfo.role === "NATIONAL_PRESIDENT",
          parametre: tokenInfo.role === "NATIONAL_PRESIDENT"
        }
      };

      await FirebaseService.saveUser(regUser.trim(), newUser);
      await FirebaseService.deleteToken(tokenKey);

      alert("🎉 Arahabaina! Voasoratra soa aman-tsara ny kaontinao. Afaka miditra ianao izao.");
      setAuthScreen("login");
      setLoginUser(regUser.trim());
      setLoginPass(regPass);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleForgotRequest = async () => {
    if (!forgotUser.trim()) {
      alert("⚠️ Ampidiro ny solonanarana mba handefasana ny Token!");
      return;
    }
    setIsAuthLoading(true);
    try {
      const user = await FirebaseService.getUser(forgotUser.trim());
      if (!user) {
        alert("❌ Tsy misy mampiasa io solonanarana io ao amin'ny rafitra!");
        setIsAuthLoading(false);
        return;
      }

      // Simulate sending 6-digit code to email / showing alert code for preview convenience
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

      await FirebaseService.saveUser(forgotUser.trim(), {
        ...user,
        tempCode: code,
        tempCodeExpires: expires
      });

      alert(`📩 Nalefa any amin'ny email-nao ny code! \n(Mba hanampiana anao amin'ny testing: Code = ${code})`);
      setForgotStep(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!tempCode) {
      alert("⚠️ Ampidiro ny code 6 chiffres!");
      return;
    }
    setIsAuthLoading(true);
    try {
      const user = await FirebaseService.getUser(forgotUser.trim());
      if (!user || user.tempCode !== tempCode) {
        alert("❌ Tsy mety na diso ny code nampidirinao!");
        setIsAuthLoading(false);
        return;
      }

      if (user.tempCodeExpires && new Date(user.tempCodeExpires).getTime() < Date.now()) {
        alert("⌛ Efa lany daty (Expired) ity code ity. Avereno ny fangatahana!");
        setIsAuthLoading(false);
        return;
      }

      setForgotStep(2); // Go to final reset step
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleResetFinal = async () => {
    if (!newPass || newPass !== confirmPass) {
      alert("❌ Tsy mifanaraka ny teny miafina roa nampidirinao!");
      return;
    }

    setIsAuthLoading(true);
    try {
      const user = await FirebaseService.getUser(forgotUser.trim());
      if (!user) return;

      await FirebaseService.saveUser(forgotUser.trim(), {
        ...user,
        password: newPass,
        tempCode: null,
        tempCodeExpires: null
      });

      alert("✅ Voasolo soa aman-tsara ny teny miafinao! Afaka miditra ianao izao.");
      setAuthScreen("login");
      setLoginPass(newPass);
      setForgotStep(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    saveActionLog("DECONNEXION_OK", `Mpandray anjara '${loginUser}' niala tamin'ny rafitra.`);
    setIsLoggedIn(false);
    setLoginPass("");
    alert("👋 Soa aman-tsara! Tafavoaka ianao.");
  };

  // --- MEMBER CREATION / EDIT ACTION HANDLERS ---
  const handleSaveMember = async () => {
    if (!formAnarana.trim() || !formDateAdhesion) {
      alert("⚠️ Ny anarana sy ny daty d'adhésion dia tsy tokony ho foana farafaharatsiny!");
      return;
    }

    const uniqueId = isEditMode && selectedEditId 
      ? selectedEditId 
      : "ID-" + Math.floor(1000 + Math.random() * 9000);

    const matriculeCode = isEditMode && selectedEditId 
      ? allMembers.find(m => m.id === selectedEditId)?.matricule || "" 
      : (PROJECT_PREFIX[formTetikasa] || "AMM") + "-" + Math.floor(10000 + Math.random() * 90000);

    const updatedMember: Member = {
      id: uniqueId,
      matricule: matriculeCode,
      anarana: formAnarana.trim().toUpperCase(),
      cin: formCin.trim(),
      cin_recto: formCinRecto || undefined,
      cin_verso: formCinVerso || undefined,
      commune: selectedCom || undefined,
      date_adhesion: formDateAdhesion,
      date_delivrance: formDateDelivrance || undefined,
      date_duplicata: formDateDuplicata || undefined,
      date_naissance: formDateNaissance || undefined,
      district: selectedDist || undefined,
      fokontany: selectedFok || undefined,
      genre: formGenre || undefined,
      lieu_delivrance: formLieuDelivrance || undefined,
      lieu_duplicata: formLieuDuplicata || undefined,
      lieu_naissance: formLieuNaissance || undefined,
      photo: formPhoto || undefined,
      province: selectedProv || undefined,
      region: selectedReg || undefined,
      telephone: formTelephone.trim() || undefined,
      tetikasa: formTetikasa,
      email_notification: formEmailNotification.trim() || undefined,
      submitted_at: new Date().toISOString()
    };

    try {
      await FirebaseService.saveMember(updatedMember);
      await saveActionLog(
        isEditMode ? "MEMBER_MDF" : "MEMBER_ADD", 
        `Nampiditra/Nanova mpikambana ${updatedMember.anarana} (${updatedMember.matricule})`
      );
      
      alert(isEditMode ? "📝 Voasolo sy voatahiry ny mombamomban'ny mpikambana!" : "🎉 Voasoratra soa aman-tsara ho mpikambana!");
      clearMemberForm();
      await loadSystemDatabase();
      setCurrentTab("members");
    } catch (e) {
      console.error(e);
      alert("❌ Nisy olana teo am-pitehirizana ny drakitra.");
    }
  };

  const startEditMember = (member: Member) => {
    setIsEditMode(true);
    setSelectedEditId(member.id);
    setFormAnarana(member.anarana || "");
    setFormCin(member.cin || "");
    setFormGenre(member.genre || "");
    setFormTelephone(member.telephone || "");
    setFormTetikasa(member.tetikasa || "AVOTRA MALAGASY");
    setFormDateAdhesion(member.date_adhesion || "");
    setFormDateNaissance(member.date_naissance || "");
    setFormLieuNaissance(member.lieu_naissance || "");
    setFormDateDelivrance(member.date_delivrance || "");
    setFormLieuDelivrance(member.lieu_delivrance || "");
    setFormDateDuplicata(member.date_duplicata || "");
    setFormLieuDuplicata(member.lieu_duplicata || "");
    setFormPhoto(member.photo || "");
    setFormEmailNotification(member.email_notification || "");

    // Geographicals selectors match loaders
    setSelectedProv(member.province || "");
    setSelectedReg(member.region || "");
    setSelectedDist(member.district || "");
    setSelectedCom(member.commune || "");
    setSelectedFok(member.fokontany || "");

    setCurrentTab("adhesion");
  };

  const clearMemberForm = () => {
    setIsEditMode(false);
    setSelectedEditId("");
    setFormAnarana("");
    setFormCin("");
    setFormGenre("");
    setFormTelephone("");
    setFormTetikasa("AVOTRA MALAGASY");
    setFormDateAdhesion("");
    setFormDateNaissance("");
    setFormLieuNaissance("");
    setFormDateDelivrance("");
    setFormLieuDelivrance("");
    setFormDateDuplicata("");
    setFormLieuDuplicata("");
    setFormPhoto("");
    setFormEmailNotification("");

    setSelectedProv("");
    setSelectedReg("");
    setSelectedDist("");
    setSelectedCom("");
    setSelectedFok("");
  };

  // --- ENQUETES STATUS MUTATIONS HANDLERS ---
  const handleUpdateStatusEnquete = async (id: string, status: string) => {
    try {
      await FirebaseService.updateEnqueteStatus(id, status);
      await saveActionLog("ENQUETE_VALIDATION", `Nanova status enquete ${id} ho ${status}`);
      alert(`✅ Voaova ho ${status} ny enquete!`);
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEnquete = async (id: string, matricule: string) => {
    if (!window.confirm("⚠️ Tena fafana ve ity enquete ity?")) return;
    try {
      await FirebaseService.deleteEnquete(id);
      await saveActionLog("ENQUETE_DELETE", `Namafa enquete social an'i ${matricule}`);
      alert("✅ Voafafa tanteraka ilay enquete!");
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    }
  };

  // --- ACCOUNTING LEDGER ACTIONS & 72H CONTROLS ---
  const handleAddAccountingTransaction = async (trans: Transaction) => {
    try {
      setIsAppLoading(true);
      
      // Calculate member account balance to verify overdraft/debits limit check
      const account = await FirebaseService.getMemberAccount(trans.matricule) || { solde: 0, solde_credit: 0, solde_debit: 0 };
      
      if (trans.karazana === 'MIVOAKA' && account.solde < trans.vola) {
        alert("❌ Tsy ampy ny solde ao amin'ny kaonty hanaovana ity retrait ity! (Solde: " + account.solde + " Ar)");
        setIsAppLoading(false);
        return;
      }

      // Safe check - If operation needs provincial chief approval first (above 50,000 MGA or based on logic)
      const needApproval = trans.vola >= 250000; // Trigger alert approval limit on larger values

      if (needApproval) {
        // Queue operation request
        const currentReqs = await FirebaseService.getOperationRequests();
        const randId = "REQ-" + Math.floor(10000 + Math.random() * 90000);
        const newReq: OperationRequest = {
          id: randId,
          matricule: trans.matricule,
          memberName: trans.memberName,
          type: trans.karazana,
          montant: trans.vola,
          motif: trans.motif,
          numero_telephone: trans.numero_telephone,
          operator: trans.operator,
          reference_transaction: trans.reference_transaction,
          createdAt: new Date().toISOString(),
          statut: "PENDING"
        };

        const reqResponse = await fetch(`${BASE_URL}/operationRequest.json`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReq)
        });

        if (reqResponse.ok) {
          alert("⏳ Opération de " + trans.vola + " Ar nahemotra ho fankatoavana amin'ny Contrôle 72H.");
          await saveActionLog("TRANSACT_PENDING", `Fangatahana mouvement 72H ho an'i ${trans.memberName}`);
        }
      } else {
        // Direct save transaction in real-time
        await FirebaseService.addAccounting(trans);
        
        // Update live balance in standard ledger account
        const updatedSolde = trans.karazana === "MIDITRA" 
          ? account.solde + trans.vola 
          : account.solde - trans.vola;
        
        const updatedCredit = trans.karazana === "MIDITRA" 
          ? account.solde_credit + trans.vola 
          : account.solde_credit;

        const updatedDebit = trans.karazana === "MIVOAKA" 
          ? account.solde_debit + trans.vola 
          : account.solde_debit;

        await FirebaseService.patchMemberAccount(trans.matricule, {
          solde: updatedSolde,
          solde_credit: updatedCredit,
          solde_debit: updatedDebit
        });

        await saveActionLog("TRANSACT_OK", `Mouvement de Caisse voatahiry ho an'i ${trans.memberName} (${trans.karazana} : ${trans.vola} Ar)`);
        alert("📥 Operation voarakitra soa aman-tsara!");
      }

      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAppLoading(false);
    }
  };

  const handleApproveOperationRequest = async (key: string, req: OperationRequest) => {
    try {
      setIsAppLoading(true);
      const randTrans: Transaction = {
        memberId: req.matricule, // Map to identifier
        matricule: req.matricule,
        memberName: req.memberName,
        karazana: req.type as "MIDITRA" | "MIVOAKA",
        vola: req.montant,
        motif: `[Approved 72H] ${req.motif}`,
        operator: loginUser,
        numero_telephone: req.numero_telephone,
        reference_transaction: req.reference_transaction,
        date: new Date().toISOString()
      };

      // Add to accounting ledger
      await FirebaseService.addAccounting(randTrans);

      // Mutate account balances
      const account = await FirebaseService.getMemberAccount(req.matricule) || { solde: 0, solde_credit: 0, solde_debit: 0 };
      const updatedSolde = req.type === "MIDITRA" ? account.solde + req.montant : account.solde - req.montant;
      const updatedCredit = req.type === "MIDITRA" ? account.solde_credit + req.montant : account.solde_credit;
      const updatedDebit = req.type === "MIVOAKA" ? account.solde_debit + req.montant : account.solde_debit;

      await FirebaseService.patchMemberAccount(req.matricule, {
        solde: updatedSolde,
        solde_credit: updatedCredit,
        solde_debit: updatedDebit
      });

      // Clear the operation request
      await FirebaseService.deleteOperationRequest(key);
      await saveActionLog("APPROVE_72H", `Nankatoavina ny opération 72H an'i ${req.memberName}`);
      alert("✅ Voafankato soa aman-tsara ilay opération!");
      
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAppLoading(false);
    }
  };

  const handleRejectOperationRequest = async (key: string, req: OperationRequest) => {
    if (!window.confirm("⚠️ Tena ho lavina ve ity opération ity?")) return;
    try {
      setIsAppLoading(true);
      await FirebaseService.deleteOperationRequest(key);
      await saveActionLog("REJECT_72H", `Nolavina ny opération 72H an'i ${req.memberName}`);
      alert("❌ Nolavina soa aman-tsara ilay opération.");
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAppLoading(false);
    }
  };

  const handleDeleteAccountingTransaction = async (id: string) => {
    if (!window.confirm("⚠️ Hamafa tanteraka ity transaction ity ve ianao? Izao dia hanova ny solde ao amin'ny ledger.")) return;
    try {
      setIsAppLoading(true);
      const transObj = allTransactions.find(t => t.id === id);
      if (!transObj) return;

      // Reverse balance mutation safely
      const account = await FirebaseService.getMemberAccount(transObj.matricule) || { solde: 0, solde_credit: 0, solde_debit: 0 };
      const updatedSolde = transObj.karazana === 'MIDITRA' ? account.solde - transObj.vola : account.solde + transObj.vola;
      const updatedCredit = transObj.karazana === 'MIDITRA' ? Math.max(0, account.solde_credit - transObj.vola) : account.solde_credit;
      const updatedDebit = transObj.karazana === 'MIVOAKA' ? Math.max(0, account.solde_debit - transObj.vola) : account.solde_debit;

      await FirebaseService.patchMemberAccount(transObj.matricule, {
        solde: updatedSolde,
        solde_credit: updatedCredit,
        solde_debit: updatedDebit
      });

      await FirebaseService.deleteAccounting(id);
      await saveActionLog("TRANSACT_DEL", `Namafa transaction (${id}) an'i ${transObj.memberName}`);
      alert("✅ Voafafa ny transaction!");
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAppLoading(false);
    }
  };

  // --- CALENDAR APPOINTMENTS ACTIONS ---
  const handleAddCalendarEvent = async (title: string, desc: string, date: string) => {
    try {
      const ev: CalendarEvent = { title, desc, date };
      await FirebaseService.saveEvent(ev);
      await saveActionLog("EVENT_ADD", `Nanampy fivoriana vaovao tamin'ny daty ${date}`);
      alert("📅 Tafiditra soa aman-tsara ny fivoriana!");
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    if (!window.confirm("⚠️ Hamafa ity event ity ve ianao?")) return;
    try {
      await FirebaseService.deleteEvent(id);
      await saveActionLog("EVENT_DEL", `Namafa event (${id}) fivoriana`);
      alert("✅ Voafafa ny event!");
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    }
  };

  // --- MESSENGER ACTIONS ---
  const handleSendChatMessage = async (text: string) => {
    const newMessage: ChatMessage = {
      sender: loginUser,
      role: currentUserRole,
      text,
      timestamp: new Date().toISOString(),
      status: "SENT",
      locked: true
    };
    try {
      await fetch(`${BASE_URL}/messenger.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLockChatMessage = async (id: string, lock: boolean) => {
    try {
      await fetch(`${BASE_URL}/messenger/${id}/locked.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lock)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAllMessages = async () => {
    if (!window.confirm("⚠️ Tena voadoroka ve ny resaka rehetra ao amin'ny messenger?")) return;
    try {
      await fetch(`${BASE_URL}/messenger.json`, { method: "DELETE" });
      await saveActionLog("MSG_PURGE", "Nafafan'ny Administrator ny resaka Messenger rehetra.");
      alert("🧹 Madio ny resaka rehetra!");
    } catch (e) {
      console.error(e);
    }
  };

  // --- SECURITY TAB TOKENS & USERS ACTIONS ---
  const handleCreateInvitationToken = async (role: string, tokenVal?: string) => {
    const code = tokenVal || "AMM-LIBRE-" + Math.floor(100000 + Math.random() * 900000);
    const randId = "TOK-" + Math.floor(1000 + Math.random() * 9000);
    try {
      await FirebaseService.saveToken(randId, { role, token_miasa: code });
      await saveActionLog("TOKEN_GEN", `Nanorona token vaovao ho an'ny rolana '${role}'`);
      alert(`🔑 Token vonona: ${code}`);
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteInvitationToken = async (key: string) => {
    try {
      await FirebaseService.deleteToken(key);
      await saveActionLog("TOKEN_DEL", "Namafa token invitation tao amin'ny pool");
      alert("✅ Token Invitation de-active!");
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateUserPermissions = async (username: string, permissions: Record<string, boolean>) => {
    try {
      const user = allUsers[username];
      if (!user) return;
      await FirebaseService.saveUser(username, { ...user, permissions });
      await saveActionLog("PERM_MUTATE", `Nanova ny fahazoan-dalàna (Permissions) an'i '${username}'`);
      alert("✅ Voatahiry ny permissions vaovao!");
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (username: string) => {
    if (!window.confirm(`⚠️ Tena fafana tanteraka ve ny kaontin'i '${username}'?`)) return;
    try {
      await FirebaseService.deleteUser(username);
      await saveActionLog("USER_DESTROYED", `Nofafana ny kaonty mpanorona '${username}'`);
      alert("✅ Kaonty voafafa tanteraka!");
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    }
  };

  // --- SYSTEM CONFIG PARAMETERS CONTROL ---
  const handleSaveParameters = async (params: any) => {
    try {
      await FirebaseService.saveParametres(params);
      await saveActionLog("PARAMS_UPDATE", "Nanova ny parameters general'ny rafitra.");
      alert("✅ Voatahiry soa aman-tsara!");
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetEntireDatabase = async () => {
    if (!window.confirm("🚨 LOZA LOZA! Hamafa tanteraka ny drakitra rehetra ve ianao? Ity dia ho fiandohan'ny famerenana tamin'ny 0 ny ERP.")) return;
    const confirmPhrase = window.prompt("Mba hanamafisana, soraty eto ambany ny teny hoe: DEPLOY-AMM");
    if (confirmPhrase !== "DEPLOY-AMM") {
      alert("❌ Tsy mety ny teny nampidirinao. Nolavina ilay fanadiovana.");
      return;
    }

    try {
      setIsAppLoading(true);
      await Promise.all([
        fetch(`${BASE_URL}/olona.json`, { method: "DELETE" }),
        fetch(`${BASE_URL}/enquetes.json`, { method: "DELETE" }),
        fetch(`${BASE_URL}/comptabilite.json`, { method: "DELETE" }),
        fetch(`${BASE_URL}/comptes.json`, { method: "DELETE" }),
        fetch(`${BASE_URL}/operationRequest.json`, { method: "DELETE" }),
        fetch(`${BASE_URL}/logs.json`, { method: "DELETE" }),
        fetch(`${BASE_URL}/events.json`, { method: "DELETE" }),
        fetch(`${BASE_URL}/messenger.json`, { method: "DELETE" })
      ]);

      await saveActionLog("DB_PURGED", "Nandoroka sy nanamarina ny drakitra rehetra tao amin'ny server ny super-admin.");
      alert("🎉 Madio tanteraka ny base de données! Nofafana daholo ny olona, enquete, transaksiona, solde, sy ny sisa.");
      await loadSystemDatabase();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAppLoading(false);
    }
  };

  // --- PRINTY GENERATION HANDLERS (ATTESTATION AND FILTER LIST REPORT) ---
  const loadAndGenerateAttestation = (member: Member, type: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("❌ Opération impossible, nampandehano ny popups ao amin'ny navigateur-nao.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Attestation de Membre - ${member.matricule}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; background: #fafafa; }
            .badge-logo { width: 90px; height: 90px; text-align: center; margin: 0 auto 20px; display: block; object-fit: contain; }
            .header-info { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .heading { font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin-top: 10px; }
            .ref-num { font-size: 11px; font-family: monospace; color: #64748b; margin-top: 4px; }
            .attestation-card { max-w: 650px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .body-text { line-height: 1.8; font-size: 14px; text-align: justify; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin: 25px 0; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #f1f5f9; }
            .info-label { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; }
            .info-val { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px; }
            .footer-sig { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
            .sig-box { text-align: center; font-size: 12px; }
            .sig-title { font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 50px; }
            .signature { font-style: italic; color: #64748b; text-decoration: underline; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="attestation-card">
            <img src="data:image/png;base64,${sysParams.logoBase64}" class="badge-logo" alt="AMM logo" />
            <div class="header-info">
              <span style="background: #4f46e5; color: white; border-radius: 20px; font-size: 10px; font-weight: 800; padding: 4px 10px; text-transform: uppercase;">Mouvement AMM Madagascar</span>
              <div class="heading">${sysParams.appName}</div>
              <div class="ref-num">Ref Contractuel: AT-${member.matricule}-AMM</div>
            </div>

            <div class="body-text">
              Le Comité National de Coordination du Mouvement AMM certifie par la présente attestation authentique que la personne mentionnée ci-dessous est officiellement enregistrée en tant qu'adhérent(e) et membre actif, rattaché(e) au programme de développement stratégique provincial.
            </div>

            <div class="info-grid">
              <div>
                <span class="info-label">Nom de l'adhérent</span>
                <div class="info-val">${member.anarana}</div>
              </div>
              <div>
                <span class="info-label">Matricule AMM Unique</span>
                <div class="info-val" style="font-family: monospace;">${member.matricule}</div>
              </div>
              <div>
                <span class="info-label">Projet de Rattachement</span>
                <div class="info-val">${member.tetikasa}</div>
              </div>
              <div>
                <span class="info-label">Faritany / Province</span>
                <div class="info-val">${member.province || 'Non défini'}</div>
              </div>
              <div style="grid-column: span 2;">
                <span class="info-label">CIN Numéro National</span>
                <div class="info-val">${member.cin || 'Non défini'}</div>
              </div>
            </div>

            <div class="body-text">
              Ce contrat membre et cette carte attestent que l'intéressé(e) est habilité(e) à bénéficier pleinement des facilitations communautaires de micro-projets et de la caisse d'investissement solidaire provincial.
            </div>

            <div class="footer-sig">
              <div class="sig-box">
                <div class="sig-title">Fait à Antananarivo, le</div>
                <div>${new Date().toLocaleDateString('fr-FR')}</div>
              </div>

              <div class="sig-box">
                <div class="sig-title">Le Président National / Admin</div>
                <div class="signature">AMM National Office</div>
              </div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportLisitreFiltrerPDF = (enquetesList: Enquete[], filter: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("❌ Opération impossible, nampandehano ny popups.");
      return;
    }

    const rowsHtml = enquetesList.map((eq, i) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">${i + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 12px;">${eq.anarana_olona}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${eq.matricule_olona || 'N/A'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${eq.fokontany || ''} • ${eq.commune || ''}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center; font-weight: bold;">${eq.points_calculated || 0} Pts</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center; font-weight: bold; color: ${eq.status === 'VALIDATED' ? '#15803d' : '#b45309'};">${eq.status || 'PENDING'}</td>
      </tr>
    `).join("");

    const reportHtml = `
      <html>
        <head>
          <title>Rapport d'Enquêtes ${filter}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; background: white; }
            .header { border-bottom: 3px double #cbd5e1; padding-bottom: 15px; margin-bottom: 30px; text-align: center; }
            .title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #0f172a; }
            .meta { font-size: 11px; color: #64748b; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #0f172a; color: white; padding: 12px; font-size: 11px; text-transform: uppercase; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Rapport Situation Enquêtes - AMM Connect</div>
            <div class="meta">Généré le ${new Date().toLocaleString()} • Filtre sélectionné: ${filter} • Nombre: ${enquetesList.length}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">Num</th>
                <th style="width: 30%">Nom Complet</th>
                <th style="width: 15%">Matricule</th>
                <th style="width: 30%">Zone Géographique</th>
                <th style="width: 10%; text-align: center;">Score</th>
                <th style="width: 10%; text-align: center;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const exportMembresPDF = (membersList: Member[]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("❌ Opération impossible, nampandehano ny popups.");
      return;
    }

    const rowsHtml = membersList.map((m, i) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">${i + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-family: monospace; font-size: 11px;">${m.matricule}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 12px;">${m.anarana}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #4f46e5; text-transform: uppercase;">${m.tetikasa || '---'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${[m.province, m.region, m.commune, m.fokontany].filter(Boolean).join(" • ") || '---'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right;">${m.date_adhesion || '---'}</td>
      </tr>
    `).join("");

    const reportHtml = `
      <html>
        <head>
          <title>Liste des Adhérents - AMM Connect</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; background: white; }
            .header { border-bottom: 3px double #4f46e5; padding-bottom: 15px; margin-bottom: 30px; text-align: center; }
            .title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #0f172a; }
            .meta { font-size: 11px; color: #64748b; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #4f46e5; color: white; padding: 12px; font-size: 11px; text-transform: uppercase; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sysParams.appName || 'AMM Connect'} - Liste Générale des Membres</div>
            <div class="meta">Généré le ${new Date().toLocaleString('fr-FR')} • Nombre de membres enregistrés-sifotra: ${membersList.length}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">Num</th>
                <th style="width: 15%">Matricule</th>
                <th style="width: 30%">Nom de l'Adhérent</th>
                <th style="width: 15%">Projet</th>
                <th style="width: 25%">Localisation (Zone)</th>
                <th style="width: 10%; text-align: right;">Adhésion</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };

  const exportTransactionsPDF = (transactionsList: Transaction[]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("❌ Opération impossible, nampandehano ny popups.");
      return;
    }

    const rowsHtml = transactionsList.map((t, i) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 11px;">${new Date(t.date).toLocaleString('fr-FR')}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-[11px] font-weight: bold;">${t.id || '---'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 12px;">${t.memberName} (${t.matricule})</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center; font-weight: bold; color: ${t.karazana === 'MIDITRA' ? '#15803d' : '#b45309'};">${t.karazana}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #475569;">${t.motif || '---'} (${t.operator || 'Admin'})</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; text-align: right; color: ${t.karazana === 'MIDITRA' ? 'green' : 'red'};">${t.karazana === 'MIDITRA' ? '+' : '-'} ${t.vola.toLocaleString()} Ar</td>
      </tr>
    `).join("");

    const miditraTotal = transactionsList.filter(t => t.karazana === 'MIDITRA').reduce((sum, t) => sum + t.vola, 0);
    const mivoakaTotal = transactionsList.filter(t => t.karazana === 'MIVOAKA').reduce((sum, t) => sum + t.vola, 0);
    const balance = miditraTotal - mivoakaTotal;

    const reportHtml = `
      <html>
        <head>
          <title>Grand Livre de Caisse - AMM Connect</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; background: white; }
            .header { border-bottom: 3px double #0d3373; padding-bottom: 15px; margin-bottom: 30px; text-align: center; }
            .title { font-size: 18px; font-weight: bold; text-transform: uppercase; color: #0d3373; }
            .meta { font-size: 11px; color: #64748b; margin-top: 5px; }
            .recap-box { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 30px; }
            .recap-item { text-align: center; }
            .recap-val { font-size: 16px; font-weight: bold; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #0d3373; color: white; padding: 12px; font-size: 11px; text-transform: uppercase; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${sysParams.appName || 'AMM Connect'} - GRAND JOURNAL DE CAISSE</div>
            <div class="meta">Généré le ${new Date().toLocaleString('fr-FR')} • Nombre total de mouvements: ${transactionsList.length}</div>
          </div>

          <div class="recap-box">
            <div class="recap-item">
              <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b;">Flux Global d'Entrées</span>
              <div class="recap-val" style="color: #15803d;">+ ${miditraTotal.toLocaleString()} Ar</div>
            </div>
            <div class="recap-item">
              <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b;">Flux Global de Sorties</span>
              <div class="recap-val" style="color: #b45309;">- ${mivoakaTotal.toLocaleString()} Ar</div>
            </div>
            <div class="recap-item">
              <span style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b;">Solde Net Trésorerie AMM</span>
              <div class="recap-val" style="color: #0d3373;">${balance.toLocaleString()} Ar</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%">Date & Heure</th>
                <th style="width: 12%">ID Opération</th>
                <th style="width: 25%">Adhérent Rattaché (Mat)</th>
                <th style="width: 8%; text-align: center;">Flux</th>
                <th style="width: 25%">Désignation & Opérateur</th>
                <th style="width: 15%; text-align: right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
  };


  // 2. Raha mbola "Loading" ny splash
  if (isSplash) {
    return <SplashScreen />;
  }

  // --- RENDERING VIEWS CORRUPTER COMPOSERS ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      
      {/* ⚠️ IF NOT LOGGED IN SHOW GATEWAYS SCREEN */}
      {!isLoggedIn ? (
        <AuthScreens
          authScreen={authScreen}
          setAuthScreen={setAuthScreen}
          isAuthLoading={isAuthLoading}
          loginUser={loginUser}
          setLoginUser={setLoginUser}
          loginPass={loginPass}
          setLoginPass={setLoginPass}
          regUser={regUser}
          setRegUser={setRegUser}
          regPass={regPass}
          setRegPass={setRegPass}
          regToken={regToken}
          setRegToken={setRegToken}
          forgotUser={forgotUser}
          setForgotUser={setForgotUser}
          tempCode={tempCode}
          setTempCode={setTempCode}
          newPass={newPass}
          setNewPass={setNewPass}
          confirmPass={confirmPass}
          setConfirmPass={setConfirmPass}
          forgotStep={forgotStep}
          handleLogin={handleLogin}
          handleSelfRegister={handleSelfRegister}
          handleForgotRequest={handleForgotRequest}
          handleVerifyCode={handleVerifyCode}
          handleResetFinal={handleResetFinal}
          logo={sysParams.logoBase64}
        />
      ) : (
        /* 🎨 CORE ERP WORKSPACE LAYOUT (AFTER LOGIN) */
        <div className="flex-1 flex flex-row relative">
          
          {/* NAVIGATION SIDEBAR */}
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            currentUserRole={currentUserRole}
            userPermissions={userPermissions}
            unreadCount={0}
            onLogout={handleLogout}
            loginUser={loginUser}
          />

          {/* RIGHT PANELS WORKSPACE */}
          <div className="flex-1 flex flex-col overflow-hidden max-h-screen">
            
            {/* TOP BAR BRAND PANELS */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm shrink-0 select-none">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-all cursor-pointer"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-2">
                  <img 
                    src={`data:image/png;base64,${sysParams.logoBase64}`} 
                    className="h-8 w-8 object-contain" 
                    alt="logo" 
                  />
                  <h1 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider">{sysParams.appName}</h1>
                </div>
              </div>

              {/* Status metrics indicators */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Rôle: {currentUserRole}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={loadSystemDatabase}
                    className={`p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-all cursor-pointer ${
                      isAppLoading ? 'animate-spin' : ''
                    }`}
                    title="Mamelona ny base de données"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                    </svg>
                  </button>
                </div>
              </div>
            </header>

            {/* TAB SCREENS PANEL COMPOSING ROUTER */}
            <main className="flex-1 overflow-y-auto bg-slate-50 relative pb-10">
              
              {/* Core loading spinner overlay */}
              {isAppLoading && (
                <div className="absolute top-0 inset-x-0 h-1 bg-indigo-600 animate-pulse z-40"></div>
              )}

              {/* Tab 1: OVERVIEW CONTROL CABINET */}
              {currentTab === "overview" && (
                <OverviewDashboard
                  allMembers={allMembers}
                  allEnquetes={allEnquetes}
                  allTransactions={allTransactions}
                  logs={logs}
                  events={events}
                  setCurrentTab={setCurrentTab}
                />
              )}

              {/* Tab 2: ADHESION REGISTRATOR CARD */}
              {currentTab === "adhesion" && (
                <div className="p-6">
                  <AdhesionForm
                    isEditMode={isEditMode}
                    selectedEditId={selectedEditId}
                    formAnarana={formAnarana}
                    setFormAnarana={setFormAnarana}
                    formCin={formCin}
                    setFormCin={setFormCin}
                    formCinRecto={formCinRecto}
                    setFormCinRecto={setFormCinRecto}
                    formCinVerso={formCinVerso}
                    setFormCinVerso={setFormCinVerso}
                    formGenre={formGenre}
                    setFormGenre={setFormGenre}
                    formTelephone={formTelephone}
                    setFormTelephone={setFormTelephone}
                    formTetikasa={formTetikasa}
                    setFormTetikasa={setFormTetikasa}
                    formDateAdhesion={formDateAdhesion}
                    setFormDateAdhesion={setFormDateAdhesion}
                    formDateNaissance={formDateNaissance}
                    setFormDateNaissance={setFormDateNaissance}
                    formLieuNaissance={formLieuNaissance}
                    setFormLieuNaissance={setFormLieuNaissance}
                    formDateDelivrance={formDateDelivrance}
                    setFormDateDelivrance={setFormDateDelivrance}
                    formLieuDelivrance={formLieuDelivrance}
                    setFormLieuDelivrance={setFormLieuDelivrance}
                    formDateDuplicata={formDateDuplicata}
                    setFormDateDuplicata={setFormDateDuplicata}
                    formLieuDuplicata={formLieuDuplicata}
                    setFormLieuDuplicata={setFormLieuDuplicata}
                    formPhoto={formPhoto}
                    setFormPhoto={setFormPhoto}
                    formEmailNotification={formEmailNotification}
                    setFormEmailNotification={setFormEmailNotification}
                    selectedProv={selectedProv}
                    setSelectedProv={setSelectedProv}
                    selectedReg={selectedReg}
                    setSelectedReg={setSelectedReg}
                    selectedDist={selectedDist}
                    setSelectedDist={setSelectedDist}
                    selectedCom={selectedCom}
                    setSelectedCom={setSelectedCom}
                    selectedFok={selectedFok}
                    setSelectedFok={setSelectedFok}
                    handleSaveMember={handleSaveMember}
                    clearMemberForm={clearMemberForm}
                    setCurrentTab={setCurrentTab}
                  />
                </div>
              )}

              {/* Tab 3: MEMBERS DIRECTORY CARD LIST */}
              {currentTab === "members" && (
                <MembersList
                  allMembers={allMembers}
                  allEnquetes={allEnquetes}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  setSelectedMember={setSelectedMember}
                  setModalMemberDetail={setModalMemberDetail}
                  startEditMember={startEditMember}
                  loadAndGenerateAttestation={loadAndGenerateAttestation}
                  exportMembresPDF={exportMembresPDF}
                />
              )}

              {/* Tab 4: ENQUETES EXPLORER (Situation Enquêtes) */}
              {currentTab === "enquetes" && (
                <EnquetesList
                  allEnquetes={allEnquetes}
                  searchQuery={surveyQuery}
                  setSearchQuery={setSurveyQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  setSelectedEnquete={setSelectedEnquete}
                  setModalEnqueteDetail={setModalEnqueteDetail}
                  handleUpdateStatusEnquete={handleUpdateStatusEnquete}
                  handleDeleteEnquete={handleDeleteEnquete}
                  exportLisitreFiltrerPDF={exportLisitreFiltrerPDF}
                />
              )}

              {/* Tab 5: COMPTABILITE TRANSACTION CARD */}
              {currentTab === "accounting" && (
                <TransactionsFormAndLog
                  allMembers={allMembers}
                  allTransactions={allTransactions}
                  accountingRequests={operationRequests}
                  currentUserRole={currentUserRole}
                  loginUser={loginUser}
                  onAddTransaction={handleAddAccountingTransaction}
                  onApproveRequest={handleApproveOperationRequest}
                  onRejectRequest={handleRejectOperationRequest}
                  onDeleteTransaction={handleDeleteAccountingTransaction}
                  exportTransactionsPDF={exportTransactionsPDF}
                />
              )}

              {/* Tab 6: OPERATIONS LEDGERS DETAIL (Member Accounts balances) */}
              {currentTab === "operations" && (
                <MemberAccountDashboard
                  allMembers={allMembers}
                  allTransactions={allTransactions}
                  currentUser={loginUser}
                  currentUserRole={currentUserRole}
                />
              )}

              {/* Tab 7: CALENDAR PLANNER APPOINTMENTS */}
              {currentTab === "calendar" && (
                <CalendarTab
                  events={events}
                  onAddEvent={handleAddCalendarEvent}
                  onDeleteEvent={handleDeleteCalendarEvent}
                />
              )}

              {/* Tab 8: SECURE INTERNAL MESSENGER CHAT */}
              {currentTab === "messenger" && (
                <MessengerTab
                  messages={messages}
                  loginUser={loginUser}
                  currentUserRole={currentUserRole}
                  onSendMessage={handleSendChatMessage}
                  onLockMessage={handleLockChatMessage}
                  onClearAllMessages={handleClearAllMessages}
                />
              )}

              {/* Tab 9: SECURITY CONFIG CONTROLL PANEL */}
              {currentTab === "security" && (
                <SecurityTab
                  tokens={tokens}
                  users={allUsers}
                  currentUserRole={currentUserRole}
                  loginUser={loginUser}
                  onCreateToken={handleCreateInvitationToken}
                  onDeleteToken={handleDeleteInvitationToken}
                  onUpdateUserPermissions={handleUpdateUserPermissions}
                  onDeleteUser={handleDeleteUser}
                />
              )}

              {/* Tab 10: ACTION SYSTEM AUDIT LOGS OVERVIEW */}
              {currentTab === "historique" && (
                <LogsList
                  logs={logs}
                  currentUserRole={currentUserRole}
                  onClearLogs={async () => {
                    if (!window.confirm("⚠️ Tena voadoroka ve ny logs audit rehetra?")) return;
                    await fetch(`${BASE_URL}/logs.json`, { method: 'DELETE' });
                    await saveActionLog("LOGS_PURGE", "Nodiovina tanteraka ny logs systeme.");
                    await loadSystemDatabase();
                  }}
                  onDeleteLog={async (id) => {
                    await FirebaseService.deleteLog(id);
                    await saveActionLog("LOG_DEL_SINGLE", `Namafa logs singulier: ${id}`);
                    await loadSystemDatabase();
                  }}
                />
              )}

              {/* Tab 11: PARAMETRES & SYSTEM EXPORTS SETTING GENERAL */}
              {currentTab === "parametre" && (
                <ParametresTab
                  currentParams={sysParams}
                  currentUserRole={currentUserRole}
                  onSaveParams={handleSaveParameters}
                  onResetDatabase={handleResetEntireDatabase}
                />
              )}
            </main>
          </div>

          {/* 🌟 OVERLAYS DETAIL POPUPS MODALES - MEMBER DETAILS */}
          {modalMemberDetail && selectedMember && (
            <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in font-sans">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-zoom-in border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white select-none">
                  <span className="text-xs font-bold uppercase tracking-widest bg-indigo-800 px-2.5 py-1 rounded-full">
                    {selectedMember.matricule}
                  </span>
                  <h3 className="font-extrabold text-sm uppercase">Mombamomba ny Mpikambana</h3>
                  <button onClick={() => setModalMemberDetail(false)} className="hover:opacity-75 transition-all text-white cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Anarana feno</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedMember.anarana || '---'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Laharana finday</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedMember.telephone || '---'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Karatra CIN / Date d'obtention</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedMember.cin || '---'} {selectedMember.date_delivrance ? `(Délivré le ${selectedMember.date_delivrance})` : ''}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Tetikasa / Projet</span>
                      <span className="font-bold text-indigo-600 text-sm uppercase">{selectedMember.tetikasa || '---'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Date d'Adhésion</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedMember.date_adhesion || '---'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Fiaviana (Faritra, Kaominina, Fokontany)</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedMember.province || '---'} • {selectedMember.region || '---'} • {selectedMember.commune || '---'} • {selectedMember.fokontany || '---'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end gap-3 select-none">
                  <button 
                    onClick={() => {
                      loadAndGenerateAttestation(selectedMember, 'Adhesion');
                      setModalMemberDetail(false);
                    }}
                    className="p-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Printy Certificat</span>
                  </button>
                  <button 
                    onClick={() => setModalMemberDetail(false)} 
                    className="p-2 py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Hakatona
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 🌟 OVERLAYS DETAIL POPUPS MODALES - ENQUETE DETAILS */}
          {modalEnqueteDetail && selectedEnquete && (
            <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in font-sans">
              <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-zoom-in border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white select-none">
                  <span className="text-xs font-bold uppercase tracking-widest bg-indigo-800 px-2.5 py-1 rounded-full animate-pulse">
                    Points: {selectedEnquete.points_calculated || 0} Pts
                  </span>
                  <h3 className="font-extrabold text-sm uppercase">Valin'ny Enquête Sosialy</h3>
                  <button onClick={() => setModalEnqueteDetail(false)} className="hover:opacity-75 transition-all text-white cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Mpikambana nanontaniana</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedEnquete.anarana_olona || '---'} {selectedEnquete.matricule_olona ? `(${selectedEnquete.matricule_olona})` : ''}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Mpanontany / Enquêteur</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedEnquete.enqueteur || '---'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Sokajy mponina</span>
                      <span className="font-bold text-rose-600 text-sm uppercase">{selectedEnquete.sokajy_mponina || '---'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Ezaka Sosialy / Assistance ilaina</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedEnquete.ezaka_ilaina || '---'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Fidiram-bola isan-karazany (MGA)</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedEnquete.fidiram_bola ? `${Number(selectedEnquete.fidiram_bola).toLocaleString()} Ar` : '---'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Lojika fokontany sy faritany</span>
                      <span className="font-bold text-slate-800 text-sm">{selectedEnquete.fokontany || '---'}, {selectedEnquete.commune || '---'}, {selectedEnquete.distrika || '---'}</span>
                    </div>
                  </div>

                  {/* VALIDATION QUESTIONNAIRE SUMMARY LIST */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 select-none">
                      📋 Questionnaire Points Détails ({selectedEnquete.valim_panontaniana ? Object.keys(selectedEnquete.valim_panontaniana).length : 0})
                    </h4>
                    <div className="space-y-2 text-xs">
                      {selectedEnquete.valim_panontaniana && Object.entries(selectedEnquete.valim_panontaniana).map(([qKey, checked]) => (
                        <div key={qKey} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100">
                          <span className="text-slate-600 font-medium pr-4">{qKey}</span>
                          <span className={`font-bold uppercase ${checked ? 'text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded' : 'text-slate-400'}`}>
                            {checked ? "ENY (YES)" : "TSIA (NO)"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end gap-3 select-none">
                  {selectedEnquete.status !== 'VALIDATED' && (
                    <button 
                      onClick={() => {
                        if (selectedEnquete.id) handleUpdateStatusEnquete(selectedEnquete.id, 'VALIDATED');
                        setModalEnqueteDetail(false);
                      }}
                      className="p-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition-all cursor-pointer"
                    >
                      Valider l'enquête
                    </button>
                  )}
                  <button 
                    onClick={() => setModalEnqueteDetail(false)} 
                    className="p-2 py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Hakatona
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
