import React from 'react';
import { PageRoute } from '../types';
import { Hero } from '../components/Hero';
import { SectionTitle } from '../components/SectionTitle';
import { ORGANIZATION_INFO, ACTIVITY_SECTORS, EVENTS_DATA, NEWS_DATA } from '../data/mockData';
import { Sprout, PawPrint, Palette, GraduationCap, Users, ArrowRight, Calendar, BookOpen, Shield, CheckCircle2, Lock } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const getSectorIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sprout': return <Sprout className="w-6 h-6 text-emerald-600" />;
      case 'PawPrint': return <PawPrint className="w-6 h-6 text-amber-600" />;
      case 'Palette': return <Palette className="w-6 h-6 text-indigo-600" />;
      case 'GraduationCap': return <GraduationCap className="w-6 h-6 text-teal-600" />;
      default: return <Users className="w-6 h-6 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-20 pb-16">
      
      {/* Hero Banner */}
      <Hero onNavigate={onNavigate} />

      {/* Institutional Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-full uppercase tracking-wider">
              Présentation Institutionnelle
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 leading-tight">
              Une alliance durable pour l'autonomie et le développement à Madagascar
            </h2>
            <p className="text-slate-600 leading-relaxed text-base sm:text-lg font-normal">
              {ORGANIZATION_INFO.description}
            </p>
            
            <div className="space-y-3 pt-2">
              {ORGANIZATION_INFO.values.map((val, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{val.title}</h4>
                    <p className="text-xs text-slate-600">{val.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={() => onNavigate('about')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
              >
                <span>En savoir plus sur notre mission</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1000&q=80"
                alt="Association Malagasy Miray en action"
                className="w-full h-[440px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-xs font-semibold uppercase text-emerald-400 tracking-wider">
                  Action Communautaire
                </span>
                <h3 className="font-serif text-xl font-bold">
                  Transmettre des compétences pratiques aux générations d'aujourd'hui
                </h3>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Activity Sectors Grid */}
      <section className="bg-slate-50/80 py-16 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            badge="Domaines d'Action"
            title="Nos Secteurs d'Intervention Majeurs"
            subtitle="Découvrez nos cinq piliers fondamentaux pour le renforcement des capacités et le progrès communautaire."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ACTIVITY_SECTORS.map((sector) => (
              <div
                key={sector.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    {getSectorIcon(sector.iconName)}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">
                    {sector.title}
                  </h3>
                  <p className="text-xs font-medium text-emerald-800 uppercase tracking-wider mb-3">
                    {sector.subtitle}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {sector.summary}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (sector.slug === 'agriculture') onNavigate('agriculture');
                    else if (sector.slug === 'livestock') onNavigate('livestock');
                    else if (sector.slug === 'arts') onNavigate('arts');
                    else if (sector.slug === 'training') onNavigate('training');
                    else onNavigate('activities');
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 group-hover:translate-x-1 transition-transform"
                >
                  <span>Découvrir le volet</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase text-emerald-800 tracking-wider">
              Agenda & Activités
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              Événements Institutionnels
            </h2>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <span>Voir tous les événements</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {EVENTS_DATA.filter(e => e.status === 'upcoming').slice(0, 3).map((evt) => (
            <div key={evt.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs flex flex-col">
              <div className="h-48 overflow-hidden relative">
                <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold bg-emerald-900/90 text-emerald-200 backdrop-blur-xs rounded-lg">
                  {evt.category}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{evt.date} • {evt.time}</span>
                  </div>
                  <h3 className="text-base font-serif font-bold text-slate-900 line-clamp-2">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                    {evt.description}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('events')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 text-left"
                >
                  Détails de la rencontre →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest News Preview */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase text-emerald-400 tracking-wider">
                Actualités
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                Dernières Communications Officielle
              </h2>
            </div>
            <button
              onClick={() => onNavigate('news')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
            >
              <span>Accéder aux articles</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {NEWS_DATA.map((article) => (
              <div key={article.id} className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/80 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950 rounded border border-emerald-800">
                    {article.category}
                  </span>
                  <h3 className="font-serif font-bold text-lg text-white line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                  <span>{article.date}</span>
                  <button
                    onClick={() => onNavigate('news')}
                    className="text-emerald-400 font-semibold hover:underline"
                  >
                    Lire →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Secure Member Access Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-700">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-semibold border border-emerald-800">
              <Shield className="w-3.5 h-3.5" />
              <span>Accès Réservé aux Membres</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Espace Membres & Personnel Autorisé
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Accédez à votre espace sécurisé pour consulter votre profil, vos documents et les informations institutionnelles de l'Association Malagasy Miray.
            </p>
          </div>
          
          <button
            onClick={() => onNavigate('login')}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 shadow-md transition-colors"
          >
            <Lock className="w-5 h-5" />
            <span>Connexion Sécurisée</span>
          </button>
        </div>
      </section>

    </div>
  );
};
