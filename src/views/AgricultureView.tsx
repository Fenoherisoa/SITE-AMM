import React from 'react';
import { PageRoute } from '../types';
import { Sprout, CheckCircle2, ArrowRight, BookOpen, Users, Leaf } from 'lucide-react';

interface DomainViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const AgricultureView: React.FC<DomainViewProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 space-y-16">
      
      {/* Banner */}
      <section className="bg-emerald-950 text-white py-16 border-b border-emerald-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-900/80 rounded-full border border-emerald-700">
            Secteur Prioritaire
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight">
            Agriculture & Développement Rural
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-emerald-100 font-normal">
            Promouvoir une agriculture vivrière et maraîchère durable, moderne et adaptée aux réalités pédo-climatiques de Madagascar.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Des Pratiques Agricoles Durables et Inclusives
            </h2>
            <p className="text-slate-600 leading-relaxed font-normal">
              L'agriculture est le cœur battant de l'économie rurale à Madagascar. L'Association Malagasy Miray s'investit aux côtés des agriculteurs et des groupements locaux pour encourager des modes de production respectueux des écosystèmes et renforcer la souveraineté alimentaire.
            </p>
            <p className="text-slate-600 leading-relaxed font-normal">
              Nos actions s'articulent autour de formations pratiques sur le terrain, de la diffusion d'engrais organiques produits localement (compostage enrichi) et de l'amélioration des techniques de gestion de l'eau d'irrigation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80">
                <Leaf className="w-5 h-5 text-emerald-700 mb-2" />
                <h4 className="font-semibold text-slate-900 text-sm">Agroécologie Pratique</h4>
                <p className="text-xs text-slate-600 mt-1">Utilisation du compost, rotation des cultures et lutte intégrée contre les ravageurs.</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80">
                <Users className="w-5 h-5 text-emerald-700 mb-2" />
                <h4 className="font-semibold text-slate-900 text-sm">Entraide Paysanne</h4>
                <p className="text-xs text-slate-600 mt-1">Organisation des travaux collectifs et partage de matériel entre membres.</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
              <img
                src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80"
                alt="Agriculture durable Madagascar"
                className="w-full h-[380px] object-cover"
              />
            </div>
          </div>
        </div>

        {/* Training & Local Initiatives */}
        <div className="bg-slate-50 p-8 sm:p-12 rounded-3xl border border-slate-200 space-y-6">
          <h3 className="text-2xl font-serif font-bold text-slate-900">
            Axes de Formation & Soutien Technique
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase text-emerald-700">Module 01</span>
              <h4 className="font-bold text-slate-900">Riziculture & Cultures Vivrières</h4>
              <p className="text-xs text-slate-600">Techniques de repiquage, gestion des pépinières et fertilisation organique.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase text-emerald-700">Module 02</span>
              <h4 className="font-bold text-slate-900">Maraîchage & Diversification</h4>
              <p className="text-xs text-slate-600">Cultures légumières à haute valeur nutritionnelle et commerciale.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase text-emerald-700">Module 03</span>
              <h4 className="font-bold text-slate-900">Conservation Post-Récolte</h4>
              <p className="text-xs text-slate-600">Stockage sécurisé, séchage et réduction des pertes après la moisson.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => onNavigate('training')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800"
            >
              <span>Consulter le programme de formation</span>
              <ArrowRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
