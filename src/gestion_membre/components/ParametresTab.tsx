import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  Database, 
  FileText, 
  CheckCircle, 
  List, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Coins, 
  Share2, 
  Building, 
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download
} from 'lucide-react';
import { BASE_URL } from '../constants';
import { Member, Enquete } from '../types';
import { loadAndGenerateAttestation } from './document';

interface Props {
  currentParams?: any;
  currentUserRole?: string;
  onSaveParams?: (params: any) => void | Promise<void>;
  onResetDatabase?: () => void | Promise<void>;
}

export default function ParametresTab({ 
  currentParams, 
  currentUserRole = "ENQUETEUR", 
  onSaveParams, 
  onResetDatabase 
}: Props) {
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string; timestamp?: string } | null>(null);

  // Identity & Association Details
  const [formAsso, setFormAsso] = useState("ASSOCIATION MALAGASY MIRAY");
  const [formAcronyme, setFormAcronyme] = useState("SITE AMM");
  const [formIdeologie, setFormIdeologie] = useState("\"fanarenana ifotony ny fiarahamonina Malgasy\"");
  const [formMission, setFormMission] = useState("Développement solidaire, micro-projets communautaires, formation agricole et valorisation citoyenne à Madagascar.");
  const [formDecret, setFormDecret] = useState("1234");
  const [formDateDecret, setFormDateDecret] = useState("28 juillet 2022");
  const [formNif, setFormNif] = useState("4001289345");
  const [formStat, setFormStat] = useState("94991 11 2022 0 10023");

  // Contact Information
  const [formTel, setFormTel] = useState("+261 34 86 115 36");
  const [formTelUrgence, setFormTelUrgence] = useState("+261 34 29 845 23");
  const [formEmail, setFormEmail] = useState("associationmalagasymiray@gmail.com");
  const [formSiege, setFormSiege] = useState("Lot 4 11 58");
  const [formLieu, setFormLieu] = useState("Ambatondrazaka, Madagascar");
  const [formRegion, setFormRegion] = useState("Alaotra-Mangoro");

  // Currency & Financial Rules
  const [formCurrency, setFormCurrency] = useState("MGA");
  const [formCurrencySymbol, setFormCurrencySymbol] = useState("Ar");
  const [formAlertThreshold, setFormAlertThreshold] = useState("500000"); // 500k Ar
  const [formCotisationAnnuelle, setFormCotisationAnnuelle] = useState("20000"); // 20k Ar

  // Social Links & Web
  const [formFacebook, setFormFacebook] = useState("https://facebook.com/associationmalagasymiray");
  const [formWhatsapp, setFormWhatsapp] = useState("+261348611536");
  const [formWebsite, setFormWebsite] = useState("https://site-amm.mg");

  // Members data state for DONNEE sub-tab
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allEnquetes, setAllEnquetes] = useState<Enquete[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({
    province: '', region: '', district: '', commune: '', fokontany: '', tetikasa: '', enquete: ''
  });

  // Check RBAC permission for editing site parameters
  const canEditParameters = useMemo(() => {
    const role = (currentUserRole || "").toUpperCase();
    return role === 'ADMIN' || 
           role === 'SUPER_ADMIN' || 
           role === 'NATIONAL_PRESIDENT' || 
           role === 'DIRECTEUR' || 
           role === 'PRESIDENT';
  }, [currentUserRole]);

  // Load Parameters from Firebase RTDB
  const fetchParametres = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/parametres.json`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const d = data.parametres || data;
          if (d.nom_association) setFormAsso(d.nom_association);
          if (d.acronyme) setFormAcronyme(d.acronyme);
          if (d.ideologie) setFormIdeologie(d.ideologie);
          if (d.mission) setFormMission(d.mission);
          if (d.decret) setFormDecret(d.decret);
          if (d.date_decret) setFormDateDecret(d.date_decret);
          if (d.nif) setFormNif(d.nif);
          if (d.stat) setFormStat(d.stat);
          if (d.telephone) setFormTel(d.telephone);
          if (d.telephone_urgence) setFormTelUrgence(d.telephone_urgence);
          if (d.email) setFormEmail(d.email);
          if (d.siege_social) setFormSiege(d.siege_social);
          if (d.lieu) setFormLieu(d.lieu);
          if (d.region) setFormRegion(d.region);
          if (d.currency) setFormCurrency(d.currency);
          if (d.currency_symbol) setFormCurrencySymbol(d.currency_symbol);
          if (d.alert_threshold) setFormAlertThreshold(String(d.alert_threshold));
          if (d.cotisation_annuelle) setFormCotisationAnnuelle(String(d.cotisation_annuelle));
          if (d.facebook) setFormFacebook(d.facebook);
          if (d.whatsapp) setFormWhatsapp(d.whatsapp);
          if (d.website) setFormWebsite(d.website);
        }
      }
    } catch (e) {
      console.error("Error fetching site parameters:", e);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/olona.json`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const membersArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
          setAllMembers(membersArray);
        }
      }
    } catch (e) {
      console.error("Error fetching members:", e);
    }
  }, []);

  useEffect(() => {
    void fetchParametres();
    void fetchMembers();
  }, [fetchParametres, fetchMembers]);

  // Save All Parameters to Firebase and localStorage
  const saveParametres = async () => {
    if (!canEditParameters) {
      setSaveStatus({
        type: 'error',
        message: 'Accès refusé : Seuls les administrateurs et directeurs peuvent modifier les paramètres globaux.'
      });
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    const paramsData = {
      nom_association: formAsso,
      acronyme: formAcronyme,
      ideologie: formIdeologie,
      mission: formMission,
      decret: formDecret,
      date_decret: formDateDecret,
      nif: formNif,
      stat: formStat,
      telephone: formTel,
      telephone_urgence: formTelUrgence,
      email: formEmail,
      siege_social: formSiege,
      lieu: formLieu,
      region: formRegion,
      currency: formCurrency,
      currency_symbol: formCurrencySymbol,
      alert_threshold: Number(formAlertThreshold) || 500000,
      cotisation_annuelle: Number(formCotisationAnnuelle) || 20000,
      facebook: formFacebook,
      whatsapp: formWhatsapp,
      website: formWebsite,
      updatedAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`${BASE_URL}/parametres.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paramsData)
      });

      if (res.ok) {
        // Also sync to localStorage for rapid access by other modules
        localStorage.setItem('site_amm_params', JSON.stringify(paramsData));
        localStorage.setItem('site_amm_profile', JSON.stringify({
          name: formAsso,
          address: `${formSiege}, ${formLieu}`,
          phone: formTel,
          email: formEmail,
          legalNotice: `Enregistrement N° ${formDecret} du ${formDateDecret}`
        }));

        if (onSaveParams) {
          await onSaveParams(paramsData);
        }

        setIsEditing(false);
        setSaveStatus({
          type: 'success',
          message: 'Paramètres globaux du SITE AMM enregistrés et synchronisés avec succès !',
          timestamp: new Date().toLocaleTimeString('fr-FR')
        });
      } else {
        throw new Error('Erreur de réponse serveur');
      }
    } catch (e) {
      console.error("Error saving params:", e);
      setSaveStatus({
        type: 'error',
        message: 'Échec de la sauvegarde des paramètres dans la base de données.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered members data for DONNEE tab
  const filteredData = useMemo(() => {
    return allMembers.filter(person => {
      const query = searchQuery ? searchQuery.toLowerCase() : "";
      const name = person.anarana ? person.anarana.toLowerCase() : "";
      const mat = person.matricule ? person.matricule.toLowerCase() : "";
      const matchSearch = name.includes(query) || mat.includes(query);

      const matchFiltre = 
        (filters.province === "" || person.province === filters.province) &&
        (filters.region === "" || person.region === filters.region) &&
        (filters.district === "" || person.district === filters.district) &&
        (filters.commune === "" || person.commune === filters.commune) &&
        (filters.fokontany === "" || person.fokontany === filters.fokontany) &&
        (filters.tetikasa === "" || person.tetikasa === filters.tetikasa);

      return matchSearch && matchFiltre;
    });
  }, [allMembers, searchQuery, filters]);

  const exportToExcel = () => {
    const headers = ["Matricule", "Nom", "CIN", "ID", "Tetikasa", "District", "Commune"];
    const rows = filteredData.map(item => [
      item.matricule, 
      `"${item.anarana || ''}"`, 
      item.cin || '', 
      item.id || '', 
      `"${item.tetikasa || ''}"`,
      `"${item.district || ''}"`,
      `"${item.commune || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lisitry_Mpikambana_AMM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const menuItems = [
    { id: 'GENERAL', label: 'Identité & Organisation', icon: Building },
    { id: 'CONTACT', label: 'Coordonnées & Siège', icon: Phone },
    { id: 'FINANCE', label: 'Devise & Paramètres Financiers', icon: Coins },
    { id: 'SOCIAL', label: 'Réseaux & Liens Publics', icon: Share2 },
    { id: 'DONNEE', label: 'Données Membres & Export', icon: Database },
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-[700px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Paramètres du Site</h2>
              <p className="text-[11px] text-slate-500">Configuration Globale AMM</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Rôle Actif :</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
              {currentUserRole}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className={`w-3.5 h-3.5 ${canEditParameters ? 'text-emerald-400' : 'text-amber-400'}`} />
            {canEditParameters 
              ? 'Droit de modification accordé' 
              : 'Mode consultation (lecture seule)'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
        {/* Status Notification */}
        {saveStatus && (
          <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
            saveStatus.type === 'success' 
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
              : 'bg-rose-950/80 border-rose-800 text-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {saveStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
              <span className="font-semibold">{saveStatus.message}</span>
            </div>
            {saveStatus.timestamp && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {saveStatus.timestamp}
              </span>
            )}
          </div>
        )}

        {/* TAB 1: IDENTITÉ & ORGANISATION */}
        {activeTab === 'GENERAL' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-400" />
                  Identité de l'Association & Métadonnées
                </h3>
                <p className="text-xs text-slate-400">Raison sociale, acronyme officiel, idéologie et enregistrement légal</p>
              </div>

              {canEditParameters && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={saveParametres}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 flex items-center gap-1.5 transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
                    >
                      Modifier les Informations
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Nom officiel de l'association *</label>
                <input
                  disabled={!isEditing}
                  value={formAsso}
                  onChange={(e) => setFormAsso(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Acronyme du Site / Plateforme</label>
                <input
                  disabled={!isEditing}
                  value={formAcronyme}
                  onChange={(e) => setFormAcronyme(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-slate-300 font-semibold">Idéologie & Devise Fondatrice</label>
                <input
                  disabled={!isEditing}
                  value={formIdeologie}
                  onChange={(e) => setFormIdeologie(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-slate-300 font-semibold">Mission Statement / Objectif Social</label>
                <textarea
                  rows={2}
                  disabled={!isEditing}
                  value={formMission}
                  onChange={(e) => setFormMission(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">N° Décret d'autorisation / Agrément</label>
                <input
                  disabled={!isEditing}
                  value={formDecret}
                  onChange={(e) => setFormDecret(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Date d'enregistrement du décret</label>
                <input
                  disabled={!isEditing}
                  value={formDateDecret}
                  onChange={(e) => setFormDateDecret(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Numéro d'Identification Fiscale (NIF)</label>
                <input
                  disabled={!isEditing}
                  value={formNif}
                  onChange={(e) => setFormNif(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Numéro Statistique (STAT)</label>
                <input
                  disabled={!isEditing}
                  value={formStat}
                  onChange={(e) => setFormStat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COORDONNÉES & CONTACT */}
        {activeTab === 'CONTACT' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-indigo-400" />
                  Coordonnées Officielles & Siège Social
                </h3>
                <p className="text-xs text-slate-400">Contacts téléphoniques, adresses e-mail et localisation du siège</p>
              </div>

              {canEditParameters && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={saveParametres}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 flex items-center gap-1.5 transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
                    >
                      Modifier les Contacts
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Téléphone Principal Siège *</label>
                <input
                  disabled={!isEditing}
                  value={formTel}
                  onChange={(e) => setFormTel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Téléphone Urgence / Coordination</label>
                <input
                  disabled={!isEditing}
                  value={formTelUrgence}
                  onChange={(e) => setFormTelUrgence(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-slate-300 font-semibold">Adresse E-mail Officielle *</label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Adresse Physique / Siège Social *</label>
                <input
                  disabled={!isEditing}
                  value={formSiege}
                  onChange={(e) => setFormSiege(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Ville & Pays</label>
                <input
                  disabled={!isEditing}
                  value={formLieu}
                  onChange={(e) => setFormLieu(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Région Principale</label>
                <input
                  disabled={!isEditing}
                  value={formRegion}
                  onChange={(e) => setFormRegion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEVISE & PARAMÈTRES FINANCIERS */}
        {activeTab === 'FINANCE' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-indigo-400" />
                  Devise Active & Règles Financières
                </h3>
                <p className="text-xs text-slate-400">Paramétrage de la monnaie de tenue de compte et seuils de trésorerie</p>
              </div>

              {canEditParameters && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={saveParametres}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 flex items-center gap-1.5 transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
                    >
                      Modifier les Paramètres Financiers
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Code Monétaire Principal *</label>
                <select
                  disabled={!isEditing}
                  value={formCurrency}
                  onChange={(e) => {
                    setFormCurrency(e.target.value);
                    if (e.target.value === 'MGA') setFormCurrencySymbol('Ar');
                    else if (e.target.value === 'EUR') setFormCurrencySymbol('€');
                    else if (e.target.value === 'USD') setFormCurrencySymbol('$');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                >
                  <option value="MGA">MGA — Ariary Malagasy (Monnaie nationale officielle)</option>
                  <option value="EUR">EUR — Euro (€)</option>
                  <option value="USD">USD — Dollar Américain ($)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Symbole Monétaire d'Affichage</label>
                <input
                  disabled={!isEditing}
                  value={formCurrencySymbol}
                  onChange={(e) => setFormCurrencySymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Seuil d'Alerte Trésorerie Basse (Ar)</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={formAlertThreshold}
                  onChange={(e) => setFormAlertThreshold(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">Alerte déclenchée si le solde de caisse descend en dessous</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Cotisation Annuelle de Base (Ar)</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={formCotisationAnnuelle}
                  onChange={(e) => setFormCotisationAnnuelle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-500">Montant d'adhésion annuel standard pour un membre</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: RÉSEAUX & LIENS PUBLICS */}
        {activeTab === 'SOCIAL' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-indigo-400" />
                  Réseaux Sociaux & Liens de Communication
                </h3>
                <p className="text-xs text-slate-400">Liens affichés sur le portail public et les attestations officielles</p>
              </div>

              {canEditParameters && (
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={saveParametres}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 flex items-center gap-1.5 transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
                    >
                      Modifier les Liens
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Page Facebook Officielle</label>
                <input
                  disabled={!isEditing}
                  value={formFacebook}
                  onChange={(e) => setFormFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold">Numéro WhatsApp Professionnel</label>
                <input
                  disabled={!isEditing}
                  value={formWhatsapp}
                  onChange={(e) => setFormWhatsapp(e.target.value)}
                  placeholder="+26134..."
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-slate-300 font-semibold">Site Web Officiel / Portail</label>
                <input
                  disabled={!isEditing}
                  value={formWebsite}
                  onChange={(e) => setFormWebsite(e.target.value)}
                  placeholder="https://site-amm.mg"
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 disabled:cursor-not-allowed rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GESTION DONNÉES MEMBRES & EXPORT */}
        {activeTab === 'DONNEE' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-400" />
                  Données Membres & Exportation
                </h3>
                <p className="text-xs text-slate-400">Consultation globale de la base olona et export CSV/Excel</p>
              </div>

              <button
                type="button"
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/30"
              >
                <Download className="w-4 h-4" />
                Exporter CSV ({filteredData.length})
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap gap-3 items-center">
              <input
                type="text"
                placeholder="Recherche par nom ou matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-400 font-medium font-mono">
                {filteredData.length} membre(s) listé(s)
              </span>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Matricule</th>
                    <th className="py-3 px-3">Nom & Prénoms</th>
                    <th className="py-3 px-3">CIN</th>
                    <th className="py-3 px-3">District</th>
                    <th className="py-3 px-3">Projet</th>
                    <th className="py-3 px-3 text-center">Attestation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredData.slice(0, 50).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 text-indigo-400 font-bold">{item.matricule}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-200 font-medium">{item.anarana}</td>
                      <td className="py-2.5 px-3 text-slate-400">{item.cin || '—'}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">{item.district || '—'}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-400">{item.tetikasa || 'AVOTRA MALAGASY'}</td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <button
                          type="button"
                          onClick={() => loadAndGenerateAttestation(item, 'Attestation')}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg text-[11px] font-semibold transition"
                        >
                          📄 Générer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
