import React, { useEffect, useState, useMemo } from 'react'
import { 
  addPayrollEntry, 
  getPayroll, 
  deletePayrollEntry, 
  updatePayrollEntry, 
  getPayrollBudget, 
  savePayrollBudget 
} from '../services/payrollService'
import { getEmployees, getDepartments } from '../services/employeesService'
import type { Employee, PayrollEntry, PayrollBudget, Department, PersonnelCategory } from '../types'
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Download, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Building2, 
  Users, 
  PieChart, 
  ShieldCheck,
  CreditCard,
  Calendar,
  Search,
  Check
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface CustomItem {
  id: string
  name: string
  amount: string
}

export const PayrollPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [entries, setEntries] = useState<PayrollEntry[]>([])
  const [budget, setBudget] = useState<PayrollBudget | null>(null)
  
  // User Session & Role
  const [userRole, setUserRole] = useState<'ADMIN' | 'DIRECTEUR' | 'COMPTABLE' | 'RH' | 'GESTIONNAIRE'>('ADMIN')
  const [isSalaryAvailable, setIsSalaryAvailable] = useState(true)

  // Filters & Period
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [employeeSearch, setEmployeeSearch] = useState('')

  // Form State
  const [employeeId, setEmployeeId] = useState('')
  const [contractType, setContractType] = useState<PersonnelCategory>('permanent')
  const [paymentMethod, setPaymentMethod] = useState<'Virement Bancaire' | 'Espèces / Caisse' | 'Mobile Money' | 'Chèque'>('Virement Bancaire')
  const [paymentStatus, setPaymentStatus] = useState<'EN_ATTENTE' | 'VALIDE' | 'PAYE' | 'ANNULE'>('EN_ATTENTE')
  const [customBaseSalary, setCustomBaseSalary] = useState<string>('')
  const [notes, setNotes] = useState('')

  // Primes & Indemnités
  const [primesList, setPrimesList] = useState<CustomItem[]>([])
  const [indemnitesList, setIndemnitesList] = useState<CustomItem[]>([])
  const [deductions, setDeductions] = useState('0')

  // Budget Modal / Editor
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [budgetAmountInput, setBudgetAmountInput] = useState<string>('15000000')
  const [budgetThresholdInput, setBudgetThresholdInput] = useState<string>('85')
  const [budgetNotesInput, setBudgetNotesInput] = useState('')

  // Processing & Feedback
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load user role from session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('amm_authenticated_user')
      if (savedUser) {
        const u = JSON.parse(savedUser)
        const role = String(u.role || '').toUpperCase()
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') setUserRole('ADMIN')
        else if (role === 'DIRECTEUR') setUserRole('DIRECTEUR')
        else if (role === 'COMPTABLE') setUserRole('COMPTABLE')
        else if (role === 'RH') setUserRole('RH')
      }
    } catch (e) {
      console.warn('Could not read user role from session:', e)
    }
  }, [])

  const loadData = async () => {
    try {
      const [employeeData, payrollData, depts, currentBudget] = await Promise.all([
        getEmployees(),
        getPayroll(),
        getDepartments(),
        getPayrollBudget(selectedMonth)
      ])
      setEmployees(employeeData || [])
      setEntries(payrollData || [])
      setDepartments(depts || [])
      setBudget(currentBudget)
      if (currentBudget) {
        setBudgetAmountInput(String(currentBudget.allocatedAmount))
        setBudgetThresholdInput(String(currentBudget.alertThresholdPercent ?? 85))
        setBudgetNotesInput(currentBudget.notes || '')
      }
    } catch (error) {
      console.error('Erreur chargement paie:', error)
    }
  }

  useEffect(() => {
    void loadData()
  }, [selectedMonth])

  // Selected Employee Details
  const selectedEmployee = employees.find((emp) => emp.id === employeeId)

  // Update base salary when employee selection changes
  useEffect(() => {
    if (selectedEmployee) {
      setCustomBaseSalary(String(selectedEmployee.salaryBase || 0))
      if (selectedEmployee.contractType) {
        setContractType(selectedEmployee.contractType as PersonnelCategory)
      }
    }
  }, [selectedEmployee])

  // Calculations
  const baseSalaryNumber = customBaseSalary !== '' ? Number(customBaseSalary) : (selectedEmployee ? Number(selectedEmployee.salaryBase || 0) : 0)
  const totalPrimes = primesList.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalIndemnites = indemnitesList.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalDeductions = Number(deductions || 0)
  const calculatedNet = Math.max(0, baseSalaryNumber + totalPrimes + totalIndemnites - totalDeductions)

  // Budget calculations for the selected month
  const monthEntries = useMemo(() => {
    return entries.filter(e => e.month === selectedMonth && e.status !== 'ANNULE')
  }, [entries, selectedMonth])

  const totalConsumedBudget = useMemo(() => {
    return monthEntries.reduce((sum, e) => sum + Number(e.netSalary || 0), 0)
  }, [monthEntries])

  const allocatedBudget = budget ? Number(budget.allocatedAmount || 0) : 0
  const remainingBudget = allocatedBudget - totalConsumedBudget
  const budgetPercentage = allocatedBudget > 0 ? (totalConsumedBudget / allocatedBudget) * 100 : 0
  const alertThreshold = budget?.alertThresholdPercent ?? 85
  const isBudgetWarning = allocatedBudget > 0 && budgetPercentage >= alertThreshold && budgetPercentage <= 100
  const isBudgetExceeded = allocatedBudget > 0 && budgetPercentage > 100

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const fullName = (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`).toLowerCase()
      const matricule = (emp.matricule || '').toLowerCase()
      const query = employeeSearch.toLowerCase()
      const matchesSearch = fullName.includes(query) || matricule.includes(query)
      
      const empCat = emp.contractType || 'permanent'
      const matchesCat = categoryFilter === 'ALL' || empCat === categoryFilter
      const matchesDept = departmentFilter === 'ALL' || emp.departmentId === departmentFilter

      return matchesSearch && matchesCat && matchesDept
    })
  }, [employees, employeeSearch, categoryFilter, departmentFilter])

  // Filtered payroll entries list
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const emp = employees.find(e => e.id === entry.employeeId)
      const matchesMonth = selectedMonth ? entry.month === selectedMonth : true
      const matchesStatus = statusFilter === 'ALL' || (entry.status || 'EN_ATTENTE') === statusFilter
      const matchesCat = categoryFilter === 'ALL' || (entry.contractType || emp?.contractType || 'permanent') === categoryFilter

      const fullName = emp ? (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`).toLowerCase() : ''
      const matricule = (emp?.matricule || entry.matricule || '').toLowerCase()
      const query = employeeSearch.toLowerCase()
      const matchesSearch = !query || fullName.includes(query) || matricule.includes(query)

      return matchesMonth && matchesStatus && matchesCat && matchesSearch
    })
  }, [entries, employees, selectedMonth, statusFilter, categoryFilter, employeeSearch])

  // Items Management
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

  // Save Payroll Entry
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!employeeId) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un employé ou membre du personnel.' })
      return
    }

    setIsProcessing(true)
    setMessage(null)

    try {
      const emp = employees.find(e => e.id === employeeId)
      const empName = emp ? (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`) : 'Personnel'

      await addPayrollEntry({
        employeeId,
        employeeName: empName,
        matricule: emp?.matricule || '',
        contractType,
        month: selectedMonth,
        baseSalary: baseSalaryNumber,
        bonus: totalPrimes,
        indemnites: totalIndemnites,
        deductions: totalDeductions,
        netSalary: calculatedNet,
        status: paymentStatus,
        paymentMethod,
        paidAt: paymentStatus === 'PAYE' ? new Date().toISOString() : undefined,
        departmentId: emp?.departmentId,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        primesBreakdown: primesList.map(p => ({ id: p.id, name: p.name, amount: Number(p.amount) })),
        indemnitesBreakdown: indemnitesList.map(i => ({ id: i.id, name: i.name, amount: Number(i.amount) }))
      })
      
      setMessage({ type: 'success', text: `Fiche de paie enregistrée avec succès pour ${empName}.` })
      setPrimesList([])
      setIndemnitesList([])
      setDeductions('0')
      setNotes('')
      setEmployeeId('')
      setCustomBaseSalary('')
      await loadData()
    } catch (error) {
      console.error('Erreur enregistrement paie:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement de la fiche de paie.' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Mass Payment Handler
  const handleMassPayment = async () => {
    if (!isSalaryAvailable) {
      alert("Impossible d'effectuer le paiement en masse : Le solde salaire est marqué comme Indisponible.")
      return
    }

    if (!window.confirm(`Voulez-vous valider et générer la paie de base pour ${filteredEmployees.length} employés pour le mois de ${selectedMonth} ?`)) {
      return
    }

    setIsProcessing(true)
    setMessage(null)
    try {
      for (const emp of filteredEmployees) {
        const bSalary = Number(emp.salaryBase || 0)
        await addPayrollEntry({
          employeeId: emp.id,
          employeeName: emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`,
          matricule: emp.matricule || '',
          contractType: (emp.contractType as PersonnelCategory) || 'permanent',
          month: selectedMonth,
          baseSalary: bSalary,
          bonus: 0,
          indemnites: 0,
          deductions: 0,
          netSalary: bSalary,
          status: 'VALIDE',
          paymentMethod: 'Virement Bancaire',
          createdAt: new Date().toISOString(),
        })
      }
      setMessage({ type: 'success', text: `Paie en masse validée avec succès pour ${selectedMonth} !` })
      await loadData()
    } catch (error) {
      console.error('Erreur paie en masse:', error)
      setMessage({ type: 'error', text: 'Erreur lors du traitement de la paie en masse.' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Save Budget Handler
  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    try {
      const newBudget: PayrollBudget = {
        period: selectedMonth,
        allocatedAmount: Number(budgetAmountInput) || 0,
        alertThresholdPercent: Number(budgetThresholdInput) || 85,
        notes: budgetNotesInput.trim(),
        updatedBy: userRole,
      }
      await savePayrollBudget(newBudget)
      setBudget(newBudget)
      setShowBudgetModal(false)
      setMessage({ type: 'success', text: `Budget de paie pour ${selectedMonth} enregistré avec succès.` })
    } catch (err) {
      console.error('Budget save error:', err)
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement du budget.' })
    } finally {
      setIsProcessing(false)
    }
  }

  // Update Status Handler
  const handleUpdateStatus = async (entry: PayrollEntry, newStatus: 'EN_ATTENTE' | 'VALIDE' | 'PAYE' | 'ANNULE') => {
    try {
      await updatePayrollEntry(entry.id, {
        status: newStatus,
        paidAt: newStatus === 'PAYE' ? new Date().toISOString() : undefined
      })
      await loadData()
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  // Delete Entry Handler
  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette ligne de paie ?')) return
    try {
      await deletePayrollEntry(id)
      await loadData()
      setMessage({ type: 'success', text: 'Ligne de paie supprimée.' })
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  // Professional Pay Slip (Bulletin de Paie) PDF Generator
  const handleDownloadPDF = (entry: PayrollEntry) => {
    const emp = employees.find((e) => e.id === entry.employeeId)
    const dept = departments.find((d) => d.id === (emp?.departmentId || entry.departmentId))
    const doc = new jsPDF()

    // Header & Organization Details
    doc.setFillColor(15, 23, 42) // Slate 900
    doc.rect(0, 0, 210, 25, 'F')

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text("ASSOCIATION MALAGASY MIRAY (SITE AMM)", 14, 12)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(203, 213, 225) // Slate 300
    doc.text("Direction des Ressources Humaines & Gestion Financière • Siège Social Antananarivo", 14, 19)

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(14, 116, 144) // Cyan 700
    doc.text("BULLETIN DE PAIE OFFICIEL", 14, 38)

    // Metadata Bar
    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105) // Slate 600
    doc.setFont('helvetica', 'normal')
    doc.text(`Période de paie : ${entry.month}`, 14, 46)
    doc.text(`Date d'émission : ${new Date().toLocaleDateString('fr-FR')}`, 90, 46)
    doc.text(`Statut : ${entry.status || 'VALIDE'}`, 155, 46)

    // Employee & Contract Box
    doc.setDrawColor(226, 232, 240) // Slate 200
    doc.setFillColor(248, 250, 252) // Slate 50
    doc.roundedRect(14, 52, 182, 36, 2, 2, 'FD')

    const empName = emp ? (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`) : (entry.employeeName || 'Inconnu')
    const contractLabel = {
      permanent: 'Salarié Permanent',
      contractuel: 'Personnel Contractuel',
      temporaire: 'Agent Temporaire / Journalier',
      externe: 'Prestataire / Consultant Externe',
      membre: 'Membre Actif Éligible'
    }[entry.contractType || emp?.contractType || 'permanent']

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(`Bénéficiaire : ${empName}`, 18, 60)

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85)
    doc.text(`Matricule : ${emp?.matricule || entry.matricule || '—'}`, 18, 67)
    doc.text(`CIN : ${emp?.cin || '—'}`, 18, 74)
    doc.text(`Téléphone : ${emp?.telephone || '—'}`, 18, 81)

    doc.text(`Type d'engagement : ${contractLabel}`, 105, 60)
    doc.text(`Département : ${dept?.name || 'Direction Opérationnelle'}`, 105, 67)
    doc.text(`Mode de règlement : ${entry.paymentMethod || 'Virement Bancaire'}`, 105, 74)
    if (entry.paidAt) {
      doc.text(`Payé le : ${new Date(entry.paidAt).toLocaleDateString('fr-FR')}`, 105, 81)
    }

    // Breakdown Table
    const bodyRows: any[] = [
      ['Salaire de base / Rémunération contractuelle', '', Number(entry.baseSalary || 0).toLocaleString('fr-FR') + ' Ar'],
    ]

    // Primes itemized
    if (entry.primesBreakdown && entry.primesBreakdown.length > 0) {
      entry.primesBreakdown.forEach(p => {
        bodyRows.push([`  • Prime : ${p.name}`, `+ ${Number(p.amount).toLocaleString('fr-FR')} Ar`, ''])
      })
    } else if (entry.bonus && entry.bonus > 0) {
      bodyRows.push(['Primes et gratifications', `+ ${Number(entry.bonus).toLocaleString('fr-FR')} Ar`, ''])
    }

    // Indemnités itemized
    if (entry.indemnitesBreakdown && entry.indemnitesBreakdown.length > 0) {
      entry.indemnitesBreakdown.forEach(i => {
        bodyRows.push([`  • Indemnité : ${i.name}`, `+ ${Number(i.amount).toLocaleString('fr-FR')} Ar`, ''])
      })
    } else if (entry.indemnites && entry.indemnites > 0) {
      bodyRows.push(['Indemnités diverses (transport, logement)', `+ ${Number(entry.indemnites).toLocaleString('fr-FR')} Ar`, ''])
    }

    // Deductions
    const totalGains = Number(entry.baseSalary || 0) + Number(entry.bonus || 0) + Number(entry.indemnites || 0)
    const ded = Number(entry.deductions || 0)
    bodyRows.push(['Total Brut Rémunération', '', `${totalGains.toLocaleString('fr-FR')} Ar`])
    bodyRows.push(['Retenues / Déductions diverses', `-${ded.toLocaleString('fr-FR')} Ar`, ''])
    bodyRows.push(['NET À PAYER (Ariary)', '', `${Number(entry.netSalary || 0).toLocaleString('fr-FR')} Ar`])

    ;(doc as any).autoTable({
      startY: 94,
      head: [['Désignation des éléments', 'Gains / Retenues', 'Montant Net (Ar)']],
      body: bodyRows,
      theme: 'grid',
      headStyles: { fillColor: [14, 116, 144], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 3.5 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 42, halign: 'right' },
        2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
      }
    })

    const finalY = (doc as any).lastAutoTable.finalY || 160

    // Footer & Signatures
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)
    doc.text("Fait pour valoir ce que de droit.", 14, finalY + 15)

    doc.setFont('helvetica', 'bold')
    doc.text("Signature & Cachet de l'Employeur :", 14, finalY + 25)
    doc.text("Émargement du Bénéficiaire :", 125, finalY + 25)

    doc.setDrawColor(203, 213, 225)
    doc.line(14, finalY + 45, 80, finalY + 45)
    doc.line(125, finalY + 45, 190, finalY + 45)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(148, 163, 184)
    doc.text("Document généré par le Système Intégré SITE-AMM • Conforme aux règles d'audit financier.", 14, 285)

    doc.save(`Bulletin_Paie_${empName.replace(/[^a-zA-Z0-9]/g, '_')}_${entry.month}.pdf`)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Control Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-xs font-semibold uppercase tracking-wider">
              Gestion RH & Paie
            </span>
            <span className="text-xs text-slate-500">• Devise : MGA (Ariary)</span>
          </div>
          <h2 className="mt-1.5 text-2xl font-bold text-slate-100 tracking-tight">
            Gestion de Paie & Suivi Budgétaire
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Solde Salaire */}
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              isSalaryAvailable 
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' 
                : 'border-rose-500/40 bg-rose-500/10 text-rose-400'
            }`}>
              <span className={`h-2 w-2 rounded-full ${isSalaryAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {isSalaryAvailable ? 'DISPONIBILITÉ SALAIRE : OK' : 'SALAIRE : INDISPONIBLE'}
            </div>

            {(userRole === 'ADMIN' || userRole === 'DIRECTEUR') && (
              <button
                type="button"
                onClick={() => setIsSalaryAvailable(!isSalaryAvailable)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                title="Bascule manuelle de la disponibilité du compte de paie"
              >
                {isSalaryAvailable ? 'Désactiver' : 'Activer'}
              </button>
            )}
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <input 
              type="month" 
              className="bg-transparent border-none text-slate-100 text-xs font-semibold focus:outline-none"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>

          {/* Budget Setting Button */}
          <button
            type="button"
            onClick={() => setShowBudgetModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-900/30 transition"
          >
            <TrendingUp className="w-4 h-4" />
            Gérer le Budget
          </button>

          {/* Mass Payment Button */}
          {(userRole === 'ADMIN' || userRole === 'DIRECTEUR' || userRole === 'COMPTABLE') && (
            <button 
              type="button" 
              onClick={handleMassPayment}
              disabled={isProcessing || filteredEmployees.length === 0 || !isSalaryAvailable}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                isSalaryAvailable 
                  ? 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200' 
                  : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Users className="w-4 h-4" />
              Paiement en Masse ({filteredEmployees.length})
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-800 text-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Budget Management Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Allocated */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-cyan-400" />
            Budget Alloué ({selectedMonth})
          </span>
          <p className="text-xl font-extrabold text-white">
            {allocatedBudget > 0 ? `${allocatedBudget.toLocaleString('fr-FR')} Ar` : 'Non défini'}
          </p>
          <p className="text-[11px] text-slate-500">Plafond budgétaire autorisé</p>
        </div>

        {/* Consumed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
            Budget Consommé
          </span>
          <p className="text-xl font-extrabold text-indigo-400">
            {totalConsumedBudget.toLocaleString('fr-FR')} Ar
          </p>
          <p className="text-[11px] text-slate-500">{monthEntries.length} bulletins enregistrés</p>
        </div>

        {/* Remaining */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Solde Disponible
          </span>
          <p className={`text-xl font-extrabold ${remainingBudget < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {allocatedBudget > 0 ? `${remainingBudget.toLocaleString('fr-FR')} Ar` : '—'}
          </p>
          <p className="text-[11px] text-slate-500">Marge budgétaire restante</p>
        </div>

        {/* Consumption Gauge & Alert */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Taux d'engagement</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              isBudgetExceeded 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' 
                : isBudgetWarning 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {allocatedBudget > 0 ? `${budgetPercentage.toFixed(1)}%` : '0%'}
            </span>
          </div>

          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden my-2 border border-slate-800">
            <div 
              className={`h-full transition-all duration-500 ${
                isBudgetExceeded ? 'bg-rose-500' : isBudgetWarning ? 'bg-amber-500' : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(100, budgetPercentage)}%` }}
            />
          </div>

          {isBudgetExceeded ? (
            <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Budget dépassé !
            </span>
          ) : isBudgetWarning ? (
            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Seuil d'alerte ({alertThreshold}%) atteint
            </span>
          ) : (
            <span className="text-[10px] text-slate-500">Consommation dans les limites autorisées</span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left Column: Formulaire d'édition de paie */}
        <div className="xl:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              Édition d'un Bulletin de Paie
            </h3>
            <span className="text-xs text-slate-500 font-mono">{selectedMonth}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Employee Selection */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-semibold">
                Personnel Concerné (Nom ou Matricule) *
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  placeholder="Rechercher par nom ou matricule..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium mt-1.5"
              >
                <option value="">-- Sélectionner dans la liste ({filteredEmployees.length} trouvés) --</option>
                {filteredEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`} • Matr: {emp.matricule || '—'} ({emp.salaryBase || 0} Ar)
                  </option>
                ))}
              </select>
            </div>

            {/* Personnel Category & Contract Type */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Catégorie de Personnel</label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value as PersonnelCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="permanent">Salarié Permanent</option>
                  <option value="contractuel">Personnel Contractuel</option>
                  <option value="temporaire">Agent Temporaire / Journalier</option>
                  <option value="externe">Prestataire / Externe</option>
                  <option value="membre">Membre Éligible</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Salaire de Base (Ar) *</label>
                <input
                  type="number"
                  required
                  placeholder="Montant en Ar"
                  value={customBaseSalary}
                  onChange={(e) => setCustomBaseSalary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Primes & Bonus */}
            <div className="space-y-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">Primes & Bonus Personnalisés</span>
                <button
                  type="button"
                  onClick={addPrimeField}
                  className="text-[11px] text-cyan-300 hover:text-cyan-200 bg-cyan-900/40 px-2 py-0.5 rounded-lg border border-cyan-800 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              </div>

              {primesList.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="Libellé (ex: Prime de mission)"
                    value={p.name}
                    onChange={(e) => updatePrimeField(p.id, 'name', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs"
                    required
                  />
                  <input 
                    type="number"
                    placeholder="Montant"
                    value={p.amount}
                    onChange={(e) => updatePrimeField(p.id, 'amount', e.target.value)}
                    className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs font-mono"
                    required
                  />
                  <button type="button" onClick={() => removePrimeField(p.id)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {primesList.length === 0 && (
                <p className="text-[11px] text-slate-500 italic">Aucune prime spécifique saisie.</p>
              )}
            </div>

            {/* Indemnités */}
            <div className="space-y-2 p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">Indemnités Spécifiques</span>
                <button
                  type="button"
                  onClick={addIndemniteField}
                  className="text-[11px] text-cyan-300 hover:text-cyan-200 bg-cyan-900/40 px-2 py-0.5 rounded-lg border border-cyan-800 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Ajouter
                </button>
              </div>

              {indemnitesList.map((ind) => (
                <div key={ind.id} className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="Libellé (ex: Transport, Repas)"
                    value={ind.name}
                    onChange={(e) => updateIndemniteField(ind.id, 'name', e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs"
                    required
                  />
                  <input 
                    type="number"
                    placeholder="Montant"
                    value={ind.amount}
                    onChange={(e) => updateIndemniteField(ind.id, 'amount', e.target.value)}
                    className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-xs font-mono"
                    required
                  />
                  <button type="button" onClick={() => removeIndemniteField(ind.id)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {indemnitesList.length === 0 && (
                <p className="text-[11px] text-slate-500 italic">Aucune indemnité saisie.</p>
              )}
            </div>

            {/* Déductions & Mode de règlement */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Déductions / Retenues (Ar)</label>
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Mode de Paiement</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="Virement Bancaire">Virement Bancaire</option>
                  <option value="Espèces / Caisse">Espèces / Caisse</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Chèque">Chèque</option>
                </select>
              </div>
            </div>

            {/* Statut de paiement */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">Statut Initial du Bulletin</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="EN_ATTENTE">En attente de validation</option>
                <option value="VALIDE">Validé (Prêt à payer)</option>
                <option value="PAYE">Payé & Réglé</option>
              </select>
            </div>

            {/* Live Net Calculation Display */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Base :</span>
                <span>{baseSalaryNumber.toLocaleString('fr-FR')} Ar</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Primes :</span>
                <span>+ {totalPrimes.toLocaleString('fr-FR')} Ar</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Indemnités :</span>
                <span>+ {totalIndemnites.toLocaleString('fr-FR')} Ar</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Déductions :</span>
                <span>- {totalDeductions.toLocaleString('fr-FR')} Ar</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-bold text-cyan-400">
                <span>NET À PAYER :</span>
                <span>{calculatedNet.toLocaleString('fr-FR')} Ar</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-900/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isProcessing ? 'Enregistrement en cours...' : 'Enregistrer et Valider le Bulletin'}
            </button>
          </form>
        </div>

        {/* Right Column: Registre des bulletins & Filtres */}
        <div className="xl:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Registre de Paie ({filteredEntries.length})
              </h3>
              <p className="text-xs text-slate-400">Suivi des règlements et génération des fiches PDF</p>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="VALIDE">Validé</option>
                <option value="PAYE">Payé</option>
                <option value="ANNULE">Annulé</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">Toutes catégories</option>
                <option value="permanent">Permanent</option>
                <option value="contractuel">Contractuel</option>
                <option value="temporaire">Temporaire</option>
                <option value="externe">Externe</option>
                <option value="membre">Membre</option>
              </select>
            </div>
          </div>

          {/* List of Entries */}
          <div className="flex-1 overflow-y-auto max-h-[560px] space-y-2.5 pr-1">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                Aucun bulletin de paie correspondant pour {selectedMonth}.
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const emp = employees.find(e => e.id === entry.employeeId)
                const name = emp ? (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`) : (entry.employeeName || 'Bénéficiaire')
                const status = entry.status || 'VALIDE'

                return (
                  <div 
                    key={entry.id} 
                    className="p-3.5 bg-slate-950 border border-slate-800/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{name}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {emp?.matricule || entry.matricule || '—'}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          status === 'PAYE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : status === 'VALIDE'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : status === 'EN_ATTENTE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span>Période : <strong className="text-slate-300">{entry.month}</strong></span>
                        <span>•</span>
                        <span>Catégorie : <strong className="text-slate-300">{entry.contractType || emp?.contractType || 'permanent'}</strong></span>
                        <span>•</span>
                        <span>Mode : <strong className="text-slate-300">{entry.paymentMethod || 'Virement'}</strong></span>
                      </div>

                      <div className="text-xs font-mono font-bold text-emerald-400 pt-0.5">
                        Net : {Number(entry.netSalary || 0).toLocaleString('fr-FR')} Ar
                        <span className="text-slate-500 font-normal text-[10px] ml-2">
                          (Base: {Number(entry.baseSalary || 0).toLocaleString('fr-FR')} Ar)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Action to change status to PAYE */}
                      {status !== 'PAYE' && (userRole === 'ADMIN' || userRole === 'COMPTABLE' || userRole === 'DIRECTEUR') && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(entry, 'PAYE')}
                          className="p-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 rounded-xl text-xs transition"
                          title="Marquer comme Payé"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* PDF Download Button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(entry)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-xl text-xs font-medium transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Bulletin PDF
                      </button>

                      {/* Delete */}
                      {(userRole === 'ADMIN' || userRole === 'DIRECTEUR') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1.5 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded-xl transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: Définition du Budget de Paie */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Budget Prévisionnel de Paie
              </h4>
              <button 
                type="button" 
                onClick={() => setShowBudgetModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Période Concernée</label>
                <input
                  type="month"
                  disabled
                  value={selectedMonth}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Enveloppe Allouée (Ar) *</label>
                <input
                  type="number"
                  required
                  placeholder="ex: 15000000"
                  value={budgetAmountInput}
                  onChange={(e) => setBudgetAmountInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Seuil d'alerte (%) *</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  required
                  value={budgetThresholdInput}
                  onChange={(e) => setBudgetThresholdInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <span className="text-[10px] text-slate-500">Alerte déclenchée dès que ce pourcentage du budget est engagé.</span>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Observations / Notes Budgétaires</label>
                <textarea
                  rows={2}
                  placeholder="Notes justificatives ou source de financement..."
                  value={budgetNotesInput}
                  onChange={(e) => setBudgetNotesInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl"
                >
                  Enregistrer le Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
