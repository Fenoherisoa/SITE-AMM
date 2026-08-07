import React, { useState } from 'react';
import { PageRoute } from '../types';
import { SectionTitle } from '../components/SectionTitle';
import { EVENTS_DATA } from '../data/mockData';
import { Calendar, Clock, MapPin, Tag, ArrowRight, CheckCircle } from 'lucide-react';

interface EventsViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const EventsView: React.FC<EventsViewProps> = () => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedEvent, setSelectedEvent] = useState<typeof EVENTS_DATA[0] | null>(null);

  const filteredEvents = EVENTS_DATA.filter(evt => {
    if (filter === 'all') return true;
    return evt.status === filter;
  });

  return (
    <div className="py-12 space-y-12">
      
      {/* Page Header */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950 rounded-full border border-emerald-800">
            Agenda Institutionnel
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight">
            Événements & Rencontres
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal">
            Retrouvez les ateliers, foires, formations et journées citoyennes organisés par l'Association Malagasy Miray.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Filter Tabs */}
        <div className="flex items-center justify-center gap-2 border-b border-slate-200 pb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tous les Événements
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === 'upcoming'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            À Venir
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filter === 'past'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Événements Passés
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col md:flex-row group hover:shadow-md transition-shadow"
            >
              <div className="md:w-2/5 h-56 md:h-auto overflow-hidden relative shrink-0">
                <img
                  src={evt.image}
                  alt={evt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-white shadow-xs ${
                  evt.status === 'upcoming' ? 'bg-emerald-700' : 'bg-slate-700'
                }`}>
                  {evt.status === 'upcoming' ? 'À venir' : 'Passé'}
                </span>
              </div>

              <div className="p-6 md:w-3/5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      <Tag className="w-3 h-3" />
                      {evt.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {evt.date}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{evt.location}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEvent(evt)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 pt-2 border-t border-slate-100"
                >
                  <span>Consulter le programme complet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Modal Detail View */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {selectedEvent.category} • {selectedEvent.status === 'upcoming' ? 'À venir' : 'Passé'}
                </span>
                <h3 className="font-serif font-bold text-2xl text-slate-900 mt-2">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span><strong>Date :</strong> {selectedEvent.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span><strong>Horaire :</strong> {selectedEvent.time || 'Non spécifié'}</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span><strong>Lieu :</strong> {selectedEvent.location}</span>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden my-4 border border-slate-200">
                <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-64 object-cover" />
              </div>

              <p className="whitespace-pre-line font-normal text-slate-700">
                {selectedEvent.fullContent || selectedEvent.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
