import React, { useState, useEffect } from 'react';
import { getEmployees } from '../services/employeesService';
import { getAttendance, addAttendanceRecord } from '../services/attendanceService';
import type { Employee, AttendanceRecord } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const AttendancePage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [statuts, setStatuts] = useState<{ [key: string]: string }>({});

  const loadData = async () => {
    try {
      const [employeeData, attendanceData] = await Promise.all([getEmployees(), getAttendance()]);
      setEmployees(employeeData || []);
      setRecords(attendanceData || []);
      
      const currentDayStatuses: { [key: string]: string } = {};
      (attendanceData || [])
        .filter((rec: AttendanceRecord) => rec.date === date)
        .forEach((rec: AttendanceRecord) => {
          currentDayStatuses[rec.employeeId] = rec.status?.toUpperCase();
        });
      setStatuts(currentDayStatuses);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    }
  };

  useEffect(() => {
    void loadData();
  }, [date]);

  const handlePointage = async (employeeId: string, type: 'PRESENT' | 'ABSENT' | 'CONGE' | 'RETARD') => {
    const newStatuts = { ...statuts, [employeeId]: type };
    setStatuts(newStatuts);

    try {
      await addAttendanceRecord({
        employeeId,
        date,
        checkIn: new Date().toISOString(),
        status: type.toLowerCase() as any,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erreur pointage:", error);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4'); 
    
    doc.setFontSize(20);
    doc.text("FICHE DE POINTAGE JOURNALIER", 14, 20);
    doc.setFontSize(12);
    doc.text(`Date du jour: ${date}`, 14, 30);
    
    const tableData = employees.map(m => [
      m.matricule || "-", 
      `${m.prenom || ""} ${m.nom || "-"} \nTel: ${m.telephone || "-"}`, 
      `${m.poste || "-"}\n${m.departments || "-"}`, 
      statuts[m.id] || "Non défini"
    ]);

    (doc as any).autoTable({
      head: [['Matricule', 'Nom / Contact', 'Poste / Dept', 'Statut']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], fontSize: 11 },
      styles: { fontSize: 10, cellPadding: 4, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 30 }, 
        1: { cellWidth: 60 }, 
        2: { cellWidth: 60 }, 
        3: { cellWidth: 35 }  
      }
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    doc.setFontSize(11);
    doc.text("Responsable RH", 150, finalY + 20);
    doc.line(150, finalY + 25, 195, finalY + 25);

    doc.save(`Pointage_${date}.pdf`);
  };

  const filteredEmployees = employees.filter(m => 
    `${m.prenom} ${m.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    m.matricule?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Présence</p>
          <h2 className="mt-2 text-3xl font-semibold">Journal de Pointage Journalier</h2>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
          />
          <button 
            onClick={exportPDF} 
            className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 transition"
          >
            Exporter en PDF
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <input 
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500" 
          placeholder="Rechercher par nom ou matricule..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)} 
        />

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-sm">
                <th className="py-3 px-4">Matricule</th>
                <th className="py-3 px-4">Nom / Prénom</th>
                <th className="py-3 px-4">Poste / Dept</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-center">Actions (Pointage)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredEmployees.map((m) => {
                const currentStatus = statuts[m.id];
                return (
                  <tr key={m.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono text-sm text-slate-300">{m.matricule || "-"}</td>
                    <td className="py-3 px-4 font-medium text-slate-100">{m.prenom} {m.nom}</td>
                    <td className="py-3 px-4 text-sm text-slate-300">
                      {m.poste || "-"} <br/> 
                      <small className="text-slate-500">{m.departments || "-"}</small>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                        currentStatus === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400' :
                        currentStatus === 'ABSENT' ? 'bg-rose-500/20 text-rose-400' :
                        currentStatus === 'CONGE' ? 'bg-amber-500/20 text-amber-400' :
                        currentStatus === 'RETARD' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {currentStatus || "Non défini"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex gap-1.5">
                        <button 
                          onClick={() => handlePointage(m.id, "PRESENT")} 
                          className={`px-3 py-1 rounded text-xs font-bold transition ${currentStatus === 'PRESENT' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                          P
                        </button>
                        <button 
                          onClick={() => handlePointage(m.id, "ABSENT")} 
                          className={`px-3 py-1 rounded text-xs font-bold transition ${currentStatus === 'ABSENT' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                          A
                        </button>
                        <button 
                          onClick={() => handlePointage(m.id, "CONGE")} 
                          className={`px-3 py-1 rounded text-xs font-bold transition ${currentStatus === 'CONGE' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                          C
                        </button>
                        <button 
                          onClick={() => handlePointage(m.id, "RETARD")} 
                          className={`px-3 py-1 rounded text-xs font-bold transition ${currentStatus === 'RETARD' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                        >
                          R
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};