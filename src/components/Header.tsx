import React, { useState } from 'react';
import { PageRoute, UserMetadata } from '../types';
import { Lock, Menu, X, Shield, User, LogOut } from 'lucide-react';

interface HeaderProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
  currentUser: UserMetadata | null;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  currentUser,
  onSignOut
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { route: PageRoute; label: string }[] = [
    { route: 'home', label: 'Accueil' },
    { route: 'about', label: 'À Propos' },
    { route: 'activities', label: 'Nos Activités' },
    { route: 'training', label: 'Formations' },
    { route: 'events', label: 'Événements' },
    { route: 'news', label: 'Actualités' },
    { route: 'gallery', label: 'Galerie' },
    { route: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (route: PageRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FDFDFC]/95 backdrop-blur-md border-b border-gray-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand Identity */}
          <button 
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left focus:outline-hidden group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#007E3A] text-white flex items-center justify-center font-bold text-xl shadow-xs group-hover:scale-105 transition-transform duration-200">
              <span className="font-sans font-extrabold">M</span>
            </div>
            <div>
              <span className="block font-sans font-extrabold text-[#1A202C] text-base sm:text-lg tracking-tight leading-none">
                ASSOCIATION MALAGASY MIRAY
              </span>
              <span className="block text-[11px] font-semibold text-[#007E3A] tracking-wider uppercase mt-1">
                Madagascar • Solidarité & Développement
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-6">
            {navLinks.map((link) => {
              const isActive = currentRoute === link.route;
              return (
                <button
                  key={link.route}
                  onClick={() => handleNavClick(link.route)}
                  className={`text-sm font-medium transition-colors duration-150 py-1 ${
                    isActive
                      ? 'text-[#007E3A] border-b-2 border-[#007E3A] font-semibold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action: Secure Area / User State */}
          <div className="hidden lg:flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/80 rounded-full p-1.5 pl-4">
                <button
                  onClick={() => handleNavClick('espace')}
                  className="flex items-center gap-2 text-xs font-semibold text-[#1A202C] hover:text-[#007E3A]"
                >
                  <User className="w-4 h-4 text-[#007E3A]" />
                  <span className="truncate max-w-[120px]">{currentUser.displayName}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-[#007E3A]/10 text-[#007E3A]">
                    {currentUser.status}
                  </span>
                </button>
                <button
                  onClick={onSignOut}
                  title="Se Déconnecter"
                  className="p-1.5 text-gray-400 hover:text-[#AD1D28] hover:bg-rose-50 rounded-full transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#1A202C] hover:bg-black transition-colors duration-200 shadow-sm"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Accès Sécurisé</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex xl:hidden items-center gap-2">
            {!currentUser && (
              <button
                onClick={() => handleNavClick('login')}
                className="p-2 text-slate-700 hover:text-emerald-700 rounded-lg"
                title="Connexion Sécurisée"
              >
                <Shield className="w-5 h-5 text-emerald-700" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-1.5 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => (
            <button
              key={link.route}
              onClick={() => handleNavClick(link.route)}
              className={`w-full text-left px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                currentRoute === link.route
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </button>
          ))}
          
          <div className="pt-4 border-t border-slate-100">
            {currentUser ? (
              <div className="space-y-2">
                <button
                  onClick={() => handleNavClick('espace')}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 font-semibold text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-600" />
                    {currentUser.displayName}
                  </span>
                  <span className="text-xs font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {currentUser.status}
                  </span>
                </button>
                <button
                  onClick={() => {
                    onSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-rose-700 font-semibold hover:bg-rose-50"
                >
                  <LogOut className="w-5 h-5" />
                  Se Déconnecter
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold shadow-md"
              >
                <Lock className="w-5 h-5 text-emerald-400" />
                Accès Membres / Espace Sécurisé
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
