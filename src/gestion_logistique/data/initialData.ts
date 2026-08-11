import { InventoryItem, StockMovement, FinancialTransaction, Supplier, AssociationProfile, BudgetLimit } from '../types';

export const INITIAL_PROFILE: AssociationProfile = {
  name: 'SITE-AMM ASSOCIATION & LOGISTIQUE',
  acronym: 'SITE-AMM',
  subtitle: 'Direction Générale - Service Logistique & Gestion Financière',
  address: 'Siège Social AMM, Avenue de la République, BP 1024',
  phone: '+221 33 820 15 15 / +33 1 40 50 60 70',
  email: 'logistique@site-amm.org',
  taxNumber: 'NINEA 008493021 / AMM-2026',
  defaultCurrency: 'XOF',
  warehouseLocations: [
    'Entrepôt Principal (Siège)',
    'Bureau Central',
    'Antenne Régionale Ouest',
    'Réserve Événementielle',
  ]
};

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'SUP-001',
    name: 'TechPro Solutions SARL',
    contactPerson: 'Amadou Diallo',
    email: 'contact@techpro-solutions.sn',
    phone: '+221 77 634 12 90',
    address: 'Zone Industrielle, Dakar',
    categorySpecialty: 'Équipement Informatique',
    taxId: 'SN-DKR-2022-B12',
    rating: 5,
    notes: 'Fournisseur agréé ordinateurs, serveurs et accessoires réseau.'
  },
  {
    id: 'SUP-002',
    name: 'AutoExpress & Véhicules',
    contactPerson: 'Marie-Claire Dupont',
    email: 'commercial@autoexpress-amm.com',
    phone: '+221 78 120 45 67',
    address: 'Route de Rufisque, Dakar',
    categorySpecialty: 'Matériel Roulant & Transport',
    taxId: 'SN-DKR-2021-A99',
    rating: 4,
    notes: 'Entretien de la flotte de camionnettes et fourniture de pièces détachées.'
  },
  {
    id: 'SUP-003',
    name: 'BuroDesign Africa',
    contactPerson: 'Jean-Baptiste Mendy',
    email: 'commandes@burodesign.org',
    phone: '+221 33 832 99 00',
    address: 'Avenue Malick Sy, Dakar',
    categorySpecialty: 'Mobilier de Bureau',
    taxId: 'SN-DKR-2020-C44',
    rating: 5,
    notes: 'Bureaux ergonomiques, armoires sécurisées, fauteuils de direction.'
  },
  {
    id: 'SUP-004',
    name: 'Events & Sound Prestige',
    contactPerson: 'Fatou Ndiaye',
    email: 'logistique@eventsound-sn.com',
    phone: '+221 76 500 88 11',
    address: 'Les Almadies, Dakar',
    categorySpecialty: 'Matériel Événementiel & Audiovisuel',
    taxId: 'SN-DKR-2023-E88',
    rating: 4,
    notes: 'Sonorisation, projecteurs laser, tentes d\'intervention.'
  },
  {
    id: 'SUP-005',
    name: 'SantéSecours Médical',
    contactPerson: 'Dr. Ousmane Sarr',
    email: 'commandes@santesecours.org',
    phone: '+221 33 864 22 10',
    address: 'Fann Résidence, Dakar',
    categorySpecialty: 'Secours & Kit Médical',
    taxId: 'SN-DKR-2019-M01',
    rating: 5,
    notes: 'Défibrillateurs, trousses de premiers soins, civières tactiques.'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'ITEM-001',
    code: 'LOG-INF-001',
    name: 'Ordinateur Portable Dell Latitude 5540',
    category: 'Équipement Informatique',
    description: 'Core i7, 16 Go RAM, SSD 512 Go pour équipe projet AMM',
    quantity: 12,
    minThreshold: 3,
    unitPrice: 650000, // FCFA
    totalValue: 7800000,
    location: 'Entrepôt Principal (Siège)',
    condition: 'Neuf',
    supplierName: 'TechPro Solutions SARL',
    lastRestockDate: '2026-07-15',
    barcode: '3700123450019',
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&q=80',
    createdAt: '2026-01-10',
    updatedAt: '2026-07-15'
  },
  {
    id: 'ITEM-002',
    code: 'LOG-ROU-002',
    name: 'Pick-up Toyota Hilux Double Cabine 4x4',
    category: 'Matériel Roulant & Transport',
    description: 'Véhicule de mission logistique pour livraison sur terrain',
    quantity: 2,
    minThreshold: 1,
    unitPrice: 22500000,
    totalValue: 45000000,
    location: 'Antenne Régionale Ouest',
    condition: 'Bon état',
    supplierName: 'AutoExpress & Véhicules',
    lastRestockDate: '2025-11-20',
    barcode: '3700123450026',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=300&q=80',
    createdAt: '2025-11-20',
    updatedAt: '2026-06-02'
  },
  {
    id: 'ITEM-003',
    code: 'LOG-EVE-003',
    name: 'Pack Sonorisation Mobile Yamaha 1000W + Micros HF',
    category: 'Matériel Événementiel & Audiovisuel',
    description: 'Enceintes actives amplifiées, table de mixage 12 canaux',
    quantity: 4,
    minThreshold: 2,
    unitPrice: 1200000,
    totalValue: 4800000,
    location: 'Réserve Événementielle',
    condition: 'Bon état',
    supplierName: 'Events & Sound Prestige',
    lastRestockDate: '2026-04-10',
    barcode: '3700123450033',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
    createdAt: '2026-04-10',
    updatedAt: '2026-04-10'
  },
  {
    id: 'ITEM-004',
    code: 'LOG-MED-004',
    name: 'Défibrillateur Automatisé Externe (DAE) Zoll AED Plus',
    category: 'Secours & Kit Médical',
    description: 'Kit complet de réanimation cardiaque avec sacoche de secours',
    quantity: 1,
    minThreshold: 3, // Stock bas alert!
    unitPrice: 1450000,
    totalValue: 1450000,
    location: 'Bureau Central',
    condition: 'Neuf',
    supplierName: 'SantéSecours Médical',
    lastRestockDate: '2026-02-01',
    barcode: '3700123450040',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80',
    createdAt: '2026-02-01',
    updatedAt: '2026-08-01'
  },
  {
    id: 'ITEM-005',
    code: 'LOG-BUR-005',
    name: 'Armoire Métallique Ignifugée 2 Portes',
    category: 'Mobilier de Bureau',
    description: 'Rangement sécurisé des archives comptables et juridiques SITE-AMM',
    quantity: 8,
    minThreshold: 2,
    unitPrice: 280000,
    totalValue: 2240000,
    location: 'Bureau Central',
    condition: 'Bon état',
    supplierName: 'BuroDesign Africa',
    lastRestockDate: '2026-01-15',
    barcode: '3700123450057',
    imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=300&q=80',
    createdAt: '2026-01-15',
    updatedAt: '2026-01-15'
  },
  {
    id: 'ITEM-006',
    code: 'LOG-CON-006',
    name: 'Rames de Papier A4 80g (Carton de 5 rames)',
    category: 'Consommables & Fournitures',
    description: 'Papier blanc extra pour impression de bilans et rapports',
    quantity: 2, // Stock bas alert!
    minThreshold: 10,
    unitPrice: 15500,
    totalValue: 31000,
    location: 'Entrepôt Principal (Siège)',
    condition: 'Neuf',
    supplierName: 'TechPro Solutions SARL',
    lastRestockDate: '2026-05-12',
    barcode: '3700123450064',
    createdAt: '2026-05-12',
    updatedAt: '2026-08-05'
  },
  {
    id: 'ITEM-007',
    code: 'LOG-INF-007',
    name: 'Videoprojecteur Epson 4K Pro Cinema 4000 Lumens',
    category: 'Équipement Informatique',
    description: 'Projecteur haute luminosité pour conférences et Assemblées Générales AMM',
    quantity: 3,
    minThreshold: 1,
    unitPrice: 850000,
    totalValue: 2550000,
    location: 'Réserve Événementielle',
    condition: 'Neuf',
    supplierName: 'TechPro Solutions SARL',
    lastRestockDate: '2026-06-20',
    barcode: '3700123450071',
    createdAt: '2026-06-20',
    updatedAt: '2026-06-20'
  },
  {
    id: 'ITEM-008',
    code: 'LOG-OUT-008',
    name: 'Groupe Électrogène Inverter Silent 6.5 kVA',
    category: 'Outillage & Maintenance',
    description: 'Alimentation de secours automatique en cas de coupure de courant',
    quantity: 0, // Rupture de stock!
    minThreshold: 2,
    unitPrice: 1100000,
    totalValue: 0,
    location: 'Entrepôt Principal (Siège)',
    condition: 'À réparer',
    supplierName: 'AutoExpress & Véhicules',
    lastRestockDate: '2025-08-10',
    barcode: '3700123450088',
    createdAt: '2025-08-10',
    updatedAt: '2026-08-10'
  }
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'MOV-1001',
    itemId: 'ITEM-001',
    itemCode: 'LOG-INF-001',
    itemName: 'Ordinateur Portable Dell Latitude 5540',
    type: 'IN',
    quantity: 5,
    unitPrice: 650000,
    totalPrice: 3250000,
    targetLocation: 'Entrepôt Principal (Siège)',
    reason: 'Achats sur Subvention Annuelle',
    referenceDoc: 'FAC-2026-089',
    handlerName: 'M. Ibrahim Diop (Resp. Logistique)',
    timestamp: '2026-07-15T10:30:00Z',
    notes: 'Réception conforme du lot Dell avec garantie 3 ans.'
  },
  {
    id: 'MOV-1002',
    itemId: 'ITEM-004',
    itemCode: 'LOG-MED-004',
    itemName: 'Défibrillateur Automatisé Externe (DAE)',
    type: 'TRANSFER',
    quantity: 1,
    unitPrice: 1450000,
    totalPrice: 1450000,
    sourceLocation: 'Entrepôt Principal (Siège)',
    targetLocation: 'Bureau Central',
    reason: 'Transfert Inter-Dépôt',
    referenceDoc: 'BT-2026-012',
    handlerName: 'Dr. Ousmane Sarr',
    timestamp: '2026-08-01T14:15:00Z',
    notes: 'Mise en place au poste de secours du siège central.'
  },
  {
    id: 'MOV-1003',
    itemId: 'ITEM-006',
    itemCode: 'LOG-CON-006',
    itemName: 'Rames de Papier A4 80g',
    type: 'OUT',
    quantity: 8,
    unitPrice: 15500,
    totalPrice: 124000,
    sourceLocation: 'Entrepôt Principal (Siège)',
    reason: 'Distribution pour Assemblée Générale AMM',
    referenceDoc: 'BS-2026-044',
    handlerName: 'Mme Aïssatou Ba (Comptable)',
    timestamp: '2026-08-05T09:00:00Z',
    notes: 'Impression des dossiers d\'audit et bilans financiers.'
  },
  {
    id: 'MOV-1004',
    itemId: 'ITEM-008',
    itemCode: 'LOG-OUT-008',
    itemName: 'Groupe Électrogène Inverter Silent 6.5 kVA',
    type: 'ADJUSTMENT',
    quantity: 1,
    unitPrice: 1100000,
    totalPrice: 1100000,
    sourceLocation: 'Entrepôt Principal (Siège)',
    reason: 'Mise en réparation / Avarie',
    referenceDoc: 'INV-AUDIT-2026',
    handlerName: 'M. Ibrahim Diop (Resp. Logistique)',
    timestamp: '2026-08-10T11:45:00Z',
    notes: 'Défaillance de l\'alternateur lors des tests de charge.'
  }
];

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'FIN-2001',
    type: 'INCOME',
    category: 'Subventions & Dons',
    title: 'Subvention Partenaire Annuelle 2026',
    description: 'Soutien financier alloué pour les projets d\'équipement et logistique SITE-AMM',
    amount: 18500000, // FCFA
    date: '2026-07-01',
    paymentMethod: 'Virement Bancaire',
    account: 'Compte Bancaire AMM',
    status: 'PAYE',
    receiptRef: 'VIR-BNK-98231',
    createdByName: 'Trésorier Général AMM',
    timestamp: '2026-07-01T08:00:00Z'
  },
  {
    id: 'FIN-2002',
    type: 'EXPENSE',
    category: 'Achat Matériel & Équipement',
    title: 'Acquisition Lot Ordinateurs Dell Latitude',
    description: 'Achat de 5 PC portables de haute performance (Ref: LOG-INF-001)',
    amount: 3250000,
    date: '2026-07-15',
    paymentMethod: 'Virement Bancaire',
    account: 'Compte Bancaire AMM',
    status: 'PAYE',
    receiptRef: 'FAC-2026-089',
    linkedMovementId: 'MOV-1001',
    createdByName: 'Mme Aïssatou Ba (Comptable)',
    timestamp: '2026-07-15T11:00:00Z'
  },
  {
    id: 'FIN-2003',
    type: 'INCOME',
    category: 'Cotisations Membres',
    title: 'Cotisations Annuelles des Membres de l\'Association',
    description: 'Encaissement des cotisations des membres actifs T2 & T3 2026',
    amount: 4200000,
    date: '2026-07-28',
    paymentMethod: 'Mobile Money',
    account: 'Mobile Money AMM',
    status: 'PAYE',
    receiptRef: 'MM-COT-2026-104',
    createdByName: 'Trésorier Général AMM',
    timestamp: '2026-07-28T16:20:00Z'
  },
  {
    id: 'FIN-2004',
    type: 'EXPENSE',
    category: 'Maintenance & Réparations',
    title: 'Révision Technique & Vidange Flotte Hilux',
    description: 'Entretien périodique des 2 véhicules Pick-Up Toyota chez AutoExpress',
    amount: 480000,
    date: '2026-08-02',
    paymentMethod: 'Chèque',
    account: 'Compte Bancaire AMM',
    status: 'PAYE',
    receiptRef: 'CHQ-009218',
    createdByName: 'M. Ibrahim Diop (Resp. Logistique)',
    timestamp: '2026-08-02T10:00:00Z'
  },
  {
    id: 'FIN-2005',
    type: 'EXPENSE',
    category: 'Transport & Logistique',
    title: 'Frais de Carburant & Péage Missions Régionales',
    description: 'Cartes carburant pour acheminement du matériel à l\'antenne Ouest',
    amount: 250000,
    date: '2026-08-08',
    paymentMethod: 'Espèces',
    account: 'Caisse Principale Siège',
    status: 'PAYE',
    receiptRef: 'BC-2026-004',
    createdByName: 'Cagnotte Caisse',
    timestamp: '2026-08-08T15:30:00Z'
  },
  {
    id: 'FIN-2006',
    type: 'INCOME',
    category: 'Prestations & Événements',
    title: 'Recettes Location de Matériel Audiovisuel',
    description: 'Mise à disposition du pack sonorisation et vidéoprojecteur pour séminaire externe',
    amount: 850000,
    date: '2026-08-10',
    paymentMethod: 'Virement Bancaire',
    account: 'Compte Bancaire AMM',
    status: 'PAYE',
    receiptRef: 'VIR-BNK-99012',
    createdByName: 'M. Ibrahim Diop (Resp. Logistique)',
    timestamp: '2026-08-10T14:10:00Z'
  }
];

export const INITIAL_BUDGETS: BudgetLimit[] = [
  { category: 'Achat Matériel & Équipement', allocatedAmount: 15000000 },
  { category: 'Achat Consommables', allocatedAmount: 2500000 },
  { category: 'Maintenance & Réparations', allocatedAmount: 3000000 },
  { category: 'Transport & Logistique', allocatedAmount: 4000000 },
  { category: 'Frais Administratifs', allocatedAmount: 2000000 },
  { category: 'Prestations & Événements', allocatedAmount: 5000000 }
];

import { UserProfile, AuditLogEntry } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'usr-admin-01',
    email: 'admin@siteamm.org',
    displayName: 'M. Cheikh Tidiane Ndiaye',
    role: 'ADMIN',
    department: 'Direction Générale & SI',
    phone: '+221 77 100 20 30',
    status: 'ACTIVE',
    mfaEnabled: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2026-01-01T08:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    permissions: [
      'inventory:read', 'inventory:write', 'inventory:delete',
      'movements:read', 'movements:write',
      'financial:read', 'financial:write',
      'suppliers:read', 'suppliers:write',
      'reports:read', 'reports:export',
      'settings:read', 'settings:write',
      'users:manage', 'audit:read'
    ]
  },
  {
    uid: 'usr-log-02',
    email: 'logistique@siteamm.org',
    displayName: 'M. Ibrahim Diop',
    role: 'LOGISTICS_MANAGER',
    department: 'Direction de la Logistique & Patrimoine',
    phone: '+221 77 200 30 40',
    status: 'ACTIVE',
    mfaEnabled: false,
    lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: '2026-01-05T09:30:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    permissions: [
      'inventory:read', 'inventory:write', 'inventory:delete',
      'movements:read', 'movements:write',
      'financial:read',
      'suppliers:read', 'suppliers:write',
      'reports:read', 'reports:export',
      'settings:read'
    ]
  },
  {
    uid: 'usr-fin-03',
    email: 'finance@siteamm.org',
    displayName: 'Mme Aïssatou Ba',
    role: 'FINANCIAL_OFFICER',
    department: 'Direction Financière & Comptabilité',
    phone: '+221 77 300 40 50',
    status: 'ACTIVE',
    mfaEnabled: true,
    lastLogin: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdAt: '2026-01-10T11:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80',
    permissions: [
      'inventory:read',
      'movements:read',
      'financial:read', 'financial:write',
      'suppliers:read', 'suppliers:write',
      'reports:read', 'reports:export'
    ]
  },
  {
    uid: 'usr-aud-04',
    email: 'auditeur@siteamm.org',
    displayName: 'M. Mamadou Sarr',
    role: 'AUDITOR',
    department: 'Audit Interne & Conformité',
    phone: '+221 77 400 50 60',
    status: 'ACTIVE',
    mfaEnabled: true,
    lastLogin: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: '2026-02-01T14:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
    permissions: [
      'inventory:read',
      'movements:read',
      'financial:read',
      'suppliers:read',
      'reports:read', 'reports:export',
      'audit:read'
    ]
  },
  {
    uid: 'usr-agt-05',
    email: 'agent@siteamm.org',
    displayName: 'M. Moussa Fall',
    role: 'AGENT',
    department: 'Exploitation Magasin Principal',
    phone: '+221 77 500 60 70',
    status: 'ACTIVE',
    mfaEnabled: false,
    lastLogin: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: '2026-03-15T10:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80',
    permissions: [
      'inventory:read', 'inventory:write',
      'movements:read', 'movements:write',
      'suppliers:read'
    ]
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-8001',
    timestamp: new Date().toISOString(),
    userId: 'usr-admin-01',
    userEmail: 'admin@siteamm.org',
    userName: 'M. Cheikh Tidiane Ndiaye',
    userRole: 'ADMIN',
    action: 'LOGIN',
    details: 'Connexion réussie via Firebase Auth (Session Administrateur)',
    ipAddress: '197.220.12.89',
    severity: 'INFO'
  },
  {
    id: 'LOG-8002',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userId: 'usr-log-02',
    userEmail: 'logistique@siteamm.org',
    userName: 'M. Ibrahim Diop',
    userRole: 'LOGISTICS_MANAGER',
    action: 'LOGIN',
    details: 'Authentification 2FA validée - Accès au module Inventaire',
    ipAddress: '197.220.14.12',
    severity: 'INFO'
  },
  {
    id: 'LOG-8003',
    timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    userId: 'usr-fin-03',
    userEmail: 'finance@siteamm.org',
    userName: 'Mme Aïssatou Ba',
    userRole: 'FINANCIAL_OFFICER',
    action: 'PROFILE_UPDATE',
    details: 'Mise à jour des coordonnées financières et habilitation comptable',
    ipAddress: '41.82.112.44',
    severity: 'INFO'
  },
  {
    id: 'LOG-8004',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    userId: 'usr-agt-05',
    userEmail: 'agent@siteamm.org',
    userName: 'M. Moussa Fall',
    userRole: 'AGENT',
    action: 'FAILED_LOGIN',
    details: 'Mot de passe incorrect saisi (Tentative 1/3)',
    ipAddress: '197.220.98.05',
    severity: 'WARNING'
  },
  {
    id: 'LOG-8005',
    timestamp: new Date(Date.now() - 3600000 * 30).toISOString(),
    userId: 'usr-admin-01',
    userEmail: 'admin@siteamm.org',
    userName: 'M. Cheikh Tidiane Ndiaye',
    userRole: 'ADMIN',
    action: 'ROLE_CHANGE',
    details: 'Attribution du rôle AUDITOR pour M. Mamadou Sarr',
    ipAddress: '197.220.12.89',
    severity: 'CRITICAL'
  }
];
