import { get, push, ref, remove, set, update } from 'firebase/database'
import { db } from '../firebase/firebaseConfig'
import type { PayrollEntry, PayrollBudget } from '../types'

const payrollRef = () => ref(db, 'payroll')
const budgetRef = (period: string) => ref(db, `payroll_budget/${period.replace(/[^a-zA-Z0-9_-]/g, '_')}`)

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

export const updatePayrollEntry = async (id: string, updates: Partial<PayrollEntry>) => {
  await update(ref(db, `payroll/${id}`), updates)
}

export const deletePayrollEntry = async (id: string) => {
  await remove(ref(db, `payroll/${id}`))
}

export const getPayrollBudget = async (period: string): Promise<PayrollBudget | null> => {
  try {
    const snapshot = await get(budgetRef(period))
    if (!snapshot.exists()) return null
    return { ...snapshot.val(), period } as PayrollBudget
  } catch (error) {
    console.error('Error fetching payroll budget:', error)
    return null
  }
}

export const savePayrollBudget = async (budget: PayrollBudget): Promise<void> => {
  try {
    await set(budgetRef(budget.period), {
      allocatedAmount: budget.allocatedAmount,
      alertThresholdPercent: budget.alertThresholdPercent ?? 85,
      notes: budget.notes ?? '',
      departmentAllocations: budget.departmentAllocations ?? {},
      updatedAt: new Date().toISOString(),
      updatedBy: budget.updatedBy ?? 'Admin',
    })
  } catch (error) {
    console.error('Error saving payroll budget:', error)
    throw error
  }
}

