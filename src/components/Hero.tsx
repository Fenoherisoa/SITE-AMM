import React from 'react';
import { PageRoute } from '../types';
import { Shield, ArrowRight, Compass, Sprout, Users, Award, BookOpen, Lock } from 'lucide-react';
import { ORGANIZATION_INFO } from '../data/mockData';

interface HeroProps {
  onNavigate: (route: PageRoute) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="bg-[#FDFDFC] border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column - Main Headline & Description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#007E3A]/10 text-[#007E3A] text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-[#007E3A]" />
              <span>Excellence Institutionnelle • {ORGANIZATION_INFO.slogan}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#1A202C] leading-[1.1] tracking-tight">
              Bâtir ensemble, <br />
              agir de manière <span className="text-[#AD1D28] italic font-serif">durable</span>.
            </h1>

            <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              Autonomiser les communautés malagasy à travers la formation professionnelle, l'innovation agricole et la préservation du patrimoine artisanal depuis notre fondation.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('about')}
                className="bg-[#007E3A] text-white px-8 py-4 rounded-xl font-bold text-base hover:shadow-lg transition-shadow shadow-[#007E3A]/20 flex items-center gap-2"
              >
                <Compass className="w-5 h-5" />
                <span>Découvrir l'Association</span>
              </button>

              <button
                onClick={() => onNavigate('contact')}
                className="border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold text-base hover:bg-gray-50 transition-colors"
              >
                Nous Contacter
              </button>
            </div>

            {/* Quick Stats Badges */}
            <div className="pt-8 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                <span className="block text-xl font-extrabold text-[#007E3A]">100%</span>
                <span className="text-xs text-gray-500 font-medium">Engagement Terrain</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                <span className="block text-xl font-extrabold text-[#AD1D28]">5</span>
                <span className="text-xs text-gray-500 font-medium">Secteurs Majeurs</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                <span className="block text-xl font-extrabold text-[#1A202C]">+150</span>
                <span className="text-xs text-gray-500 font-medium">Membres Actifs</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                <span className="block text-xl font-extrabold text-[#007E3A]">2026</span>
                <span className="text-xs text-gray-500 font-medium">Projets en cours</span>
              </div>
            </div>
          </div>

          {/* Right Column - Core Areas Preview Cards & Dark Member Banner */}
          <div className="lg:col-span-5 space-y-6 bg-[#F8F9FA] p-6 sm:p-8 rounded-3xl border border-gray-100">
            <div>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Axe de Développement Majeurs
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => onNavigate('agriculture')}
                  className="bg-white p-5 rounded-2xl shadow-2xs border border-gray-100 cursor-pointer hover:border-[#007E3A] transition-all group"
                >
                  <div className="w-10 h-10 bg-[#007E3A]/10 rounded-xl flex items-center justify-center mb-3">
                    <Sprout className="w-5 h-5 text-[#007E3A]" />
                  </div>
                  <h3 className="font-bold text-[#1A202C] text-sm group-hover:text-[#007E3A] transition-colors">
                    Agriculture
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Pratiques pérennes et agroécologie.</p>
                </div>

                <div 
                  onClick={() => onNavigate('livestock')}
                  className="bg-white p-5 rounded-2xl shadow-2xs border border-gray-100 cursor-pointer hover:border-[#AD1D28] transition-all group"
                >
                  <div className="w-10 h-10 bg-[#AD1D28]/10 rounded-xl flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-[#AD1D28]" />
                  </div>
                  <h3 className="font-bold text-[#1A202C] text-sm group-hover:text-[#AD1D28] transition-colors">
                    Élevage
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Santé animale et filière apicole.</p>
                </div>
              </div>
            </div>

            {/* Dark Portal Card */}
            <div className="bg-[#1A202C] rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                    Portail Officiel
                  </span>
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold">Espace Sécurisé Membres</h3>
                <p className="text-gray-300 text-xs leading-relaxed font-normal">
                  Accédez aux registres d'activités, attestations et documents administratifs dans un environnement protégé.
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">+150 Membres Authentifiés</span>
                  <button
                    onClick={() => onNavigate('login')}
                    className="px-4 py-2 bg-[#007E3A] text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Se Connecter →
                  </button>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

