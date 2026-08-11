import { Account, JournalEntry, FixedAsset, CompanyConfig, JournalInfo } from '../types/accounting';

export const JOURNAL_TYPES: JournalInfo[] = [
  {
    code: 'VT',
    label: 'Journal des Ventes',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Factures clients, avoirs et prestations réalisées',
  },
  {
    code: 'AC',
    label: 'Journal des Achats',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Achats marchandises, sous-traitance et frais généraux',
  },
  {
    code: 'BQ',
    label: 'Journal de Banque',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Mouvements bancaires, virements, encaissements et règlements',
  },
  {
    code: 'CA',
    label: 'Journal de Caisse',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Recettes et dépenses en espèces',
  },
  {
    code: 'OD',
    label: 'Opérations Diverses',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Paie, TVA, amortissements et régularisations',
  },
  {
    code: 'AN',
    label: 'À-Nouveau (Bilan Initial)',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'Solde d\'ouverture de l\'exercice comptable',
  },
];

export const INITIAL_COMPANY_CONFIG: CompanyConfig = {
  name: 'SITE-AMM SARL',
  legalForm: 'Société à Responsabilité Limitée',
  taxId: 'NIF-9847201938-A',
  rccm: 'RCCM-2024-B-84920',
  address: '128 Boulevard du 13 Janvier, Immeuble AMM',
  phone: '+228 90 12 34 56',
  email: 'comptabilite@site-amm.com',
  currency: 'FCFA',
  currencySymbol: 'FCFA',
  fiscalYear: '2026',
  fiscalYearStart: '2026-01-01',
  fiscalYearEnd: '2026-12-31',
  vatRate: 18,
  isClosed: false,
};

export const INITIAL_ACCOUNTS: Account[] = [
  // Class 1
  { code: '1010', label: 'Capital social souscrit', classCode: 1, category: 'CAPITAUX', normalBalance: 'CREDIT', active: true, isSystem: true },
  { code: '1110', label: 'Report à nouveau créditeur', classCode: 1, category: 'CAPITAUX', normalBalance: 'CREDIT', active: true, isSystem: true },
  { code: '1310', label: 'Résultat net de l\'exercice (Bénéfice)', classCode: 1, category: 'CAPITAUX', normalBalance: 'CREDIT', active: true, isSystem: true },
  { code: '1620', label: 'Emprunts auprès des établissements de crédit', classCode: 1, category: 'CAPITAUX', normalBalance: 'CREDIT', active: true, isSystem: true },

  // Class 2
  { code: '2110', label: 'Terrains nus', classCode: 2, category: 'IMMOBILISATIONS', normalBalance: 'DEBIT', active: true },
  { code: '2130', label: 'Bâtiments administratifs et commerciaux', classCode: 2, category: 'IMMOBILISATIONS', normalBalance: 'DEBIT', active: true },
  { code: '2410', label: 'Matériel et outillage industriel', classCode: 2, category: 'IMMOBILISATIONS', normalBalance: 'DEBIT', active: true },
  { code: '2440', label: 'Matériel de bureau et informatique', classCode: 2, category: 'IMMOBILISATIONS', normalBalance: 'DEBIT', active: true },
  { code: '2450', label: 'Matériel de transport (Véhicules)', classCode: 2, category: 'IMMOBILISATIONS', normalBalance: 'DEBIT', active: true },
  { code: '2844', label: 'Amortissement du matériel de bureau', classCode: 2, category: 'IMMOBILISATIONS', normalBalance: 'CREDIT', active: true },
  { code: '2845', label: 'Amortissement du matériel de transport', classCode: 2, category: 'IMMOBILISATIONS', normalBalance: 'CREDIT', active: true },

  // Class 3
  { code: '3110', label: 'Stocks de marchandises', classCode: 3, category: 'STOCKS', normalBalance: 'DEBIT', active: true },
  { code: '3210', label: 'Matières premières et fournitures', classCode: 3, category: 'STOCKS', normalBalance: 'DEBIT', active: true },

  // Class 4
  { code: '4011', label: 'Fournisseurs - Achats de biens et services', classCode: 4, category: 'TIERS_FOURNISSEURS', normalBalance: 'CREDIT', active: true, isSystem: true },
  { code: '4081', label: 'Fournisseurs - Factures non parvenues', classCode: 4, category: 'TIERS_FOURNISSEURS', normalBalance: 'CREDIT', active: true },
  { code: '4111', label: 'Clients - Ventes de biens et services', classCode: 4, category: 'TIERS_CLIENTS', normalBalance: 'DEBIT', active: true, isSystem: true },
  { code: '4210', label: 'Personnel - Rémunérations dues', classCode: 4, category: 'TIERS_ETAT_PERSONNEL', normalBalance: 'CREDIT', active: true },
  { code: '4310', label: 'Sécurité Sociale (CNSS / Caisse Retraite)', classCode: 4, category: 'TIERS_ETAT_PERSONNEL', normalBalance: 'CREDIT', active: true },
  { code: '4431', label: 'État - TVA facturée sur ventes (18%)', classCode: 4, category: 'TIERS_ETAT_PERSONNEL', normalBalance: 'CREDIT', active: true, isSystem: true },
  { code: '4452', label: 'État - TVA déductible sur achats (18%)', classCode: 4, category: 'TIERS_ETAT_PERSONNEL', normalBalance: 'DEBIT', active: true, isSystem: true },
  { code: '4453', label: 'État - TVA déductible sur immobilisations', classCode: 4, category: 'TIERS_ETAT_PERSONNEL', normalBalance: 'DEBIT', active: true },
  { code: '4440', label: 'État - Impôts sur les sociétés (IS)', classCode: 4, category: 'TIERS_ETAT_PERSONNEL', normalBalance: 'CREDIT', active: true },

  // Class 5
  { code: '5211', label: 'Banque Principale (BCP)', classCode: 5, category: 'TRESORERIE_BANQUE', normalBalance: 'DEBIT', active: true, isSystem: true },
  { code: '5212', label: 'Banque Secondaire (Ecobank)', classCode: 5, category: 'TRESORERIE_BANQUE', normalBalance: 'DEBIT', active: true },
  { code: '5711', label: 'Caisse Principale Siège', classCode: 5, category: 'TRESORERIE_CAISSE', normalBalance: 'DEBIT', active: true, isSystem: true },

  // Class 6
  { code: '6011', label: 'Achats de marchandises', classCode: 6, category: 'CHARGES_EXPLOITATION', normalBalance: 'DEBIT', active: true },
  { code: '6051', label: 'Fournitures de bureau non stockables', classCode: 6, category: 'CHARGES_EXPLOITATION', normalBalance: 'DEBIT', active: true },
  { code: '6052', label: 'Énergie, eau et électricité', classCode: 6, category: 'CHARGES_EXPLOITATION', normalBalance: 'DEBIT', active: true },
  { code: '6130', label: 'Locations et charges locatives', classCode: 6, category: 'CHARGES_EXPLOITATION', normalBalance: 'DEBIT', active: true },
  { code: '6220', label: 'Honoraires d\'experts & conseils', classCode: 6, category: 'CHARGES_EXPLOITATION', normalBalance: 'DEBIT', active: true },
  { code: '6240', label: 'Frais de transport et déplacements', classCode: 6, category: 'CHARGES_EXPLOITATION', normalBalance: 'DEBIT', active: true },
  { code: '6260', label: 'Frais de télécommunication & Internet', classCode: 6, category: 'CHARGES_EXPLOITATION', normalBalance: 'DEBIT', active: true },
  { code: '6310', label: 'Impôts, taxes et versements assimilés', classCode: 6, category: 'CHARGES_EXPLOITATION', normalBalance: 'DEBIT', active: true },
  { code: '6410', label: 'Salaires et traitements du personnel', classCode: 6, category: 'CHARGES_EXPLOITATION', normalBalance: 'DEBIT', active: true },
  { code: '6450', label: 'Charges sociales patronales', classCode: 6, category: 'CHARGES_EXPLOITATION', normalBalance: 'DEBIT', active: true },
  { code: '6610', label: 'Charges d\'intérêts bancaires', classCode: 6, category: 'CHARGES_FINANCIERES', normalBalance: 'DEBIT', active: true },
  { code: '6813', label: 'Dotations aux amortissements des immob.', classCode: 6, category: 'CHARGES_EXPLOITATION', normalBalance: 'DEBIT', active: true },

  // Class 7
  { code: '7011', label: 'Ventes de marchandises', classCode: 7, category: 'PRODUITS_EXPLOITATION', normalBalance: 'CREDIT', active: true },
  { code: '7061', label: 'Prestations de services informatiques & conseils', classCode: 7, category: 'PRODUITS_EXPLOITATION', normalBalance: 'CREDIT', active: true },
  { code: '7080', label: 'Produits des activités annexes', classCode: 7, category: 'PRODUITS_EXPLOITATION', normalBalance: 'CREDIT', active: true },
  { code: '7710', label: 'Intérêts et produits financiers', classCode: 7, category: 'PRODUITS_FINANCIERS', normalBalance: 'CREDIT', active: true },
];

export const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: 'entry-an-1',
    pieceNumber: 'AN-2026-001',
    date: '2026-01-01',
    journalCode: 'AN',
    label: 'Bilan d\'ouverture Exercice 2026 - Reprise des soldes',
    reference: 'PV Assemblée Générale',
    isPosted: true,
    createdAt: '2026-01-01T08:00:00Z',
    lines: [
      { id: 'l1', accountCode: '1010', accountLabel: 'Capital social souscrit', debit: 0, credit: 25000000, memo: 'Capital libéré' },
      { id: 'l2', accountCode: '1620', accountLabel: 'Emprunts auprès des établissements de crédit', debit: 0, credit: 10000000, memo: 'Prêt BCP' },
      { id: 'l3', accountCode: '2130', accountLabel: 'Bâtiments administratifs et commerciaux', debit: 18000000, credit: 0, memo: 'Immeuble Siège' },
      { id: 'l4', accountCode: '2440', accountLabel: 'Matériel de bureau et informatique', debit: 4500000, credit: 0, memo: 'Serveurs & PC' },
      { id: 'l5', accountCode: '2450', accountLabel: 'Matériel de transport (Véhicules)', debit: 8000000, credit: 0, memo: 'Pick-up Pick-up' },
      { id: 'l6', accountCode: '2844', accountLabel: 'Amortissement du matériel de bureau', debit: 0, credit: 1500000, memo: 'Cumul amort. 2025' },
      { id: 'l7', accountCode: '5211', accountLabel: 'Banque Principale (BCP)', debit: 14000000, credit: 0, memo: 'Solde Banque' },
      { id: 'l8', accountCode: '5711', accountLabel: 'Caisse Principale Siège', debit: 2000000, credit: 0, memo: 'Solde Caisse' },
    ],
  },
  {
    id: 'entry-vt-1',
    pieceNumber: 'FAC-2026-001',
    date: '2026-01-10',
    journalCode: 'VT',
    label: 'Facture Vente Prestation de Service Client SOGEDI',
    reference: 'Devis D-2026-88',
    isPosted: true,
    createdAt: '2026-01-10T10:15:00Z',
    lines: [
      { id: 'l10', accountCode: '4111', accountLabel: 'Clients - Ventes de biens et services', debit: 5900000, credit: 0, thirdPartyName: 'SOGEDI SA', memo: 'Net à payer' },
      { id: 'l11', accountCode: '7061', accountLabel: 'Prestations de services informatiques & conseils', debit: 0, credit: 5000000, memo: 'Audit SI & Réseaux' },
      { id: 'l12', accountCode: '4431', accountLabel: 'État - TVA facturée sur ventes (18%)', debit: 0, credit: 900000, memo: 'TVA 18%' },
    ],
  },
  {
    id: 'entry-ac-1',
    pieceNumber: 'ACH-2026-012',
    date: '2026-01-15',
    journalCode: 'AC',
    label: 'Achat Fournitures & Licences Logiciels - Fournisseur TECH-PLUS',
    reference: 'FAC-TECH-991',
    isPosted: true,
    createdAt: '2026-01-15T14:30:00Z',
    lines: [
      { id: 'l20', accountCode: '6051', accountLabel: 'Fournitures de bureau non stockables', debit: 1500000, credit: 0, memo: 'Licences Cloud' },
      { id: 'l21', accountCode: '4452', accountLabel: 'État - TVA déductible sur achats (18%)', debit: 270000, credit: 0, memo: 'TVA déductible' },
      { id: 'l22', accountCode: '4011', accountLabel: 'Fournisseurs - Achats de biens et services', debit: 0, credit: 1770000, thirdPartyName: 'TECH-PLUS SARL', memo: 'Facture à payer' },
    ],
  },
  {
    id: 'entry-bq-1',
    pieceNumber: 'REG-2026-005',
    date: '2026-01-20',
    journalCode: 'BQ',
    label: 'Encaissement règlement Client SOGEDI par Virement BCP',
    reference: 'VIR-BCP-9812',
    isPosted: true,
    createdAt: '2026-01-20T11:00:00Z',
    lines: [
      { id: 'l30', accountCode: '5211', accountLabel: 'Banque Principale (BCP)', debit: 5900000, credit: 0, memo: 'Règlement Facture FAC-2026-001' },
      { id: 'l31', accountCode: '4111', accountLabel: 'Clients - Ventes de biens et services', debit: 0, credit: 5900000, thirdPartyName: 'SOGEDI SA', memo: 'Solde compte SOGEDI' },
    ],
  },
  {
    id: 'entry-od-1',
    pieceNumber: 'PAIE-2026-01',
    date: '2026-01-31',
    journalCode: 'OD',
    label: 'Comptabilisation de la Paie du Personnel - Mois de Janvier 2026',
    reference: 'Livre de Paie 01/2026',
    isPosted: true,
    createdAt: '2026-01-31T17:00:00Z',
    lines: [
      { id: 'l40', accountCode: '6410', accountLabel: 'Salaires et traitements du personnel', debit: 4200000, credit: 0, memo: 'Salaires bruts' },
      { id: 'l41', accountCode: '6450', accountLabel: 'Charges sociales patronales', debit: 840000, credit: 0, memo: 'CNSS Part Patronale' },
      { id: 'l42', accountCode: '4210', accountLabel: 'Personnel - Rémunérations dues', debit: 0, credit: 3500000, memo: 'Net à payer personnel' },
      { id: 'l43', accountCode: '4310', accountLabel: 'Sécurité Sociale (CNSS / Caisse Retraite)', debit: 0, credit: 1540000, memo: 'Cotisations CNSS dues' },
    ],
  },
  {
    id: 'entry-bq-2',
    pieceNumber: 'REG-2026-009',
    date: '2026-02-02',
    journalCode: 'BQ',
    label: 'Paiement des Salaires de Janvier 2026 par Virement Bancaire Groupé',
    reference: 'ORDRE-VIR-0012',
    isPosted: true,
    createdAt: '2026-02-02T09:30:00Z',
    lines: [
      { id: 'l50', accountCode: '4210', accountLabel: 'Personnel - Rémunérations dues', debit: 3500000, credit: 0, memo: 'Virement des net à payer' },
      { id: 'l51', accountCode: '5211', accountLabel: 'Banque Principale (BCP)', debit: 0, credit: 3500000, memo: 'Débit compte BCP' },
    ],
  },
  {
    id: 'entry-vt-2',
    pieceNumber: 'FAC-2026-002',
    date: '2026-02-10',
    journalCode: 'VT',
    label: 'Vente de Marchandises & Équipements Client WAP-TRADING',
    reference: 'BC-2026-44',
    isPosted: true,
    createdAt: '2026-02-10T15:20:00Z',
    lines: [
      { id: 'l60', accountCode: '4111', accountLabel: 'Clients - Ventes de biens et services', debit: 9440000, credit: 0, thirdPartyName: 'WAP-TRADING', memo: 'Facture FAC-2026-002' },
      { id: 'l61', accountCode: '7011', accountLabel: 'Ventes de marchandises', debit: 0, credit: 8000000, memo: 'Vente équipements' },
      { id: 'l62', accountCode: '4431', accountLabel: 'État - TVA facturée sur ventes (18%)', debit: 0, credit: 1440000, memo: 'TVA 18%' },
    ],
  },
];

export const INITIAL_FIXED_ASSETS: FixedAsset[] = [
  {
    id: 'asset-1',
    code: 'IMM-2024-001',
    name: 'Serveurs Dell PowerEdge & Parc informatique Siège',
    category: 'Matériel Informatique',
    acquisitionDate: '2024-01-15',
    acquisitionCost: 4500000,
    salvageValue: 0,
    lifespanYears: 3,
    accountAssetCode: '2440',
    accountDepreciationCode: '2844',
    accountExpenseCode: '6813',
    depreciationMethod: 'LINEAR',
  },
  {
    id: 'asset-2',
    code: 'IMM-2025-002',
    name: 'Véhicule de Fonction Pick-up Hilux',
    category: 'Matériel de Transport',
    acquisitionDate: '2025-06-01',
    acquisitionCost: 15000000,
    salvageValue: 2000000,
    lifespanYears: 5,
    accountAssetCode: '2450',
    accountDepreciationCode: '2845',
    accountExpenseCode: '6813',
    depreciationMethod: 'LINEAR',
  },
];
