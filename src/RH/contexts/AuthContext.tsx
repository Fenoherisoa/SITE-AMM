import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { signIn as signInWithRtdb, signOut as signOutUser } from '../services/authService'
import type { AppUser } from '../types'

interface AuthContextValue {
  user: AppUser | null
  currentUser: AppUser | null
  loading: boolean
  isAuthenticated: boolean
  permissions: Record<string, boolean>
  role: string | null
  signIn: (email: string, password: string) => Promise<{ user: AppUser | null; error: string | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isRh: boolean
  isComptable: boolean
  isDirecteur: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const storageKey = 'amm-rh-current-user'

const normalizeRole = (role?: string) => role?.toLowerCase().replace(/\s+/g, '')

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as AppUser
        setUser(parsed)
      }
    } catch {
      window.localStorage.removeItem(storageKey)
    } finally {
      setLoading(false)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const result = await signInWithRtdb(email, password)
    if (result.user) {
      setUser(result.user)
      window.localStorage.setItem(storageKey, JSON.stringify(result.user))
    } else {
      setUser(null)
      window.localStorage.removeItem(storageKey)
    }
    setLoading(false)
    return result
  }

  const signOut = async () => {
    await signOutUser()
    setUser(null)
    window.localStorage.removeItem(storageKey)
  }

  const value = useMemo(
    () => ({
      user,
      currentUser: user,
      loading,
      isAuthenticated: Boolean(user),
      permissions: user?.permissions ?? {},
      role: user?.role ?? null,
      signIn,
      signOut,
      isAdmin: normalizeRole(user?.role) === 'admin' || normalizeRole(user?.role) === 'superadmin',
      isRh: normalizeRole(user?.role) === 'rh' || normalizeRole(user?.role) === 'admin' || normalizeRole(user?.role) === 'superadmin',
      isComptable: normalizeRole(user?.role) === 'comptable' || normalizeRole(user?.role) === 'admin' || normalizeRole(user?.role) === 'superadmin',
      isDirecteur: normalizeRole(user?.role) === 'directeur' || normalizeRole(user?.role) === 'admin' || normalizeRole(user?.role) === 'superadmin',
    }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
