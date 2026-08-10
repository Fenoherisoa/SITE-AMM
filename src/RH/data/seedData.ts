import { push, ref, set } from 'firebase/database'
import { db } from '../firebase/firebaseConfig'

export const seedInitialData = async () => {
  const departmentsRef = ref(db, 'departments')
  const positionsRef = ref(db, 'positions')

  const departments = [
    { name: 'Direction', description: 'Direction générale' },
    { name: 'RH', description: 'Ressources humaines' },
    { name: 'Comptabilité', description: 'Finance et paie' },
    { name: 'Opérations', description: 'Opérations' },
  ]

  const positions = [
    { name: 'Directeur', description: 'Direction' },
    { name: 'Responsable RH', description: 'Gestion RH' },
    { name: 'Comptable', description: 'Gestion paie' },
    { name: 'Coordinateur', description: 'Support opérationnel' },
  ]

  const existingDepartments = await Promise.all(departments.map((department) => {
    const newRef = push(departmentsRef)
    return set(newRef, department)
  }))
  const existingPositions = await Promise.all(positions.map((position) => {
    const newRef = push(positionsRef)
    return set(newRef, position)
  }))

  return { existingDepartments, existingPositions }
}
