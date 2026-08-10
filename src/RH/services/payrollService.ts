import { get, push, ref, set } from 'firebase/database'
import { db } from '../firebase/firebaseConfig'
import type { PayrollEntry } from '../types'

const payrollRef = () => ref(db, 'payroll')

export const getPayroll = async (): Promise<PayrollEntry[]> => {
  const snapshot = await get(payrollRef())
  if (!snapshot.exists()) return []
  const values = snapshot.val() as Record<string, PayrollEntry>
  return Object.entries(values).map(([id, value]) => ({ ...value, id }))
}

export const addPayrollEntry = async (entry: Omit<PayrollEntry, 'id'>) => {
  const newRef = push(payrollRef())
  await set(newRef, entry)
  return newRef.key
}
