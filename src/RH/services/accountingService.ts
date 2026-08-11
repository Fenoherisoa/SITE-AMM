import { get, ref, set } from 'firebase/database'
import { db } from '../firebase/firebaseConfig'
import type { AccountingTransaction, EmployeeAccount } from '../types'

const transactionsRef = () => ref(db, 'comptabilite')

export const getEmployeeAccountByMatricule = async (matricule: string): Promise<EmployeeAccount | null> => {
  const snapshot = await get(ref(db, `comptes/${matricule}`))
  if (!snapshot.exists()) return null
  return snapshot.val() as EmployeeAccount
}

export const ensureEmployeeAccount = async (matricule: string): Promise<EmployeeAccount> => {
  const snapshot = await get(ref(db, `comptes/${matricule}`))
  if (snapshot.exists()) return snapshot.val() as EmployeeAccount

  const account: EmployeeAccount = {
    matricule,
    solde: 0,
    solde_credit: 0,
    solde_debit: 0,
  }
  await set(ref(db, `comptes/${matricule}`), account)
  return account
}

export const getTransactionsByMatricule = async (matricule: string): Promise<AccountingTransaction[]> => {
  const snapshot = await get(transactionsRef())
  if (!snapshot.exists()) return []

  const values = snapshot.val() as Record<string, AccountingTransaction>
  return Object.values(values)
    .filter((item) => item.matricule === matricule)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export const addTransaction = async (transaction: Omit<AccountingTransaction, 'id' | 'date' | 'customId'>) => {
  const customId = `ID-AMM-ENC-${Date.now().toString().slice(-6)}`
  const payload: AccountingTransaction = {
    ...transaction,
    customId,
    date: new Date().toISOString(),
  }

  const accountRef = ref(db, `comptes/${payload.matricule}`)
  const accountSnapshot = await get(accountRef)
  const currentAccount = (accountSnapshot.exists() ? accountSnapshot.val() : { solde: 0, solde_credit: 0, solde_debit: 0 }) as EmployeeAccount

  const nextAccount: EmployeeAccount = {
    ...currentAccount,
    matricule: payload.matricule,
    solde: payload.karazana === 'MIDITRA' ? currentAccount.solde + payload.vola : currentAccount.solde - payload.vola,
    solde_credit: payload.karazana === 'MIDITRA' ? currentAccount.solde_credit + payload.vola : currentAccount.solde_credit,
    solde_debit: payload.karazana === 'FIVOAHANA' ? currentAccount.solde_debit + payload.vola : currentAccount.solde_debit,
  }

  await set(ref(db, `comptabilite/${customId}`), payload)
  await set(accountRef, nextAccount)
  return payload
}

// Ao amin'ny src/RH/services/accountingService.ts
export const getTransactions = async () => {
  // Ampio eto ny fakana ny data raha misy API na mbola mampiasa localStorage
  const saved = localStorage.getItem('pcg_accounting_journal')
  return saved ? JSON.parse(saved) : []
}

export const saveTransactions = async (transactions: any[]) => {
  localStorage.setItem('pcg_accounting_journal', JSON.stringify(transactions))
}
