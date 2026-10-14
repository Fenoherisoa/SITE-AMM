import type { Employee, Department, Position } from '../types'

/**
 * Retourne le nom complet d'un employé RH de manière fiable
 * en priorisant 'anarana', puis la combinaison 'prenom nom', ou 'Nom non renseigné'.
 */
export const getEmployeeFullName = (employee: Employee | null | undefined): string => {
  if (!employee) return 'Matricule non assigné'
  
  if (employee.anarana && employee.anarana.trim()) {
    return employee.anarana.trim()
  }

  const parts = [employee.prenom, employee.nom].filter(Boolean).map(s => String(s).trim())
  if (parts.length > 0 && parts.join(' ').trim()) {
    return parts.join(' ').trim()
  }

  return 'Nom non renseigné'
}

/**
 * Retourne le matricule officiel de l'employé
 */
export const getEmployeeMatricule = (employee: Employee | null | undefined): string => {
  if (!employee) return '—'
  return employee.matricule || employee.employeeId || employee.id || '—'
}

/**
 * Recherche exacte ou normalisée d'un employé par son matricule ou identifiant unique
 */
export const findEmployeeByMatricule = (
  employees: Employee[],
  matriculeQuery: string
): Employee | null => {
  if (!matriculeQuery || !matriculeQuery.trim()) return null
  const query = matriculeQuery.trim().toLowerCase()

  // 1. Recherche exacte prioritaire sur matricule, employeeId ou id
  const exact = employees.find((emp) => {
    const mat = (emp.matricule || '').trim().toLowerCase()
    const empId = (emp.employeeId || '').trim().toLowerCase()
    const id = (emp.id || '').trim().toLowerCase()
    return mat === query || empId === query || id === query
  })
  if (exact) return exact

  // 2. Recherche avec tolérance de préfixe (ex: "RH-00001" vs "AMM-RH-00001" ou numéro pur)
  const queryDigits = query.replace(/\D/g, '')
  if (queryDigits.length >= 3) {
    const matchedByDigits = employees.filter((emp) => {
      const matDigits = (emp.matricule || '').replace(/\D/g, '')
      const idDigits = (emp.employeeId || emp.id || '').replace(/\D/g, '')
      return matDigits === queryDigits || idDigits === queryDigits
    })
    if (matchedByDigits.length === 1) {
      return matchedByDigits[0]
    }
  }

  return null
}

/**
 * Vérifie si un employé est actif et autorisé
 */
export const isEmployeeActive = (employee: Employee | null | undefined): boolean => {
  if (!employee) return false
  return employee.status === 'Active'
}

/**
 * Résolution du libellé de département
 */
export const resolveDepartmentName = (
  departmentId: string | undefined,
  departments: Department[]
): string => {
  if (!departmentId) return 'Non assigné'
  const dept = departments.find((d) => d.id === departmentId)
  return dept?.name || 'Département inconnu'
}

/**
 * Résolution du libellé de poste
 */
export const resolvePositionName = (
  positionId: string | undefined,
  positions: Position[]
): string => {
  if (!positionId) return 'Non assigné'
  const pos = positions.find((p) => p.id === positionId)
  return pos?.name || 'Poste non renseigné'
}
