import React from 'react';
import { Eye, Edit2, Printer } from 'lucide-react';
import { Member, Enquete } from '../types';

interface Props {
  allMembers: Member[];
  allEnquetes: Enquete[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSelectedMember: (member: Member | null) => void;
  setModalMemberDetail: (open: boolean) => void;
  startEditMember: (member: Member) => void;
  loadAndGenerateAttestation: (member: Member, type: string) => void;
  exportMembresPDF: (membersList: Member[]) => void;
}

export default function MembersList({
  allMembers,
  allEnquetes,
  searchQuery,
  setSearchQuery,
  setSelectedMember,
  setModalMemberDetail,
  startEditMember,
  loadAndGenerateAttestation,
  exportMembresPDF
}: Props) {
  const filteredMembers = allMembers.filter(m => {
    const q = searchQuery.toLowerCase();
    return (m.anarana?.toLowerCase().includes(q) || m.matricule?.toLowerCase().includes(q));
  });

  return (
    <div className="flex flex-col h-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm m-6">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            📄 Liste des Adhérents & Contrats Bancaires (${filteredMembers.length})
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">Membres enregistrés et projets rattachés</p>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-lg lg:justify-end">
          <input
            type="text"
            placeholder="Fikarohana amin'ny anarana na laharana matricule..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            onClick={() => exportMembresPDF(filteredMembers)}
          >
            <Printer className="h-4 w-4" />
            <span>Printy Lisitra</span>
          </button>
        </div>
      </div>

      <div className="flex flex-row bg-slate-900 p-4 rounded-t-lg select-none">
        <span className="text-white text-xs font-bold uppercase tracking-wider flex-[1.5]">ID / Matricule</span>
        <span className="text-white text-xs font-bold uppercase tracking-wider flex-[2.2]">Anarana Mpikambana</span>
        <span className="text-white text-xs font-bold uppercase tracking-wider flex-[1.3]">Tetikasa</span>
        <span className="text-white text-xs font-bold uppercase tracking-wider flex-[1.3]">Kaominina</span>
        <span className="text-white text-xs font-bold uppercase tracking-wider flex-[1.5]">Lojika Enquête</span>
        <span className="text-white text-xs font-bold uppercase tracking-wider flex-[1.2] text-center">Action</span>
      </div>

      <div className="overflow-y-auto max-h-[50vh] border border-slate-200 border-t-0 rounded-b-lg divide-y divide-slate-100">
        {filteredMembers.map((item, idx) => {
          const hasEnquete = allEnquetes.some(enq => enq.matricule_olona === item.matricule);
          return (
            <div key={item.id} className={`flex flex-row p-4 items-center ${idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
              <span className="text-xs font-bold text-slate-900 flex-[1.5] whitespace-nowrap">{item.id} / {item.matricule || '---'}</span>
              <span className="text-xs text-slate-700 flex-[2.2] truncate pr-2">{item.anarana}</span>
              <span className="text-xs text-slate-600 flex-[1.3] truncate">{item.tetikasa}</span>
              <span className="text-xs text-slate-600 flex-[1.3] truncate">{item.commune || '---'}</span>
              <span className={`text-xs font-bold flex-[1.5] ${hasEnquete ? 'text-rose-600' : 'text-emerald-600'}`}>
                {hasEnquete ? "🚫 Efa misy Enquête" : "✅ Afaka atao Enquête"}
              </span>
              <div className="flex-[1.2] flex flex-row justify-around gap-2">
                <button onClick={() => { setSelectedMember(item); setModalMemberDetail(true); }} className="hover:text-indigo-600 cursor-pointer text-slate-500">
                  <Eye className="h-4 w-4" />
                </button>
                <button onClick={() => startEditMember(item)} className="hover:text-amber-600 cursor-pointer text-slate-400">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => loadAndGenerateAttestation(item, 'Adhesion')} className="hover:text-emerald-700 cursor-pointer text-emerald-600">
                  <Printer className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
        {filteredMembers.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">Tsy misy mpikambana mifanaraka amin'ny sivana.</div>
        )}
      </div>
    </div>
  );
}
