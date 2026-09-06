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

    if (!isEdit) {
      if (!form.anarana.trim()) return 'Le nom est obligatoire.'
      if (!cinPattern.test(form.cin.trim())) return 'Le CIN doit contenir 12 chiffres.'
      if (!phonePattern.test(form.telephone.trim())) return 'Le téléphone est invalide.'
    }

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
      if (isEdit && selectedEmployee) {
        const patch = {
          departmentId: form.departmentId,
          positionId: form.positionId,
          salaryBase: Number(form.salaryBase),
          status: form.status,
          isMember: form.isMember,
          memberId: form.isMember ? form.memberId || null : null,
        }
        await updateEmployee(selectedEmployee.id, patch)
        setFeedback('Employé mis à jour.')
        setEmployees((current) => current.map((employee) => employee.id === selectedEmployee.id ? { ...employee, ...patch } : employee))
        setSelectedEmployee({ ...selectedEmployee, ...patch })
        setForm((current) => ({ ...current, departmentId: patch.departmentId, positionId: patch.positionId, salaryBase: patch.salaryBase, status: patch.status as 'Active' | 'Inactive', isMember: patch.isMember, memberId: patch.memberId ?? '' }))
      } else {
        const payload = {
          anarana: form.anarana,
          cin: form.cin,
          telephone: form.telephone,
          email: form.email,
          departmentId: form.departmentId,
          positionId: form.positionId,
          salaryBase: Number(form.salaryBase),
          status: form.status,
          isMember: form.isMember,
          memberId: form.isMember ? form.memberId || null : null,
          province: form.province,
          region: form.region,
          district: form.district,
          commune: form.commune,
          fokontany: form.fokontany,
          date_naissance: form.dateNaissance,
          email_notification: form.emailNotification,
          genre: form.genre,
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
    await deleteEmployee(id)
    setEmployees((current) => current.filter((employee) => employee.id !== id))
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
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Employés</p>
          <h2 className="mt-2 text-3xl font-semibold">Gestion des employés</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" placeholder="Rechercher" value={search} onChange={(event) => setSearch(event.target.value)} />
          <select className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)}>
            <option value="">Tous les départements</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
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
                  <tr key={employee.id} className="border-b border-slate-800/70">
                    <td className="px-3 py-3">{displayValue(employee.anarana ?? `${employee.prenom ?? ''} ${employee.nom ?? ''}`.trim())}</td>
                    <td className="px-3 py-3">{displayValue(positions.find((position) => position.id === employee.positionId)?.name)}</td>
                    <td className="px-3 py-3">{displayValue(departments.find((dep) => dep.id === employee.departmentId)?.name)}</td>
                    <td className="px-3 py-3">{displayValue(employee.status)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <Link className="rounded bg-cyan-500/20 px-2 py-1 text-cyan-300" to={`/employees/${employee.id}`}>Détail</Link>
                        <button className="rounded bg-cyan-500/20 px-2 py-1 text-cyan-300" onClick={() => {
                          setSelectedEmployee(employee)
                          setForm({
                            employeeId: employee.employeeId ?? employee.id,
                            matricule: employee.matricule ?? '',
                            anarana: employee.anarana ?? '',
                            cin: employee.cin ?? '',
                            telephone: employee.telephone,
                            email: employee.email ?? '',
                            departmentId: employee.departmentId,
                            positionId: employee.positionId,
                            salaryBase: employee.salaryBase,
                            status: employee.status,
                            isMember: employee.isMember,
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
                        <button className="rounded bg-rose-500/20 px-2 py-1 text-rose-300" onClick={() => void handleDelete(employee.id)}>Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form className="rounded-2xl border border-slate-800 bg-slate-900 p-5" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold">{selectedEmployee ? 'Modifier employé' : 'Ajouter employé'}</h3>
            {selectedEmployee ? <button className="rounded-lg border border-slate-700 px-3 py-2 text-sm" type="button" onClick={resetForm}>Nouveau</button> : null}
          </div>
          {feedback ? <p className="mt-3 rounded-lg border border-cyan-700/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300">{feedback}</p> : null}

          <div className="mt-4 space-y-3 text-sm">
            {selectedEmployee ? (
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <p className="font-semibold text-slate-200">Informations d’identité</p>
                <div className="mt-2 grid gap-2 text-slate-400">
                  <p><span className="text-slate-500">ID RH :</span> {displayValue(selectedEmployee.id)}</p>
                  <p><span className="text-slate-500">Matricule :</span> {displayValue(selectedEmployee.matricule)}</p>
                  <p><span className="text-slate-500">Anarana :</span> {displayValue(selectedEmployee.anarana)}</p>
                  <p><span className="text-slate-500">CIN :</span> {displayValue(selectedEmployee.cin)}</p>
                  <p><span className="text-slate-500">Date naissance :</span> {displayValue(selectedEmployee.date_naissance)}</p>
                  <p><span className="text-slate-500">Adresse :</span> {displayValue(`${selectedEmployee.province ?? ''} ${selectedEmployee.region ?? ''} ${selectedEmployee.district ?? ''} ${selectedEmployee.commune ?? ''} ${selectedEmployee.fokontany ?? ''}`.trim())}</p>
                  <p><span className="text-slate-500">Téléphone :</span> {displayValue(selectedEmployee.telephone)}</p>
                </div>
              </div>
            ) : (
              <>
                <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="ID RH" value={form.employeeId} onChange={(event) => handleChange('employeeId', event.target.value)} required />
                <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Matricule" value={form.matricule} onChange={(event) => handleChange('matricule', event.target.value)} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Anarana" value={form.anarana} onChange={(event) => handleChange('anarana', event.target.value)} required />
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="CIN" value={form.cin} onChange={(event) => handleChange('cin', event.target.value)} required />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Téléphone" value={form.telephone} onChange={(event) => handleChange('telephone', event.target.value)} required />
                  <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} />
                </div>
                <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Date naissance" value={form.dateNaissance} onChange={(event) => handleChange('dateNaissance', event.target.value)} />
                <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Email notification" value={form.emailNotification} onChange={(event) => handleChange('emailNotification', event.target.value)} />
                <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.genre} onChange={(event) => handleChange('genre', event.target.value)}>
                  <option value="LAHY">Lahy</option>
                  <option value="VAVY">Vavy</option>
                </select>
              </>
            )}

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="mb-2 text-sm text-slate-400">Données RH</p>
              <div className="space-y-3">
                <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.departmentId} onChange={(event) => handleChange('departmentId', event.target.value)} required>
                  <option value="">Sélectionner un département</option>
                  {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
                <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.positionId} onChange={(event) => handleChange('positionId', event.target.value)} required>
                  <option value="">Sélectionner un poste</option>
                  {positions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
                </select>
                <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Salaire de base" type="number" value={form.salaryBase} onChange={(event) => handleChange('salaryBase', event.target.value)} required />
                <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.status} onChange={(event) => handleChange('status', event.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={form.isMember} onChange={(event) => setForm({ ...form, isMember: event.target.checked, memberId: event.target.checked ? form.memberId : '' })} /> Est membre</label>
                <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.memberId} onChange={(event) => setForm({ ...form, memberId: event.target.value })} disabled={!form.isMember}>
                  <option value="">Sélectionner un membre</option>
                  {members.map((member) => <option key={member.id} value={member.id}>{member.anarana ?? ((`${member.prenom ?? ''} ${member.nom ?? ''}`.trim() || member.id))}</option>)}
                </select>
              </div>
            </div>

            {!selectedEmployee ? (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="mb-2 text-sm text-slate-400">Localisation</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.province} onChange={(event) => handleChange('province', event.target.value)}>
                    <option value="">Province</option>
                    {provinceOptions.map((province) => <option key={province} value={province}>{province}</option>)}
                  </select>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.region} onChange={(event) => handleChange('region', event.target.value)} disabled={!form.province}>
                    <option value="">Région</option>
                    {regionOptions.map((region) => <option key={region} value={region}>{region}</option>)}
                  </select>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.district} onChange={(event) => handleChange('district', event.target.value)} disabled={!form.region}>
                    <option value="">District</option>
                    {districtOptions.map((district) => <option key={district} value={district}>{district}</option>)}
                  </select>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.commune} onChange={(event) => handleChange('commune', event.target.value)} disabled={!form.district}>
                    <option value="">Commune</option>
                    {communeOptions.map((commune) => <option key={commune} value={commune}>{commune}</option>)}
                  </select>
                </div>
                <select className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.fokontany} onChange={(event) => handleChange('fokontany', event.target.value)} disabled={!form.commune}>
                  <option value="">Fokontany</option>
                  {tokenizedCommune.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
                </select>
              </div>
            ) : null}

            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm">
              <p className="font-semibold text-slate-200">Compte financier</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3 text-slate-400">
                <div><p>Solde</p><p className="text-cyan-300">{account?.solde ?? 0}</p></div>
                <div><p>Crédit</p><p className="text-emerald-300">{account?.solde_credit ?? 0}</p></div>
                <div><p>Débit</p><p className="text-rose-300">{account?.solde_debit ?? 0}</p></div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950" type="submit">{selectedEmployee ? 'Mettre à jour' : 'Enregistrer'}</button>
            <button className="rounded-lg border border-slate-700 px-4 py-2" type="button" onClick={resetForm}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  )
}
