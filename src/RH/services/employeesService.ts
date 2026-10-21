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

export const stripUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  if (!obj || typeof obj !== 'object') return obj
  const clean: Record<string, any> = {}
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        clean[key] = stripUndefined(val)
      } else {
        clean[key] = val
      }
    }
  }
  return clean as Partial<T>
}

export const getEmployees = async (): Promise<Employee[]> => {
  const snapshot = await get(employeesRef())
  return parseList<Employee>(snapshot)
}

export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  if (!id) return null
  const snapshot = await get(ref(db, `employees/${id}`))
  if (!snapshot.exists()) return null
  const data = snapshot.val() as Record<string, any>
  return { 
    ...data, 
    id,
    status: String(data.status || 'Active').toLowerCase() === 'inactive' ? 'Inactive' : 'Active'
  } as Employee
}

export const addEmployee = async (employee: Omit<Employee, 'id'> & { id?: string }) => {
  if (!employee.anarana && !employee.nom) {
    throw new Error("Le nom de l'employé est obligatoire.")
  }
  const id = employee.id ?? employee.employeeId ?? (await createRhId())
  const matricule = employee.matricule ?? (await createMatricule(id))

  const normalizedStatus: 'Active' | 'Inactive' =
    String(employee.status || '').trim().toLowerCase() === 'inactive' ? 'Inactive' : 'Active'

  const payload = stripUndefined({
    ...employee,
    id,
    employeeId: id,
    matricule,
    status: normalizedStatus,
    submitted_at: employee.submitted_at ?? new Date().toISOString(),
  })

  await set(ref(db, `employees/${id}`), payload)
  await ensureEmployeeAccount(matricule)
  return id
}

export const updateEmployee = async (id: string, employee: Partial<Employee>) => {
  if (!id) {
    throw new Error("L'identifiant de l'employé est manquant.")
  }

  // Retrieve existing employee to preserve untouched fields and guaranteed valid status
  const snapshot = await get(ref(db, `employees/${id}`))
  const existing = snapshot.exists() ? (snapshot.val() as Employee) : null

  let normalizedStatus: 'Active' | 'Inactive' = 'Active'
  if (employee.status !== undefined && employee.status !== null) {
    normalizedStatus = String(employee.status).trim().toLowerCase() === 'inactive' ? 'Inactive' : 'Active'
  } else if (existing?.status) {
    normalizedStatus = String(existing.status).trim().toLowerCase() === 'inactive' ? 'Inactive' : 'Active'
  }

  const cleanPayload = stripUndefined({
    ...employee,
    status: normalizedStatus,
    updated_at: new Date().toISOString(),
  })

  await update(ref(db, `employees/${id}`), cleanPayload)
}

export const deleteEmployee = async (id: string) => {
  if (!id) return
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
  const clean = stripUndefined(department as Record<string, any>)
  await set(newRef, clean)
  return newRef.key
}

export const updateDepartment = async (id: string, department: Partial<Department>) => {
  if (!id) return
  const clean = stripUndefined(department as Record<string, any>)
  await update(ref(db, `departments/${id}`), clean)
}

export const deleteDepartment = async (id: string) => {
  if (!id) return
  await remove(ref(db, `departments/${id}`))
}

export const getPositions = async (): Promise<Position[]> => {
  const snapshot = await get(positionsRef())
  return parseList<Position>(snapshot)
}

export const addPosition = async (position: Omit<Position, 'id'>) => {
  const newRef = push(positionsRef())
  const clean = stripUndefined(position as Record<string, any>)
  await set(newRef, clean)
  return newRef.key
}

export const updatePosition = async (id: string, position: Partial<Position>) => {
  if (!id) return
  const clean = stripUndefined(position as Record<string, any>)
  await update(ref(db, `positions/${id}`), clean)
}

export const deletePosition = async (id: string) => {
  if (!id) return
  await remove(ref(db, `positions/${id}`))
}
