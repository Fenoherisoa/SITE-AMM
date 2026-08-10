import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Clock } from 'lucide-react';
import { CalendarEvent } from '../types';

interface Props {
  events: CalendarEvent[];
  onAddEvent: (title: string, desc: string, date: string) => void;
  onDeleteEvent: (id: string) => void;
}

export default function CalendarTab({
  events,
  onAddEvent,
  onDeleteEvent
}: Props) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      alert("⚠️ Ampidiro ny lohateny sy ny daty!");
      return;
    }
    onAddEvent(title.trim(), desc.trim(), date);
    setTitle("");
    setDesc("");
    setDate("");
  };

  // Group events by date chronologically
  const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 m-6">
      {/* 1. CREATION CARD */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
        <h3 className="text-base font-bold text-slate-900 mb-6 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          <span>FANDAHARAM-POTOANA</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Datin'ny Hevitra *</label>
            <input 
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Lohateny / Activisme *</label>
            <input 
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Fivoriana fandraisana mpikambana..."
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Détails / Famaritana fohy</label>
            <textarea 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Ex: Handinihana ny fandoavana solde..."
              rows={3}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Ampidirina ny Event</span>
          </button>
        </form>
      </div>

      {/* 2. LIST OUT */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
        <h4 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 uppercase tracking-wide flex items-center justify-between">
          <span>📅 Daty Malaza & Fivoriana Antomotra</span>
          <span className="bg-indigo-50 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full">
            {events.length} Events
          </span>
        </h4>

        <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
          {sortedEvents.map(ev => (
            <div key={ev.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50 flex justify-between items-start gap-4 hover:bg-slate-50 transition-all">
              <div className="flex gap-4">
                {/* Visual date box */}
                <div className="bg-indigo-600 text-white p-2.5 rounded-lg text-center font-mono min-w-[65px] h-[65px] flex flex-col justify-center shadow-sm select-none">
                  <span className="text-lg font-bold leading-none">
                    {new Date(ev.date).getDate()}
                  </span>
                  <span className="text-[10px] uppercase font-bold mt-1">
                    {new Date(ev.date).toLocaleString('fr-FR', { month: 'short' })}
                  </span>
                </div>
                <div>
                  <h5 className="font-bold text-sm text-slate-900">{ev.title}</h5>
                  {ev.desc && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ev.desc}</p>}
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-semibold">
                    <Clock className="h-3 w-3" />
                    <span>Lasa: {new Date(ev.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => ev.id && onDeleteEvent(ev.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                title="Hamafa"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {sortedEvents.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              Tsy misy fandaharam-potoana voarakitra amin'izao fotoana izao.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
