import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { deleteUserProfile, getAllUserProfiles, registerUser, updateUserProfile } from '../services/authService'
import { getEmployees } from '../services/employeesService'
import type { AppUser, Employee, Role } from '../types'

export const UsersPage = () => {
  const { user, isAdmin, isRh } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  
  const [editingUid, setEditingUid] = useState<string | null>(null)
  const [role, setRole] = useState<Role>('RH')
  
  // Fandraketana kaonty vaovao
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [matriculeInput, setMatriculeInput] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false) // <--- Fanaraha-maso ny maso kely
  const [createRole, setCreateRole] = useState<Role>('RH')
  const [isProvisoire, setIsProvisoire] = useState(false)
  
  const [message, setMessage] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    try {
      const [usersData, empData] = await Promise.all([
        getAllUserProfiles(),
        getEmployees()
      ])
      setUsers(usersData || [])
      setEmployees(empData || [])
    } catch (error) {
      console.error("Erreur chargement données:", error)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Fonction mpanampy: Maka ny anarana avy amin'ny employé raha misy matricule
  const getEmployeeNameByMatricule = (matricule?: string) => {
    if (!matricule) return null
    const found = employees.find(e => (e.matricule || '').toLowerCase() === matricule.trim().toLowerCase())
    if (found) {
      return found.anarana || `${found.prenom ?? ''} ${found.nom ?? ''}`.trim()
    }
    return null
  }

  // Rehefa misafidy mpiasa ao anaty lisitra dropdown
  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeId(empId)
    if (!empId) {
      setName('')
      setMatriculeInput('')
      return
    }
    const emp = employees.find(e => e.id === empId)
    if (emp) {
      const fullName = emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`.trim()
      setName(fullName)
      setMatriculeInput(emp.matricule || '')
      if (emp.email) setEmail(emp.email)
    }
  }

  // Rehefa soratana mivantana ny Matricule dia mitady ny anarana mifanaraka aminy ho fanamarinana
  const handleMatriculeChange = (matValue: string) => {
    setMatriculeInput(matValue)
    const trimmedMat = matValue.trim().toLowerCase()
    
    if (!trimmedMat) {
      setName('')
      setSelectedEmployeeId('')
      return
    }

    const matchedEmp = employees.find(e => (e.matricule || '').toLowerCase() === trimmedMat)
    if (matchedEmp) {
      const fullName = matchedEmp.anarana || `${matchedEmp.prenom ?? ''} ${matchedEmp.nom ?? ''}`.trim()
      setName(fullName)
      setSelectedEmployeeId(matchedEmp.id)
      if (matchedEmp.email) setEmail(matchedEmp.email)
    } else {
      setName('Matricule tsy hita ao amin\'ny lisitry ny mpiasa')
      setSelectedEmployeeId('')
    }
  }

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsCreating(true)
    setMessage('')

    const finalName = isProvisoire ? `${name} (RH PROVISOIRE)` : ''
    const finalRole = isProvisoire ? 'RH' : createRole
    const finalMatricule = isProvisoire ? undefined : matriculeInput.trim()

    const { user: createdUser, error } = await registerUser(email, password, finalRole, finalName, finalMatricule)
    
    if (createdUser) {
      setName('')
      setEmail('')
      setPassword('')
      setMatriculeInput('')
      setSelectedEmployeeId('')
      setCreateRole('RH')
      setIsProvisoire(false)
      setMessage(isProvisoire ? 'Compte RH provisoire créé avec succès.' : 'Compte créé avec succès et lié au matricule.')
      await loadData()
    } else {
      setMessage(error ?? 'Impossible de créer le compte.')
    }

    setIsCreating(false)
  }

  const handleSave = async (uid: string) => {
    await updateUserProfile(uid, { role })
    setEditingUid(null)
    await loadData()
  }

  const handleDelete = async (uid: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return
    await deleteUserProfile(uid)
    await loadData()
  }

  const filteredUsers = users.filter((u) => {
    const query = searchTerm.toLowerCase()
    const userMatricule = (u as any).matricule || ''
    const linkedName = getEmployeeNameByMatricule(userMatricule) || ''
    const userName = (u.name || linkedName).toLowerCase()
    const userEmail = (u.email || '').toLowerCase()
    
    return userName.includes(query) || userEmail.includes(query) || userMatricule.toLowerCase().includes(query)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Utilisateurs</p>
          <h2 className="mt-2 text-3xl font-semibold">Gestion des comptes & Liaison par Matricule</h2>
        </div>
      </div>

      {(isAdmin || isRh) ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold text-amber-300">Créer un compte lié à un Matricule ou RH Provisoire</h3>
              <p className="mt-0.5 text-xs text-slate-400">Saisissez ou sélectionnez un matricule pour vérifier automatiquement le nom de l'employé.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs text-amber-300">
              <input 
                type="checkbox" 
                checked={isProvisoire} 
                onChange={(e) => {
                  setIsProvisoire(e.target.checked)
                  setName('')
                  setMatriculeInput('')
                  setSelectedEmployeeId('')
                }}
                className="rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0"
              />
              Mode RH Provisoire Libre
            </label>
          </div>

          <form className="grid gap-4 md:grid-cols-2 pt-2" onSubmit={handleCreateUser}>
            {!isProvisoire && (
              <>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Sélectionner par Matricule (Liste des employés)</label>
                  <select 
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                    value={selectedEmployeeId}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                  >
                    <option value="">-- Choisir un employé --</option>
                    {employees.map((emp) => {
                      const fullName = emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`
                      const mat = emp.matricule ? `[${emp.matricule}]` : '[Sans mat]'
                      return (
                        <option key={emp.id} value={emp.id}>
                          {mat} {fullName} {emp.poste ? `- ${emp.poste}` : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-400">Ou saisir directement le Matricule</label>
                  <input 
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 uppercase" 
                    placeholder="Ex: MAT001" 
                    value={matriculeInput} 
                    onChange={(event) => handleMatriculeChange(event.target.value)} 
                  />
                </div>
              </>
            )}

            <div className={isProvisoire ? "md:col-span-2" : ""}>
              <label className="mb-1 block text-xs text-slate-400">
                {isProvisoire ? "Nom complet du RH Provisoire" : "Nom complet (Fananamarinana fotsiny - avy amin'ny Matricule)"}
              </label>
              <input 
                className={`w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm ${!isProvisoire ? 'text-cyan-300 bg-slate-900/50 cursor-not-allowed' : 'text-slate-200'}`} 
                placeholder={isProvisoire ? "Nom et Prénom" : "Ny anaran'ny mpiasa dia hiseho eto ho fanamarinana"} 
                value={name} 
                onChange={(event) => {
                  if (isProvisoire) setName(event.target.value)
                }} 
                readOnly={!isProvisoire}
                required 
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Adresse Email de connexion</label>
              <input 
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" 
                placeholder="email@domaine.mg" 
                type="email" 
                value={email} 
                onChange={(event) => setEmail(event.target.value)} 
                required 
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Mot de passe temporaire</label>
              <div className="relative">
                <input 
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pr-10 text-sm text-slate-200" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(event) => setPassword(event.target.value)} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 focus:outline-none"
                  title={showPassword ? "Afina ny tenimiafina" : "Seho ny tenimiafina"}
                >
                  {showPassword ? (
                    // Icon maso misokatra (Hide)
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    // Icon maso mihidy (Show)
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Rôle attribué</label>
              <select 
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200" 
                value={isProvisoire ? 'RH' : createRole} 
                onChange={(event) => setCreateRole(event.target.value as Role)}
                disabled={isProvisoire}
              >
                <option value="RH">RH {isProvisoire ? '(Forcé Provisoire)' : ''}</option>
                <option value="COMPTABLE">COMPTABLE</option>
                <option value="DIRECTEUR">DIRECTEUR</option>
                <option value="SUPER ADMIN">SUPER ADMIN</option>
                <option value="GESTIONAIRE">GESTIONAIRE</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition" type="submit" disabled={isCreating}>
                {isCreating ? 'Création en cours…' : (isProvisoire ? 'Créer le RH Provisoire' : 'Créer et lier le compte')}
              </button>
              {message ? <span className="text-sm font-medium text-emerald-400">{message}</span> : null}
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Liste des utilisateurs enregistrés</h3>
            <p className="text-xs text-slate-400">Connecté en tant que <span className="text-cyan-400 font-medium">{user?.name ?? user?.email ?? 'utilisateur'}</span></p>
          </div>

          <div className="w-full sm:w-72">
            <input 
              type="text" 
              placeholder="Rechercher par nom, email, matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
            />
          </div>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3">Matricule / Nom</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Rôle Actuel</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500 text-sm">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const userMatricule = (u as any).matricule
                  const employeeName = getEmployeeNameByMatricule(userMatricule)
                  const displayName = employeeName || u.name || '—'

                  return (
                    <tr key={u.uid} className="hover:bg-slate-950/40 transition">
                      <td className="px-3 py-3 font-medium text-slate-200">
                        {userMatricule ? <span className="font-mono text-cyan-400 text-xs mr-2">[{userMatricule}]</span> : null}
                        {displayName}
                      </td>
                      <td className="px-3 py-3 text-slate-400 text-xs font-mono">{u.email ?? '—'}</td>
                      <td className="px-3 py-3">
                        {editingUid === u.uid ? (
                          <div className="flex items-center gap-2">
                            <select className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200" value={role} onChange={(event) => setRole(event.target.value as Role)}>
                              <option value="COMPTABLE">COMPTABLE</option>
                              <option value="DIRECTEUR">DIRECTEUR</option>
                              <option value="SUPER ADMIN">SUPER ADMIN</option>
                              <option value="GESTIONAIRE">GESTIONAIRE</option>
                            </select>
                            <button className="rounded bg-cyan-500 px-2.5 py-1 text-xs font-medium text-slate-950" onClick={() => void handleSave(u.uid)}>Enregistrer</button>
                          </div>
                        ) : (
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === 'Super Admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : u.role === 'RH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {editingUid !== u.uid && (
                          <div className="flex items-center justify-end gap-2">
                            <button className="rounded bg-cyan-500/20 px-2.5 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-500/30 transition" onClick={() => { setEditingUid(u.uid); setRole(u.role) }}>Modifier</button>
                            <button className="rounded bg-rose-500/20 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/30 transition" onClick={() => void handleDelete(u.uid)}>Supprimer</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}