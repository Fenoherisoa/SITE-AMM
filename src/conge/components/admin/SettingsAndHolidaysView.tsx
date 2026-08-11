import React, { useState, useEffect } from 'react';
import { 
  getPublicHolidays, 
  addPublicHoliday, 
  deletePublicHoliday, 
  getAuditLogs, 
  getDepartments, 
  saveDepartment 
} from '../../services/dbService';
import { PublicHoliday, AuditLog, Department } from '../../types';
import { 
  Settings, 
  Calendar, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  Building2, 
  Check, 
  Sparkles,
  FileText
} from 'lucide-react';

export const SettingsAndHolidaysView: React.FC = () => {
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [newHoliName, setNewHoliName] = useState('');
  const [newHoliDate, setNewHoliDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const [activeTab, setActiveTab] = useState<'HOLIDAYS' | 'DEPARTMENTS' | 'LOGS'>('HOLIDAYS');
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [hData, lData, dData] = await Promise.all([
      getPublicHolidays(),
      getAuditLogs(),
      getDepartments(),
    ]);
    setHolidays(hData);
    setLogs(lData);
    setDepartments(dData);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliName.trim() || !newHoliDate) return;
    await addPublicHoliday({ name: newHoliName, date: newHoliDate, isRecurring });
    setNewHoliName('');
    setNewHoliDate('');
    setIsRecurring(false);
    await loadAll();
  };

  const handleDeleteHoliday = async (id: string) => {
    await deletePublicHoliday(id);
    await loadAll();
  };

  const handleUpdateDeptCoverage = async (dept: Department, minCov: number) => {
    await saveDepartment({ ...dept, minCoveragePercentage: minCov });
    await loadAll();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Paramètres & Configuration Système
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Calendrier des jours fériés légaux, seuils de couverture d'équipe et journaux d'audit
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('HOLIDAYS')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'HOLIDAYS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Jours Fériés (Public Holidays)
        </button>

        <button
          onClick={() => setActiveTab('DEPARTMENTS')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'DEPARTMENTS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Seuils de Couverture Départements
        </button>

        <button
          onClick={() => setActiveTab('LOGS')}
          className={`pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'LOGS'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Journal d'Audit Système
        </button>
      </div>

      {/* TAB 1: Public Holidays */}
      {activeTab === 'HOLIDAYS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Holiday Form */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs space-y-4 h-fit">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4 text-indigo-500" />
              Ajouter un Jour Férié
            </h3>

            <form onSubmit={handleAddHoliday} className="space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Nom du jour férié</label>
                <input
                  type="text"
                  value={newHoliName}
                  onChange={(e) => setNewHoliName(e.target.value)}
                  placeholder="ex: Lundi de Pâques"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={newHoliDate}
                  onChange={(e) => setNewHoliDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-600 dark:text-slate-400">Répétition annuelle automatique</span>
              </label>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Enregistrer le jour férié</span>
              </button>
            </form>
          </div>

          {/* Holidays List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300">
              Liste des Jours Fériés Traités en Année 2026
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
              {holidays.map((h, idx) => (
                <div key={h.id ? `holiday-${h.id}-${idx}` : `holiday-${idx}`} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{h.name}</div>
                      <div className="text-[11px] text-slate-500">{h.date} {h.isRecurring ? '• Récurrent annuel' : ''}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteHoliday(h.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Department Coverage */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Règles de Présence Minimale par Département
          </h3>
          <p className="text-xs text-slate-500">
            Définit le pourcentage minimum de personnel présent requis pour éviter les alertes de pénurie d'effectif lors de la validation des congés.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {departments.map((dept, idx) => (
              <div key={dept.id ? `dept-${dept.id}-${idx}` : `dept-${idx}`} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    {dept.name} ({dept.code})
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    Seuil: {dept.minCoveragePercentage}%
                  </span>
                </div>

                <div className="space-y-1">
                  <input
                    type="range"
                    min="20"
                    max="80"
                    step="5"
                    value={dept.minCoveragePercentage}
                    onChange={(e) => handleUpdateDeptCoverage(dept, Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>20% Souple</span>
                    <span>50% Standard</span>
                    <span>80% Stricte</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Audit Logs */}
      {activeTab === 'LOGS' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300">
            Journal de Traçabilité des Actions (Audit Trail)
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {logs.map((log, idx) => (
              <div key={log.id ? `log-${log.id}-${idx}` : `log-${idx}`} className="p-3.5 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{log.action}</span>
                  <span className="text-slate-400">{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                </div>
                <div className="text-slate-800 dark:text-slate-200 font-medium">{log.details}</div>
                <div className="text-[10px] text-slate-500">Auteur: {log.actorName}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
