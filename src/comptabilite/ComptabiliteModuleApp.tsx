import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView } from './components/auth/AuthView';
import { UserManagementView } from './components/auth/UserManagementView';
import { ProfileModal } from './components/auth/ProfileModal';

import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { JournalView } from './components/JournalView';
import { LedgerView } from './components/LedgerView';
import { TrialBalanceView } from './components/TrialBalanceView';
import { FinancialStatementsView } from './components/FinancialStatementsView';
import { ChartOfAccountsView } from './components/ChartOfAccountsView';
import { AssetsView } from './components/AssetsView';
import { BankReconcileView } from './components/BankReconcileView';
import { VatView } from './components/VatView';
import { SettingsView } from './components/SettingsView';
import { EntryModal } from './components/EntryModal';

import { Account, JournalEntry, FixedAsset, CompanyConfig } from './types/accounting';
import { INITIAL_ACCOUNTS, INITIAL_ENTRIES, INITIAL_FIXED_ASSETS, INITIAL_COMPANY_CONFIG } from './data/defaultData';
import { FirebaseSyncService, AccountingData } from './services/firebaseSync';
import { AuthService } from './services/authService';

function MainLayout() {
  const { currentUser, userProfile, permissions, isLoading: authLoading } = useAuth();

  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Data states
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_ENTRIES);
  const [assets, setAssets] = useState<FixedAsset[]>(INITIAL_FIXED_ASSETS);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>(INITIAL_COMPANY_CONFIG);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Firebase Realtime Subscription
  useEffect(() => {
    if (!currentUser) return;

    setIsSyncing(true);
    const unsubscribe = FirebaseSyncService.subscribeToData(
      (data: AccountingData) => {
        setAccounts(data.accounts);
        setEntries(data.entries);
        setAssets(data.assets);
        setCompanyConfig(data.companyConfig);
        setIsSyncing(false);
        setSyncError(null);
      },
      (err) => {
        console.warn('[App] Realtime sync error:', err);
        setIsSyncing(false);
        setSyncError('Mode Hors Ligne');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-2xl animate-pulse shadow-lg shadow-blue-600/30">
          AMM
        </div>
        <p className="text-xs font-mono text-slate-400">Vérification de session & droits Firebase Auth...</p>
      </div>
    );
  }

  // If Unauthenticated, Render Auth Screen
  if (!currentUser || !userProfile) {
    return <AuthView />;
  }

  // Handlers
  const handleSaveEntry = async (entry: JournalEntry) => {
    if (!permissions?.canCreateEntries) return;

    try {
      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === entry.id);
        if (idx >= 0) {
          const clone = [...prev];
          clone[idx] = entry;
          return clone;
        }
        return [entry, ...prev];
      });

      await FirebaseSyncService.addOrUpdateEntry(entry);

      // Audit Log
      await AuthService.logAuditAction(
        userProfile.uid,
        userProfile.email,
        userProfile.displayName,
        userProfile.role,
        'ECRITURE_COMPTABLE',
        `Saisie / validation de la pièce ${entry.pieceNumber} (${entry.journalCode})`
      );
    } catch (err) {
      console.error('[App] Save entry error:', err);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!permissions?.canDeleteEntries) return;

    if (window.confirm('Voulez-vous vraiment supprimer cette écriture comptable ?')) {
      try {
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
        await FirebaseSyncService.deleteEntry(entryId);

        await AuthService.logAuditAction(
          userProfile.uid,
          userProfile.email,
          userProfile.displayName,
          userProfile.role,
          'SUPPRESSION_ECRITURE',
          `Suppression de l'écriture ID ${entryId}`
        );
      } catch (err) {
        console.error('[App] Delete entry error:', err);
      }
    }
  };

  const handleAddAccount = async (newAccount: Account) => {
    try {
      const updatedAccounts = [...accounts, newAccount];
      setAccounts(updatedAccounts);
      await FirebaseSyncService.saveAccounts(updatedAccounts);

      await AuthService.logAuditAction(
        userProfile.uid,
        userProfile.email,
        userProfile.displayName,
        userProfile.role,
        'AJOUT_COMPTE',
        `Création du compte N° ${newAccount.code} - ${newAccount.label}`
      );
    } catch (err) {
      console.error('[App] Add account error:', err);
    }
  };

  const handleSaveCompanyConfig = async (config: CompanyConfig) => {
    try {
      setCompanyConfig(config);
      await FirebaseSyncService.saveCompanyConfig(config);

      await AuthService.logAuditAction(
        userProfile.uid,
        userProfile.email,
        userProfile.displayName,
        userProfile.role,
        'CONFIG_PROFIL',
        `Mise à jour des paramètres légaux entité (${config.name})`
      );
    } catch (err) {
      console.error('[App] Save config error:', err);
    }
  };

  const handleResetData = async () => {
    if (!permissions?.canResetDatabase) return;

    try {
      await FirebaseSyncService.resetToDefaultSeed();
      setAccounts(INITIAL_ACCOUNTS);
      setEntries(INITIAL_ENTRIES);
      setAssets(INITIAL_FIXED_ASSETS);
      setCompanyConfig(INITIAL_COMPANY_CONFIG);

      await AuthService.logAuditAction(
        userProfile.uid,
        userProfile.email,
        userProfile.displayName,
        userProfile.role,
        'REINITIALISATION_BASE',
        'Réinitialisation complète de la base comptable au jeu de seed SYSCOHADA'
      );

      alert('Base de données comptables réinitialisée au jeu de données exemple SYSCOHADA !');
    } catch (err) {
      console.error('[App] Reset data error:', err);
    }
  };

  const handleOpenNewEntryModal = () => {
    if (!permissions?.canCreateEntries) return;
    setEditingEntry(null);
    setIsEntryModalOpen(true);
  };

  const handleEditEntryModal = (entry: JournalEntry) => {
    if (!permissions?.canEditEntries) return;
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        companyConfig={companyConfig}
        onOpenNewEntry={handleOpenNewEntryModal}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenUserManagement={() => setCurrentTab('userManagement')}
        isSyncing={isSyncing}
        syncError={syncError}
        activeEntriesCount={entries.length}
      />

      {/* Main Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          entriesCount={entries.length}
          accountsCount={accounts.length}
        />

        {/* Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
          {currentTab === 'dashboard' && permissions?.canAccessDashboard && (
            <DashboardView
              entries={entries}
              accounts={accounts}
              companyConfig={companyConfig}
              onOpenNewEntry={handleOpenNewEntryModal}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'journal' && permissions?.canAccessJournal && (
            <JournalView
              entries={entries}
              companyConfig={companyConfig}
              onOpenNewEntry={handleOpenNewEntryModal}
              onEditEntry={handleEditEntryModal}
              onDeleteEntry={handleDeleteEntry}
            />
          )}

          {currentTab === 'ledger' && permissions?.canAccessLedger && (
            <LedgerView
              accounts={accounts}
              entries={entries}
              companyConfig={companyConfig}
            />
          )}

          {currentTab === 'trialBalance' && permissions?.canAccessTrialBalance && (
            <TrialBalanceView
              accounts={accounts}
              entries={entries}
              companyConfig={companyConfig}
            />
          )}

          {currentTab === 'financialStatements' && permissions?.canAccessFinancialStatements && (
            <FinancialStatementsView
              accounts={accounts}
              entries={entries}
              companyConfig={companyConfig}
            />
          )}

          {currentTab === 'chartOfAccounts' && permissions?.canAccessChartOfAccounts && (
            <ChartOfAccountsView
              accounts={accounts}
              onAddAccount={handleAddAccount}
            />
          )}

          {currentTab === 'assets' && permissions?.canAccessAssets && (
            <AssetsView
              assets={assets}
              companyConfig={companyConfig}
              onAddAsset={async (a) => {
                const newAssets = [...assets, a];
                setAssets(newAssets);
                await FirebaseSyncService.saveAssets(newAssets);
              }}
              onPostDepreciationEntry={handleSaveEntry}
            />
          )}

          {currentTab === 'bank' && permissions?.canAccessBank && (
            <BankReconcileView
              entries={entries}
              companyConfig={companyConfig}
            />
          )}

          {currentTab === 'vat' && permissions?.canAccessVat && (
            <VatView
              entries={entries}
              companyConfig={companyConfig}
            />
          )}

          {currentTab === 'settings' && permissions?.canAccessSettings && (
            <SettingsView
              companyConfig={companyConfig}
              onSaveConfig={handleSaveCompanyConfig}
              onResetData={handleResetData}
            />
          )}

          {currentTab === 'userManagement' && permissions?.canAccessUserManagement && (
            <UserManagementView />
          )}
        </main>

      </div>

      {/* Saisie de Pièce Modal */}
      {permissions?.canCreateEntries && (
        <EntryModal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          onSave={handleSaveEntry}
          accounts={accounts}
          companyConfig={companyConfig}
          editingEntry={editingEntry}
        />
      )}

      {/* User Profile & Session Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
