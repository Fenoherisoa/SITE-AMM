import React, { useState, useEffect } from 'react';
import { PageRoute, UserMetadata } from './types';
import { authService } from './services/authService';

import { Header } from './components/Header';
import { Footer } from './components/Footer';

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

  useEffect(() => {
    // Subscribe to Auth state updates
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleNavigate = (route: PageRoute) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    await authService.signOut();
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
        return (
          <EspaceMemberView
            currentUser={currentUser}
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
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
