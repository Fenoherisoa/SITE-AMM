import React from 'react';
import { PageRoute } from '../types';
import { GraduationCap, BookOpen, Award, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DomainViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const TrainingView: React.FC<DomainViewProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 space-y-16">
      
      {/* Banner */}
      <section className="bg-teal-950 text-white py-16 border-b border-teal-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-300 bg-teal-900/80 rounded-full border border-teal-700">
            Pôle Formation Continue
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight">
            Formations Pratiques & Autonomie
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-teal-100 font-normal">
            Développement de compétences concrètes et opérationnelles destinées aux adultes, producteurs, éleveurs et artisans pour renforcer l'autonomie socio-économique.
          </p>
        </div>
      </section>

      {/* Main Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Des Cursus Concrets Axés sur le Terrain
            </h2>
            <p className="text-slate-600 leading-relaxed font-normal">
              L'Association Malagasy Miray privilégie la formation professionnelle continue des adultes et acteurs économiques locaux. Nos sessions d'apprentissage sont structurées pour apporter des réponses concrètes aux défis quotidiens de l'exploitation agricole, de la conduite d'élevage et de la commercialisation.
            </p>
            <p className="text-slate-600 leading-relaxed font-normal">
              Les ateliers se déroulent en environnement réel (parcelles démonstratives, ateliers artisanaux, ruchers-écoles) afin d'assurer un transfert direct d'acquis directement applicables.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-teal-50 p-3.5 rounded-xl border border-teal-200/80">
                <Award className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Gestion d'Activité & Entraide</h4>
                  <p className="text-xs text-slate-600">Calcul des coûts de production, tenue du carnet de bord et organisation coopérative.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-teal-50 p-3.5 rounded-xl border border-teal-200/80">
                <BookOpen className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Pratique Immédiate</h4>
                  <p className="text-xs text-slate-600">80% de pratique guidée sur le terrain, 20% de synthèse méthodologique.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80"
                alt="Formation professionnelle pour adultes à Madagascar"
                className="w-full h-[380px] object-cover"
              />
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="bg-slate-50 p-8 sm:p-12 rounded-3xl border border-slate-200 space-y-6">
          <h3 className="text-2xl font-serif font-bold text-slate-900">
            Nos Principaux Cursus de Formation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 rounded">
                Agriculture
              </span>
              <h4 className="font-serif font-bold text-slate-900 text-lg">Agroécologie & Fertilité</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apprentissage des techniques d'enrichissement naturel des sols, fabrication du bio-compost et gestion de l'eau.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 rounded">
                Élevage
              </span>
              <h4 className="font-serif font-bold text-slate-900 text-lg">Conduite d'Élevage & Apiculture</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Suivi sanitaire du bétail, aviculture villageoise et exploitation rationnelle des ruchers.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 rounded">
                Artisanat
              </span>
              <h4 className="font-serif font-bold text-slate-900 text-lg">Perfectionnement Artisanat</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Maîtrise du tressage du raphia, broderie de précision et traitements écologiques.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 rounded">
                Entrepreneuriat
              </span>
              <h4 className="font-serif font-bold text-slate-900 text-lg">Gestion Rurale & Autonomie</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Initiation aux principes comptables simples, épargne communautaire et micro-projets.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 rounded">
                Organisation
              </span>
              <h4 className="font-serif font-bold text-slate-900 text-lg">Vie Associative & Coopérative</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gouvernance démocratique, responsabilité collective et organisation des réunions d'entraide.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
