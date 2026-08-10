import { useEffect, useMemo, useState } from 'react'
import { addTransaction, getEmployeeAccountByMatricule, getTransactionsByMatricule } from '../services/accountingService'
import { getEmployees } from '../services/employeesService'
import type { AccountingTransaction, Employee, EmployeeAccount } from '../types'

export const AccountingPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedMatricule, setSelectedMatricule] = useState('')
  const [transactions, setTransactions] = useState<AccountingTransaction[]>([])
  const [account, setAccount] = useState<EmployeeAccount | null>(null)
  const [form, setForm] = useState({ karazana: 'MIDITRA' as 'MIDITRA' | 'FIVOAHANA', motif: '', vola: '0', memberName: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const employeeData = await getEmployees()
      setEmployees(employeeData)
      if (employeeData[0]) {
        setSelectedMatricule(employeeData[0].matricule ?? '')
      }
    }
    void loadData()
  }, [])

  useEffect(() => {
    const loadTransactions = async () => {
      if (!selectedMatricule) return
      const [txs, acc] = await Promise.all([getTransactionsByMatricule(selectedMatricule), getEmployeeAccountByMatricule(selectedMatricule)])
      setTransactions(txs)
      setAccount(acc)
    }
    void loadTransactions()
  }, [selectedMatricule])

  const filteredEmployees = useMemo(() => employees.filter((employee) => employee.matricule), [employees])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedMatricule) return
    const payload = {
      karazana: form.karazana,
      matricule: selectedMatricule,
      memberName: form.memberName || employees.find((item) => item.matricule === selectedMatricule)?.anarana || 'EMPLOYEE',
      motif: form.motif,
      vola: Number(form.vola),
    }
    await addTransaction(payload)
    setMessage('Transaction enregistrée')
    const [txs, acc] = await Promise.all([getTransactionsByMatricule(selectedMatricule), getEmployeeAccountByMatricule(selectedMatricule)])
    setTransactions(txs)
    setAccount(acc)
    setForm({ karazana: 'MIDITRA', motif: '', vola: '0', memberName: '' })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Comptabilité</p>
        <h2 className="mt-2 text-3xl font-semibold">Suivi comptable par employé</h2>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-400">Matricule employé</label>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={selectedMatricule} onChange={(event) => setSelectedMatricule(event.target.value)}>
              <option value="">Sélectionner</option>
              {filteredEmployees.map((employee) => <option key={employee.matricule} value={employee.matricule}>{employee.matricule} — {employee.anarana}</option>)}
            </select>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-sm text-slate-400">Solde</p>
            <p className="text-2xl font-semibold">{account?.solde ?? 0}</p>
            <div className="mt-2 flex gap-4 text-sm text-slate-400">
              <span>Crédit: {account?.solde_credit ?? 0}</span>
              <span>Débit: {account?.solde_debit ?? 0}</span>
            </div>
          </div>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Type</label>
            <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.karazana} onChange={(event) => setForm({ ...form, karazana: event.target.value as 'MIDITRA' | 'FIVOAHANA' })}>
              <option value="MIDITRA">MIDITRA</option>
              <option value="FIVOAHANA">FIVOAHANA</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Motif</label>
            <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.motif} onChange={(event) => setForm({ ...form, motif: event.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Montant</label>
            <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="number" value={form.vola} onChange={(event) => setForm({ ...form, vola: event.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-400">Nom employé</label>
            <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.memberName} onChange={(event) => setForm({ ...form, memberName: event.target.value })} />
          </div>
          <div className="md:col-span-2">
            <button className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950" type="submit">Ajouter la transaction</button>
            {message ? <span className="ml-3 text-sm text-emerald-400">{message}</span> : null}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="text-xl font-semibold">Historique</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Motif</th>
                <th className="px-3 py-3">Montant</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.customId} className="border-b border-slate-800/70">
                  <td className="px-3 py-3">{transaction.date}</td>
                  <td className="px-3 py-3">{transaction.karazana}</td>
                  <td className="px-3 py-3">{transaction.motif}</td>
                  <td className="px-3 py-3">{transaction.vola}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
