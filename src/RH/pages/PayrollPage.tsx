import { useEffect, useState } from 'react'
import { addPayrollEntry, getPayroll } from '../services/payrollService'
import { getEmployees } from '../services/employeesService'
import type { Employee, PayrollEntry } from '../types'

export const PayrollPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [entries, setEntries] = useState<PayrollEntry[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [bonus, setBonus] = useState('0')
  const [deductions, setDeductions] = useState('0')

  const loadData = async () => {
    const [employeeData, payrollData] = await Promise.all([getEmployees(), getPayroll()])
    setEmployees(employeeData)
    setEntries(payrollData)
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const employee = employees.find((item) => item.id === employeeId)
    if (!employee) return
    const baseSalary = Number(employee.salaryBase)
    const bonusValue = Number(bonus)
    const deductionsValue = Number(deductions)
    const netSalary = baseSalary + bonusValue - deductionsValue
    await addPayrollEntry({
      employeeId,
      month: new Date().toISOString().slice(0, 7),
      baseSalary,
      bonus: bonusValue,
      deductions: deductionsValue,
      netSalary,
      createdAt: new Date().toISOString(),
    })
    setEmployeeId('')
    setBonus('0')
    setDeductions('0')
    await loadData()
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Paie</p>
        <h2 className="mt-2 text-3xl font-semibold">Calcul automatique de salaire</h2>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <form className="rounded-2xl border border-slate-800 bg-slate-900 p-5" onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold">Générer une paie</h3>
          <div className="mt-4 space-y-3">
            <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} required>
              <option value="">Sélectionner un employé</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.prenom} {employee.nom}</option>)}
            </select>
            <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="number" placeholder="Primes" value={bonus} onChange={(event) => setBonus(event.target.value)} />
            <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="number" placeholder="Retenues" value={deductions} onChange={(event) => setDeductions(event.target.value)} />
          </div>
          <button className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950" type="submit">Enregistrer</button>
        </form>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-slate-800 px-4 py-3">
                <p className="font-medium">{employees.find((employee) => employee.id === entry.employeeId)?.prenom} {employees.find((employee) => employee.id === entry.employeeId)?.nom}</p>
                <p className="text-sm text-slate-400">{entry.month} • Salaire net: {entry.netSalary}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
