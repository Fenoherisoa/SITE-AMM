import React from 'react';
import { PageRoute } from '../types';
import { PawPrint, CheckCircle2, ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';

interface DomainViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const LivestockView: React.FC<DomainViewProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 space-y-16">
      
      {/* Banner */}
      <section className="bg-amber-950 text-white py-16 border-b border-amber-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300 bg-amber-900/80 rounded-full border border-amber-700">
            Secteur Élevage & Apiculture
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight">
            Élevage & Santé Animale
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-amber-100 font-normal">
            Accompagner les éleveurs dans la gestion sanitaire, l'alimentation du bétail, la volaille et le développement de l'apiculture durable.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Valorisation des Filières d'Élevage
            </h2>
            <p className="text-slate-600 leading-relaxed font-normal">
              L'élevage revêt une importance économique et sociale majeure à Madagascar. L'Association Malagasy Miray propose un accompagnement de proximité pour prémunir les troupeaux contre les maladies courantes et améliorer la rentabilité des petites exploitations.
            </p>
            <p className="text-slate-600 leading-relaxed font-normal">
              Un accent particulier est mis sur la promotion de l'apiculture (production de miel de qualité) et l'élevage avicole villageois, vecteurs d'autonomie financière rapide pour les ménages.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 bg-amber-50 p-3.5 rounded-xl border border-amber-200/80">
                <HeartPulse className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Suivi Sanitaire & Hygiène</h4>
                  <p className="text-xs text-slate-600">Sensibilisation aux principes élémentaires de prophylaxie et d'entretien des abris.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-amber-50 p-3.5 rounded-xl border border-amber-200/80">
                <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Apiculture Responsable</h4>
                  <p className="text-xs text-slate-600">Conduite des ruches modernes, protection des abeilles et récolte de qualité supérieure.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=1000&q=80"
                alt="Élevage et bétail à Madagascar"
                className="w-full h-[380px] object-cover"
              />
            </div>
          </div>
        </div>

        {/* Knowledge Transfer */}
        <div className="bg-slate-50 p-8 sm:p-12 rounded-3xl border border-slate-200 space-y-6">
          <h3 className="text-2xl font-serif font-bold text-slate-900">
            Programmes d'Appui aux Éleveurs
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase text-amber-700">Axe 01</span>
              <h4 className="font-bold text-slate-900">Alimentation & Fourrages</h4>
              <p className="text-xs text-slate-600">Culture de plantes fourragères et préparation de rations équilibrées pour bétail.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase text-amber-700">Axe 02</span>
              <h4 className="font-bold text-slate-900">Aviculture Familiale</h4>
              <p className="text-xs text-slate-600">Aménagement des poulaillers et préventions des pathologies aviaires.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase text-amber-700">Axe 03</span>
              <h4 className="font-bold text-slate-900">Filière Miel "Miray"</h4>
              <p className="text-xs text-slate-600">Structuration de la récolte, filtration et mise en pot collective.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
