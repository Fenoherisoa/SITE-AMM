import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  User, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Printer, 
  Search, 
  PlusCircle, 
  Building2, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { db } from '../firebase/firebaseConfig';
import { ref, get, push, update, child } from 'firebase/database';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  departmentId: string;
  departmentName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  leaveType: 'ANNUAL_PAID' | 'SICK_LEAVE' | 'RTT' | 'UNPAID' | 'SPECIAL_LEAVE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export const LeavePage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [leaveType, setLeaveType] = useState<LeaveRequest['leaveType']>('ANNUAL_PAID');
  const [reason, setReason] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [exportDate, setExportDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Chargement des données depuis Firebase Realtime Database
  const fetchLeaveData = async (): Promise<void> => {
    setLoading(true);
    setFormError(null);
    try {
      if (!db) {
        throw new Error("La connexion à Firebase n'est pas configurée (db est indéfini).");
      }

      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, 'leaveRequests'));
      
      const requests: LeaveRequest[] = [];
      const empMap = new Map<string, Employee>();

      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
          Object.keys(data).forEach((key) => {
            const item = data[key];
            if (item) {
              const req: LeaveRequest = {
                id: key,
                userId: item.userId || '',
                userDisplayName: item.userDisplayName || 'Employé',
                userEmail: item.userEmail || '',
                departmentId: item.departmentId || '',
                departmentName: item.departmentName || 'Département',
                startDate: item.startDate || '',
                endDate: item.endDate || '',
                totalDays: item.totalDays || 1,
                reason: item.reason || '',
                leaveType: item.leaveType || 'ANNUAL_PAID',
                status: item.status || 'PENDING',
                createdAt: item.createdAt || new Date().toISOString(),
                reviewedBy: item.reviewedBy,
                reviewedAt: item.reviewedAt,
              };
              requests.push(req);

              if (req.userId && !empMap.has(req.userId)) {
                empMap.set(req.userId, {
                  id: req.userId,
                  name: req.userDisplayName,
                  email: req.userEmail,
                  department: req.departmentName,
                });
              }
            }
          });
        }
        requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      setLeaveRequests(requests);

      if (empMap.size === 0) {
        setEmployees([
          { id: 'admin_2026', name: 'Admin Principal', email: 'admin@site-amm.mg', department: 'Direction' }
        ]);
      } else {
        setEmployees(Array.from(empMap.values()));
      }

    } catch (error: any) {
      console.error('Erreur lors du chargement des données de congés:', error);
      setFormError(`Impossible de récupérer les données : ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count === 0 && s <= e ? 1 : count;
  };

  // Création d'une nouvelle demande de congé dans Firebase
  const handleCreateLeaveRequest = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedEmployeeId) {
      setFormError('Veuillez sélectionner un employé.');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Veuillez sélectionner les dates de début et de fin.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setFormError('La date de fin ne peut pas être antérieure à la date de début.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Veuillez fournir un motif précis pour la demande.');
      return;
    }

    const employee = employees.find((emp) => emp.id === selectedEmployeeId);
    if (!employee) {
      setFormError('Employé introuvable.');
      return;
    }

    setSubmitting(true);
    try {
      const computedDays = calculateDays(startDate, endDate);
      const newRequestPayload = {
        userId: employee.id,
        userDisplayName: employee.name,
        userEmail: employee.email || 'N/A',
        departmentId: employee.department.toLowerCase().replace(/\s+/g, '-'),
        departmentName: employee.department,
        startDate,
        endDate,
        totalDays: computedDays || 1,
        reason: reason.trim(),
        leaveType,
        status: 'PENDING' as const,
        isHalfDayStart: false,
        isHalfDayEnd: false,
        createdAt: new Date().toISOString(),
      };

      const leaveRequestsRef = ref(db, 'leaveRequests');
      const newRef = push(leaveRequestsRef);
      await update(newRef, newRequestPayload);
      
      const createdRequest: LeaveRequest = {
        id: newRef.key as string,
        ...newRequestPayload,
      };

      setLeaveRequests((prev) => [createdRequest, ...prev]);
      setFormSuccess(`La demande de congé pour ${employee.name} a été soumise avec succès !`);
      
      setSelectedEmployeeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveType('ANNUAL_PAID');
    } catch (err: any) {
      console.error('Erreur lors de la création de la demande :', err);
      setFormError(`Problème lors de l'enregistrement des données : ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Mise à jour du statut d'une demande
  const handleUpdateStatus = async (
    requestId: string, 
    newStatus: 'APPROVED' | 'REJECTED'
  ): Promise<void> => {
    setActionLoadingId(requestId);
    try {
      const reviewPayload = {
        status: newStatus,
        reviewedBy: 'Admin / Manager Responsable',
        reviewedAt: new Date().toISOString(),
      };

      const requestRef = ref(db, `leaveRequests/${requestId}`);
      await update(requestRef, reviewPayload);

      setLeaveRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, ...reviewPayload }
            : req
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut :', error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) => {
      const matchesStatus =
        statusFilter === 'ALL' || req.status === statusFilter;
      const matchesSearch =
        req.userDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [leaveRequests, statusFilter, searchQuery]);

  const handleExportPDF = (): void => {
    const docPdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const activeDateStr = exportDate || new Date().toISOString().split('T')[0];

    const dailyActiveLeaves = leaveRequests.filter((req) => {
      return (
        req.startDate <= activeDateStr &&
        req.endDate >= activeDateStr &&
        req.status === 'APPROVED'
      );
    });

    docPdf.setFillColor(15, 23, 42);
    docPdf.rect(0, 0, 210, 35, 'F');

    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(16);
    docPdf.text('SITE-AMM — LISTE QUOTIDIENNE DES CONGÉS', 14, 15);

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(10);
    docPdf.text(`Rapport Officiel du Personnel en Congé • Date : ${activeDateStr}`, 14, 23);
    docPdf.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, 29);

    docPdf.setFillColor(241, 245, 249);
    docPdf.rect(14, 42, 182, 22, 'F');
    docPdf.setDrawColor(203, 213, 225);
    docPdf.rect(14, 42, 182, 22, 'S');

    docPdf.setTextColor(15, 23, 42);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(10);
    docPdf.text('RÉSUMÉ DU JOUR', 18, 50);

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(9);
    docPdf.text(`Total Employés Absents / En Congé Validé : ${dailyActiveLeaves.length}`, 18, 57);
    docPdf.text(`Total Demandes Générales sur Portail : ${leaveRequests.length}`, 110, 57);

    let startY = 74;
    docPdf.setFillColor(30, 41, 59);
    docPdf.rect(14, startY, 182, 8, 'F');

    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(8);
    docPdf.text('EMPLOYÉ', 18, startY + 5.5);
    docPdf.text('DÉPARTEMENT', 65, startY + 5.5);
    docPdf.text('TYPE CONGÉ', 105, startY + 5.5);
    docPdf.text('PÉRIODE DU / AU', 140, startY + 5.5);
    docPdf.text('JOURS', 180, startY + 5.5);

    startY += 8;

    if (dailyActiveLeaves.length === 0) {
      docPdf.setDrawColor(226, 232, 240);
      docPdf.rect(14, startY, 182, 12, 'S');
      docPdf.setTextColor(100, 116, 139);
      docPdf.setFont('helvetica', 'italic');
      docPdf.setFontSize(9);
      docPdf.text(`Aucun employé en congé approuvé pour la journée du ${activeDateStr}.`, 18, startY + 7.5);
    } else {
      dailyActiveLeaves.forEach((req, idx) => {
        const isEven = idx % 2 === 0;
        if (isEven) {
          docPdf.setFillColor(248, 250, 252);
          docPdf.rect(14, startY, 182, 9, 'F');
        }
        docPdf.setDrawColor(226, 232, 240);
        docPdf.rect(14, startY, 182, 9, 'S');

        docPdf.setTextColor(15, 23, 42);
        docPdf.setFont('helvetica', 'normal');
        docPdf.setFontSize(8);
        docPdf.text(req.userDisplayName.substring(0, 24), 18, startY + 6);
        docPdf.text(req.departmentName.substring(0, 20), 65, startY + 6);

        const typeLabels: Record<string, string> = {
          ANNUAL_PAID: 'Congé Payé',
          SICK_LEAVE: 'Maladie',
          RTT: 'RTT',
          UNPAID: 'Sans Solde',
          SPECIAL_LEAVE: 'Spécial',
        };
        docPdf.text(typeLabels[req.leaveType] || req.leaveType, 105, startY + 6);
        docPdf.text(`${req.startDate} au ${req.endDate}`, 140, startY + 6);
        docPdf.text(`${req.totalDays} j.`, 180, startY + 6);

        startY += 9;
      });
    }

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(8);
    docPdf.setTextColor(148, 163, 184);
    docPdf.text('Document confidentiel — Direction des Ressources Humaines SITE-AMM', 14, 285);
    docPdf.text('Page 1 / 1', 180, 285);

    docPdf.save(`liste-conges-quotidienne-${activeDateStr}.pdf`);
  };

  const handlePrint = (): void => {
    window.print();
  };

  const getLeaveTypeBadge = (type: LeaveRequest['leaveType']) => {
    switch (type) {
      case 'ANNUAL_PAID':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Congé Payé</span>;
      case 'SICK_LEAVE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">Maladie</span>;
      case 'RTT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">RTT</span>;
      case 'UNPAID':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Sans Solde</span>;
      case 'SPECIAL_LEAVE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">Evénement Spécial</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Approuvée
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Refusée
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> En Attente
          </span>
        );
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-slate-200 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* En-tête */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Gestion des Congés & Absences</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Module RH — Firebase Realtime Database
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchLeaveData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-all"
            title="Actualiser les données"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Imprimer</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <input
              type="date"
              value={exportDate}
              onChange={(e) => setExportDate(e.target.value)}
              className="bg-transparent text-xs px-2 py-1 focus:outline-none text-slate-700 dark:text-slate-200"
            />
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter PDF</span>
            </button>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Colonne de gauche : Formulaire de demande */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs h-fit space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <PlusCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Nouvelle Demande de Congé</h2>
          </div>

          {formSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateLeaveRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Employé Bénéficiaire *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                >
                  <option value="">-- Sélectionner un employé --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Type de Congé / Absence *
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveRequest['leaveType'])}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              >
                <option value="ANNUAL_PAID">Congé Payé (Annuel)</option>
                <option value="SICK_LEAVE">Congé Maladie</option>
                <option value="RTT">RTT (Réduction du Temps de Travail)</option>
                <option value="UNPAID">Congé Sans Solde</option>
                <option value="SPECIAL_LEAVE">Evénement Spécial / Familial</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date de Début *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Date de Fin *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {startDate && endDate && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between border border-slate-200 dark:border-slate-700">
                <span>Total estimé en jours ouvrés :</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                  {calculateDays(startDate, endDate)} jour(s)
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Motif & Justification *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Indiquez la raison ou le détail de la demande de congé..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement en cours...
                </span>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Soumettre la Demande</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Colonne de droite : Liste des demandes et validation */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Liste des Demandes ({filteredRequests.length})
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px]">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'Toutes' : st === 'PENDING' ? 'En Attente' : st === 'APPROVED' ? 'Approuvées' : 'Refusées'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par employé, département ou motif..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
              <span>Chargement des données...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
              Aucune demande de congé enregistrée.
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {filteredRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {req.userDisplayName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {req.userDisplayName}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{req.departmentName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {getLeaveTypeBadge(req.leaveType)}
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Période du congé :</span>
                      <span className="font-medium">
                        {req.startDate} → {req.endDate}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Durée totale :</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400">
                        {req.totalDays} jour(s)
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 italic">
                    "{req.reason}"
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                        disabled={actionLoadingId === req.id}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Refuser</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                        disabled={actionLoadingId === req.id}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approuver</span>
                      </button>
                    </div>
                  )}

                  {req.reviewedBy && (
                    <div className="text-[10px] text-slate-400 text-right italic pt-1">
                      Traité par {req.reviewedBy} le {new Date(req.reviewedAt || '').toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeavePage;