import { useEffect, useState } from 'react'
import { addLeaveRequest, getLeaveRequests, updateLeaveRequest } from '../services/leaveService'
import { getEmployees } from '../services/employeesService'
import type { Employee, LeaveRequest } from '../types'

export const LeavePage = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const loadData = async () => {
    const [employeeData, leaveData] = await Promise.all([getEmployees(), getLeaveRequests()])
    setEmployees(employeeData)
    setRequests(leaveData)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await addLeaveRequest({ employeeId, startDate, endDate, reason, status: 'pending', createdAt: new Date().toISOString() })
    setEmployeeId('')
    setStartDate('')
    setEndDate('')
    setReason('')
    await loadData()
  }

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    await updateLeaveRequest(id, { status })
    await loadData()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Congés</p>
        <h2 className="mt-2 text-3xl font-semibold">Demandes de congé</h2>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="rounded-2xl border border-slate-800 bg-slate-900 p-5" onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold">Nouvelle demande</h3>
          <div className="mt-4 space-y-3">
            <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} required>
              <option value="">Sélectionner un employé</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.prenom} {employee.nom}</option>)}
            </select>
            <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
            <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
            <textarea className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Motif" value={reason} onChange={(event) => setReason(event.target.value)} required />
          </div>
          <button className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950" type="submit">Soumettre</button>
        </form>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <ul className="space-y-3">
            {requests.map((request) => (
              <li key={request.id} className="rounded-lg border border-slate-800 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{employees.find((employee) => employee.id === request.employeeId)?.prenom} {employees.find((employee) => employee.id === request.employeeId)?.nom}</p>
                    <p className="text-sm text-slate-400">{request.startDate} → {request.endDate}</p>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-xs uppercase">{request.status}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-300" onClick={() => void handleStatusUpdate(request.id, 'approved')}>Approuver</button>
                  <button className="rounded bg-rose-500/20 px-2 py-1 text-rose-300" onClick={() => void handleStatusUpdate(request.id, 'rejected')}>Rejeter</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
