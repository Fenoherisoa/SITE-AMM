import React, { useState } from 'react';
import { 
  User, Phone, FileText, Calendar, Mail, MapPin, 
  Upload, Image, CheckCircle2, ArrowLeft, AlertCircle, Save, Shield
} from 'lucide-react';
import { madagascarData } from '../madagascarData';
import { PROJECT_PREFIX } from '../constants';

interface Props {
  isEditMode: boolean;
  selectedEditId: string;
  formAnarana: string;
  setFormAnarana: (v: string) => void;
  formCin: string;
  setFormCin: (v: string) => void;
  formCinRecto: string;
  setFormCinRecto: (v: string) => void;
  formCinVerso: string;
  setFormCinVerso: (v: string) => void;
  formGenre: string;
  setFormGenre: (v: string) => void;
  formTelephone: string;
  setFormTelephone: (v: string) => void;
  formTetikasa: string;
  setFormTetikasa: (v: string) => void;
  formDateAdhesion: string;
  setFormDateAdhesion: (v: string) => void;
  formDateNaissance: string;
  setFormDateNaissance: (v: string) => void;
  formLieuNaissance: string;
  setFormLieuNaissance: (v: string) => void;
  formDateDelivrance: string;
  setFormDateDelivrance: (v: string) => void;
  formLieuDelivrance: string;
  setFormLieuDelivrance: (v: string) => void;
  formDateDuplicata: string;
  setFormDateDuplicata: (v: string) => void;
  formLieuDuplicata: string;
  setFormLieuDuplicata: (v: string) => void;
  formPhoto: string;
  setFormPhoto: (v: string) => void;
  formEmailNotification: string;
  setFormEmailNotification: (v: string) => void;
  selectedProv: string;
  setSelectedProv: (v: string) => void;
  selectedReg: string;
  setSelectedReg: (v: string) => void;
  selectedDist: string;
  setSelectedDist: (v: string) => void;
  selectedCom: string;
  setSelectedCom: (v: string) => void;
  selectedFok: string;
  setSelectedFok: (v: string) => void;
  handleSaveMember: () => void;
  clearMemberForm: () => void;
  setCurrentTab: (tab: string) => void;
  isSaving?: boolean;
}

export default function AdhesionForm({
  isEditMode,
  selectedEditId,
  formAnarana,
  setFormAnarana,
  formCin,
  setFormCin,
  formCinRecto,
  setFormCinRecto,
  formCinVerso,
  setFormCinVerso,
  formGenre,
  setFormGenre,
  formTelephone,
  setFormTelephone,
  formTetikasa,
  setFormTetikasa,
  formDateAdhesion,
  setFormDateAdhesion,
  formDateNaissance,
  setFormDateNaissance,
  formLieuNaissance,
  setFormLieuNaissance,
  formDateDelivrance,
  setFormDateDelivrance,
  formLieuDelivrance,
  setFormLieuDelivrance,
  formDateDuplicata,
  setFormDateDuplicata,
  formLieuDuplicata,
  setFormLieuDuplicata,
  formPhoto,
  setFormPhoto,
  formEmailNotification,
  setFormEmailNotification,
  selectedProv,
  setSelectedProv,
  selectedReg,
  setSelectedReg,
  selectedDist,
  setSelectedDist,
  selectedCom,
  setSelectedCom,
  selectedFok,
  setSelectedFok,
  handleSaveMember,
  clearMemberForm,
  setCurrentTab,
  isSaving = false
}: Props) {
  const [validationError, setValidationError] = useState<string | null>(null);

  // Date input auto-formatter: DD/MM/YYYY
  const formatDateInput = (text: string) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}/${cleaned.substring(4, 8)}`;
    } else if (cleaned.length > 2) {
      formatted = `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    }
    return formatted;
  };

  // Image upload helper (base64 reader)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("La taille de l'image ne doit pas dépasser 2 Mo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formAnarana.trim()) {
      setValidationError("Le nom complet et les prénoms de l'adhérent sont obligatoires.");
      return;
    }

    if (!formDateAdhesion.trim()) {
      setValidationError("La date d'adhésion est obligatoire.");
      return;
    }

    handleSaveMember();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <button
            type="button"
            onClick={() => { clearMemberForm(); setCurrentTab("members"); }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à la liste des adhérents</span>
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? "Modification de la Fiche Adhérent" : "Formulaire d'Enregistrement d'Adhésion"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isEditMode 
              ? `Modification des informations du membre (ID: ${selectedEditId})` 
              : "Saisie administrative pour l'adhésion officielle au Mouvement AMM."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { clearMemberForm(); setCurrentTab("members"); }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Enregistrement..." : isEditMode ? "Mettre à jour" : "Valider l'Adhésion"}</span>
          </button>
        </div>
      </div>

      {/* Inline Validation Error Banner */}
      {validationError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        
        {/* SECTION 1: ÉTAT CIVIL & IDENTITÉ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">1. Identité & État Civil</h2>
              <p className="text-[11px] text-slate-500">Renseignements civils du membre</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Anarana sy Fanampiny */}
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">
                Nom complet et Prénoms <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all uppercase" 
                placeholder="Ex: RAKOTOARISOA JEAN BAPTISTE" 
                value={formAnarana} 
                onChange={e => setFormAnarana(e.target.value)} 
              />
            </div>

            {/* Genre */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Genre</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer" 
                value={formGenre} 
                onChange={e => setFormGenre(e.target.value)}
              >
                <option value="">-- Sélectionner le genre --</option>
                <option value="LAHY">Homme (Lahy)</option>
                <option value="VAVY">Femme (Vavy)</option>
              </select>
            </div>

            {/* Date Naissance */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Date de Naissance (JJ/MM/AAAA)</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
                  placeholder="JJ/MM/AAAA" 
                  value={formDateNaissance} 
                  onChange={e => setFormDateNaissance(formatDateInput(e.target.value))} 
                />
              </div>
            </div>

            {/* Lieu Naissance */}
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">Lieu de Naissance</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
                placeholder="Ex: Antsirabe, Ambatondrazaka..." 
                value={formLieuNaissance} 
                onChange={e => setFormLieuNaissance(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CARTE NATIONALE D'IDENTITÉ (CIN) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">2. Titre d'Identité National (CIN)</h2>
              <p className="text-[11px] text-slate-500">Détails de la carte d'identité ou acte d'état civil</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Karapanondro CIN */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Numéro CIN (12 chiffres)</label>
              <input 
                type="text" 
                className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
                placeholder="Ex: 101 234 567 890" 
                value={formCin} 
                onChange={e => setFormCin(e.target.value)} 
                maxLength={14}
              />
            </div>

            {/* Date Délivrance CIN */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Date Délivrance CIN</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
                  placeholder="JJ/MM/AAAA" 
                  value={formDateDelivrance} 
                  onChange={e => setFormDateDelivrance(formatDateInput(e.target.value))} 
                />
              </div>
            </div>

            {/* Lieu Délivrance CIN */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Lieu de Délivrance</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
                placeholder="Ex: Ambohimanarina" 
                value={formLieuDelivrance} 
                onChange={e => setFormLieuDelivrance(e.target.value)} 
              />
            </div>

            {/* Date Duplicata */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Date Duplicata (si existant)</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
                placeholder="JJ/MM/AAAA" 
                value={formDateDuplicata} 
                onChange={e => setFormDateDuplicata(formatDateInput(e.target.value))} 
              />
            </div>

            {/* Lieu Duplicata */}
            <div className="md:col-span-2">
              <label className="font-bold text-slate-700 block mb-1.5">Lieu du Duplicata</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
                placeholder="Ex: Antananarivo Renivohitra" 
                value={formLieuDuplicata} 
                onChange={e => setFormLieuDuplicata(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: CONTACT & RATTACHEMENT */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">3. Coordonnées & Projet de Rattachement</h2>
              <p className="text-[11px] text-slate-500">Contact et affectation associative</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Téléphone */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Numéro de téléphone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
                  placeholder="Ex: 034 12 345 67" 
                  value={formTelephone} 
                  onChange={e => setFormTelephone(e.target.value)} 
                />
              </div>
            </div>

            {/* Email Notification */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Email de notification</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="email" 
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
                  placeholder="Ex: adherent@example.mg" 
                  value={formEmailNotification} 
                  onChange={e => setFormEmailNotification(e.target.value)} 
                  autoCapitalize="none"
                />
              </div>
            </div>

            {/* Tetikasa / Projet */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Projet de Rattachement (Tetikasa)</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer" 
                value={formTetikasa} 
                onChange={e => setFormTetikasa(e.target.value)}
              >
                {Object.keys(PROJECT_PREFIX).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Date d'Adhésion */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">
                Date d'Adhésion (JJ/MM/AAAA) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text" 
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" 
                  placeholder="JJ/MM/AAAA" 
                  value={formDateAdhesion} 
                  onChange={e => setFormDateAdhesion(formatDateInput(e.target.value))} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: LOCALISATION GÉOGRAPHIQUE (MADAGASCAR CASCADING) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">4. Localisation Géographique</h2>
              <p className="text-[11px] text-slate-500">Découpage territorial officiel de Madagascar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            {/* Province */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Province (Faritany)</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer" 
                value={selectedProv} 
                onChange={e => { 
                  setSelectedProv(e.target.value); 
                  setSelectedReg(""); 
                  setSelectedDist(""); 
                  setSelectedCom(""); 
                  setSelectedFok(""); 
                }}
              >
                <option value="">-- Choisir --</option>
                {Object.keys(madagascarData).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Région */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Région (Faritra)</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer disabled:opacity-40" 
                value={selectedReg} 
                disabled={!selectedProv}
                onChange={e => { 
                  setSelectedReg(e.target.value); 
                  setSelectedDist(""); 
                  setSelectedCom(""); 
                  setSelectedFok(""); 
                }}
              >
                <option value="">-- Choisir --</option>
                {selectedProv && Object.keys(madagascarData[selectedProv] || {}).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">District (Distrika)</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer disabled:opacity-40" 
                value={selectedDist} 
                disabled={!selectedReg}
                onChange={e => { 
                  setSelectedDist(e.target.value); 
                  setSelectedCom(""); 
                  setSelectedFok(""); 
                }}
              >
                <option value="">-- Choisir --</option>
                {selectedProv && selectedReg && Object.keys(madagascarData[selectedProv][selectedReg] || {}).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Commune */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Commune (Kaominina)</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer disabled:opacity-40" 
                value={selectedCom} 
                disabled={!selectedDist}
                onChange={e => { 
                  setSelectedCom(e.target.value); 
                  setSelectedFok(""); 
                }}
              >
                <option value="">-- Choisir --</option>
                {selectedProv && selectedReg && selectedDist && Object.keys(madagascarData[selectedProv][selectedReg][selectedDist] || {}).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Fokontany */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="font-bold text-slate-700 block mb-1.5">Fokontany</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer disabled:opacity-40" 
                value={selectedFok} 
                disabled={!selectedCom}
                onChange={e => setSelectedFok(e.target.value)}
              >
                <option value="">-- Choisir --</option>
                {selectedProv && selectedReg && selectedDist && selectedCom && (madagascarData[selectedProv][selectedReg][selectedDist][selectedCom] || []).map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 5: PHOTO & DOCUMENTS SCAN */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">5. Photographie & Pièces Jointes</h2>
              <p className="text-[11px] text-slate-500">Photo d'identité et scans CIN (facultatif)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Photo Profil */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">Photo d'Identité</span>
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-2">
                {formPhoto ? (
                  <div className="relative w-20 h-20 mx-auto">
                    <img src={formPhoto} alt="Aperçu" className="w-full h-full object-cover rounded-lg border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setFormPhoto('')}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                    <User className="w-6 h-6" />
                  </div>
                )}
                <label className="inline-block px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-pointer hover:bg-slate-100 transition-colors">
                  <span>Parcourir...</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleImageUpload(e, setFormPhoto)}
                  />
                </label>
              </div>
            </div>

            {/* CIN Recto */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">Scan CIN (Recto)</span>
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-2">
                {formCinRecto ? (
                  <div className="relative h-20 mx-auto">
                    <img src={formCinRecto} alt="CIN Recto" className="h-full object-contain mx-auto rounded border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setFormCinRecto('')}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-16 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center mx-auto w-24">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <label className="inline-block px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-pointer hover:bg-slate-100 transition-colors">
                  <span>Parcourir...</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleImageUpload(e, setFormCinRecto)}
                  />
                </label>
              </div>
            </div>

            {/* CIN Verso */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700 block">Scan CIN (Verso)</span>
              <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-2">
                {formCinVerso ? (
                  <div className="relative h-20 mx-auto">
                    <img src={formCinVerso} alt="CIN Verso" className="h-full object-contain mx-auto rounded border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setFormCinVerso('')}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-16 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center mx-auto w-24">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <label className="inline-block px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-pointer hover:bg-slate-100 transition-colors">
                  <span>Parcourir...</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleImageUpload(e, setFormCinVerso)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => { clearMemberForm(); setCurrentTab("members"); }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors"
          >
            Annuler et Retourner
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Enregistrement en cours..." : isEditMode ? "Enregistrer les modifications" : "Valider l'Adhésion"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
