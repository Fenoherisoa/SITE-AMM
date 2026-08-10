import React, { useState } from 'react';
import { Search, Printer, Eye, CheckCircle, Trash2 } from 'lucide-react';
import { Enquete } from '../types';

interface Props {
  allEnquetes: Enquete[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  setSelectedEnquete: (enquete: Enquete | null) => void;
  setModalEnqueteDetail: (open: boolean) => void;
  handleUpdateStatusEnquete: (id: string, status: string) => void;
  handleDeleteEnquete: (id: string, matricule: string) => void;
  exportLisitreFiltrerPDF: (enquetes: Enquete[], filter: string) => void;
}

export default function EnquetesList({
  allEnquetes,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  setSelectedEnquete,
  setModalEnqueteDetail,
  handleUpdateStatusEnquete,
  handleDeleteEnquete,
  exportLisitreFiltrerPDF
}: Props) {
  return (
    <div className="flex flex-col h-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm m-6">
      {/* HEADER & FILTER toolbar */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            🔍 Situation Enquêtes ({allEnquetes.length})
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">Suivi de la validation des enquêtes sociales</p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Fikarohana (Anarana, Fokontany, ID, Matricule)..." 
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* FILTRE STATUS */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="ALL">📋 Rehetra</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="VALIDATED">✅ Valide</option>
            <option value="REJECTED">❌ Rejete</option>
          </select>

          {/* BOKOTRA PRINT LISITRA */}
          <button 
            className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            onClick={() => {
              const filtered = allEnquetes.filter(e => statusFilter === "ALL" ? true : (e.status || "PENDING") === statusFilter);
              exportLisitreFiltrerPDF(filtered, statusFilter);
            }}
          >
            <Printer className="h-4 w-4" />
            <span>Printy Lisitra</span>
          </button>
        </div>
      </div>

      {/* HEADER TABILAO */}
      <div className="flex flex-row bg-slate-900 p-4 rounded-t-lg select-none">
        <span className="text-white text-xs font-bold uppercase tracking-wider flex-[2]">Anarana / ID</span>
        <span className="text-white text-xs font-bold uppercase tracking-wider flex-[1.5]">Matricule / Fokontany</span>
        <span className="text-white text-xs font-bold uppercase tracking-wider flex-[1] text-center">Score</span>
        <span className="text-white text-xs font-bold uppercase tracking-wider flex-[1] text-center">Status</span>
        <span className="text-white text-xs font-bold uppercase tracking-wider flex-[2] text-center">Action</span>
      </div>

      {/* LISTA MISY FILTRE */}
      <div className="overflow-y-auto max-h-[50vh] border border-slate-200 border-t-0 rounded-b-lg divide-y divide-slate-100">
        {allEnquetes
          .filter(e => {
            const matchStatus = statusFilter === "ALL" ? true : (e.status || "PENDING") === statusFilter;
            const matchSearch = 
              e.anarana_olona?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              e.fokontany?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              e.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              e.matricule_olona?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchStatus && matchSearch;
          })
          .map((item, idx) => (
            <div key={item.id} className={`flex flex-row p-4 items-center ${idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}`}>
              {/* ANARANA SY ID */}
              <div className="flex-[2] flex flex-col pr-2">
                <span className="font-bold text-sm text-slate-800 truncate">{item.anarana_olona}</span>
                <span className="text-[10px] text-slate-400 font-mono">ID: {item.unique_id}</span>
              </div>

              {/* MATRICULE SY FOKONTANY */}
              <div className="flex-[1.5] flex flex-col pr-2">
                <span className="text-xs font-semibold text-slate-700">{item.matricule_olona || '-'}</span>
                <span className="text-[11px] text-slate-400 truncate">Fokontany: {item.fokontany || '-'}</span>
              </div>

              <span className="flex-[1] text-center text-xs font-medium text-slate-700">{item.points_calculated || 0} Pts</span>
              
              <div className="flex-[1] text-center">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  item.status === 'VALIDATED' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : item.status === 'REJECTED' 
                    ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  {item.status || 'PENDING'}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="flex-[2] flex flex-row justify-center gap-1.5">
                <button 
                  onClick={() => { setSelectedEnquete(item); setModalEnqueteDetail(true); }}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Fijery
                </button>
                <button 
                  onClick={() => {
                    if (item.id) handleUpdateStatusEnquete(item.id, 'VALIDATED');
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer"
                >
                  Valide
                </button>
                <button 
                  onClick={() => {
                    if (item.id) handleDeleteEnquete(item.id, item.matricule_olona || '');
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer"
                >
                  Fafana
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
