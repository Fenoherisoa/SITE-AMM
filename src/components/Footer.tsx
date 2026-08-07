import React from 'react';
import { PageRoute } from '../types';
import { Shield, Lock, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';
import { ORGANIZATION_INFO } from '../data/mockData';

interface FooterProps {
  onNavigate: (route: PageRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#1A202C] text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#007E3A] text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
                M
              </div>
              <span className="font-sans font-bold text-white text-base tracking-tight">
                ASSOCIATION MALAGASY MIRAY
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed font-normal">
              {ORGANIZATION_INFO.description}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#007E3A]/20 text-emerald-400 border border-[#007E3A]/40">
                <Shield className="w-3.5 h-3.5" />
                {ORGANIZATION_INFO.slogan}
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-emerald-400 transition-colors">
                  Accueil
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-emerald-400 transition-colors">
                  À Propos de l'Association
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('activities')} className="hover:text-emerald-400 transition-colors">
                  Nos Activités & Domaines
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('training')} className="hover:text-emerald-400 transition-colors">
                  Formations Pratiques
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('events')} className="hover:text-emerald-400 transition-colors">
                  Événements
                </button>
              </li>
            </ul>
          </div>

          {/* Information & Media */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
              Ressources
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate('news')} className="hover:text-emerald-400 transition-colors">
                  Actualités & Publications
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('gallery')} className="hover:text-emerald-400 transition-colors">
                  Galerie Photos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-emerald-400 transition-colors">
                  Contact & Information
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('login')}
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Espace Sécurisé Membres
                </button>
              </li>
            </ul>
          </div>

          {/* Contact / Institutional Info */}
          <div>
            <h3 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">
              Siège & Contact
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#007E3A] shrink-0 mt-0.5" />
                <span>{ORGANIZATION_INFO.addressPlaceholder}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#007E3A] shrink-0" />
                <span>{ORGANIZATION_INFO.emailPlaceholder}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#007E3A] shrink-0" />
                <span>{ORGANIZATION_INFO.phonePlaceholder}</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© Association Malagasy Miray. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('login')} className="hover:text-gray-300 transition-colors flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#007E3A]" />
              Portail d'Accès Sécurisé
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
