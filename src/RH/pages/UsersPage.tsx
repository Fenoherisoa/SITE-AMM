import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { deleteUserProfile, getAllUserProfiles, registerUser, updateUserProfile } from '../services/authService'
import type { AppUser, Role } from '../types'

export const UsersPage = () => {
  const { user, isAdmin, isRh } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [editingUid, setEditingUid] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('RH')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [createRole, setCreateRole] = useState<Role>('RH')
  const [message, setMessage] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const loadUsers = async () => {
    setUsers(await getAllUserProfiles())
  }

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsCreating(true)
    setMessage('')

    const { user: createdUser, error } = await registerUser(email, password, createRole, name)
    if (createdUser) {
      setName('')
      setEmail('')
      setPassword('')
      setCreateRole('RH')
      setMessage('Compte créé avec succès.')
      await loadUsers()
    } else {
      setMessage(error ?? 'Impossible de créer le compte.')
    }

    setIsCreating(false)
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const handleSave = async (uid: string) => {
    await updateUserProfile(uid, { role })
    setEditingUid(null)
    await loadUsers()
  }

  const handleDelete = async (uid: string) => {
    await deleteUserProfile(uid)
    await loadUsers()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Utilisateurs</p>
        <h2 className="mt-2 text-3xl font-semibold">Gestion des comptes RH</h2>
      </div>
      {(isAdmin || isRh) ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-lg font-semibold">Créer un compte RH</h3>
          <p className="mt-1 text-sm text-slate-400">Ouverture de compte réservée aux administrateurs RH.</p>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleCreateUser}>
            <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Nom complet" value={name} onChange={(event) => setName(event.target.value)} required />
            <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Mot de passe" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={createRole} onChange={(event) => setCreateRole(event.target.value as Role)}>
              <option value="RH">RH</option>
              <option value="Comptable">Comptable</option>
              <option value="Directeur">Directeur</option>
              <option value="Super Admin">Super Admin</option>
            </select>
            <div className="md:col-span-2">
              <button className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950" type="submit" disabled={isCreating}>
                {isCreating ? 'Création…' : 'Créer le compte'}
              </button>
              {message ? <span className="ml-3 text-sm text-emerald-400">{message}</span> : null}
            </div>
          </form>
        </div>
      ) : null}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-3 text-sm text-slate-400">Connecté en tant que {user?.name ?? user?.email ?? 'utilisateur'} • {user?.role}</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-3 py-3">Nom</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Rôle</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.uid} className="border-b border-slate-800/70">
                  <td className="px-3 py-3">{user.name ?? '—'}</td>
                  <td className="px-3 py-3">{user.email ?? '—'}</td>
                  <td className="px-3 py-3">
                    {editingUid === user.uid ? (
                      <div className="flex items-center gap-2">
                        <select className="rounded border border-slate-700 bg-slate-950 px-2 py-1" value={role} onChange={(event) => setRole(event.target.value as Role)}>
                          <option value="RH">RH</option>
                          <option value="Comptable">Comptable</option>
                          <option value="Directeur">Directeur</option>
                          <option value="Super Admin">Super Admin</option>
                        </select>
                        <button className="rounded bg-cyan-500 px-2 py-1 text-sm text-slate-950" onClick={() => void handleSave(user.uid)}>Enregistrer</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{user.role}</span>
                        <button className="rounded bg-cyan-500/20 px-2 py-1 text-cyan-300" onClick={() => { setEditingUid(user.uid); setRole(user.role) }}>Modifier</button>
                        <button className="rounded bg-rose-500/20 px-2 py-1 text-rose-300" onClick={() => void handleDelete(user.uid)}>Supprimer</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
