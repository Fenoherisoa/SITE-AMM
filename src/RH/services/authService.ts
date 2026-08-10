import { get, push, ref, remove, set, update } from 'firebase/database'
import { db } from '../firebase/firebaseConfig'
import type { AppUser, Role } from '../types'

const getUserRef = (uid: string) => ref(db, `users/${uid}`)
const getUsersRef = () => ref(db, 'users')

const getFriendlyAuthError = (errorCode: string) => {
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou mot de passe incorrect'
    case 'auth/invalid-email':
      return 'Adresse email invalide'
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Veuillez réessayer plus tard'
    default:
      return 'Erreur Firebase connexion'
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const snapshot = await get(getUsersRef())
    if (!snapshot.exists()) {
      return { user: null, error: 'Aucun utilisateur trouvé dans la base RTDB' }
    }

    const values = snapshot.val() as Record<string, Partial<AppUser>>
    const matchedEntry = Object.entries(values).find(([, data]) => {
      const normalizedEmail = (data.email ?? '').toLowerCase()
      return normalizedEmail === email.toLowerCase() && String(data.password ?? '') === password
    })

    if (!matchedEntry) {
      return { user: null, error: 'Email ou mot de passe incorrect' }
    }

    const [uid, data] = matchedEntry
    const user: AppUser = {
      ...(data as AppUser),
      uid,
      username: data.username ?? data.name ?? (data.email ?? '').split('@')[0],
      name: data.name ?? data.username ?? (data.email ?? '').split('@')[0],
      email: data.email ?? '',
      role: (data.role as Role) ?? 'RH',
      permissions: data.permissions ?? {},
      status: data.status ?? 'active',
      createdAt: data.createdAt ?? new Date().toISOString(),
    }

    return { user, error: null as string | null }
  } catch (error: unknown) {
    const message = error instanceof Error ? getFriendlyAuthError((error as { code?: string }).code ?? '') : 'Erreur Firebase connexion'
    if (import.meta.env.DEV) {
      console.error('[auth] failure', error)
    }
    return { user: null, error: message }
  }
}

export const getCurrentUserProfile = async (uid: string): Promise<AppUser | null> => {
  const snapshot = await get(getUserRef(uid))
  if (!snapshot.exists()) return null

  const data = snapshot.val() as Partial<AppUser> | null
  return data ? { ...(data as AppUser), uid, email: data.email ?? '' } as AppUser : null
}

export const registerUser = async (email: string, password: string, role: Role, name: string) => {
  try {
    const newRef = push(getUsersRef())
    const permissions = {
      overview: true,
      members: role === 'RH' || role === 'Super Admin' || role === 'ADMIN',
      operations: role === 'RH' || role === 'Super Admin' || role === 'ADMIN',
      calendar: role === 'RH' || role === 'Super Admin' || role === 'ADMIN',
      accounting: role === 'Comptable' || role === 'Super Admin' || role === 'ADMIN',
      security: role === 'Super Admin' || role === 'ADMIN',
      parametre: role === 'RH' || role === 'Super Admin' || role === 'ADMIN',
      adhesion: true,
      enquetes: true,
      historique: true,
      historiquetrans: true,
      messenger: true,
    }

    const profile: AppUser = {
      uid: newRef.key ?? `user-${Date.now()}`,
      username: name.trim().toLowerCase().replace(/\s+/g, '.'),
      email,
      role,
      name,
      permissions,
      password,
      status: 'active',
      createdAt: new Date().toISOString(),
    }

    await set(newRef, profile)
    return { user: profile, error: null as string | null }
  } catch (error: unknown) {
    const message = error instanceof Error ? getFriendlyAuthError((error as { code?: string }).code ?? '') : 'Erreur Firebase connexion'
    if (import.meta.env.DEV) {
      console.error('[auth] register failure', error)
    }
    return { user: null, error: message }
  }
}

export const getAllUserProfiles = async (): Promise<AppUser[]> => {
  const snapshot = await get(getUsersRef())
  if (!snapshot.exists()) return []
  const values = snapshot.val() as Record<string, Partial<AppUser>>
  return Object.entries(values).map(([uid, data]) => ({ ...(data as AppUser), uid, email: (data as AppUser).email ?? '' }))
}

export const updateUserProfile = async (uid: string, updates: Partial<AppUser>) => {
  await update(getUserRef(uid), updates)
}

export const deleteUserProfile = async (uid: string) => {
  await remove(getUserRef(uid))
}

export const signOut = async () => {
  return null
}
