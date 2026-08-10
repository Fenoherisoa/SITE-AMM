import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Settings, Save, Server, ShieldCheck, Database, FileText, CheckCircle, List } from 'lucide-react';
import { 
  PROJECT_PREFIX, BASE_URL, QUESTIONS_LIST, base64Logo 
} from '../constants';
import { Member, Enquete } from '../types';
import {loadAndGenerateAttestation} from './document';


export default function ParametresTab({ currentParams, currentUserRole, onSaveParams, onResetDatabase }: Props) {
  // Ampiana state ho an'ny sidebar
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [isEditing, setIsEditing] = useState(false); // <--- Tsy maintsy atao io
  const [formAsso, setFormAsso] = useState("");
  const [formIdeologie, setFormIdeologie] = useState("");
  const [formDecret, setFormDecret] = useState("");
  const [formDateDecret, setFormDateDecret] = useState("");
  const [formTel, setFormTel] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSiege, setFormSiege] = useState("");
  const [formLieu, setFormLieu] = useState("");
  const [allMembers, setAllMembers] = useState([]);
  const [allEnquetes, setAllEnquetes] = useState([]); // Aza adino ity
  // Fikarohana (Search Filter)
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
  province: '', region: '', district: '', commune: '', fokontany: '', tetikasa: '', enquete: ''
});
  const [showSignatureCol, setShowSignatureCol] = useState(false); // Ho an'ny sonia
  const [membersData, setMembersData] = useState([]); // Hamarino tsara ny tsipelina eto
  

  useEffect(() => {
    // Antsoina avy hatrany rehefa misokatra ny tab "parametre"
    fetchMembers();
    fetchParametres();
  }, []); // [] = midika hoe indray mandeha monja rehefa vao misokatra

  ///format date
  const formatDateInput = (text) => {
    // 1. Esorina ny zavatra rehetra tsy isa (0-9)
    let cleaned = text.replace(/\D/g, '');

    // 2. Tsy azo mihoatra ny 8 ny isa (DDMMYYYY)
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);

    // 3. Ampiana ny "/"
    let formatted = cleaned;
    if (cleaned.length > 4) {
        formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4, 8)}`;
    } else if (cleaned.length > 2) {
        formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    }

    return formatted;
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/olona.json`);
      const data = await res.json();
      if (data) {
        const membersArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setAllMembers(membersArray);
      }
    } catch (e) { console.error("Olana tamin'ny famakiana:", e); }
  };

  
  const menuItems = [
    { id: 'GENERAL', label: 'Paramètres Généraux', icon: Settings },
    { id: 'DONNEE', label: 'Données Membres', icon: Database },
    { id: 'DOSSIER', label: 'Gestion Dossiers', icon: FileText },
    { id: 'VERIFICATION', label: 'Audit & Vérification', icon: CheckCircle },
    { id: 'TOKEN', label: 'Gestion Tokens', icon: List },
    { id: 'VALIDATION COMPTE', label: 'Validation Compte', icon: List },
  ];


  const fetchParametres = async () => {
      try {
        const res = await fetch(`${BASE_URL}/parametres.json`);
        const data = await res.json();
        
        // IZAO NO ATAO: Log-eo aloha ny data hahitanao izay ao anatiny
        console.log("DATA AZO:", data); 

        if (data) {
          // Jereo raha ao anatin'ny "parametres" ny data-nao
          const d = data.parametres || data; 

          setFormAsso(d.nom_association || "");
          setFormIdeologie(d.ideologie || "");
          setFormDecret(d.decret || "");
          setFormDateDecret(d.date_decret || "");
          setFormTel(d.telephone || "");
          setFormEmail(d.email || "");
          setFormSiege(d.siege_social || "");
          setFormLieu(d.lieu || "");
        }
      } catch (e) {
        console.error("Olana tamin'ny famakiana:", e);
      }
    };

    const saveParametres = async () => {
      const paramsData = {
        nom_association: formAsso,
        ideologie: formIdeologie,
        decret: formDecret,
        date_decret: formDateDecret,
        telephone: formTel,
        email: formEmail,
        siege_social: formSiege,
        lieu: formLieu,
        updatedAt: new Date().toISOString()
      };

      try {
        const res = await fetch(`${BASE_URL}/parametres.json`, {
          method: 'PUT', // Mampiasa PUT mba hanoloana ny data taloha
          body: JSON.stringify(paramsData)
        });
        
        if (res.ok) {
          alert("Voatahiry soa aman-tsara ny paramètres!");
        }
      } catch (e) {
        console.error("Error saving params:", e);
      }
    };

  // Ataovy eo ambonin'ny 'return' amin'ny component-nao
  const filteredData = useMemo(() => {
    return allMembers.filter(person => {
      // 1. Search Logic
      const query = searchQuery ? searchQuery.toLowerCase() : "";
      const name = person.anarana ? person.anarana.toLowerCase() : "";
      const mat = person.matricule ? person.matricule.toLowerCase() : "";
      const matchSearch = name.includes(query) || mat.includes(query);

      // 2. Filter Logic
      const matchFiltre = 
        (filters.province === "" || person.province === filters.province) &&
        (filters.region === "" || person.region === filters.region) &&
        (filters.district === "" || person.district === filters.district) &&
        (filters.commune === "" || person.commune === filters.commune) &&
        (filters.fokontany === "" || person.fokontany === filters.fokontany) &&
        (filters.tetikasa === "" || person.tetikasa === filters.tetikasa);

      // 3. Status Enquête Logic (Ataovy "Optional Chaining" mba tsy ho vaky raha tsy misy data)
      const enqueteInfo = allEnquetes?.find(e => e.matricule_olona === person.matricule);
      const status = !enqueteInfo ? "tsy_vita" : enqueteInfo.statut;
      const matchEnquete = (filters.enquete === "" || status === filters.enquete);

      return matchSearch && matchFiltre && matchEnquete;
    });
  }, [allMembers, searchQuery, filters, allEnquetes]); // Ireo dependency ireo dia miantoka fa hiova ny tableau rehefa miova ny state

  // Function hamafana azy ao amin'ny state
  const deleteMember = async (memberToDelete) => {
    try {
      const response = await fetch(`${BASE_URL}/olona.json`);
      const data = await response.json();
      
      let firebaseKey = null;
      
      for (let key in data) {
        const m = data[key];

        // Fanamarinana mifanaraka amin'ny filaharana tianao:
        // Raha misy ID, ampiasao ID. Raha tsy misy, jereo ny Matricule... sns
        const isMatch = (memberToDelete.id && m.id === memberToDelete.id) ||
                        (memberToDelete.matricule && m.matricule === memberToDelete.matricule) ||
                        (memberToDelete.cin && m.cin === memberToDelete.cin) ||
                        (memberToDelete.anarana && m.anarana === memberToDelete.anarana);

        if (isMatch) {
          firebaseKey = key;
          break;
        }
      }

      if (firebaseKey) {
        // Famafana ao amin'ny Firebase
        await fetch(`${BASE_URL}/olona/${firebaseKey}.json`, {
          method: 'DELETE',
        });

        // Fanavaozana ny "state"
        // Eto isika mampiasa ilay "key" mba ho azo antoka kokoa fa ilay olona marina no voafafa
        setAllMembers(allMembers.filter(m => m.id !== memberToDelete.id));
        alert("Voafafa tamim-pahombiazana ilay mpikambana.");
      } else {
        alert("Tsy hita ilay mpikambana ao amin'ny database.");
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("Nisy olana tamin'ny famafana.");
    }
  };

  const exportToExcel = () => {
      // 1. Manomana ny headers
      const headers = ["Matricule", "Nom", "CIN", "ID", "Tetikasa"];
      
      // 2. Manomana ny data
      const rows = filteredData.map(item => [
        item.matricule, 
        item.anarana, 
        item.cin, 
        item.id, 
        item.tetikasa
      ]);

      // 3. Mamorona CSV content
      let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

      // 4. Mampidina azy mivantana (Download)
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "Lisitry_Mpikambana.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r border-slate-200 p-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase mb-6 px-2">Navigation Paramètres</h2>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'GENERAL' && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">Informations de l'Association</h3>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isEditing ? 'bg-amber-100 text-amber-700' : 'bg-indigo-600 text-white'
                }`}
              >
                {isEditing ? "Annuler la modification" : "Modifier les infos"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Nom de l'association", val: formAsso, setter: setFormAsso },
                { label: "Idéologie", val: formIdeologie, setter: setFormIdeologie },
                { label: "Décret", val: formDecret, setter: setFormDecret },
                { label: "Date du décret", val: formDateDecret, setter: setFormDateDecret },
                { label: "Téléphone", val: formTel, setter: setFormTel },
                { label: "Email", val: formEmail, setter: setFormEmail },
                { label: "Siège Social", val: formSiege, setter: setFormSiege },
                { label: "Lieu", val: formLieu, setter: setFormLieu },
              ].map((item, index) => (
                <div key={index} className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2">
                    {item.label}
                  </label>
                  <input
                    disabled={!isEditing}
                    value={item.val}
                    onChange={(e) => item.setter(e.target.value)}
                    className={`w-full p-3 rounded-lg border text-sm transition-all focus:outline-none ${
                      isEditing 
                        ? 'border-indigo-300 bg-white focus:ring-2 focus:ring-indigo-100' 
                        : 'border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed'
                    }`}
                    placeholder={`Saisir ${item.label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>

            {isEditing && (
              <div className="mt-8 flex justify-end">
                <button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-indigo-200 transition-all"
                  onClick={() => { saveParametres(); setIsEditing(false); }}
                >
                  Enregistrer les modifications
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'DONNEE' && (
        <div className="flex flex-col h-full p-6 bg-slate-50">
          {/* HEADER SECTION */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Gestion des Données</h2>
            <p className="text-slate-500 text-sm">Liste complète des membres et outils de filtrage.</p>
          </div>

          {/* TOOLBAR: SEARCH & FILTERS */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search Bar */}
              <input 
                type="text"
                placeholder="Rechercher par nom ou matricule..." 
                className="flex-1 min-w-[250px] p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['province', 'region', 'district', 'commune', 'fokontany'].map((field) => (
                  <select 
                    key={field}
                    value={filters[field] || ""} 
                    onChange={(e) => setFilters({...filters, [field]: e.target.value})}
                    className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm capitalize outline-none"
                  >
                    <option value="">{field}</option>
                    {[...new Set(allMembers.map(o => o[field]))].filter(Boolean).map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                ))}

                <select 
                  value={filters.enquete} 
                  onChange={(e) => setFilters({...filters, enquete: e.target.value})}
                  className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none"
                >
                  <option value="">STATUS ENQUÊTE...</option>
                  <option value="valide">Valide</option>
                  <option value="rejete">Rejeté</option>
                  <option value="tsy_vita">Mbola tsy vita</option>
                </select>
              </div>

              {/* Export Button */}
              <button 
                onClick={exportToExcel}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md"
              >
                📥 EXPORT EXCEL
              </button>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-7 bg-slate-100 p-4 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <div className="text-center">Matricule</div>
              <div className="col-span-2 text-left px-2">Nom & Prénoms</div>
              <div className="text-center">CIN</div>
              <div className="text-center">ID</div>
              <div className="text-center">Projet</div>
              <div className="text-center">Actions</div>
            </div>

            {/* Table Body (Scrollable) */}
            <div className="overflow-y-auto max-h-[500px]">
              {filteredData.map((item, index) => (
                <div key={item.id || index} className="grid grid-cols-7 items-center p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors text-sm">
                  <div className="text-center font-mono text-slate-600">{item.matricule}</div>
                  <div className="col-span-2 px-2 font-semibold text-slate-800">{item.anarana}</div>
                  <div className="text-center text-slate-600">{item.cin}</div>
                  <div className="text-center text-slate-600">{item.id}</div>
                  <div className="text-center text-slate-600">{item.tetikasa}</div>
                  <div className="flex justify-center gap-3">
                    <button onClick={() => deleteMember(item)} className="text-red-500 hover:text-red-700 font-bold transition-all">❌</button>
                    <button onClick={() => loadAndGenerateAttestation(item, 'Attestation')} className="text-indigo-600 hover:text-indigo-800 font-bold transition-all">📄</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        {activeTab === 'DOSSIER' && (
           /* Eto no apetrakao ilay code SEARCH BAR sy TABLE ho an'ny Données */
           <div>...Fampisehoana ny tableau données...</div>
        )}

        {activeTab === 'VERIFICATION' && (
           /* Eto no apetrakao ilay code SEARCH BAR sy TABLE ho an'ny Données */
           <div>...AUDIT EN COURS...</div>
        )}

        {activeTab === 'TOKEN' && (
           /* Eto no apetrakao ilay code SEARCH BAR sy TABLE ho an'ny Données */
           <div>...GETSION TOKEN EN COURS...</div>
        )}

        {activeTab === 'VALIDATION COMPTE' && (
           /* Eto no apetrakao ilay code SEARCH BAR sy TABLE ho an'ny Données */
           <div>...VALIDATION COMPTE EN COURS...</div>
        )}
      </div>
    </div>
  );
}