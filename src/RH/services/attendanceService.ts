import { get, push, ref, set } from 'firebase/database'
import { db } from '../firebase/firebaseConfig'
import type { AttendanceRecord } from '../types'

const attendanceRef = () => ref(db, 'attendance')

export const getAttendance = async (): Promise<AttendanceRecord[]> => {
  const snapshot = await get(attendanceRef())
  if (!snapshot.exists()) return []
  const values = snapshot.val() as Record<string, AttendanceRecord>
  return Object.entries(values).map(([id, value]) => ({ ...value, id }))
}

export const addAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'>) => {
  const newRef = push(attendanceRef())
  await set(newRef, record)
  return newRef.key
}
