import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAttendance } from '../services/attendanceService'
import { getEmployees } from '../services/employeesService'
import { getLeaveRequests } from '../services/leaveService'
import type { AttendanceRecord, Employee, LeaveRequest } from '../types'

export const DashboardPage = () => {
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])

  useEffect(() => {
    const load = async () => {
      const [employeeData, attendanceData, leaveData] = await Promise.all([getEmployees(), getAttendance(), getLeaveRequests()])
      setEmployees(employeeData)
      setAttendance(attendanceData)
      setLeaveRequests(leaveData)
    }

    load()
  }, [])

  const stats = useMemo(() => ({
    totalEmployees: employees.length,
    activeEmployees: employees.filter((employee) => employee.status === 'Active').length,
    pendingLeaves: leaveRequests.filter((leave) => leave.status === 'pending').length,
    todayPresence: attendance.filter((record) => record.date === new Date().toISOString().slice(0, 10)).length,
  }), [attendance, employees, leaveRequests])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Tableau de bord</p>
        <h2 className="mt-2 text-3xl font-semibold">Vue d’ensemble RH</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total employés', value: stats.totalEmployees },
          { label: 'Employés actifs', value: stats.activeEmployees },
          { label: 'Congés en attente', value: stats.pendingLeaves },
          { label: 'Présences du jour', value: stats.todayPresence },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">Bienvenue {user?.name ?? 'utilisateur'}</h3>
          <p className="mt-2 text-sm text-slate-400">Vous êtes connecté avec le rôle {user?.role ?? 'RH'}. Le tableau de bord centralise les indicateurs clés du système.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950" to="/employees">Gérer les employés</Link>
            <Link className="rounded-lg border border-slate-700 px-3 py-2 text-sm" to="/payroll">Consulter la paie</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-xl font-semibold">Statut du système</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li>• Authentification Firebase active</li>
            <li>• Données RH stockées dans Firestore</li>
            <li>• Accès par rôle disponible</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
