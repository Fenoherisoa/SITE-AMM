import { useAuth } from '../contexts/AuthContext'

export const useRoleAccess = () => {
  const { isAdmin, isRh, isComptable, isDirecteur } = useAuth()

  return {
    canManageEmployees: isAdmin || isRh,
    canManagePayroll: isAdmin || isComptable || isDirecteur,
    canManageUsers: isAdmin || isRh,
    canViewAttendance: isAdmin || isRh || isDirecteur,
    canManageLeaves: isAdmin || isRh || isDirecteur,
  }
}
