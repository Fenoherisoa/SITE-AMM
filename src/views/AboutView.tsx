import React from 'react';
import { PageRoute } from '../types';
import { SectionTitle } from '../components/SectionTitle';
import { ORGANIZATION_INFO } from '../data/mockData';
import { Shield, Target, Eye, HeartHandshake, Award, Compass, CheckCircle2 } from 'lucide-react';

interface AboutViewProps {
  onNavigate: (route: PageRoute) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 space-y-16">
      
      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="inline-block px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950 rounded-full border border-emerald-800">
            Institution & Identité
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold tracking-tight">
            À Propos de l'Association
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal">
            L'Association Malagasy Miray (AMM) est engagée aux côtés des populations pour bâtir des opportunités durables et renforcer l'autonomie communautaire.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Who We Are */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Présentation
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Qui Sommes-Nous ?
            </h2>
            <p className="text-slate-600 leading-relaxed text-base font-normal">
              {ORGANIZATION_INFO.description}
            </p>
            <p className="text-slate-600 leading-relaxed text-base font-normal">
              Fondée sur les valeurs traditionnelles de solidarité (Fihavanana) et de responsabilité citoyenne, l'association rassemble des compétences variées pour accompagner les initiatives locales dans les domaines de l'agriculture, de l'élevage, de la culture et de la formation professionnelle.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=1000&q=80"
                alt="Communauté Association Malagasy Miray"
                className="w-full h-[360px] object-cover"
              />
            </div>
          </div>
        </section>

        {/* Mission & Vision Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-emerald-50/80 rounded-2xl p-8 border border-emerald-200/80 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-slate-900">
              Notre Mission
            </h3>
            <p className="text-slate-700 leading-relaxed font-normal">
              {ORGANIZATION_INFO.mission}
            </p>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-900 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white">
              Notre Vision
            </h3>
            <p className="text-slate-300 leading-relaxed font-normal">
              {ORGANIZATION_INFO.vision}
            </p>
          </div>

        </section>

        {/* Our Values */}
        <section className="space-y-8">
          <SectionTitle
            badge="Principes Directeurs"
            title="Nos Valeurs Fondamentales"
            subtitle="Des convictions ancrées dans la tradition et tournées vers un avenir responsable."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ORGANIZATION_INFO.values.map((val, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  0{idx + 1}
                </div>
                <h4 className="font-serif font-bold text-lg text-slate-900">
                  {val.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Commitment & Approach */}
        <section className="bg-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200/80 space-y-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Engagement & Démarche
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Notre Approche Terrain
            </h2>
            <p className="text-slate-600 leading-relaxed font-normal">
              {ORGANIZATION_INFO.approach}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="flex items-start gap-3 bg-white p-5 rounded-xl border border-slate-200/80">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Accompagnement de proximité</h4>
                <p className="text-xs text-slate-600 mt-1">Interventions directes dans les fokontany auprès des usagers et producteurs.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-5 rounded-xl border border-slate-200/80">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Transfert de Compétences</h4>
                <p className="text-xs text-slate-600 mt-1">Formations pratiques favorisant l'autonomie et la pérennité.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-5 rounded-xl border border-slate-200/80">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Transparence & Gouvernance</h4>
                <p className="text-xs text-slate-600 mt-1">Gestion éthique et respectueuse des engagements institutionnels.</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
