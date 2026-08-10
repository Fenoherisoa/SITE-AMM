import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getDepartments, getEmployeeById, getPositions } from '../services/employeesService'
import type { Department, Employee, Position } from '../types'

export const EmployeeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!id) return
      const [employeeData, departmentData, positionData] = await Promise.all([getEmployeeById(id), getDepartments(), getPositions()])
      if (active) {
        setEmployee(employeeData)
        setDepartments(departmentData)
        setPositions(positionData)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [id])

  const departmentName = useMemo(() => departments.find((item) => item.id === employee?.departmentId)?.name ?? '—', [departments, employee])
  const positionName = useMemo(() => positions.find((item) => item.id === employee?.positionId)?.name ?? '—', [positions, employee])

  if (!employee) {
    return <div className="text-slate-300">Chargement…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Employé</p>
        <h2 className="mt-2 text-3xl font-semibold">{employee.anarana ?? `${employee.prenom} ${employee.nom}`}</h2>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">Informations</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p><span className="text-slate-500">ID RH :</span> {employee.id}</p>
            <p><span className="text-slate-500">Matricule :</span> {employee.matricule ?? '—'}</p>
            <p><span className="text-slate-500">CIN :</span> {employee.cin ?? '—'}</p>
            <p><span className="text-slate-500">Téléphone :</span> {employee.telephone}</p>
            <p><span className="text-slate-500">Email :</span> {employee.email ?? '—'}</p>
            <p><span className="text-slate-500">Département :</span> {departmentName}</p>
            <p><span className="text-slate-500">Poste :</span> {positionName}</p>
            <p><span className="text-slate-500">Salaire de base :</span> {employee.salaryBase || 0} Ar</p>
            <p><span className="text-slate-500">Statut :</span> {employee.status}</p>
            <p><span className="text-slate-500">Membre :</span> {employee.isMember ? 'Oui' : 'Non'}</p>
            <p><span className="text-slate-500">Member ID :</span> {employee.memberId ?? '—'}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">Résumé RH</h3>
          <p className="mt-2 text-sm text-slate-400">Cet espace pourra accueillir prochainement l’historique des présences, des congés et de la paie.</p>
        </div>
      </div>
    </div>
  )
}
