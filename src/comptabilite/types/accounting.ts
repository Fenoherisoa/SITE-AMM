export type AccountClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type AccountCategory =
  | 'CAPITAUX'
  | 'IMMOBILISATIONS'
  | 'STOCKS'
  | 'TIERS_CLIENTS'
  | 'TIERS_FOURNISSEURS'
  | 'TIERS_ETAT_PERSONNEL'
  | 'TRESORERIE_BANQUE'
  | 'TRESORERIE_CAISSE'
  | 'CHARGES_EXPLOITATION'
  | 'CHARGES_FINANCIERES'
  | 'PRODUITS_EXPLOITATION'
  | 'PRODUITS_FINANCIERS'
  | 'HORS_ACTIVITE';

export interface Account {
  code: string;
  label: string;
  classCode: AccountClass;
  category: AccountCategory;
  normalBalance: 'DEBIT' | 'CREDIT';
  description?: string;
  isSystem?: boolean;
  active: boolean;
}

export type JournalCode = 'VT' | 'AC' | 'BQ' | 'CA' | 'OD' | 'AN';

export interface JournalInfo {
  code: JournalCode;
  label: string;
  color: string;
  description: string;
}

export interface EntryLine {
  id: string;
  accountCode: string;
  accountLabel: string;
  debit: number;
  credit: number;
  memo?: string;
  thirdPartyName?: string;
}

export interface JournalEntry {
  id: string;
  pieceNumber: string;
  date: string; // YYYY-MM-DD
  journalCode: JournalCode;
  label: string;
  reference?: string; // e.g., Facture N° FAC-2026-001
  lines: EntryLine[];
  isPosted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  category: string;
  acquisitionDate: string;
  acquisitionCost: number;
  salvageValue: number;
  lifespanYears: number;
  accountAssetCode: string; // e.g., 2410
  accountDepreciationCode: string; // e.g., 2841
  accountExpenseCode: string; // e.g., 6813
  depreciationMethod: 'LINEAR' | 'DEGRESSIVE';
}

export interface AssetDepreciationSchedule {
  year: number;
  baseAmount: number;
  annuity: number;
  accumulated: number;
  netBookValue: number;
  isPosted?: boolean;
}

export interface BankTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive = credit to bank, negative = debit from bank
  reference?: string;
  matchedEntryId?: string;
  isMatched: boolean;
}

export interface CompanyConfig {
  name: string;
  legalForm: string;
  taxId: string; // NIF
  rccm: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  currencySymbol: string;
  fiscalYear: string; // e.g. "2026"
  fiscalYearStart: string; // YYYY-MM-DD
  fiscalYearEnd: string; // YYYY-MM-DD
  vatRate: number; // e.g., 18 or 20 (%)
  isClosed: boolean;
}

export interface TrialBalanceRow {
  accountCode: string;
  accountLabel: string;
  accountClass: AccountClass;
  initialDebit: number;
  initialCredit: number;
  periodDebit: number;
  periodCredit: number;
  totalDebit: number;
  totalCredit: number;
  endingDebit: number;
  endingCredit: number;
}

export interface VatSummary {
  vatCollected: number; // TVA Facturée (Comptes 443 / 4457)
  vatDeductible: number; // TVA Déductible (Comptes 445 / 4456)
  netVatPayable: number; // TVA à Payer
  vatCredit: number; // Crédit de TVA
  salesTaxableBase: number;
  purchasesTaxableBase: number;
}
