/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { SessionTimeoutBanner } from './components/SessionTimeoutBanner';
import { UserManagementView } from './components/UserManagementView';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { StockMovementsView } from './components/StockMovementsView';
import { FinancialView } from './components/FinancialView';
import { SuppliersView } from './components/SuppliersView';
import { PDFReportsView } from './components/PDFReportsView';
import { SettingsView } from './components/SettingsView';

import { ItemFormModal } from './components/ItemFormModal';
import { MovementFormModal } from './components/MovementFormModal';
import { FinancialFormModal } from './components/FinancialFormModal';
import { BarcodeQRModal } from './components/BarcodeQRModal';

import { InventoryItem, StockMovement, FinancialTransaction, Supplier, AssociationProfile, CurrencyCode, MovementType, TransactionType } from './types';
import { INITIAL_INVENTORY, INITIAL_MOVEMENTS, INITIAL_TRANSACTIONS, INITIAL_SUPPLIERS, INITIAL_PROFILE } from './data/initialData';
import { subscribeToRealtimeBranch, pushRealtimeBranch, seedDatabaseIfEmpty } from './lib/firebase';
import { GENERATE_INVENTORY_REPORT } from './utils/pdfGenerator';

function MainAppContent() {
  const { isAuthenticated, loading } = useAuth();

  // Navigation & Preferences
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currency, setCurrency] = useState<CurrencyCode>('XOF');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Core Data States
  const [profile, setProfile] = useState<AssociationProfile>(() => {
    const cached = localStorage.getItem('site_amm_profile');
    return cached ? JSON.parse(cached) : INITIAL_PROFILE;
  });

  const [items, setItems] = useState<InventoryItem[]>(() => {
    const cached = localStorage.getItem('site_amm_inventory');
    return cached ? JSON.parse(cached) : INITIAL_INVENTORY;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const cached = localStorage.getItem('site_amm_movements');
    return cached ? JSON.parse(cached) : INITIAL_MOVEMENTS;
  });

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    const cached = localStorage.getItem('site_amm_transactions');
    return cached ? JSON.parse(cached) : INITIAL_TRANSACTIONS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const cached = localStorage.getItem('site_amm_suppliers');
    return cached ? JSON.parse(cached) : INITIAL_SUPPLIERS;
  });

  // Modal Controls
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>('IN');

  const [financialModalOpen, setFinancialModalOpen] = useState(false);
  const [financialType, setFinancialType] = useState<TransactionType>('EXPENSE');

  const [qrModalItem, setQrModalItem] = useState<InventoryItem | null>(null);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('site_amm_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('site_amm_inventory', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('site_amm_movements', JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem('site_amm_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('site_amm_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  // Firebase Realtime DB Subscriptions
  useEffect(() => {
    let unsubs: Array<() => void> = [];

    // Subscribe to inventory
    const unsubInv = subscribeToRealtimeBranch<Record<string, InventoryItem>>(
      'inventory',
      (data) => {
        if (data) {
          const list = Object.values(data);
          setItems(list);
          setIsFirebaseConnected(true);
        }
      },
      () => setIsFirebaseConnected(false)
    );

    // Subscribe to movements
    const unsubMov = subscribeToRealtimeBranch<Record<string, StockMovement>>(
      'movements',
      (data) => {
        if (data) {
          const list = Object.values(data).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setMovements(list);
        }
      }
    );

    // Subscribe to transactions
    const unsubTx = subscribeToRealtimeBranch<Record<string, FinancialTransaction>>(
      'transactions',
      (data) => {
        if (data) {
          const list = Object.values(data).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setTransactions(list);
        }
      }
    );

    // Subscribe to suppliers
    const unsubSup = subscribeToRealtimeBranch<Record<string, Supplier>>(
      'suppliers',
      (data) => {
        if (data) {
          setSuppliers(Object.values(data));
        }
      }
    );

    // Subscribe to profile
    const unsubProf = subscribeToRealtimeBranch<AssociationProfile>(
      'profile',
      (data) => {
        if (data) {
          setProfile(data);
        }
      }
    );

    unsubs.push(unsubInv, unsubMov, unsubTx, unsubSup, unsubProf);

    return () => {
      unsubs.forEach(fn => fn && fn());
    };
  }, []);

  // If not authenticated, render Auth Screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Force Sync & Seed Firebase
  const handleForceSync = async () => {
    const success = await seedDatabaseIfEmpty();
    setIsFirebaseConnected(success);
  };

  const handleSeedDemoData = async () => {
    setItems(INITIAL_INVENTORY);
    setMovements(INITIAL_MOVEMENTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setSuppliers(INITIAL_SUPPLIERS);
    setProfile(INITIAL_PROFILE);
    return await seedDatabaseIfEmpty();
  };

  // Handlers for Items
  const handleSaveItem = async (item: InventoryItem) => {
    const updatedItems = items.some(i => i.id === item.id)
      ? items.map(i => i.id === item.id ? item : i)
      : [item, ...items];

    setItems(updatedItems);
    await pushRealtimeBranch(`inventory/${item.id}`, item);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet article de l'inventaire ?")) return;
    const updated = items.filter(i => i.id !== itemId);
    setItems(updated);
    await pushRealtimeBranch(`inventory/${itemId}`, null);
  };

  // Handlers for Stock Movements
  const handleSaveMovement = async (mov: StockMovement) => {
    const newMovements = [mov, ...movements];
    setMovements(newMovements);
    await pushRealtimeBranch(`movements/${mov.id}`, mov);

    const targetItem = items.find(i => i.id === mov.itemId);
    if (targetItem) {
      let newQty = targetItem.quantity;
      if (mov.type === 'IN') {
        newQty += mov.quantity;
      } else if (mov.type === 'OUT') {
        newQty = Math.max(0, targetItem.quantity - mov.quantity);
      } else if (mov.type === 'ADJUSTMENT') {
        newQty = mov.quantity;
      }

      const updatedItem: InventoryItem = {
        ...targetItem,
        quantity: newQty,
        totalValue: newQty * targetItem.unitPrice,
        location: mov.type === 'TRANSFER' && mov.targetLocation ? mov.targetLocation : targetItem.location,
        lastRestockDate: mov.type === 'IN' ? mov.timestamp.slice(0, 10) : targetItem.lastRestockDate,
        updatedAt: new Date().toISOString().slice(0, 10)
      };

      const newItems = items.map(i => i.id === targetItem.id ? updatedItem : i);
      setItems(newItems);
      await pushRealtimeBranch(`inventory/${updatedItem.id}`, updatedItem);
    }
  };

  // Handlers for Financial Transactions
  const handleSaveTransaction = async (tx: FinancialTransaction) => {
    const newTxList = [tx, ...transactions];
    setTransactions(newTxList);
    await pushRealtimeBranch(`transactions/${tx.id}`, tx);
  };

  // Handlers for Suppliers
  const handleAddSupplier = async (sup: Supplier) => {
    const newSups = [...suppliers, sup];
    setSuppliers(newSups);
    await pushRealtimeBranch(`suppliers/${sup.id}`, sup);
  };

  const locationsList = profile.warehouseLocations || INITIAL_PROFILE.warehouseLocations;
  const supplierNames = suppliers.map(s => s.name);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased pb-12 selection:bg-indigo-500 selection:text-white relative">
      
      {/* Session Inactivity Timeout Floating Alert */}
      <SessionTimeoutBanner />

      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        currency={currency}
        setCurrency={setCurrency}
        isFirebaseConnected={isFirebaseConnected}
        onQuickAddItem={() => {
          setEditingItem(null);
          setItemModalOpen(true);
        }}
        onQuickAddTransaction={() => {
          setFinancialType('EXPENSE');
          setFinancialModalOpen(true);
        }}
        onSyncFirebase={handleForceSync}
      />

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            items={items}
            movements={movements}
            transactions={transactions}
            currency={currency}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAddItem={() => {
              setEditingItem(null);
              setItemModalOpen(true);
            }}
            onOpenAddMovement={(type) => {
              setMovementType(type || 'IN');
              setMovementModalOpen(true);
            }}
            onOpenAddTransaction={() => {
              setFinancialType('EXPENSE');
              setFinancialModalOpen(true);
            }}
            onGenerateReport={() => GENERATE_INVENTORY_REPORT(items, { profile, currency })}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            items={items}
            currency={currency}
            onOpenAddItem={() => {
              setEditingItem(null);
              setItemModalOpen(true);
            }}
            onOpenEditItem={(item) => {
              setEditingItem(item);
              setItemModalOpen(true);
            }}
            onOpenQRModal={(item) => setQrModalItem(item)}
            onOpenQuickStockModal={(item) => {
              setMovementType('IN');
              setMovementModalOpen(true);
            }}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {activeTab === 'movements' && (
          <StockMovementsView
            movements={movements}
            currency={currency}
            onOpenAddMovement={(type) => {
              setMovementType(type || 'IN');
              setMovementModalOpen(true);
            }}
          />
        )}

        {activeTab === 'financial' && (
          <FinancialView
            transactions={transactions}
            currency={currency}
            onOpenAddTransaction={(type) => {
              setFinancialType(type || 'EXPENSE');
              setFinancialModalOpen(true);
            }}
          />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
          />
        )}

        {activeTab === 'reports' && (
          <PDFReportsView
            items={items}
            movements={movements}
            transactions={transactions}
            profile={profile}
            currency={currency}
          />
        )}

        {activeTab === 'users' && (
          <UserManagementView />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            profile={profile}
            onUpdateProfile={(p) => {
              setProfile(p);
              pushRealtimeBranch('profile', p);
            }}
            isFirebaseConnected={isFirebaseConnected}
            onSeedDemoData={handleSeedDemoData}
            onForceSync={handleForceSync}
          />
        )}
      </main>

      {/* Modals */}
      <ItemFormModal
        isOpen={itemModalOpen}
        onClose={() => {
          setItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        initialItem={editingItem}
        locations={locationsList}
        suppliers={supplierNames}
      />

      <MovementFormModal
        isOpen={movementModalOpen}
        onClose={() => setMovementModalOpen(false)}
        onSave={handleSaveMovement}
        items={items}
        defaultType={movementType}
        locations={locationsList}
      />

      <FinancialFormModal
        isOpen={financialModalOpen}
        onClose={() => setFinancialModalOpen(false)}
        onSave={handleSaveTransaction}
        defaultType={financialType}
      />

      <BarcodeQRModal
        item={qrModalItem}
        onClose={() => setQrModalItem(null)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
