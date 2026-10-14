import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  UserCheck,
  UserX,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Trash2,
  Edit2,
  Info,
  Check,
  User,
  Building,
  Briefcase,
  Phone
} from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

import { getEmployees, getDepartments, getPositions } from '../services/employeesService'
import {
  getAttendance,
  saveAttendanceRecord,
  deleteAttendanceRecord,
  auditAttendanceData,
  type AttendanceAnomaly
} from '../services/attendanceService'
import type { Employee, AttendanceRecord, Department, Position } from '../types'
import {
  getEmployeeFullName,
  getEmployeeMatricule,
  findEmployeeByMatricule,
  isEmployeeActive,
  resolveDepartmentName,
  resolvePositionName
} from '../utils/employeeUtils'

export const AttendancePage: React.FC = () => {
  // Données principales
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Navigation & Onglets
  const [activeTab, setActiveTab] = useState<'journal' | 'express' | 'audit'>('journal')

  // Filtres
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [search, setSearch] = useState<string>('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Notification / Feedback
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  } | null>(null)

  // Formulaire Pointage Express par Matricule
  const [matriculeInput, setMatriculeInput] = useState<string>('')
  const [matchedEmployee, setMatchedEmployee] = useState<Employee | null>(null)
  const [searchAttempted, setSearchAttempted] = useState<boolean>(false)
  const [expressStatus, setExpressStatus] = useState<'PRESENT' | 'RETARD' | 'ABSENT' | 'CONGE'>('PRESENT')
  const [expressTime, setExpressTime] = useState<string>(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [expressNote, setExpressNote] = useState<string>('')
  const [isSubmittingExpress, setIsSubmittingExpress] = useState(false)

  // Modal d'édition détaillée
  const [editingRecord, setEditingRecord] = useState<{
    record: AttendanceRecord
    employee: Employee | null
  } | null>(null)

  // Chargement des données
  const loadData = async () => {
    setLoading(true)
    try {
      const [empData, deptData, posData, attData] = await Promise.all([
        getEmployees(),
        getDepartments(),
        getPositions(),
        getAttendance()
      ])
      setEmployees(empData || [])
      setDepartments(deptData || [])
      setPositions(posData || [])
      setRecords(attData || [])
    } catch (error) {
      console.error('Erreur chargement données de présence:', error)
      showNotification('error', 'Impossible de charger les données RH.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string
  ) => {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr))
    }, 4500)
  }

  // Synchronisation dynamique lors de la frappe du matricule
  useEffect(() => {
    const trimmed = matriculeInput.trim()
    if (!trimmed) {
      setMatchedEmployee(null)
      setSearchAttempted(false)
      return
    }

    setSearchAttempted(true)
    const found = findEmployeeByMatricule(employees, trimmed)
    setMatchedEmployee(found)
  }, [matriculeInput, employees])

  // Map des pointages pour la date sélectionnée (clé: employeeId)
  const dateRecordsMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>()
    records
      .filter((r) => r.date === selectedDate)
      .forEach((r) => {
        // En cas d'historique multiple à la même date, on privilégie l'enregistrement le plus récent
        map.set(r.employeeId, r)
      })
    return map
  }, [records, selectedDate])

  // Statut actuel du membre sélectionné pour la date du formulaire express
  const expressExistingRecord = useMemo(() => {
    if (!matchedEmployee) return null
    return records.find(
      (r) => r.employeeId === matchedEmployee.id && r.date === selectedDate
    ) || null
  }, [matchedEmployee, records, selectedDate])

  // Statistiques du jour
  const stats = useMemo(() => {
    const activeEmps = employees.filter((e) => e.status === 'Active')
    const totalActive = activeEmps.length
    let presents = 0
    let retards = 0
    let absents = 0
    let conges = 0

    activeEmps.forEach((emp) => {
      const rec = dateRecordsMap.get(emp.id)
      if (rec) {
        const st = (rec.status || '').toUpperCase()
        if (st === 'PRESENT') presents++
        else if (st === 'RETARD' || st === 'LATE') retards++
        else if (st === 'ABSENT') absents++
        else if (st === 'CONGE') conges++
      }
    })

    const pointes = presents + retards + absents + conges
    const nonPointes = Math.max(0, totalActive - pointes)
    const tauxPresence = totalActive > 0 ? Math.round(((presents + retards) / totalActive) * 100) : 0

    return { totalActive, presents, retards, absents, conges, nonPointes, tauxPresence }
  }, [employees, dateRecordsMap])

  // Filtrage du tableau
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // 1. Filtre département
      if (departmentFilter !== 'all' && emp.departmentId !== departmentFilter) {
        return false
      }

      // 2. Filtre statut présence
      const rec = dateRecordsMap.get(emp.id)
      const currentStatus = rec ? (rec.status || '').toUpperCase() : 'NON_POINTE'

      if (statusFilter !== 'all') {
        if (statusFilter === 'NON_POINTE' && currentStatus !== 'NON_POINTE') return false
        if (statusFilter === 'PRESENT' && currentStatus !== 'PRESENT') return false
        if (statusFilter === 'RETARD' && currentStatus !== 'RETARD' && currentStatus !== 'LATE') return false
        if (statusFilter === 'ABSENT' && currentStatus !== 'ABSENT') return false
        if (statusFilter === 'CONGE' && currentStatus !== 'CONGE') return false
      }

      // 3. Recherche texte (matricule, nom complet, téléphone, poste, département)
      if (search.trim()) {
        const query = search.toLowerCase()
        const fullName = getEmployeeFullName(emp).toLowerCase()
        const matricule = getEmployeeMatricule(emp).toLowerCase()
        const deptName = resolveDepartmentName(emp.departmentId, departments).toLowerCase()
        const posName = resolvePositionName(emp.positionId, positions).toLowerCase()
        const phone = (emp.telephone || '').toLowerCase()

        return (
          fullName.includes(query) ||
          matricule.includes(query) ||
          deptName.includes(query) ||
          posName.includes(query) ||
          phone.includes(query)
        )
      }

      return true
    })
  }, [employees, departmentFilter, statusFilter, search, dateRecordsMap, departments, positions])

  // Traitement du pointage rapide depuis le tableau
  const handleDirectPointage = async (
    employee: Employee,
    type: 'PRESENT' | 'ABSENT' | 'CONGE' | 'RETARD'
  ) => {
    // Règle 5: Si membre inactif, interdire
    if (!isEmployeeActive(employee)) {
      showNotification('error', `Action refusée : ${getEmployeeFullName(employee)} est inactif dans la base RH.`)
      return
    }

    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    try {
      const result = await saveAttendanceRecord({
        employeeId: employee.id,
        matricule: getEmployeeMatricule(employee),
        employeeName: getEmployeeFullName(employee),
        departmentName: resolveDepartmentName(employee.departmentId, departments),
        positionName: resolvePositionName(employee.positionId, positions),
        date: selectedDate,
        checkIn: type === 'ABSENT' ? undefined : currentTime,
        status: type,
        createdAt: new Date().toISOString()
      }, false)

      // Rafraîchir l'état local immédiatement
      const updatedRecs = await getAttendance()
      setRecords(updatedRecs)

      showNotification(
        'success',
        result.isUpdate
          ? `Pointage mis à jour pour ${getEmployeeFullName(employee)} : ${type}`
          : `Pointage enregistré pour ${getEmployeeFullName(employee)} : ${type}`
      )
    } catch (error) {
      console.error('Erreur pointage direct:', error)
      showNotification('error', 'Erreur lors de l’enregistrement du pointage.')
    }
  }

  // Soumission du formulaire Express par Matricule
  const handleExpressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Règle 4: Si matricule introuvable, afficher message clair et empêcher
    if (!matchedEmployee) {
      showNotification('error', 'Matricule introuvable dans la base RH. Enregistrement impossible.')
      return
    }

    // Règle 5: Si matricule désactivé ou membre inactif
    if (!isEmployeeActive(matchedEmployee)) {
      showNotification(
        'error',
        `Enregistrement refusé : Le membre ${getEmployeeFullName(matchedEmployee)} (${getEmployeeMatricule(matchedEmployee)}) est désactivé dans la base RH.`
      )
      return
    }

    setIsSubmittingExpress(true)
    try {
      const isExisting = Boolean(expressExistingRecord)
      const res = await saveAttendanceRecord({
        id: expressExistingRecord?.id,
        employeeId: matchedEmployee.id,
        matricule: getEmployeeMatricule(matchedEmployee),
        employeeName: getEmployeeFullName(matchedEmployee),
        departmentName: resolveDepartmentName(matchedEmployee.departmentId, departments),
        positionName: resolvePositionName(matchedEmployee.positionId, positions),
        date: selectedDate,
        checkIn: expressStatus === 'ABSENT' ? undefined : expressTime,
        status: expressStatus,
        note: expressNote.trim() || undefined,
        createdAt: expressExistingRecord?.createdAt || new Date().toISOString()
      }, false)

      const updatedRecs = await getAttendance()
      setRecords(updatedRecs)

      showNotification(
        'success',
        isExisting
          ? `Présence mise à jour sans doublon pour ${getEmployeeFullName(matchedEmployee)} (${expressStatus}).`
          : `Pointage enregistré avec succès pour ${getEmployeeFullName(matchedEmployee)} (${expressStatus}).`
      )

      // Réinitialisation du champ pour le pointage suivant
      setMatriculeInput('')
      setMatchedEmployee(null)
      setSearchAttempted(false)
      setExpressNote('')
    } catch (error) {
      console.error('Erreur soumission pointage express:', error)
      showNotification('error', 'Échec de l’enregistrement de la présence.')
    } finally {
      setIsSubmittingExpress(false)
    }
  }

  // Sauvegarde des modifications du modal
  const handleSaveModalEdit = async () => {
    if (!editingRecord) return

    try {
      await saveAttendanceRecord({
        id: editingRecord.record.id,
        employeeId: editingRecord.record.employeeId,
        matricule: editingRecord.record.matricule,
        employeeName: editingRecord.record.employeeName,
        date: editingRecord.record.date,
        checkIn: editingRecord.record.checkIn,
        checkOut: editingRecord.record.checkOut,
        status: editingRecord.record.status,
        note: editingRecord.record.note,
        createdAt: editingRecord.record.createdAt
      }, false)

      const updated = await getAttendance()
      setRecords(updated)
      setEditingRecord(null)
      showNotification('success', 'Fiche de présence mise à jour.')
    } catch (error) {
      console.error('Erreur mise à jour présence:', error)
      showNotification('error', 'Impossible de mettre à jour la présence.')
    }
  }

  // Suppression d'un pointage
  const handleDeleteRecord = async (recordId: string, employeeName: string) => {
    if (!window.confirm(`Confirmez-vous la suppression du pointage pour ${employeeName} ?`)) {
      return
    }

    try {
      await deleteAttendanceRecord(recordId)
      const updated = await getAttendance()
      setRecords(updated)
      showNotification('info', `Pointage supprimé pour ${employeeName}.`)
    } catch (error) {
      console.error('Erreur suppression pointage:', error)
      showNotification('error', 'Erreur lors de la suppression.')
    }
  }

  // Audit des données existantes
  const anomalies = useMemo(() => {
    return auditAttendanceData(records, employees)
  }, [records, employees])

  // Export PDF Officiel
  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4')

    // En-tête
    doc.setFillColor(15, 23, 42) // Slate 900
    doc.rect(0, 0, 210, 32, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('JOURNAL OFFICIEL DE POINTAGE DES PRÉSENCES RH', 14, 15)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.text(`Date de contrôle : ${selectedDate}   |   Total effectif actif : ${stats.totalActive} collaborateurs`, 14, 24)

    // Bandeau récapitulatif
    doc.setFillColor(241, 245, 249)
    doc.rect(14, 36, 182, 14, 'F')
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(9)
    doc.text(
      `Présents : ${stats.presents}    |    Retards : ${stats.retards}    |    Absents : ${stats.absents}    |    Congés : ${stats.conges}    |    Taux de présence : ${stats.tauxPresence}%`,
      18,
      45
    )

    // Données du tableau
    const tableData = filteredEmployees.map((emp) => {
      const rec = dateRecordsMap.get(emp.id)
      const mat = getEmployeeMatricule(emp)
      const nom = getEmployeeFullName(emp)
      const dept = resolveDepartmentName(emp.departmentId, departments)
      const pos = resolvePositionName(emp.positionId, positions)
      const statut = rec ? (rec.status || 'Non défini').toUpperCase() : 'NON POINTÉ'
      const heure = rec?.checkIn || '—'
      const obs = rec?.note || (emp.status === 'Inactive' ? '[Inactif]' : '—')

      return [mat, nom, `${dept}\n${pos}`, heure, statut, obs]
    })

    ;(doc as any).autoTable({
      head: [['Matricule', 'Nom Complet du Collaborateur', 'Département / Poste', 'Heure', 'Statut', 'Observations']],
      body: tableData,
      startY: 55,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 3.5,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: 'bold', halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 42 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 20 }
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 4) {
          const val = String(data.cell.raw).toUpperCase()
          if (val === 'PRESENT') {
            data.cell.styles.textColor = [16, 185, 129] // Emerald
          } else if (val === 'RETARD') {
            data.cell.styles.textColor = [59, 130, 246] // Blue
          } else if (val === 'ABSENT') {
            data.cell.styles.textColor = [239, 68, 68] // Red
          } else if (val === 'CONGE') {
            data.cell.styles.textColor = [245, 158, 11] // Amber
          } else {
            data.cell.styles.textColor = [148, 163, 184] // Gray
          }
        }
      }
    })

    const finalY = (doc as any).lastAutoTable?.finalY || 160
    const pageHeight = doc.internal.pageSize.height

    const signatureY = finalY + 25 > pageHeight - 30 ? pageHeight - 35 : finalY + 20

    doc.setFontSize(9)
    doc.setTextColor(71, 85, 105)
    doc.text('Visa du Responsable RH :', 20, signatureY)
    doc.line(20, signatureY + 15, 75, signatureY + 15)

    doc.text('Visa de la Direction Générale :', 135, signatureY)
    doc.line(135, signatureY + 15, 190, signatureY + 15)

    doc.save(`Pointage_RH_${selectedDate}.pdf`)
    showNotification('success', 'Rapport de pointage exporté en PDF.')
  }

  // Export Excel / CSV
  const exportCSV = () => {
    const headers = [
      'Matricule',
      'Nom Complet',
      'Département',
      'Poste',
      'Statut RH',
      'Date',
      'Statut Présence',
      'Heure Pointage',
      'Observations'
    ]

    const rows = filteredEmployees.map((emp) => {
      const rec = dateRecordsMap.get(emp.id)
      return [
        `"${getEmployeeMatricule(emp)}"`,
        `"${getEmployeeFullName(emp).replace(/"/g, '""')}"`,
        `"${resolveDepartmentName(emp.departmentId, departments).replace(/"/g, '""')}"`,
        `"${resolvePositionName(emp.positionId, positions).replace(/"/g, '""')}"`,
        `"${emp.status || 'Active'}"`,
        `"${selectedDate}"`,
        `"${rec ? (rec.status || 'Non défini').toUpperCase() : 'NON POINTÉ'}"`,
        `"${rec?.checkIn || '—'}"`,
        `"${(rec?.note || '').replace(/"/g, '""')}"`
      ]
    })

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `Pointage_RH_${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showNotification('success', 'Export CSV (compatible Excel) généré avec succès.')
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm transition-all transform animate-in fade-in slide-in-from-top-4 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-700 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-700 text-rose-200'
              : notification.type === 'warning'
              ? 'bg-amber-950/90 border-amber-700 text-amber-200'
              : 'bg-cyan-950/90 border-cyan-700 text-cyan-200'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          {notification.type === 'info' && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Titre & En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-bold bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/50">
              Module Présence RH
            </span>
            <span className="text-xs text-slate-400">| Contrôle & Pointage du Personnel</span>
          </div>
          <h2 className="mt-2 text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Gestion des Présences & Pointage
          </h2>
        </div>

        {/* Boutons d'exportation */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-sm font-semibold text-white transition shadow-sm"
            title="Exporter le journal en PDF"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>PDF</span>
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-sm font-semibold text-white transition shadow-sm"
            title="Exporter pour Microsoft Excel (CSV UTF-8)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel / CSV</span>
          </button>
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2 text-slate-300 transition"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Barre d'onglets principale */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'journal'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Journal de Pointage Journalier</span>
        </button>

        <button
          onClick={() => setActiveTab('express')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'express'
              ? 'border-cyan-500 text-cyan-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Pointage Express par Matricule</span>
          {matchedEmployee && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition ${
            activeTab === 'audit'
              ? 'border-amber-500 text-amber-400 bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Contrôle & Cohérence des Données</span>
          {anomalies.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {anomalies.length}
            </span>
          )}
        </button>
      </div>

      {/* Cartes KPI récapitulatives */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5">
          <p className="text-xs font-medium text-slate-400">Effectif Actif</p>
          <p className="mt-1 text-2xl font-bold text-white">{stats.totalActive}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Membres autorisés</p>
        </div>

        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-400">Présents</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-300">{stats.presents}</p>
          <p className="text-[11px] text-emerald-400/70 mt-0.5">À l'heure</p>
        </div>

        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-blue-400">Retards</p>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-blue-300">{stats.retards}</p>
          <p className="text-[11px] text-blue-400/70 mt-0.5">Arrivée tardive</p>
        </div>

        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-rose-400">Absents</p>
            <UserX className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-rose-300">{stats.absents}</p>
          <p className="text-[11px] text-rose-400/70 mt-0.5">Non présent(e)s</p>
        </div>

        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-amber-400">Congés</p>
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-300">{stats.conges}</p>
          <p className="text-[11px] text-amber-400/70 mt-0.5">Permission / Congé</p>
        </div>

        <div className="rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-cyan-400">Taux de Présence</p>
            <span className="text-[11px] font-bold text-cyan-400">{stats.tauxPresence}%</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-cyan-300">{stats.tauxPresence}%</p>
          <p className="text-[11px] text-cyan-400/70 mt-0.5">{stats.nonPointes} non pointé(s)</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VUE 1 : JOURNAL DE POINTAGE JOURNALIER                                    */}
      {/* ========================================================================= */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          {/* Barre de Filtres et Outils */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Date de contrôle
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    title="Aujourd'hui"
                  >
                    Auj.
                  </button>
                </div>
              </div>

              {/* Filtre Département */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Département
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">Tous les départements ({departments.length})</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre Statut de Présence */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Statut de présence
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="PRESENT">Présent(e)</option>
                  <option value="RETARD">En retard</option>
                  <option value="ABSENT">Absent(e)</option>
                  <option value="CONGE">En congé / Autorisé</option>
                  <option value="NON_POINTE">Non encore pointé</option>
                </select>
              </div>

              {/* Recherche libre */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Rechercher
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Matricule, nom, poste..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-2.5 text-xs text-slate-500 hover:text-slate-300"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des Employés & Pointage */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Matricule</th>
                    <th className="py-3.5 px-4 font-semibold">Membre du Personnel (RH)</th>
                    <th className="py-3.5 px-4 font-semibold">Département & Poste</th>
                    <th className="py-3.5 px-4 font-semibold">Statut RH</th>
                    <th className="py-3.5 px-4 font-semibold">Statut Pointage</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Heure</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Actions de Pointage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-sm">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <UsersIcon className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                        <p className="font-medium text-slate-400">Aucun employé ne correspond aux critères.</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Vérifiez les filtres de recherche ou sélectionnez une autre date.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const rec = dateRecordsMap.get(emp.id)
                      const currentStatus = rec ? (rec.status || '').toUpperCase() : null
                      const isActive = isEmployeeActive(emp)
                      const fullName = getEmployeeFullName(emp)
                      const matricule = getEmployeeMatricule(emp)
                      const deptName = resolveDepartmentName(emp.departmentId, departments)
                      const posName = resolvePositionName(emp.positionId, positions)

                      return (
                        <tr
                          key={emp.id}
                          className={`transition ${
                            !isActive
                              ? 'bg-rose-950/10 hover:bg-rose-950/20'
                              : 'hover:bg-slate-800/50'
                          }`}
                        >
                          {/* Matricule garanti exact */}
                          <td className="py-3 px-4 font-mono font-medium text-cyan-300">
                            <span className="inline-block px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/50 text-xs">
                              {matricule}
                            </span>
                          </td>

                          {/* Nom complet garanti associé au matricule */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-100 flex items-center gap-2">
                              <span>{fullName}</span>
                              {emp.telephone && (
                                <span className="text-xs text-slate-500 font-normal">
                                  ({emp.telephone})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              ID RH: {emp.id}
                            </div>
                          </td>

                          {/* Département & Poste */}
                          <td className="py-3 px-4 text-xs text-slate-300">
                            <div className="font-medium text-slate-200">{deptName}</div>
                            <div className="text-slate-400">{posName}</div>
                          </td>

                          {/* Statut RH */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                                isActive
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-400' : 'bg-rose-400'
                                }`}
                              ></span>
                              {isActive ? 'Actif' : 'Inactif'}
                            </span>
                          </td>

                          {/* Statut du pointage du jour */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : currentStatus === 'ABSENT'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : currentStatus === 'CONGE'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : currentStatus === 'RETARD' || currentStatus === 'LATE'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                              }`}
                            >
                              {currentStatus === 'PRESENT'
                                ? 'Présent'
                                : currentStatus === 'ABSENT'
                                ? 'Absent'
                                : currentStatus === 'CONGE'
                                ? 'En Congé'
                                : currentStatus === 'RETARD' || currentStatus === 'LATE'
                                ? 'En Retard'
                                : 'Non pointé'}
                            </span>
                            {rec?.note && (
                              <p className="text-[11px] text-slate-400 italic mt-0.5 max-w-[160px] truncate" title={rec.note}>
                                📝 {rec.note}
                              </p>
                            )}
                          </td>

                          {/* Heure */}
                          <td className="py-3 px-4 text-center font-mono text-xs text-slate-300">
                            {rec?.checkIn || '—'}
                          </td>

                          {/* Actions de Pointage Direct */}
                          <td className="py-3 px-4 text-center">
                            {isActive ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleDirectPointage(emp, 'PRESENT')}
                                  title="Marquer Présent"
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                                    currentStatus === 'PRESENT'
                                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
                                      : 'bg-slate-800 text-slate-300 hover:bg-emerald-900/60 hover:text-emerald-300 border border-slate-700'
                                  }`}
                                >
                                  P
                                </button>
                                <button
                                  onClick={() => handleDirectPointage(emp, 'RETARD')}
                                  title="Marquer en Retard"
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                                    currentStatus === 'RETARD' || currentStatus === 'LATE'
                                      ? 'bg-blue-600 text-white ring-2 ring-blue-400/50'
                                      : 'bg-slate-800 text-slate-300 hover:bg-blue-900/60 hover:text-blue-300 border border-slate-700'
                                  }`}
                                >
                                  R
                                </button>
                                <button
                                  onClick={() => handleDirectPointage(emp, 'ABSENT')}
                                  title="Marquer Absent"
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                                    currentStatus === 'ABSENT'
                                      ? 'bg-rose-600 text-white ring-2 ring-rose-400/50'
                                      : 'bg-slate-800 text-slate-300 hover:bg-rose-900/60 hover:text-rose-300 border border-slate-700'
                                  }`}
                                >
                                  A
                                </button>
                                <button
                                  onClick={() => handleDirectPointage(emp, 'CONGE')}
                                  title="Marquer en Congé"
                                  className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                                    currentStatus === 'CONGE'
                                      ? 'bg-amber-600 text-white ring-2 ring-amber-400/50'
                                      : 'bg-slate-800 text-slate-300 hover:bg-amber-900/60 hover:text-amber-300 border border-slate-700'
                                  }`}
                                >
                                  C
                                </button>

                                {rec && (
                                  <>
                                    <button
                                      onClick={() => setEditingRecord({ record: rec, employee: emp })}
                                      title="Modifier l'heure ou la note"
                                      className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition ml-1"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRecord(rec.id, fullName)}
                                      title="Supprimer ce pointage"
                                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-rose-400/80 italic">
                                Membre inactif (pointage bloqué)
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 2 : POINTAGE EXPRESS PAR MATRICULE                                    */}
      {/* ========================================================================= */}
      {activeTab === 'express' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulaire de saisie par matricule */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                Saisie & Pointage Immédiat par Matricule
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Saisissez ou choisissez un matricule. Le système recherche automatiquement le membre du personnel
                associé et vérifie son statut RH avant d'autoriser l'enregistrement.
              </p>
            </div>

            <form onSubmit={handleExpressSubmit} className="space-y-5">
              {/* Saisie du matricule avec autocomplétion / suggestion */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Matricule RH du Collaborateur *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Ex: AMM-RH-00001, RH-00002..."
                      value={matriculeInput}
                      onChange={(e) => setMatriculeInput(e.target.value)}
                      className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-slate-100 font-mono tracking-wide placeholder-slate-600 focus:outline-none transition ${
                        searchAttempted && !matchedEmployee
                          ? 'border-rose-500 focus:border-rose-400 bg-rose-950/20'
                          : matchedEmployee
                          ? 'border-emerald-500 focus:border-emerald-400 bg-emerald-950/10'
                          : 'border-slate-700 focus:border-cyan-500'
                      }`}
                      autoFocus
                    />
                    {matchedEmployee && (
                      <Check className="w-5 h-5 text-emerald-400 absolute right-3 top-3.5" />
                    )}
                  </div>

                  {/* Menu sélecteur rapide */}
                  <select
                    value={matchedEmployee ? matchedEmployee.id : ''}
                    onChange={(e) => {
                      const emp = employees.find((x) => x.id === e.target.value)
                      if (emp) {
                        setMatriculeInput(getEmployeeMatricule(emp))
                      }
                    }}
                    className="w-48 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">Sélectionner dans la liste...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {getEmployeeMatricule(emp)} — {getEmployeeFullName(emp)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exigence 4 : Message d'erreur clair si matricule introuvable */}
                {searchAttempted && !matchedEmployee && (
                  <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-rose-800/80 bg-rose-950/60 p-3 text-rose-300 text-xs">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-rose-200">Matricule introuvable dans la base RH</p>
                      <p className="mt-0.5 text-rose-300/80">
                        Aucun employé ne correspond au matricule "{matriculeInput}". Veuillez vérifier la saisie ou
                        créer la fiche employé dans le module RH.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Paramètres du pointage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date du pointage
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Heure */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Heure d'arrivée / enregistrement
                  </label>
                  <input
                    type="time"
                    value={expressTime}
                    onChange={(e) => setExpressTime(e.target.value)}
                    disabled={expressStatus === 'ABSENT'}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 disabled:opacity-40 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Statut de présence */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Statut à appliquer
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setExpressStatus('PRESENT')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      expressStatus === 'PRESENT'
                        ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    Présent
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpressStatus('RETARD')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      expressStatus === 'RETARD'
                        ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    En Retard
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpressStatus('ABSENT')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      expressStatus === 'ABSENT'
                        ? 'bg-rose-600 text-white border-rose-500 ring-2 ring-rose-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpressStatus('CONGE')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center ${
                      expressStatus === 'CONGE'
                        ? 'bg-amber-600 text-white border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    En Congé
                  </button>
                </div>
              </div>

              {/* Note / Observation */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observation ou motif (facultatif)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Retard justifié transport, mission extérieure, certificat médical..."
                  value={expressNote}
                  onChange={(e) => setExpressNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Exigence 6 : Avertissement si un pointage existe déjà à cette date */}
              {matchedEmployee && expressExistingRecord && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-800/80 bg-amber-950/50 p-3 text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-200">Pointage déjà existant pour cette date</p>
                    <p className="mt-0.5 text-amber-300/80">
                      Un pointage est déjà enregistré pour ce membre le {selectedDate} (Statut actuel :{' '}
                      <span className="font-bold underline">{expressExistingRecord.status}</span> à{' '}
                      {expressExistingRecord.checkIn || 'non précisée'}).
                      L'enregistrement mettra à jour ce pointage sans créer de doublon.
                    </p>
                  </div>
                </div>
              )}

              {/* Exigence 5 : Avertissement et blocage si employé inactif */}
              {matchedEmployee && !isEmployeeActive(matchedEmployee) && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-800 bg-rose-950/80 p-3.5 text-rose-300 text-xs">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-100 text-sm">
                      Membre désactivé — Enregistrement non autorisé
                    </p>
                    <p className="mt-1 text-rose-300/90 leading-relaxed">
                      Ce membre possède le statut RH "Inactif". Selon les règles de sécurité et de statut RH
                      du logiciel, il n'est pas autorisé à enregistrer sa présence. Pour débloquer, veuillez réactiver
                      ce membre dans la page Gestion des Employés.
                    </p>
                  </div>
                </div>
              )}

              {/* Bouton de validation */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={
                    !matchedEmployee ||
                    !isEmployeeActive(matchedEmployee) ||
                    isSubmittingExpress
                  }
                  className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg ${
                    !matchedEmployee || !isEmployeeActive(matchedEmployee)
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                      : expressExistingRecord
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  }`}
                >
                  {isSubmittingExpress ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : expressExistingRecord ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Mettre à jour le pointage existant (Évite le doublon)</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Valider & Enregistrer la présence</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Fiche d'identification instantanée du membre trouvé */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Fiche Membre RH Correspondant
              </h4>

              {matchedEmployee ? (
                <div className="space-y-4">
                  {/* Carte d'identité */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-xl">
                      {getEmployeeFullName(matchedEmployee).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-cyan-400 font-mono font-semibold">
                        {getEmployeeMatricule(matchedEmployee)}
                      </p>
                      <h3 className="text-lg font-bold text-white truncate">
                        {getEmployeeFullName(matchedEmployee)}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {resolvePositionName(matchedEmployee.positionId, positions)}
                      </p>
                    </div>
                  </div>

                  {/* Détails du membre */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <p className="text-slate-500">Département</p>
                      <p className="font-semibold text-slate-200 mt-0.5">
                        {resolveDepartmentName(matchedEmployee.departmentId, departments)}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <p className="text-slate-500">Statut RH</p>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isEmployeeActive(matchedEmployee)
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isEmployeeActive(matchedEmployee) ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <p className="text-slate-500">Téléphone</p>
                      <p className="font-mono text-slate-200 mt-0.5">
                        {matchedEmployee.telephone || 'Non renseigné'}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                      <p className="text-slate-500">Identifiant Unique</p>
                      <p className="font-mono text-slate-400 text-[11px] mt-0.5 truncate" title={matchedEmployee.id}>
                        {matchedEmployee.id}
                      </p>
                    </div>
                  </div>

                  {/* Récapitulatif du pointage du jour */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <p className="text-xs font-semibold text-slate-400">
                      Statut au {selectedDate} :
                    </p>
                    {expressExistingRecord ? (
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {expressExistingRecord.status}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Enregistré à : {expressExistingRecord.checkIn || '—'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Aucun pointage enregistré pour cette date.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 px-4 text-center rounded-xl bg-slate-950/50 border border-dashed border-slate-800 space-y-3">
                  <User className="w-12 h-12 text-slate-700 mx-auto" />
                  <p className="text-sm font-medium text-slate-400">
                    En attente de matricule
                  </p>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Entrez un matricule valide pour visualiser instantanément la fiche du personnel et effectuer son
                    pointage.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 3 : CONTRÔLE DE COHÉRENCE ET AUDIT DES DONNÉES                       */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Audit de Cohérence de la Base des Présences
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ce module analyse l'intégrité de la table Firebase "attendance" : détection des doublons à la même
                  date, matricules orphelins, et pointages d'employés inactifs.
                </p>
              </div>

              <button
                onClick={() => void loadData()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Réanalyser la base</span>
              </button>
            </div>

            {anomalies.length === 0 ? (
              <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-4 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-200">Base de données saine et cohérente</p>
                  <p className="text-emerald-300/80 mt-0.5">
                    Tous les enregistrements de pointage ({records.length} entrées au total) sont associés à des
                    matricules valides du personnel RH, sans aucun doublon non contrôlé.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-800/80 bg-amber-950/40 p-4 text-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      <strong>{anomalies.length} anomalie(s) détectée(s)</strong> dans l'historique des présences.
                      Vous pouvez les examiner et les corriger de manière contrôlée.
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-semibold">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">ID / Matricule</th>
                        <th className="py-3 px-4">Type d'anomalie</th>
                        <th className="py-3 px-4">Description du problème</th>
                        <th className="py-3 px-4">Action recommandée</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {anomalies.map((ano, index) => (
                        <tr key={ano.record.id + '_' + index} className="hover:bg-slate-900/50">
                          <td className="py-3 px-4 font-mono">{ano.record.date}</td>
                          <td className="py-3 px-4 font-mono text-cyan-300">
                            {ano.record.matricule || ano.record.employeeId}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ano.type === 'DUPLICATE_ENTRY'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : ano.type === 'ORPHAN_EMPLOYEE'
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {ano.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs">{ano.message}</td>
                          <td className="py-3 px-4 text-slate-400 italic">{ano.suggestedFix}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() =>
                                handleDeleteRecord(
                                  ano.record.id,
                                  ano.record.employeeName || ano.record.employeeId
                                )
                              }
                              className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/50 text-[11px] font-semibold transition"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal d'édition détaillée */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                Modifier le pointage
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400">Collaborateur :</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {editingRecord.employee
                    ? getEmployeeFullName(editingRecord.employee)
                    : editingRecord.record.employeeName || editingRecord.record.employeeId}
                </p>
                <p className="font-mono text-cyan-400">
                  {editingRecord.employee
                    ? getEmployeeMatricule(editingRecord.employee)
                    : editingRecord.record.matricule || '—'}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={editingRecord.record.date}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      record: { ...editingRecord.record, date: e.target.value }
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Heure Arrivée</label>
                  <input
                    type="time"
                    value={editingRecord.record.checkIn || ''}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        record: { ...editingRecord.record, checkIn: e.target.value }
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Heure Départ</label>
                  <input
                    type="time"
                    value={editingRecord.record.checkOut || ''}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        record: { ...editingRecord.record, checkOut: e.target.value }
                      })
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Statut</label>
                <select
                  value={(editingRecord.record.status || '').toUpperCase()}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      record: { ...editingRecord.record, status: e.target.value }
                    })
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                >
                  <option value="PRESENT">Présent</option>
                  <option value="RETARD">En Retard</option>
                  <option value="ABSENT">Absent</option>
                  <option value="CONGE">En Congé</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Observation / Note</label>
                <textarea
                  rows={2}
                  value={editingRecord.record.note || ''}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      record: { ...editingRecord.record, note: e.target.value }
                    })
                  }
                  placeholder="Motif d'absence, retard justifié, etc."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveModalEdit}
                className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  )
}