import React from 'react';
import { PageRoute } from '../types';
import { SectionTitle } from '../components/SectionTitle';
import { ACTIVITY_SECTORS } from '../data/mockData';
import { Sprout, PawPrint, Palette, GraduationCap, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ActivitiesViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({ onNavigate }) => {
  const getSectorIcon = (slug: string) => {
    switch (slug) {
      case 'agriculture': return <Sprout className="w-8 h-8 text-emerald-600" />;
      case 'livestock': return <PawPrint className="w-8 h-8 text-amber-600" />;
      case 'arts': return <Palette className="w-8 h-8 text-indigo-600" />;
      case 'training': return <GraduationCap className="w-8 h-8 text-teal-600" />;
      default: return <Users className="w-8 h-8 text-blue-600" />;
    }
  };

  return (
    <div className="py-12 space-y-16">
      
      {/* Page Title */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950 rounded-full border border-emerald-800">
            Piliers d'Intervention
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight">
            Nos Activités & Domaines Majeurs
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal">
            L'Association Malagasy Miray structure ses actions autour de cinq grands axes complémentaires au service du développement des communautés locales.
          </p>
        </div>
      </section>

      {/* Activities Grid / Detailed Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {ACTIVITY_SECTORS.map((sector, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <div
              key={sector.id}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center p-8 rounded-3xl border border-slate-200/90 bg-white shadow-xs ${
                isEven ? '' : 'lg:flex-row-reverse'
              }`}
            >
              <div className={`lg:col-span-7 space-y-5 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 rounded-2xl">
                    {getSectorIcon(sector.slug)}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Volet {idx + 1}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                      {sector.title}
                    </h2>
                  </div>
                </div>

                <p className="text-slate-600 text-base leading-relaxed font-normal">
                  {sector.description}
                </p>

                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                    Objectifs Stratégiques :
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sector.objectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-4">
                  {sector.slug === 'agriculture' && (
                    <button
                      onClick={() => onNavigate('agriculture')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-colors"
                    >
                      <span>Voir la section Agriculture</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {sector.slug === 'livestock' && (
                    <button
                      onClick={() => onNavigate('livestock')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-700 text-white font-semibold text-sm hover:bg-amber-800 transition-colors"
                    >
                      <span>Voir la section Élevage</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {sector.slug === 'arts' && (
                    <button
                      onClick={() => onNavigate('arts')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-700 text-white font-semibold text-sm hover:bg-indigo-800 transition-colors"
                    >
                      <span>Voir la section Arts</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  {sector.slug === 'training' && (
                    <button
                      onClick={() => onNavigate('training')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 transition-colors"
                    >
                      <span>Voir la section Formations</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className={`lg:col-span-5 ${isEven ? 'lg:order-2' : 'lg:order-1'}`}>
                <div className="rounded-2xl overflow-hidden shadow-md border border-slate-200">
                  <img
                    src={sector.heroImage}
                    alt={sector.title}
                    className="w-full h-[320px] object-cover"
                  />
                </div>
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
};
