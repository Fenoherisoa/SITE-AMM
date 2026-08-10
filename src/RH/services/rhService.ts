import { get, ref, set, update } from 'firebase/database'
import { db } from '../firebase/firebaseConfig'
import type { RHRecord } from '../types'

const rhRef = () => ref(db, 'RH')

const getNextRhNumber = async () => {
  const snapshot = await get(rhRef())
  if (!snapshot.exists()) return 1

  const values = snapshot.val() as Record<string, RHRecord>
  const ids = Object.keys(values)
    .filter((key) => /^RH-\d{3}$/.test(key))
    .map((key) => Number.parseInt(key.split('-')[1], 10))

  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

export const getRHRecords = async (): Promise<RHRecord[]> => {
  const snapshot = await get(rhRef())
  if (!snapshot.exists()) return []

  const values = snapshot.val() as Record<string, RHRecord>
  return Object.entries(values)
    .filter(([, value]) => value.status !== 'inactive')
    .map(([id, value]) => ({ ...value, id }))
}

export const createRHRecord = async (payload: Omit<RHRecord, 'id' | 'matricule' | 'submitted_at' | 'status'>) => {
  const nextNumber = await getNextRhNumber()
  const id = `RH-${String(nextNumber).padStart(3, '0')}`
  const matricule = `AMM-RH-${String(nextNumber).padStart(5, '0')}`
  const record: RHRecord = {
    ...payload,
    id,
    matricule,
    submitted_at: new Date().toISOString(),
    status: 'active',
  }

  await set(ref(db, `RH/${id}`), record)
  return record
}

export const updateRHRecord = async (id: string, payload: Partial<RHRecord>) => {
  await update(ref(db, `RH/${id}`), payload)
}

export const deleteRHRecord = async (id: string) => {
  await update(ref(db, `RH/${id}`), { status: 'inactive' })
}
