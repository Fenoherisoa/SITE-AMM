import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import type { Role } from '../types'

interface ProtectedRouteProps {
  requiredRole?: Role[]
  requiredPermissions?: string[]
}

const normalizeRole = (role?: string) => role?.toLowerCase().replace(/\s+/g, '')

export const ProtectedRoute = ({ requiredRole, requiredPermissions }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">Chargement...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredPermissions?.length === 1 && requiredPermissions.includes('apropos')) {
    return <Outlet />
  }

  if (requiredRole && !requiredRole.some((role) => normalizeRole(role) === normalizeRole(user.role))) {
    // Ovay ho any amin'ny pejy tsy miteraka loop na asio hafatra tsotra
    return <div className="p-8 text-center text-red-600 font-bold">Tsy manana alalana hiditra eto ianao (Rôle tsy ampy).</div>
  }
  

  if (requiredPermissions && requiredPermissions.some((permission) => !Boolean(user.permissions?.[permission]))) {
    return <div className="p-8 text-center text-red-600 font-bold">Tsy manana alalana hiditra eto ianao (Permissions tsy ampy).</div>
  }

  return <Outlet />
}