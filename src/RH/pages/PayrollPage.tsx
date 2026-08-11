import React, { useEffect, useState } from 'react'
import { addPayrollEntry, getPayroll, deletePayrollEntry } from '../services/payrollService'
import { getEmployees } from '../services/employeesService'
import type { Employee, PayrollEntry } from '../types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface CustomItem {
  id: string
  name: string
  amount: string
}

export const PayrollPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [entries, setEntries] = useState<PayrollEntry[]>([])
  
  // Role & Solde State
  const [userRole, setUserRole] = useState<'ADMIN' | 'GESTIONNAIRE' | 'RH'>('ADMIN')
  const [isSalaryAvailable, setIsSalaryAvailable] = useState(true) // Maitso = Disponible

  // Form state
  const [employeeId, setEmployeeId] = useState('')
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  
  // Primes sy Indemnités maro be
  const [primesList, setPrimesList] = useState<CustomItem[]>([])
  const [indemnitesList, setIndemnitesList] = useState<CustomItem[]>([])
  const [deductions, setDeductions] = useState('0')

  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState('')

  const loadData = async () => {
    try {
      const [employeeData, payrollData] = await Promise.all([getEmployees(), getPayroll()])
      setEmployees(employeeData || [])
      setEntries(payrollData || [])
    } catch (error) {
      console.error("Erreur chargement paie:", error)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  // Filtrage des employés par nom ou matricule
  const filteredEmployees = employees.filter((emp) => {
    const fullName = (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`).toLowerCase()
    const matricule = (emp.matricule || '').toLowerCase()
    const query = employeeSearch.toLowerCase()
    return fullName.includes(query) || matricule.includes(query)
  })

  // Mpiasa voafidy
  const selectedEmployee = employees.find((emp) => emp.id === employeeId)
  const baseSalary = selectedEmployee ? Number(selectedEmployee.salaryBase || 0) : 0

  // Tambatra Primes sy Indemnités
  const totalPrimes = primesList.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalIndemnites = indemnitesList.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalDeductions = Number(deductions || 0)

  const calculatedNet = baseSalary + totalPrimes + totalIndemnites - totalDeductions

  // Fanampiana sy famafana singa Prime / Indemnité
  const addPrimeField = () => setPrimesList([...primesList, { id: Date.now().toString(), name: '', amount: '' }])
  const removePrimeField = (id: string) => setPrimesList(primesList.filter(p => p.id !== id))
  const updatePrimeField = (id: string, field: 'name' | 'amount', value: string) => {
    setPrimesList(primesList.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const addIndemniteField = () => setIndemnitesList([...indemnitesList, { id: Date.now().toString(), name: '', amount: '' }])
  const removeIndemniteField = (id: string) => setIndemnitesList(indemnitesList.filter(i => i.id !== id))
  const updateIndemniteField = (id: string, field: 'name' | 'amount', value: string) => {
    setIndemnitesList(indemnitesList.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  // Famoahana paie tokana
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!employeeId) return

    setIsProcessing(true)
    setMessage('')
    try {
      await addPayrollEntry({
        employeeId,
        month: selectedMonth,
        baseSalary,
        bonus: totalPrimes,
        indemnites: totalIndemnites,
        deductions: totalDeductions,
        netSalary: calculatedNet,
        createdAt: new Date().toISOString(),
      } as any)
      
      setMessage('Paie enregistrée avec succès.')
      setPrimesList([])
      setIndemnitesList([])
      setDeductions('0')
      setEmployeeId('')
      await loadData()
    } catch (error) {
      console.error("Erreur enregistrement paie:", error)
      setMessage('Erreur lors de l\'enregistrement.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Fandoavam-bola faobe (Paiement en masse par mois)
  const handleMassPayment = async () => {
    if (!isSalaryAvailable) {
      alert("Impossible d'effectuer le paiement en masse : Le solde n'est pas disponible (Indisponible).")
      return
    }

    if (!window.confirm(`Voulez-vous valider la paie en masse pour tous les ${employees.length} employés pour le mois de ${selectedMonth} ?`)) {
      return
    }

    setIsProcessing(true)
    setMessage('')
    try {
      for (const emp of employees) {
        const bSalary = Number(emp.salaryBase || 0)
        await addPayrollEntry({
          employeeId: emp.id,
          month: selectedMonth,
          baseSalary: bSalary,
          bonus: 0,
          indemnites: 0,
          deductions: 0,
          netSalary: bSalary,
          createdAt: new Date().toISOString(),
        } as any)
      }
      setMessage(`Paie en masse effectuée avec succès pour ${selectedMonth} !`)
      await loadData()
    } catch (error) {
      console.error("Erreur paie en masse:", error)
      setMessage('Erreur lors du traitement en masse.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Fanaovana Téléchargement Fiche de Paie PDF
  const handleDownloadPDF = (entry: PayrollEntry) => {
    const emp = employees.find((e) => e.id === entry.employeeId)
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.setTextColor(14, 116, 144)
    doc.text("BULLETIN DE PAIE", 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Mois : ${entry.month}`, 14, 28)
    doc.text(`Date d'édition : ${new Date().toLocaleDateString()}`, 14, 34)

    doc.setFontSize(12)
    doc.setTextColor(30, 30, 30)
    doc.text("Informations de l'employé :", 14, 46)
    
    doc.setFontSize(10)
    const empName = emp ? (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`) : 'Inconnu'
    doc.text(`Nom complet : ${empName}`, 14, 54)
    doc.text(`Matricule : ${emp?.matricule ?? '—'}`, 14, 60)
    doc.text(`CIN : ${emp?.cin ?? '—'}`, 14, 66)
    doc.text(`Téléphone : ${emp?.telephone ?? '—'}`, 14, 72)

    const bodyRows: any[] = [
      ['Salaire de base', entry.baseSalary.toLocaleString() + ' Ar'],
    ]

    if (entry.bonus && entry.bonus > 0) {
      bodyRows.push(['Primes & Bonus globaux', entry.bonus.toLocaleString() + ' Ar'])
    }
    if (entry.indemnites && entry.indemnites > 0) {
      bodyRows.push(['Indemnités globales', entry.indemnites.toLocaleString() + ' Ar'])
    }

    bodyRows.push(['Retenues / Déductions', '-' + (entry.deductions ?? 0).toLocaleString() + ' Ar'])
    bodyRows.push(['SALAIRE NET À PAYER', entry.netSalary.toLocaleString() + ' Ar'])

    ;(doc as any).autoTable({
      startY: 80,
      head: [['Élément constitutif', 'Montant (Ar)']],
      body: bodyRows,
      theme: 'grid',
      headStyles: { fillColor: [14, 116, 144] },
      columnStyles: { 1: { halign: 'right' } }
    })

    const finalY = (doc as any).lastAutoTable.finalY || 140
    doc.text("Signature de l'employeur :", 14, finalY + 20)
    doc.text("Signature de l'employé :", 130, finalY + 20)

    doc.save(`Fiche_de_paie_${empName.replace(/\s+/g, '_')}_${entry.month}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Header & Status bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Paie & Rémunération</p>
          <h2 className="mt-2 text-3xl font-semibold">Calcul et Gestion de la Paie</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Salaire Disponible & Bokotra Admin hanovana azy */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${isSalaryAvailable ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/40 bg-rose-500/10 text-rose-400'}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${isSalaryAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {isSalaryAvailable ? 'SALAIRE DISPONIBLE' : 'SALAIRE INDISPONIBLE'}
            </div>

            {/* Bokotra Admin hanova mivantana ny status */}
            {userRole === 'ADMIN' && (
              <button
                type="button"
                onClick={() => setIsSalaryAvailable(!isSalaryAvailable)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                  isSalaryAvailable 
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30' 
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                }`}
                title="Admin : Changer le statut du solde"
              >
                {isSalaryAvailable ? 'Mettre Indisponible' : 'Mettre Disponible'}
              </button>
            )}
          </div>

          {/* Fidio ny Rôle raha ilaina andrana */}
          <select 
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as any)}
          >
            <option value="ADMIN">Rôle : Admin</option>
            <option value="GESTIONNAIRE">Rôle : Gestionnaire</option>
            <option value="RH">Rôle : RH</option>
          </select>

          <input 
            type="month" 
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-100 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />

          <button 
            type="button" 
            onClick={handleMassPayment}
            disabled={isProcessing || employees.length === 0 || !isSalaryAvailable}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${isSalaryAvailable ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'}`}
          >
            Paiement en masse (Mois)
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-300 text-sm font-medium">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.1fr]">
        {/* Formulaire de génération détaillé */}
        <form className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5" onSubmit={handleSubmit}>
          <h3 className="text-xl font-semibold">Générer une fiche de paie personnalisée</h3>
          
          {/* Recherche & Sélection Employé */}
          <div className="space-y-2">
            <label className="block text-sm text-slate-400">Rechercher et sélectionner un employé (Nom ou Matricule)</label>
            <input 
              type="text"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 text-sm mb-2"
              placeholder="Taper un nom ou matricule pour filtrer..."
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
            />
            <select 
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" 
              value={employeeId} 
              onChange={(event) => setEmployeeId(event.target.value)} 
              required
            >
              <option value="">Sélectionner dans la liste ({filteredEmployees.length} trouvés)</option>
              {filteredEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.anarana || `${employee.prenom ?? ''} ${employee.nom ?? ''}`} — Matr: {employee.matricule || '—'} (Base: {employee.salaryBase || 0} Ar)
                </option>
              ))}
            </select>
          </div>

          {/* Primes / Bonus multiples */}
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-cyan-400">Primes et Bonus (Personnalisés)</label>
              <button type="button" onClick={addPrimeField} className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-500/30">+ Ajouter une prime</button>
            </div>
            {primesList.map((prime) => (
              <div key={prime.id} className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Nom du prime (ex: Prime de risque)" 
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100"
                  value={prime.name}
                  onChange={(e) => updatePrimeField(prime.id, 'name', e.target.value)}
                  required
                />
                <input 
                  type="number" 
                  placeholder="Montant" 
                  className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100"
                  value={prime.amount}
                  onChange={(e) => updatePrimeField(prime.id, 'amount', e.target.value)}
                  required
                />
                <button type="button" onClick={() => removePrimeField(prime.id)} className="text-rose-400 hover:text-rose-300 px-2 text-sm font-bold">×</button>
              </div>
            ))}
            {primesList.length === 0 && <p className="text-xs text-slate-500 italic">Aucune prime spécifique ajoutée.</p>}
          </div>

          {/* Indemnités multiples */}
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-cyan-400">Indemnités (Personnalisées)</label>
              <button type="button" onClick={addIndemniteField} className="rounded bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-500/30">+ Ajouter une indemnité</button>
            </div>
            {indemnitesList.map((indemnite) => (
              <div key={indemnite.id} className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Nom indemnité (ex: Transport, Logement)" 
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100"
                  value={indemnite.name}
                  onChange={(e) => updateIndemniteField(indemnite.id, 'name', e.target.value)}
                  required
                />
                <input 
                  type="number" 
                  placeholder="Montant" 
                  className="w-32 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100"
                  value={indemnite.amount}
                  onChange={(e) => updateIndemniteField(indemnite.id, 'amount', e.target.value)}
                  required
                />
                <button type="button" onClick={() => removeIndemniteField(indemnite.id)} className="text-rose-400 hover:text-rose-300 px-2 text-sm font-bold">×</button>
              </div>
            ))}
            {indemnitesList.length === 0 && <p className="text-xs text-slate-500 italic">Aucune indemnité spécifique ajoutée.</p>}
          </div>

          {/* Déductions / Retenues */}
          <div>
            <label className="mb-1 block text-sm text-slate-400">Retenues / Déductions globales (Ar)</label>
            <input 
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" 
              type="number" 
              value={deductions} 
              onChange={(event) => setDeductions(event.target.value)} 
            />
          </div>

          {/* Résumé de calcul */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-1">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Salaire de base :</span>
              <span>{baseSalary.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Total Primes :</span>
              <span>+ {totalPrimes.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Total Indemnités :</span>
              <span>+ {totalIndemnites.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>Total Retenues :</span>
              <span>- {totalDeductions.toLocaleString()} Ar</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-semibold text-cyan-400">
              <span>Salaire Net Estimé :</span>
              <span>{calculatedNet.toLocaleString()} Ar</span>
            </div>
          </div>

          <button 
            className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-400 transition" 
            type="submit"
            disabled={isProcessing}
          >
            {isProcessing ? 'Enregistrement...' : 'Enregistrer et valider la paie'}
          </button>
        </form>

        {/* Liste des registres de paie */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 flex flex-col">
          <h3 className="text-xl font-semibold mb-4">Registre de paie enregistré ({entries.length})</h3>
          
          <div className="flex-1 overflow-y-auto max-h-[600px] space-y-3 pr-1">
            {entries.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Aucun bulletin de paie enregistré.</p>
            ) : (
              entries.map((entry) => {
                const emp = employees.find((e) => e.id === entry.employeeId)
                const name = emp ? (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`) : 'Employé introuvable'
                return (
                  <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-100">{name} <span className="text-xs font-mono text-slate-500">({emp?.matricule})</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Mois: <span className="text-cyan-400 font-medium">{entry.month}</span> • Base: {entry.baseSalary.toLocaleString()} Ar
                      </p>
                      <p className="text-sm font-semibold text-emerald-400 mt-1">
                        Net: {entry.netSalary.toLocaleString()} Ar
                      </p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleDownloadPDF(entry)}
                      className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/30 transition shrink-0"
                    >
                      Fiche PDF
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}