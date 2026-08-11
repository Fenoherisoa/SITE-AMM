import React, { useState, useEffect } from 'react';
import { PageRoute, UserMetadata } from './types';
// Ampio ity import ity eo an-tampon'ny App.tsx lehibe
import { BrowserRouter } from 'react-router-dom';
import MembersAppModule from './gestion_membre/MembersAppModule';
import RHAppModule from './RH/RHAppModule'; // Ilay natao tamin'ny Dingana 1
import { AuthProvider } from './RH/contexts/AuthContext';


import { authService } from './services/authService';
import { FirebaseService } from './services/firebaseService'; // Ahitsio ny lalana raha ilaina

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardMenu } from './components/DashboardMenu';


import { HomeView } from './views/HomeView';
import { AboutView } from './views/AboutView';
import { ActivitiesView } from './views/ActivitiesView';
import { AgricultureView } from './views/AgricultureView';
import { LivestockView } from './views/LivestockView';
import { ArtsView } from './views/ArtsView';
import { TrainingView } from './views/TrainingView';
import { EventsView } from './views/EventsView';
import { NewsView } from './views/NewsView';
import { GalleryView } from './views/GalleryView';
import { ContactView } from './views/ContactView';

import { LoginView } from './views/LoginView';
import { ForgotPasswordView } from './views/ForgotPasswordView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { ChangePasswordView } from './views/ChangePasswordView';
import { EspaceMemberView } from './views/EspaceMemberView';
import { AccessDeniedView } from './views/AccessDeniedView';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('home');
  const [currentUser, setCurrentUser] = useState<UserMetadata | null>(authService.getCurrentUser());
  
  // Fanjakana hitazona an'ilay module voafidy ao anatin'ny espace
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('overview'); // Ampio ity state ity

  // Fanjakana fitehirizana ny données avy any Firebase
  const [members, setMembers] = useState<any[]>([]);
  const [enquetes, setEnquetes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  useEffect(() => {
    // Subscribe to Auth state updates
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fakana ny données avy ao Firebase rehefa misafidy 'members' na module mitovy aminy ianao
  // Fakana ny données avy ao Firebase rehefa misafidy 'members' na 'adhesion'
  useEffect(() => {
    if (activeModule === 'members' || activeModule === 'adhesion') {
      const fetchData = async () => {
        setLoadingData(true);
        try {
          const [memData, enqData, accData, logData, evData] = await Promise.all([
            FirebaseService.getMembers(),
            FirebaseService.getEnquetes(),
            FirebaseService.getAccounting(),
            FirebaseService.getLogs(),
            FirebaseService.getEvents()
          ]);
          setMembers(memData);
          setEnquetes(enqData);
          setTransactions(accData);
          setLogs(logData);
          setEvents(evData);
        } catch (error) {
          console.error("Erreur lors du chargement des données depuis Firebase:", error);
        } finally {
          setLoadingData(false);
        }
      };

      fetchData();
    }
  }, [activeModule]);

  const handleNavigate = (route: PageRoute) => {
    setCurrentRoute(route);
    setActiveModule(null); // Famerenana azy ho null raha miala amin'ny espace
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setActiveModule(null);
    setCurrentRoute('home');
  };

  const handleLoginSuccess = (user: UserMetadata) => {
    if (user.status === 'ACTIVE' || user.status === 'APPROVED') {
      setCurrentRoute('espace');
    } else {
      setCurrentRoute('access-denied');
    }
  };

  // Render active view
  const renderView = () => {
    switch (currentRoute) {
      case 'home':
        return <HomeView onNavigate={handleNavigate} />;
      case 'about':
        return <AboutView onNavigate={handleNavigate} />;
      case 'activities':
        return <ActivitiesView onNavigate={handleNavigate} />;
      case 'agriculture':
        return <AgricultureView onNavigate={handleNavigate} />;
      case 'livestock':
        return <LivestockView onNavigate={handleNavigate} />;
      case 'arts':
        return <ArtsView onNavigate={handleNavigate} />;
      case 'training':
        return <TrainingView onNavigate={handleNavigate} />;
      case 'events':
        return <EventsView onNavigate={handleNavigate} />;
      case 'news':
        return <NewsView onNavigate={handleNavigate} />;
      case 'gallery':
        return <GalleryView onNavigate={handleNavigate} />;
      case 'contact':
        return <ContactView onNavigate={handleNavigate} />;
      
      // Auth Routes
      case 'login':
        return <LoginView onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
      case 'forgot-password':
        return <ForgotPasswordView onNavigate={handleNavigate} />;
      case 'reset-password':
        return <ResetPasswordView onNavigate={handleNavigate} />;
      
      // Protected Routes
      case 'change-password':
        if (!currentUser) {
          return <LoginView onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
        }
        return <ChangePasswordView onNavigate={handleNavigate} />;
        

      case 'espace':
        if (!currentUser) {
          return <LoginView onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
        }
        if (currentUser.status !== 'ACTIVE' && currentUser.status !== 'APPROVED') {
          return (
            <AccessDeniedView
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onSignOut={handleSignOut}
            />
          );
        }

        // 1. Raha misy module voafidy
        if (activeModule === 'members' || activeModule === 'adhesion' || activeModule === 'hr') {
          return (
            <BrowserRouter>
              <AuthProvider>
                <div className="w-full">
                  <div className="max-w-7xl mx-auto px-6 pt-4 bg-slate-100">
                    <button
                      onClick={() => { setActiveModule(null); setCurrentTab('overview'); }}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      ← Retour au Menu Principal du Site
                    </button>
                  </div>

                  {activeModule === 'hr' ? (
                    <RHAppModule />
                  ) : (
                    <MembersAppModule />
                  )}
                </div>
              </AuthProvider>
            </BrowserRouter>
          );
        }

        // Raha misy module voafidy (hr na members)
        if (activeModule === 'hr' || activeModule === 'members') {
          return (
            <BrowserRouter>
              <AuthProvider> {/* <--- Tsy maintsy atao eto izy mba hamahana ilay error */}
                <div className="w-full">
                  <div className="max-w-7xl mx-auto px-6 pt-4 bg-slate-100">
                    <button
                      onClick={() => { setActiveModule(null); setCurrentTab('overview'); }}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      ← Retour au Menu Principal du Site
                    </button>
                  </div>

                  <RHAppModule />
                </div>
              </AuthProvider>
            </BrowserRouter>
          );
        }

        // 2. Raha mbola tsy misy dia ny DashboardMenu no aseho
        return (
          <DashboardMenu
            user={currentUser}
            onSelectModule={(moduleKey) => {
              console.log("Module sélectionné :", moduleKey);
              setActiveModule(moduleKey); // Mametraka ilay module ho mavitrika
            }}
          />
        );

      case 'access-denied':
        return (
          <AccessDeniedView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
          />
        );

      default:
        return <HomeView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-slate-900 flex flex-col justify-between selection:bg-emerald-200 selection:text-emerald-900">
      
      {/* Header */}
      <Header
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {renderView()}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

    </div>
  );
}