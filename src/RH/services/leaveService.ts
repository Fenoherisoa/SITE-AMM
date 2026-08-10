import { get, push, ref, set, update } from 'firebase/database'
import { db } from '../firebase/firebaseConfig'
import type { LeaveRequest } from '../types'

const leaveRef = () => ref(db, 'leave_requests')

export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
  const snapshot = await get(leaveRef())
  if (!snapshot.exists()) return []
  const values = snapshot.val() as Record<string, LeaveRequest>
  return Object.entries(values).map(([id, value]) => ({ ...value, id }))
}

export const addLeaveRequest = async (request: Omit<LeaveRequest, 'id'>) => {
  const newRef = push(leaveRef())
  await set(newRef, request)
  return newRef.key
}

export const updateLeaveRequest = async (id: string, request: Partial<LeaveRequest>) => {
  await update(ref(db, `leave_requests/${id}`), request)
}
