import { onValue, ref } from 'firebase/database'
import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../firebase/firebaseConfig'
import madagascarData from '../data/madagascarData'
import { getEmployeeAccountByMatricule } from '../services/accountingService'
import { addEmployee, deleteEmployee, getMembers, updateEmployee } from '../services/employeesService'
import type { Department, Employee, EmployeeAccount, Position } from '../types'

type EmployeeForm = {
  employeeId: string
  matricule: string
  anarana: string
  cin: string
  telephone: string
  email: string
  departmentId: string
  positionId: string
  salaryBase: number
  status: 'Active' | 'Inactive'
  isMember: boolean
  memberId: string
  province: string
  region: string
  district: string
  commune: string
  fokontany: string
  dateNaissance: string
  genre: string
  emailNotification: string
}

type MemberOption = {
  id: string
  anarana?: string
  nom?: string
  prenom?: string
}

const emptyEmployee: EmployeeForm = {
  employeeId: '',
  matricule: '',
  anarana: '',
  cin: '',
  telephone: '',
  email: '',
  departmentId: '',
  positionId: '',
  salaryBase: 0,
  status: 'Active',
  isMember: false,
  memberId: '',
  province: '',
  region: '',
  district: '',
  commune: '',
  fokontany: '',
  dateNaissance: '',
  genre: 'LAHY',
  emailNotification: '',
}

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [members, setMembers] = useState<MemberOption[]>([])
  const [search, setSearch] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [form, setForm] = useState<EmployeeForm>(emptyEmployee)
  const [account, setAccount] = useState<EmployeeAccount | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    const memberData = await getMembers()
    setMembers(memberData)
  }

  useEffect(() => {
    const employeesUnsubscribe = onValue(ref(db, 'employees'), (snapshot) => {
      const values = snapshot.val() as Record<string, unknown> | null
      const nextEmployees = values
        ? Object.entries(values).map(([id, value]) => ({ ...(value as Record<string, unknown>), id } as Employee))
        : []
      setEmployees(nextEmployees)
      setLoading(false)
    })

    const departmentsUnsubscribe = onValue(ref(db, 'departments'), (snapshot) => {
      const values = snapshot.val() as Record<string, unknown> | null
      const nextDepartments = values
        ? Object.entries(values).map(([id, value]) => ({ ...(value as Record<string, unknown>), id } as Department))
        : []
      setDepartments(nextDepartments)
    })

    const positionsUnsubscribe = onValue(ref(db, 'positions'), (snapshot) => {
      const values = snapshot.val() as Record<string, unknown> | null
      const nextPositions = values
        ? Object.entries(values).map(([id, value]) => ({ ...(value as Record<string, unknown>), id } as Position))
        : []
      setPositions(nextPositions)
    })

    void loadData()

    return () => {
      employeesUnsubscribe()
      departmentsUnsubscribe()
      positionsUnsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadAccount = async () => {
      if (!selectedEmployee?.matricule) {
        if (active) setAccount(null)
        return
      }
      const accountData = await getEmployeeAccountByMatricule(selectedEmployee.matricule)
      if (active) setAccount(accountData)
    }

    void loadAccount()

    return () => {
      active = false
    }
  }, [selectedEmployee])

  const provinceOptions = Object.keys(madagascarData)
  const selectedProvince = form.province ? madagascarData[form.province as keyof typeof madagascarData] : null
  const regionOptions = selectedProvince ? Object.keys(selectedProvince) : []
  const selectedRegion = form.region ? selectedProvince?.[form.region as keyof typeof selectedProvince] ?? null : null
  const districtOptions = selectedRegion ? Object.keys(selectedRegion) : []
  const selectedDistrict = form.district ? selectedRegion?.[form.district as keyof typeof selectedRegion] ?? null : null
  const communeOptions = selectedDistrict ? Object.keys(selectedDistrict) : []
  const tokenizedCommune = Array.isArray(selectedDistrict) ? selectedDistrict : []

  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const fullName = `${employee?.anarana ?? employee?.prenom ?? ''} ${employee?.nom ?? ''}`.trim().toLowerCase()
    const matchesSearch = fullName.includes(search.toLowerCase())
    const matchesDepartment = selectedDepartment ? employee.departmentId === selectedDepartment : true
    return matchesSearch && matchesDepartment
  }), [employees, search, selectedDepartment])

  const handleChange = (field: keyof EmployeeForm, value: string) => {
    setForm((current) => {
      if (field === 'province') {
        return { ...current, province: value, region: '', district: '', commune: '', fokontany: '' }
      }
      if (field === 'region') {
        return { ...current, region: value, district: '', commune: '', fokontany: '' }
      }
      if (field === 'district') {
        return { ...current, district: value, commune: '', fokontany: '' }
      }
      if (field === 'commune') {
        return { ...current, commune: value, fokontany: '' }
      }
      return { ...current, [field]: value }
    })
  }

  const resetForm = () => {
    setSelectedEmployee(null)
    setForm(emptyEmployee)
    setAccount(null)
    setFeedback(null)
  }

  const validateForm = (isEdit: boolean) => {
    const cinPattern = /^\d{12}$/
    const phonePattern = /^[0-9+()\s-]{7,15}$/

    if (!form.anarana.trim()) return 'Le nom (Anarana) est obligatoire.'
    if (form.cin.trim() && !cinPattern.test(form.cin.trim())) return 'Le CIN doit contenir 12 chiffres.'
    if (form.telephone.trim() && !phonePattern.test(form.telephone.trim())) return 'Le téléphone est invalide.'
    if (!form.departmentId) return 'Veuillez sélectionner un département.'
    if (!form.positionId) return 'Veuillez sélectionner un poste.'

    return null
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFeedback(null)

    const isEdit = Boolean(selectedEmployee)
    const validationError = validateForm(isEdit)
    if (validationError) {
      setFeedback(validationError)
      return
    }

    try {
      const normalizedStatus: 'Active' | 'Inactive' =
        String(form.status || '').toLowerCase() === 'inactive' ? 'Inactive' : 'Active'

      if (isEdit && selectedEmployee) {
        const patch: Partial<Employee> = {
          anarana: form.anarana.trim(),
          cin: form.cin.trim(),
          telephone: form.telephone.trim(),
          email: form.email.trim(),
          departmentId: form.departmentId,
          positionId: form.positionId,
          salaryBase: Number(form.salaryBase) || 0,
          status: normalizedStatus,
          isMember: Boolean(form.isMember),
          memberId: form.isMember ? form.memberId || null : null,
          province: form.province || null,
          region: form.region || null,
          district: form.district || null,
          commune: form.commune || null,
          fokontany: form.fokontany || null,
          date_naissance: form.dateNaissance || null,
          email_notification: form.emailNotification || null,
          genre: form.genre || 'LAHY',
        }
        await updateEmployee(selectedEmployee.id, patch)
        setFeedback('Employé mis à jour avec succès.')
        setEmployees((current) => current.map((employee) => employee.id === selectedEmployee.id ? { ...employee, ...patch } : employee))
        setSelectedEmployee({ ...selectedEmployee, ...patch })
      } else {
        const payload = {
          anarana: form.anarana.trim(),
          cin: form.cin.trim(),
          telephone: form.telephone.trim(),
          email: form.email.trim(),
          departmentId: form.departmentId,
          positionId: form.positionId,
          salaryBase: Number(form.salaryBase) || 0,
          status: normalizedStatus,
          isMember: Boolean(form.isMember),
          memberId: form.isMember ? form.memberId || null : null,
          province: form.province,
          region: form.region,
          district: form.district,
          commune: form.commune,
          fokontany: form.fokontany,
          date_naissance: form.dateNaissance,
          email_notification: form.emailNotification,
          genre: form.genre || 'LAHY',
        }
        await addEmployee(payload as Employee)
        setFeedback('Employé créé avec succès.')
        resetForm()
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Une erreur est survenue.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return
    await deleteEmployee(id)
    setEmployees((current) => current.filter((employee) => employee.id !== id))
    if (selectedEmployee?.id === id) resetForm()
  }

  const displayValue = (value?: string | null, fallback = '—') => {
    if (value === undefined || value === null) return fallback
    const normalized = String(value).trim()
    return normalized || fallback
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-300">
        Chargement des employés…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Ressources Humaines</p>
          <h2 className="mt-2 text-3xl font-semibold">Gestion du Personnel & Employés</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Rechercher" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)}>
            <option value="">Tous les départements</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-3 py-3">Nom</th>
                  <th className="px-3 py-3">Poste</th>
                  <th className="px-3 py-3">Département</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-slate-800/70 hover:bg-slate-800/30 transition-colors">
                    <td className="px-3 py-3 font-medium text-slate-200">
                      <div>{displayValue(employee.anarana ?? `${employee.prenom ?? ''} ${employee.nom ?? ''}`.trim())}</div>
                      <div className="text-xs text-slate-500 font-mono">{employee.matricule || employee.id}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{displayValue(positions.find((position) => position.id === employee.positionId)?.name)}</td>
                    <td className="px-3 py-3 text-slate-300">{displayValue(departments.find((dep) => dep.id === employee.departmentId)?.name)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        employee.status === 'Inactive' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {employee.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <Link className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-300 transition-colors" to={`/employees/${employee.id}`}>Détail</Link>
                        <button className="rounded bg-cyan-500/20 hover:bg-cyan-500/30 px-2.5 py-1 text-cyan-300 transition-colors cursor-pointer" onClick={() => {
                          setSelectedEmployee(employee)
                          const validStatus: 'Active' | 'Inactive' =
                            String(employee.status || '').toLowerCase() === 'inactive' ? 'Inactive' : 'Active'
                          setForm({
                            employeeId: employee.employeeId ?? employee.id,
                            matricule: employee.matricule ?? '',
                            anarana: employee.anarana ?? `${employee.prenom ?? ''} ${employee.nom ?? ''}`.trim(),
                            cin: employee.cin ?? '',
                            telephone: employee.telephone ?? '',
                            email: employee.email ?? '',
                            departmentId: employee.departmentId ?? '',
                            positionId: employee.positionId ?? '',
                            salaryBase: Number(employee.salaryBase || 0),
                            status: validStatus,
                            isMember: Boolean(employee.isMember),
                            memberId: employee.memberId ?? '',
                            province: employee.province ?? '',
                            region: employee.region ?? '',
                            district: employee.district ?? '',
                            commune: employee.commune ?? '',
                            fokontany: employee.fokontany ?? '',
                            dateNaissance: employee.date_naissance ?? '',
                            genre: employee.genre ?? 'LAHY',
                            emailNotification: employee.email_notification ?? '',
                          })
                          setFeedback(null)
                        }}>Modifier</button>
                        <button className="rounded bg-rose-500/20 hover:bg-rose-500/30 px-2.5 py-1 text-rose-300 transition-colors cursor-pointer" onClick={() => void handleDelete(employee.id)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xl font-semibold text-white">
                {selectedEmployee ? 'Modifier employé' : 'Ajouter un employé'}
              </h3>
              {selectedEmployee && (
                <p className="text-xs text-cyan-400 mt-0.5">
                  ID: {selectedEmployee.id} • Matricule: {selectedEmployee.matricule || 'En cours'}
                </p>
              )}
            </div>
            {selectedEmployee ? (
              <button className="rounded-lg border border-slate-700 hover:bg-slate-800 px-3 py-1.5 text-xs text-slate-300 transition-colors cursor-pointer" type="button" onClick={resetForm}>
                + Nouvel employé
              </button>
            ) : null}
          </div>

          {feedback ? (
            <p className={`rounded-lg px-3 py-2 text-sm ${
              feedback.includes('succès') || feedback.includes('mis à jour')
                ? 'border border-emerald-700/40 bg-emerald-500/10 text-emerald-300'
                : 'border border-rose-700/40 bg-rose-500/10 text-rose-300'
            }`}>
              {feedback}
            </p>
          ) : null}

          <div className="space-y-4 text-sm">
            {/* Section 1: Identité */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <p className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-cyan-400">1. Identité & Coordonnées</p>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Nom complet (Anarana) *</label>
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="Nom et prénom" value={form.anarana} onChange={(event) => handleChange('anarana', event.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Numéro CIN (12 chiffres)</label>
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="Ex: 101234567890" value={form.cin} onChange={(event) => handleChange('cin', event.target.value)} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Téléphone *</label>
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="+261 34 00 000 00" value={form.telephone} onChange={(event) => handleChange('telephone', event.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email</label>
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="email@exemple.mg" type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Date de naissance</label>
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" type="date" value={form.dateNaissance} onChange={(event) => handleChange('dateNaissance', event.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Genre</label>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.genre} onChange={(event) => handleChange('genre', event.target.value)}>
                    <option value="LAHY">Lahy (Homme)</option>
                    <option value="VAVY">Vavy (Femme)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Email notification</label>
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="Notification" value={form.emailNotification} onChange={(event) => handleChange('emailNotification', event.target.value)} />
                </div>
              </div>
            </div>

            {/* Section 2: Données RH & Affectation */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <p className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-cyan-400">2. Affectation & Données RH</p>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Département *</label>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.departmentId} onChange={(event) => handleChange('departmentId', event.target.value)} required>
                    <option value="">Sélectionner un département</option>
                    {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Poste *</label>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.positionId} onChange={(event) => handleChange('positionId', event.target.value)} required>
                    <option value="">Sélectionner un poste</option>
                    {positions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Salaire de base (MGA) *</label>
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" placeholder="Salaire de base" type="number" min="0" value={form.salaryBase} onChange={(event) => handleChange('salaryBase', event.target.value)} required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Statut de l'employé *</label>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.status} onChange={(event) => handleChange('status', event.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-slate-300 text-xs font-medium cursor-pointer">
                  <input type="checkbox" checked={form.isMember} onChange={(event) => setForm({ ...form, isMember: event.target.checked, memberId: event.target.checked ? form.memberId : '' })} />
                  Cet employé est également membre de l'Association AMM
                </label>
                {form.isMember && (
                  <select className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 text-xs" value={form.memberId} onChange={(event) => setForm({ ...form, memberId: event.target.value })}>
                    <option value="">Associer à la fiche d'un membre</option>
                    {members.map((member) => <option key={member.id} value={member.id}>{member.anarana ?? ((`${member.prenom ?? ''} ${member.nom ?? ''}`.trim() || member.id))}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Section 3: Localisation */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <p className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-cyan-400">3. Localisation Géographique</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Province</label>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.province} onChange={(event) => handleChange('province', event.target.value)}>
                    <option value="">Province</option>
                    {provinceOptions.map((province) => <option key={province} value={province}>{province}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Région</label>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.region} onChange={(event) => handleChange('region', event.target.value)} disabled={!form.province}>
                    <option value="">Région</option>
                    {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">District</label>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.district} onChange={(event) => handleChange('district', event.target.value)} disabled={!form.region}>
                    <option value="">District</option>
                    {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Commune</label>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.commune} onChange={(event) => handleChange('commune', event.target.value)} disabled={!form.district}>
                    <option value="">Commune</option>
                    {communeOptions.map((commune) => <option key={commune} value={commune}>{commune}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Fokontany</label>
                <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={form.fokontany} onChange={(event) => handleChange('fokontany', event.target.value)} disabled={!form.commune}>
                  <option value="">Fokontany</option>
                  {tokenizedCommune.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
                </select>
              </div>
            </div>

            {/* Section 4: Compte Financier */}
            {selectedEmployee && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
                <p className="font-semibold text-slate-200">Compte financier rattaché ({selectedEmployee.matricule})</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800"><p className="text-slate-400">Solde</p><p className="text-cyan-300 font-bold">{account?.solde ?? 0} MGA</p></div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800"><p className="text-slate-400">Crédit</p><p className="text-emerald-300 font-bold">{account?.solde_credit ?? 0} MGA</p></div>
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800"><p className="text-slate-400">Débit</p><p className="text-rose-300 font-bold">{account?.solde_debit ?? 0} MGA</p></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-3 pt-2">
            <button className="flex-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 transition-colors cursor-pointer" type="submit">
              {selectedEmployee ? 'Mettre à jour les informations' : 'Enregistrer le nouvel employé'}
            </button>
            <button className="rounded-lg border border-slate-700 hover:bg-slate-800 px-4 py-2.5 text-slate-300 transition-colors cursor-pointer" type="button" onClick={resetForm}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
