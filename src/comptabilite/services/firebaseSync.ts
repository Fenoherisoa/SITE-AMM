import { ref, onValue, set, push, remove, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { Account, JournalEntry, FixedAsset, CompanyConfig } from '../types/accounting';
import { INITIAL_ACCOUNTS, INITIAL_ENTRIES, INITIAL_FIXED_ASSETS, INITIAL_COMPANY_CONFIG } from '../data/defaultData';

const BASE_PATH = 'comptabilite_site_amm';

export interface AccountingData {
  accounts: Account[];
  entries: JournalEntry[];
  assets: FixedAsset[];
  companyConfig: CompanyConfig;
}

export class FirebaseSyncService {
  private static isInitialized = false;

  public static subscribeToData(
    onDataChange: (data: AccountingData) => void,
    onError?: (err: Error) => void
  ) {
    try {
      const rootRef = ref(db, BASE_PATH);

      const unsubscribe = onValue(
        rootRef,
        async (snapshot) => {
          if (!snapshot.exists()) {
            // First time setup - seed default data
            console.log('[FirebaseSync] No existing accounting data found. Seeding initial SYSCOHADA dataset...');
            const initialData: AccountingData = {
              accounts: INITIAL_ACCOUNTS,
              entries: INITIAL_ENTRIES,
              assets: INITIAL_FIXED_ASSETS,
              companyConfig: INITIAL_COMPANY_CONFIG,
            };
            await set(rootRef, initialData);
            onDataChange(initialData);
          } else {
            const rawVal = snapshot.val();
            
            // Format accounts array
            const accountsList: Account[] = rawVal.accounts
              ? Object.values(rawVal.accounts)
              : INITIAL_ACCOUNTS;

            // Format entries array
            const entriesList: JournalEntry[] = rawVal.entries
              ? Object.values(rawVal.entries)
              : [];

            // Format assets array
            const assetsList: FixedAsset[] = rawVal.assets
              ? Object.values(rawVal.assets)
              : [];

            // Format company config
            const config: CompanyConfig = rawVal.companyConfig || INITIAL_COMPANY_CONFIG;

            // Sort entries chronologically (most recent first)
            entriesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            onDataChange({
              accounts: accountsList,
              entries: entriesList,
              assets: assetsList,
              companyConfig: config,
            });
          }
        },
        (error) => {
          console.error('[FirebaseSync] Listener error:', error);
          if (onError) onError(error);
        }
      );

      return unsubscribe;
    } catch (err) {
      console.error('[FirebaseSync] Exception in subscribeToData:', err);
      if (onError) onError(err as Error);
      return () => {};
    }
  }

  public static async addOrUpdateEntry(entry: JournalEntry): Promise<void> {
    try {
      const entryRef = ref(db, `${BASE_PATH}/entries/${entry.id}`);
      await set(entryRef, entry);
    } catch (err) {
      console.error('[FirebaseSync] Error adding entry:', err);
      throw err;
    }
  }

  public static async deleteEntry(entryId: string): Promise<void> {
    try {
      const entryRef = ref(db, `${BASE_PATH}/entries/${entryId}`);
      await remove(entryRef);
    } catch (err) {
      console.error('[FirebaseSync] Error deleting entry:', err);
      throw err;
    }
  }

  public static async saveAccounts(accounts: Account[]): Promise<void> {
    try {
      const accountsRef = ref(db, `${BASE_PATH}/accounts`);
      // Convert array to object keyed by code for easy Firebase access
      const accountsObj: Record<string, Account> = {};
      accounts.forEach((acc) => {
        accountsObj[acc.code] = acc;
      });
      await set(accountsRef, accountsObj);
    } catch (err) {
      console.error('[FirebaseSync] Error saving accounts:', err);
      throw err;
    }
  }

  public static async saveAssets(assets: FixedAsset[]): Promise<void> {
    try {
      const assetsRef = ref(db, `${BASE_PATH}/assets`);
      const assetsObj: Record<string, FixedAsset> = {};
      assets.forEach((ast) => {
        assetsObj[ast.id] = ast;
      });
      await set(assetsRef, assetsObj);
    } catch (err) {
      console.error('[FirebaseSync] Error saving assets:', err);
      throw err;
    }
  }

  public static async saveCompanyConfig(config: CompanyConfig): Promise<void> {
    try {
      const configRef = ref(db, `${BASE_PATH}/companyConfig`);
      await set(configRef, config);
    } catch (err) {
      console.error('[FirebaseSync] Error saving company config:', err);
      throw err;
    }
  }

  public static async resetToDefaultSeed(): Promise<void> {
    try {
      const rootRef = ref(db, BASE_PATH);
      const initialData: AccountingData = {
        accounts: INITIAL_ACCOUNTS,
        entries: INITIAL_ENTRIES,
        assets: INITIAL_FIXED_ASSETS,
        companyConfig: INITIAL_COMPANY_CONFIG,
      };

      const accountsObj: Record<string, Account> = {};
      INITIAL_ACCOUNTS.forEach((a) => (accountsObj[a.code] = a));

      const entriesObj: Record<string, JournalEntry> = {};
      INITIAL_ENTRIES.forEach((e) => (entriesObj[e.id] = e));

      const assetsObj: Record<string, FixedAsset> = {};
      INITIAL_FIXED_ASSETS.forEach((a) => (assetsObj[a.id] = a));

      await set(rootRef, {
        accounts: accountsObj,
        entries: entriesObj,
        assets: assetsObj,
        companyConfig: INITIAL_COMPANY_CONFIG,
      });
    } catch (err) {
      console.error('[FirebaseSync] Error resetting data:', err);
      throw err;
    }
  }
}
