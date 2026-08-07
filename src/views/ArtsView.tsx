import React from 'react';
import { PageRoute } from '../types';
import { Palette, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface DomainViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const ArtsView: React.FC<DomainViewProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 space-y-16">
      
      {/* Banner */}
      <section className="bg-indigo-950 text-white py-16 border-b border-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-900/80 rounded-full border border-indigo-700">
            Patrimoine & Création
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight">
            Arts & Artisanat Malagasy
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-indigo-100 font-normal">
            Soutenir la transmission des savoir-faire artisanaux traditionnels, la création culturelle et l'autonomisation des artisanes et artisans.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Valoriser la Richesse Culturelle et Artisanale
            </h2>
            <p className="text-slate-600 leading-relaxed font-normal">
              Le travail manuel et l'expression artistique font partie intégrante de l'identité malagasy. L'Association Malagasy Miray encourage les artisanes et artisans spécialisés dans la vannerie (raphia, satrana), la broderie, la sculpture sur bois et le travail de la corne.
            </p>
            <p className="text-slate-600 leading-relaxed font-normal">
              Nos programmes accompagnent le perfectionnement technique, la sensibilisation au design contemporain tout en respectant l'authenticité patrimoniale, et facilitent la participation à des expositions régionales.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200/80">
                <Sparkles className="w-5 h-5 text-indigo-700 mb-2" />
                <h4 className="font-semibold text-slate-900 text-sm">Finitions & Qualité</h4>
                <p className="text-xs text-slate-600 mt-1">Perfectionnement des coutures, teintures naturelles et solidité des ouvrages.</p>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200/80">
                <Palette className="w-5 h-5 text-indigo-700 mb-2" />
                <h4 className="font-semibold text-slate-900 text-sm">Transmission Culturelle</h4>
                <p className="text-xs text-slate-600 mt-1">Conservation des motifs traditionnels et valorisation des maîtres-artisans.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?auto=format&fit=crop&w=1000&q=80"
                alt="Artisanat malagasy en raphia"
                className="w-full h-[380px] object-cover"
              />
            </div>
          </div>
        </div>

        {/* Gallery Preview Button */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-xl font-bold">Découvrez les créations artisanales dans notre galerie</h3>
            <p className="text-xs text-slate-300 mt-1">Consultez les photos des ouvrages faits main réalisés par les membres de l'association.</p>
          </div>
          <button
            onClick={() => onNavigate('gallery')}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-indigo-500 text-slate-950 font-semibold text-sm hover:bg-indigo-400 transition-colors"
          >
            Accéder à la Galerie Photos →
          </button>
        </div>

      </div>
    </div>
  );
};
