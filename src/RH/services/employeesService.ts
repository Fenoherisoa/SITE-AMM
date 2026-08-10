import { get, push, ref, remove, set, update } from 'firebase/database'
import { db } from '../firebase/firebaseConfig'
import { ensureEmployeeAccount } from './accountingService'
import type { Department, Employee, Position } from '../types'

const employeesRef = () => ref(db, 'employees')
const departmentsRef = () => ref(db, 'departments')
const positionsRef = () => ref(db, 'positions')
const membersRef = () => ref(db, 'olona')

const parseList = <T>(snapshot: Awaited<ReturnType<typeof get>>, keyName = 'id'): T[] => {
  if (!snapshot.exists()) return []
  const values = snapshot.val() as Record<string, T>
  return Object.entries(values).map(([id, value]) => ({ ...(value as object), [keyName]: id } as T))
}

const createRhId = async () => {
  const snapshot = await get(employeesRef())
  const values = snapshot.exists() ? (snapshot.val() as Record<string, unknown>) : {}
  const ids = Object.keys(values)
  const parsed = ids
    .map((id) => id.match(/^RH-(\d+)$/i)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

  const next = parsed.length > 0 ? Math.max(...parsed) + 1 : 1
  return `RH-${String(next).padStart(5, '0')}`
}

const createMatricule = async (rhId: string) => {
  const suffix = rhId.replace(/^RH-/, '')
  return `AMM-RH-${suffix}`
}

export const getEmployees = async (): Promise<Employee[]> => {
  const snapshot = await get(employeesRef())
  return parseList<Employee>(snapshot)
}

export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  const snapshot = await get(ref(db, `employees/${id}`))
  if (!snapshot.exists()) return null
  return { ...(snapshot.val() as Employee), id } as Employee
}

export const addEmployee = async (employee: Omit<Employee, 'id'> & { id?: string }) => {
  const id = employee.id ?? employee.employeeId ?? (await createRhId())
  const matricule = employee.matricule ?? (await createMatricule(id))
  const payload = {
    ...employee,
    id,
    employeeId: id,
    matricule,
    submitted_at: employee.submitted_at ?? new Date().toISOString(),
  }
  await set(ref(db, `employees/${id}`), payload)
  await ensureEmployeeAccount(matricule)
  return id
}

export const updateEmployee = async (id: string, employee: Partial<Employee>) => {
  await update(ref(db, `employees/${id}`), employee)
}

export const deleteEmployee = async (id: string) => {
  await remove(ref(db, `employees/${id}`))
}

export const getMembers = async () => {
  const snapshot = await get(membersRef())
  if (!snapshot.exists()) return []
  const values = snapshot.val() as Record<string, Record<string, unknown>>
  return Object.entries(values).map(([id, value]) => ({ id, ...value }))
}

export const getDepartments = async (): Promise<Department[]> => {
  const snapshot = await get(departmentsRef())
  return parseList<Department>(snapshot)
}

export const addDepartment = async (department: Omit<Department, 'id'>) => {
  const newRef = push(departmentsRef())
  await set(newRef, department)
  return newRef.key
}

export const updateDepartment = async (id: string, department: Partial<Department>) => {
  await update(ref(db, `departments/${id}`), department)
}

export const deleteDepartment = async (id: string) => {
  await remove(ref(db, `departments/${id}`))
}

export const getPositions = async (): Promise<Position[]> => {
  const snapshot = await get(positionsRef())
  return parseList<Position>(snapshot)
}

export const addPosition = async (position: Omit<Position, 'id'>) => {
  const newRef = push(positionsRef())
  await set(newRef, position)
  return newRef.key
}

export const updatePosition = async (id: string, position: Partial<Position>) => {
  await update(ref(db, `positions/${id}`), position)
}

export const deletePosition = async (id: string) => {
  await remove(ref(db, `positions/${id}`))
}
