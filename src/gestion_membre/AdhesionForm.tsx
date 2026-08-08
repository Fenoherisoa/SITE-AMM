import React, { useState } from 'react';
import { User, Phone, FileText, Calendar, Mail, Map, MapPin } from 'lucide-react';
import { madagascarData } from '../data/madagascarData';
import { PROJECT_PREFIX } from './constants';

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
  setCurrentTab
}: Props) {

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

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
      <h3 className="text-base font-bold text-slate-900 mb-6 border-b-2 border-slate-100 pb-3 uppercase tracking-wide">
        {isEditMode ? "📝 Hanova Mpikambana" : "📝 Adhésion Feno Auto"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Anarana feno */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Anarana sy Fanampiny *</label>
          <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white focus-within:border-indigo-500 transition-all">
            <User className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              className="w-full bg-transparent text-sm text-slate-900 outline-none" 
              placeholder="Ex: FANJAHARIVOLA LISY HARIZAKA" 
              value={formAnarana} 
              onChange={e => setFormAnarana(e.target.value)} 
            />
          </div>
        </div>

        {/* Karapanondro CIN */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Laharana karatra CIN</label>
          <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white focus-within:border-indigo-500 transition-all">
            <FileText className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              className="w-full bg-transparent text-sm text-slate-900 outline-none" 
              placeholder="Ex: 112 345 678 901" 
              value={formCin} 
              onChange={e => setFormCin(e.target.value)} 
              maxLength={12}
            />
          </div>
        </div>

        {/* Genre */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Genre (Lahy / Vavy)</label>
          <select 
            className="w-full border border-slate-200 rounded-lg p-2 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            value={formGenre} 
            onChange={e => setFormGenre(e.target.value)}
          >
            <option value="">-- Safidio --</option>
            <option value="LAHY">LAHY</option>
            <option value="VAVY">VAVY</option>
          </select>
        </div>

        {/* Telefaonina */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Laharana Telephone finday</label>
          <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white focus-within:border-indigo-500 transition-all">
            <Phone className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              className="w-full bg-transparent text-sm text-slate-900 outline-none" 
              placeholder="Ex: 034 12 345 67" 
              value={formTelephone} 
              onChange={e => setFormTelephone(e.target.value)} 
            />
          </div>
        </div>

        {/* Tetikasa */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Tetikasa voafidy</label>
          <select 
            className="w-full border border-slate-200 rounded-lg p-2 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            value={formTetikasa} 
            onChange={e => setFormTetikasa(e.target.value)}
          >
            {Object.keys(PROJECT_PREFIX).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Date Adhesion */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Date d'Adhésion (DD/MM/AAAA) *</label>
          <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white focus-within:border-indigo-500 transition-all">
            <Calendar className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              className="w-full bg-transparent text-sm text-slate-900 outline-none" 
              placeholder="DD/MM/AAAA" 
              value={formDateAdhesion} 
              onChange={e => setFormDateAdhesion(formatDateInput(e.target.value))} 
            />
          </div>
        </div>

        {/* Date Naissance */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Date de Naissance (DD/MM/AAAA)</label>
          <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white focus-within:border-indigo-500 transition-all">
            <Calendar className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              className="w-full bg-transparent text-sm text-slate-900 outline-none" 
              placeholder="DD/MM/AAAA" 
              value={formDateNaissance} 
              onChange={e => setFormDateNaissance(formatDateInput(e.target.value))} 
            />
          </div>
        </div>

        {/* Lieu Naissance */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Lieu de Naissance</label>
          <input 
            type="text" 
            className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white" 
            placeholder="Ex: Ambatondrazaka" 
            value={formLieuNaissance} 
            onChange={e => setFormLieuNaissance(e.target.value)} 
          />
        </div>

        {/* Date Delivrance */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Date Délivrance CIN (DD/MM/AAAA)</label>
          <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white focus-within:border-indigo-500 transition-all">
            <Calendar className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              className="w-full bg-transparent text-sm text-slate-900 outline-none" 
              placeholder="DD/MM/AAAA" 
              value={formDateDelivrance} 
              onChange={e => setFormDateDelivrance(formatDateInput(e.target.value))} 
            />
          </div>
        </div>

        {/* Lieu Delivrance */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Lieu de Délivrance CIN</label>
          <input 
            type="text" 
            className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white" 
            placeholder="Ex: Ambatondrazaka" 
            value={formLieuDelivrance} 
            onChange={e => setFormLieuDelivrance(e.target.value)} 
          />
        </div>

        {/* Email Notification */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Mailaka (Email Notification)</label>
          <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white focus-within:border-indigo-500 transition-all">
            <Mail className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="email" 
              className="w-full bg-transparent text-sm text-slate-900 outline-none" 
              placeholder="ex: lisy@gmail.com" 
              value={formEmailNotification} 
              onChange={e => setFormEmailNotification(e.target.value)} 
              autoCapitalize="none"
            />
          </div>
        </div>

        {/* --- GEOGRAPHIC SELECTORS --- */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Faritany (Province)</label>
          <select 
            className="w-full border border-slate-200 rounded-lg p-2 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            value={selectedProv} 
            onChange={e => { setSelectedProv(e.target.value); setSelectedReg(""); setSelectedDist(""); setSelectedCom(""); setSelectedFok(""); }}
          >
            <option value="">-- Safidio --</option>
            {Object.keys(madagascarData).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Faritra (Région)</label>
          <select 
            className="w-full border border-slate-200 rounded-lg p-2 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            value={selectedReg} 
            disabled={!selectedProv}
            onChange={e => { setSelectedReg(e.target.value); setSelectedDist(""); setSelectedCom(""); setSelectedFok(""); }}
          >
            <option value="">-- Safidio --</option>
            {selectedProv && Object.keys(madagascarData[selectedProv] || {}).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Distrika (District)</label>
          <select 
            className="w-full border border-slate-200 rounded-lg p-2 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            value={selectedDist} 
            disabled={!selectedReg}
            onChange={e => { setSelectedDist(e.target.value); setSelectedCom(""); setSelectedFok(""); }}
          >
            <option value="">-- Safidio --</option>
            {selectedProv && selectedReg && Object.keys(madagascarData[selectedProv][selectedReg] || {}).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Kaominina (Commune)</label>
          <select 
            className="w-full border border-slate-200 rounded-lg p-2 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            value={selectedCom} 
            disabled={!selectedDist}
            onChange={e => { setSelectedCom(e.target.value); setSelectedFok(""); }}
          >
            <option value="">-- Safidio --</option>
            {selectedProv && selectedReg && selectedDist && Object.keys(madagascarData[selectedProv][selectedReg][selectedDist] || {}).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">Fokontany</label>
          <select 
            className="w-full border border-slate-200 rounded-lg p-2 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
            value={selectedFok} 
            disabled={!selectedCom}
            onChange={e => setSelectedFok(e.target.value)}
          >
            <option value="">-- Safidio --</option>
            {selectedProv && selectedReg && selectedDist && selectedCom && (madagascarData[selectedProv][selectedReg][selectedDist][selectedCom] || []).map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-4">
        <button 
          onClick={handleSaveMember}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm shadow-sm transition-all cursor-pointer"
        >
          {isEditMode ? "RE-ENREGISTRER LE MEMBRE" : "VALIDER L'ADHÉSION"}
        </button>
        {isEditMode && (
          <button 
            onClick={() => { clearMemberForm(); setCurrentTab("members"); }}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-sm transition-all cursor-pointer"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
