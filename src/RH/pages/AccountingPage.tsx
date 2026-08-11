import React, { useEffect, useState } from 'react'
import { getEmployees } from '../services/employeesService'
import type { Employee } from '../types'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface AccountingEntry {
  id: string
  date: string
  pieceRef: string
  accountDebit: string
  accountCredit: string
  label: string
  amount: number
  authorRole: string
}

export const AccountingPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  
  // Napetraka ho ADMIN mivantana (Tsy misy select role intsony etsy ambony)
  const userRole = 'ADMIN'
  
  // Journal comptable
  const [journalEntries, setJournalEntries] = useState<AccountingEntry[]>([])

  // State ho an'ny Petite Caisse & Transfert
  const [caisseType, setCaisseType] = useState<'DEPOT_URGENT' | 'RETRAIT_URGENT' | 'TRANSFERT'>('DEPOT_URGENT')
  
  // Fikarohana mpiasa (Source sy Destinataire)
  const [sourceSearch, setSourceSearch] = useState('')
  const [destSearch, setDestSearch] = useState('')
  const [sourceEmp, setSourceEmp] = useState('')
  const [destEmp, setDestEmp] = useState('')

  const [amount, setAmount] = useState('')
  const [motif, setMotif] = useState('')
  const [message, setMessage] = useState('')

  const loadData = async () => {
    try {
      const empData = await getEmployees()
      setEmployees(empData || [])

      const savedJournal = localStorage.getItem('pcg_accounting_journal')
      if (savedJournal) {
        setJournalEntries(JSON.parse(savedJournal))
      } else {
        const initialSample: AccountingEntry[] = [
          {
            id: '1',
            date: new Date().toISOString().slice(0, 10),
            pieceRef: 'PC-001',
            accountDebit: '421 - Personnel, rémunérations dues',
            accountCredit: '512 - Banques',
            label: 'Paiement en masse - Salaires du mois',
            amount: 1500000,
            authorRole: 'ADMIN'
          }
        ]
        setJournalEntries(initialSample)
        localStorage.setItem('pcg_accounting_journal', JSON.stringify(initialSample))
      }
    } catch (error) {
      console.error("Erreur chargement comptabilité:", error)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const saveJournalToStorage = (newEntries: AccountingEntry[]) => {
    setJournalEntries(newEntries)
    localStorage.setItem('pcg_accounting_journal', JSON.stringify(newEntries))
  }

  // Filtrage mpiasa ho an'ny Source
  const filteredSourceEmployees = employees.filter((emp) => {
    const fullName = (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`).toLowerCase()
    const matricule = (emp.matricule || '').toLowerCase()
    const query = sourceSearch.toLowerCase()
    return fullName.includes(query) || matricule.includes(query)
  })

  // Filtrage mpiasa ho an'ny Destinataire
  const filteredDestEmployees = employees.filter((emp) => {
    const fullName = (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`).toLowerCase()
    const matricule = (emp.matricule || '').toLowerCase()
    const query = destSearch.toLowerCase()
    return fullName.includes(query) || matricule.includes(query)
  })

  // Fikarakarana ny Petite Caisse / Transfert
  const handleCaisseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      alert("Ampidiro ny vola marina.")
      return
    }

    const val = Number(amount)
    let newEntry: AccountingEntry | null = null
    const today = new Date().toISOString().slice(0, 10)

    if (caisseType === 'DEPOT_URGENT') {
      if (!sourceEmp) { alert("Safidio ny mpiasa handraisana ny vola."); return; }
      const emp = employees.find(emp => emp.id === sourceEmp)
      const empName = emp ? (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`) : 'Mpiasa'

      newEntry = {
        id: Date.now().toString(),
        date: today,
        pieceRef: `CAISSE-${Math.floor(100 + Math.random() * 900)}`,
        accountDebit: '531 - Caisse',
        accountCredit: '421 - Personnel (' + empName + ')',
        label: `Dépôt caisse / Avance : ${motif || 'Versement exceptionnel'}`,
        amount: val,
        authorRole: userRole
      }
    } else if (caisseType === 'RETRAIT_URGENT') {
      if (!sourceEmp) { alert("Safidio ny mpiasa hanaovana ny fivoahana."); return; }
      const emp = employees.find(emp => emp.id === sourceEmp)
      const empName = emp ? (emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`) : 'Mpiasa'

      newEntry = {
        id: Date.now().toString(),
        date: today,
        pieceRef: `CAISSE-${Math.floor(100 + Math.random() * 900)}`,
        accountDebit: '421 - Personnel (' + empName + ')',
        accountCredit: '531 - Caisse',
        label: `Retrait caisse / Décaissement : ${motif || 'Frais divers'}`,
        amount: val,
        authorRole: userRole
      }
    } else if (caisseType === 'TRANSFERT') {
      if (!sourceEmp || !destEmp) { alert("Safidio ny mpiasa roa hanaovana ny transfert."); return; }
      if (sourceEmp === destEmp) { alert("Tsy afaka atao mitovy ny mpiasa mandefa sy mandray."); return; }
      
      const empSrc = employees.find(e => e.id === sourceEmp)
      const empDst = employees.find(e => e.id === destEmp)
      const nameSrc = empSrc ? (empSrc.anarana || `${empSrc.prenom ?? ''} ${empSrc.nom ?? ''}`) : 'Src'
      const nameDst = empDst ? (empDst.anarana || `${empDst.prenom ?? ''} ${empDst.nom ?? ''}`) : 'Dst'

      newEntry = {
        id: Date.now().toString(),
        date: today,
        pieceRef: `TRF-${Math.floor(100 + Math.random() * 900)}`,
        accountDebit: `421 - Compte Personnel (${nameDst})`,
        accountCredit: `421 - Compte Personnel (${nameSrc})`,
        label: `Transfert entre employés : ${motif || 'Ajustement interne'}`,
        amount: val,
        authorRole: userRole
      }
    }

    if (newEntry) {
      const updated = [newEntry, ...journalEntries]
      saveJournalToStorage(updated)
      setMessage('Opération de caisse enregistrée dans le Journal avec succès !')
      setAmount('')
      setMotif('')
      setSourceEmp('')
      setDestEmp('')
      setSourceSearch('')
      setDestSearch('')
      setTimeout(() => setMessage(''), 4000)
    }
  }

  // Fanafoanana / Annulation écriture (Admin ihany)
  const handleCancelEntry = (id: string, pieceRef: string) => {
    if (!window.confirm(`Voulez-vous vraiment annuler/supprimer l'écriture comptable N° ${pieceRef} ? Cette action est réservée à l'Administrateur.`)) {
      return
    }
    const updated = journalEntries.filter(item => item.id !== id)
    saveJournalToStorage(updated)
    setMessage(`L'écriture ${pieceRef} a été annulée avec succès.`)
    setTimeout(() => setMessage(''), 4000)
  }

  // Fanaovana Téléchargement PDF an'ny Journal (PCG 2005)
  const handleDownloadJournalPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setTextColor(14, 116, 144)
    doc.text("JOURNAL GÉNÉRAL COMPTABLE (PCG 2005)", 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Date d'édition : ${new Date().toLocaleDateString()}`, 14, 28)
    doc.text(`Référence légale : Plan Comptable Général 2005 (Madagascar)`, 14, 34)

    const tableRows = journalEntries.map((item) => [
      item.date,
      item.pieceRef,
      item.label,
      item.accountDebit,
      item.accountCredit,
      item.amount.toLocaleString('en-US').replace(/,/g, ' ') + ' Ar'
    ])

    ;(doc as autoTable).autoTable({
      startY: 42,
      head: [['Date', 'N° Pièce', 'Libellé des Opérations', 'Débit (Compte)', 'Crédit (Compte)', 'Montant']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [14, 116, 144] },
      columnStyles: { 5: { halign: 'right' } }
    })

    const finalY = (doc as any).lastAutoTable.finalY || 100
    doc.text("Visa / Signature Administrateur :", 14, finalY + 20)

    doc.save(`Journal_Comptable_PCG2005_${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Comptabilité Générale</p>
          <h2 className="mt-2 text-3xl font-semibold">Journal des Débits et Crédits (PCG 2005)</h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300 font-semibold">
            Mode : ADMINISTRATEUR
          </span>
        </div>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-300 text-sm font-medium">
          {message}
        </div>
      ) : null}

      {/* Fizarana Petite Caisse & Opérations */}
      <div className="rounded-2xl border border-amber-500/30 bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-amber-300">Petite Caisse & Opérations Ponctuelles</h3>
            <p className="text-xs text-slate-400 mt-0.5">Enregistrement des flux de caisse d'urgence ou transferts inter-employés</p>
          </div>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-300 font-medium">
            Admin Panel
          </span>
        </div>

        <form onSubmit={handleCaisseSubmit} className="grid gap-4 md:grid-cols-3 pt-2">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Type d'opération</label>
            <select 
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={caisseType}
              onChange={(e) => setCaisseType(e.target.value as any)}
            >
              <option value="DEPOT_URGENT">Dépôt / Avance (Entrée Caisse)</option>
              <option value="RETRAIT_URGENT">Retrait / Décaissement (Sortie Caisse)</option>
              <option value="TRANSFERT">Transfert entre deux comptes employés</option>
            </select>
          </div>

          {/* Source / Employé concerné avec recherche par Nom ou Matricule */}
          <div>
            <label className="mb-1 block text-xs text-slate-400">
              {caisseType === 'TRANSFERT' ? 'Employé Mandataire (Source)' : 'Employé concerné'}
            </label>
            <input 
              type="text"
              placeholder="Filtrer par nom ou matricule..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 mb-1"
              value={sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
            />
            <select 
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={sourceEmp}
              onChange={(e) => setSourceEmp(e.target.value)}
              required
            >
              <option value="">Sélectionner ({filteredSourceEmployees.length})</option>
              {filteredSourceEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.matricule ? `[${emp.matricule}] ` : ''}{emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`}
                </option>
              ))}
            </select>
          </div>

          {/* Destinataire si Transfert */}
          {caisseType === 'TRANSFERT' ? (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Employé Bénéficiaire (Destination)</label>
              <input 
                type="text"
                placeholder="Filtrer par nom ou matricule..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 mb-1"
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
              />
              <select 
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                value={destEmp}
                onChange={(e) => setDestEmp(e.target.value)}
                required
              >
                <option value="">Sélectionner ({filteredDestEmployees.length})</option>
                {filteredDestEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.matricule ? `[${emp.matricule}] ` : ''}{emp.anarana || `${emp.prenom ?? ''} ${emp.nom ?? ''}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Montant (Ar)</label>
              <input 
                type="number"
                placeholder="0"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          )}

          {caisseType === 'TRANSFERT' && (
            <div>
              <label className="mb-1 block text-xs text-slate-400">Montant (Ar)</label>
              <input 
                type="number"
                placeholder="0"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          )}

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">Motif ou Libellé de l'opération</label>
            <input 
              type="text"
              placeholder="Ex: Avance sur salaire exceptionnelle / Remboursement frais..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button 
              type="submit"
              className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition"
            >
              Valider l'opération
            </button>
          </div>
        </form>
      </div>

      {/* Journal Général Débit / Crédit (PCG 2005) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Journal Général des Opérations (PCG 2005)</h3>
            <p className="text-xs text-slate-400">Enregistrements automatiques (Paiements de masse, Caisse, Transferts)</p>
          </div>

          <button 
            type="button"
            onClick={handleDownloadJournalPDF}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition flex items-center justify-center gap-2"
          >
            Télécharger le Journal PDF
          </button>
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">N° Pièce</th>
                <th className="px-3 py-3">Libellé</th>
                <th className="px-3 py-3">Débit (Compte)</th>
                <th className="px-3 py-3">Crédit (Compte)</th>
                <th className="px-3 py-3 text-right">Montant (Ar)</th>
                <th className="px-3 py-3 text-center">Actions (Admin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {journalEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                    Aucune écriture enregistrée dans le journal.
                  </td>
                </tr>
              ) : (
                journalEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-950/40 transition">
                    <td className="px-3 py-3 font-mono text-xs text-slate-400">{item.date}</td>
                    <td className="px-3 py-3 font-mono text-xs text-cyan-400">{item.pieceRef}</td>
                    <td className="px-3 py-3 text-slate-200 font-medium">{item.label}</td>
                    <td className="px-3 py-3 text-xs text-emerald-400 font-mono">{item.accountDebit}</td>
                    <td className="px-3 py-3 text-xs text-rose-400 font-mono">{item.accountCredit}</td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-100 font-mono">
                      {item.amount.toLocaleString('en-US').replace(/,/g, ' ')} Ar
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button 
                        type="button"
                        onClick={() => handleCancelEntry(item.id, item.pieceRef)}
                        className="rounded bg-rose-500/20 px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/30 transition"
                        title="Annuler ou supprimer cette écriture en cas d'erreur"
                      >
                        Annuler
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}