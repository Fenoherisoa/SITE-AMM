import { useEffect, useState } from 'react'
import { addAttendanceRecord, getAttendance } from '../services/attendanceService'
import { getEmployees } from '../services/employeesService'
import type { AttendanceRecord, Employee } from '../types'

export const AttendancePage = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [status, setStatus] = useState<'present' | 'absent' | 'late'>('present')

  const loadData = async () => {
    const [employeeData, attendanceData] = await Promise.all([getEmployees(), getAttendance()])
    setEmployees(employeeData)
    setRecords(attendanceData)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await addAttendanceRecord({
      employeeId,
      date: new Date().toISOString().slice(0, 10),
      checkIn: new Date().toISOString(),
      status,
      createdAt: new Date().toISOString(),
    })
    setEmployeeId('')
    setStatus('present')
    await loadData()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Présence</p>
        <h2 className="mt-2 text-3xl font-semibold">Check-in / Check-out / Historique</h2>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="rounded-2xl border border-slate-800 bg-slate-900 p-5" onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold">Enregistrer une présence</h3>
          <div className="mt-4 space-y-3">
            <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} required>
              <option value="">Sélectionner un employé</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.prenom} {employee.nom}</option>)}
            </select>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={status} onChange={(event) => setStatus(event.target.value as 'present' | 'absent' | 'late')}>
              <option value="present">Présent</option>
              <option value="absent">Absent</option>
              <option value="late">Retard</option>
            </select>
          </div>
          <button className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950" type="submit">Enregistrer</button>
        </form>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <ul className="space-y-3">
            {records.map((record) => (
              <li key={record.id} className="rounded-lg border border-slate-800 px-4 py-3">
                <p className="font-medium">{employees.find((employee) => employee.id === record.employeeId)?.prenom} {employees.find((employee) => employee.id === record.employeeId)?.nom}</p>
                <p className="text-sm text-slate-400">{record.date} • {record.status}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
