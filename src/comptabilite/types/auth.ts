export type UserRole =
  | 'ADMIN'
  | 'DIRECTEUR'
  | 'COMPTABLE'
  | 'GESTIONNAIRE'
  | 'ASSISTANT COMPTABLE';

export type UserStatus = 'ACTIVE' | 'DISABLED';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  createdAt: string;
  lastLoginAt: string;
  createdBy?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  uid: string;
  userEmail: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  ipAddress?: string;
}

export interface RolePermissions {
  canAccessDashboard: boolean;
  canAccessJournal: boolean;
  canAccessLedger: boolean;
  canAccessTrialBalance: boolean;
  canAccessFinancialStatements: boolean;
  canAccessChartOfAccounts: boolean;
  canAccessAssets: boolean;
  canAccessBank: boolean;
  canAccessVat: boolean;
  canAccessSettings: boolean;
  canAccessUserManagement: boolean;
  
  // Action permissions
  canCreateEntries: boolean;
  canEditEntries: boolean;
  canDeleteEntries: boolean;
  canPostDepreciation: boolean;
  canReconcileBank: boolean;
  canManageUsers: boolean;
  canResetDatabase: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  ADMIN: {
    canAccessDashboard: true,
    canAccessJournal: true,
    canAccessLedger: true,
    canAccessTrialBalance: true,
    canAccessFinancialStatements: true,
    canAccessChartOfAccounts: true,
    canAccessAssets: true,
    canAccessBank: true,
    canAccessVat: true,
    canAccessSettings: true,
    canAccessUserManagement: true,
    canCreateEntries: true,
    canEditEntries: true,
    canDeleteEntries: true,
    canPostDepreciation: true,
    canReconcileBank: true,
    canManageUsers: true,
    canResetDatabase: true,
  },
  DIRECTEUR: {
    canAccessDashboard: true,
    canAccessJournal: true,
    canAccessLedger: true,
    canAccessTrialBalance: true,
    canAccessFinancialStatements: true,
    canAccessChartOfAccounts: true,
    canAccessAssets: true,
    canAccessBank: true,
    canAccessVat: true,
    canAccessSettings: true,
    canAccessUserManagement: false,
    canCreateEntries: false,
    canEditEntries: false,
    canDeleteEntries: false,
    canPostDepreciation: false,
    canReconcileBank: false,
    canManageUsers: false,
    canResetDatabase: false,
  },
  COMPTABLE: {
    canAccessDashboard: true,
    canAccessJournal: true,
    canAccessLedger: true,
    canAccessTrialBalance: true,
    canAccessFinancialStatements: true,
    canAccessChartOfAccounts: true,
    canAccessAssets: true,
    canAccessBank: true,
    canAccessVat: true,
    canAccessSettings: false,
    canAccessUserManagement: false,
    canCreateEntries: true,
    canEditEntries: true,
    canDeleteEntries: true,
    canPostDepreciation: true,
    canReconcileBank: true,
    canManageUsers: false,
    canResetDatabase: false,
  },
  GESTIONNAIRE: {
    canAccessDashboard: true,
    canAccessJournal: true,
    canAccessLedger: true,
    canAccessTrialBalance: false,
    canAccessFinancialStatements: false,
    canAccessChartOfAccounts: true,
    canAccessAssets: true,
    canAccessBank: true,
    canAccessVat: false,
    canAccessSettings: false,
    canAccessUserManagement: false,
    canCreateEntries: true,
    canEditEntries: true,
    canDeleteEntries: false,
    canPostDepreciation: false,
    canReconcileBank: true,
    canManageUsers: false,
    canResetDatabase: false,
  },
  'ASSISTANT COMPTABLE': {
    canAccessDashboard: true,
    canAccessJournal: true,
    canAccessLedger: true,
    canAccessTrialBalance: false,
    canAccessFinancialStatements: false,
    canAccessChartOfAccounts: true,
    canAccessAssets: false,
    canAccessBank: false,
    canAccessVat: false,
    canAccessSettings: false,
    canAccessUserManagement: false,
    canCreateEntries: true,
    canEditEntries: false,
    canDeleteEntries: false,
    canPostDepreciation: false,
    canReconcileBank: false,
    canManageUsers: false,
    canResetDatabase: false,
  },
};

export const ROLE_LABELS: Record<UserRole, { title: string; badgeColor: string; description: string }> = {
  ADMIN: {
    title: 'Administrateur Système',
    badgeColor: 'bg-purple-900/80 text-purple-300 border-purple-700',
    description: 'Accès intégral à la gestion des utilisateurs, audit, paramétrage et comptabilité.',
  },
  DIRECTEUR: {
    title: 'Directeur Général / Financier',
    badgeColor: 'bg-indigo-900/80 text-indigo-300 border-indigo-700',
    description: 'Vue d\'ensemble, validation des états financiers, rapports executifs et piste d\'audit.',
  },
  COMPTABLE: {
    title: 'Chef Comptable',
    badgeColor: 'bg-blue-900/80 text-blue-300 border-blue-700',
    description: 'Gestion complète du journal, grand livre, déclarations TVA, amortissements et bilan.',
  },
  GESTIONNAIRE: {
    title: 'Gestionnaire Logistique & Finance',
    badgeColor: 'bg-emerald-900/80 text-emerald-300 border-emerald-700',
    description: 'Gestion opérationnelle des immobilisations, banque et mouvements quotidiens.',
  },
  'ASSISTANT COMPTABLE': {
    title: 'Assistant Comptable',
    badgeColor: 'bg-amber-900/80 text-amber-300 border-amber-700',
    description: 'Saisie initiale des pièces comptables, consultation du journal et du plan comptable.',
  },
};
