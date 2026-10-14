import { get, push, ref, remove, set, update } from 'firebase/database'
import { db } from '../firebase/firebaseConfig'
import type { AttendanceRecord, Employee } from '../types'
import { getEmployeeFullName, getEmployeeMatricule } from '../utils/employeeUtils'

const attendanceRef = () => ref(db, 'attendance')

/**
 * Récupère tous les enregistrements de pointage
 */
export const getAttendance = async (): Promise<AttendanceRecord[]> => {
  try {
    const snapshot = await get(attendanceRef())
    if (!snapshot.exists()) return []
    const values = snapshot.val() as Record<string, AttendanceRecord>
    return Object.entries(values).map(([id, value]) => ({ ...value, id }))
  } catch (error) {
    console.error('Erreur getAttendance:', error)
    return []
  }
}

/**
 * Récupère les pointages d'une date donnée
 */
export const getAttendanceByDate = async (date: string): Promise<AttendanceRecord[]> => {
  const all = await getAttendance()
  return all.filter((rec) => rec.date === date)
}

/**
 * Recherche si un pointage existe déjà pour un employé à une date précise
 */
export const findExistingAttendance = async (
  employeeId: string,
  date: string
): Promise<AttendanceRecord | null> => {
  const records = await getAttendance()
  const found = records.find(
    (rec) => rec.employeeId === employeeId && rec.date === date
  )
  return found || null
}

/**
 * Enregistrement ou mise à jour contrôlée pour éviter les doublons
 */
export const saveAttendanceRecord = async (
  record: Omit<AttendanceRecord, 'id'> & { id?: string },
  allowDuplicate = false
): Promise<{ id: string; isUpdate: boolean }> => {
  // 1. Si un ID précis est fourni, on met à jour
  if (record.id) {
    const recordRef = ref(db, `attendance/${record.id}`)
    const payload = {
      ...record,
      updatedAt: new Date().toISOString(),
    }
    await update(recordRef, payload)
    return { id: record.id, isUpdate: true }
  }

  // 2. Vérification d'unicité (Empêcher les doublons pour le même employé à la même date)
  if (!allowDuplicate) {
    const existing = await findExistingAttendance(record.employeeId, record.date)
    if (existing) {
      const recordRef = ref(db, `attendance/${existing.id}`)
      const payload = {
        ...existing,
        ...record,
        updatedAt: new Date().toISOString(),
      }
      await update(recordRef, payload)
      return { id: existing.id, isUpdate: true }
    }
  }

  // 3. Nouveau pointage
  const newRef = push(attendanceRef())
  const payload = {
    ...record,
    createdAt: record.createdAt || new Date().toISOString(),
  }
  await set(newRef, payload)
  return { id: newRef.key as string, isUpdate: false }
}

/**
 * Rétro-compatibilité pour l'ancien addAttendanceRecord
 */
export const addAttendanceRecord = async (record: Omit<AttendanceRecord, 'id'>) => {
  const res = await saveAttendanceRecord(record, false)
  return res.id
}

/**
 * Mise à jour ciblée d'un pointage
 */
export const updateAttendanceRecord = async (
  id: string,
  updates: Partial<AttendanceRecord>
): Promise<void> => {
  const recordRef = ref(db, `attendance/${id}`)
  await update(recordRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

/**
 * Suppression contrôlée d'un pointage
 */
export const deleteAttendanceRecord = async (id: string): Promise<void> => {
  const recordRef = ref(db, `attendance/${id}`)
  await remove(recordRef)
}

/**
 * Structure de résultat d'audit des présences
 */
export interface AttendanceAnomaly {
  record: AttendanceRecord
  type: 'ORPHAN_EMPLOYEE' | 'DUPLICATE_ENTRY' | 'INACTIVE_EMPLOYEE' | 'MATRICULE_MISMATCH'
  message: string
  suggestedFix?: string
}

/**
 * Audit de cohérence des données de présence existantes
 */
export const auditAttendanceData = (
  attendanceList: AttendanceRecord[],
  employees: Employee[]
): AttendanceAnomaly[] => {
  const anomalies: AttendanceAnomaly[] = []
  const employeeMap = new Map<string, Employee>()
  employees.forEach((emp) => {
    employeeMap.set(emp.id, emp)
    if (emp.employeeId) employeeMap.set(emp.employeeId, emp)
  })

  // Suivi pour détection des doublons : clé = employeeId_date
  const seenKeyCount = new Map<string, number>()
  attendanceList.forEach((rec) => {
    const key = `${rec.employeeId}_${rec.date}`
    seenKeyCount.set(key, (seenKeyCount.get(key) || 0) + 1)
  })

  attendanceList.forEach((rec) => {
    const emp = employeeMap.get(rec.employeeId)

    // 1. Employé introuvable dans la base RH
    if (!emp) {
      anomalies.push({
        record: rec,
        type: 'ORPHAN_EMPLOYEE',
        message: `Pointage du ${rec.date} lié à l'ID inconnu "${rec.employeeId}". Aucun membre RH correspondant.`,
        suggestedFix: 'Réassigner ce pointage au matricule du membre approprié.',
      })
      return
    }

    // 2. Doublon de présence pour un même membre à la même date
    const key = `${rec.employeeId}_${rec.date}`
    if ((seenKeyCount.get(key) || 0) > 1) {
      anomalies.push({
        record: rec,
        type: 'DUPLICATE_ENTRY',
        message: `Pointage en double pour ${getEmployeeFullName(emp)} (${getEmployeeMatricule(emp)}) le ${rec.date}.`,
        suggestedFix: 'Conserver l’enregistrement le plus récent et supprimer le doublon obsolète.',
      })
    }

    // 3. Présence enregistrée pour un employé inactif
    if (emp.status === 'Inactive') {
      anomalies.push({
        record: rec,
        type: 'INACTIVE_EMPLOYEE',
        message: `Pointage enregistré pour ${getEmployeeFullName(emp)} alors que le statut RH actuel est "Inactif".`,
        suggestedFix: 'Vérifier si le membre était en activité à cette date ou réactiver son statut RH.',
      })
    }

    // 4. Incohérence de matricule
    if (rec.matricule && emp.matricule && rec.matricule.trim() !== emp.matricule.trim()) {
      anomalies.push({
        record: rec,
        type: 'MATRICULE_MISMATCH',
        message: `Matricule enregistré sur la fiche ("${rec.matricule}") diffère du matricule officiel de l'employé ("${emp.matricule}").`,
        suggestedFix: 'Synchroniser le matricule de la fiche avec la base RH.',
      })
    }
  })

  return anomalies
}
