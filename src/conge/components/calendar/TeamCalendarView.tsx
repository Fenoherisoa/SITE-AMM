import React, { useState, useEffect } from 'react';
import { 
  getLeaveRequests, 
  getAllUsers, 
  getPublicHolidays 
} from '../../services/dbService';
import { 
  LeaveRequest, 
  UserProfile, 
  PublicHoliday, 
  LEAVE_TYPES_INFO 
} from '../../types';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isWeekend, 
  isSameDay, 
  parseISO 
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Users, 
  Filter, 
  Search,
  Building2,
  AlertCircle
} from 'lucide-react';

export const TeamCalendarView: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 7, 1)); // August 2026
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);

  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    async function loadCalendarData() {
      setLoading(true);
      const [reqsData, usersData, holisData] = await Promise.all([
        getLeaveRequests({ status: 'APPROVED' }),
        getAllUsers(),
        getPublicHolidays(),
      ]);
      setRequests(reqsData);
      setUsers(usersData);
      setHolidays(holisData);
      setLoading(false);
    }
    loadCalendarData();
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Filtered users by search or department
  const filteredUsers = users.filter(u => {
    if (departmentFilter !== 'ALL' && u.departmentId !== departmentFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return u.displayName.toLowerCase().includes(term) || u.jobTitle.toLowerCase().includes(term);
    }
    return true;
  });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Helper to check if user has approved leave on a specific day
  const getUserLeaveForDay = (userId: string, day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return requests.find(r => r.userId === userId && r.startDate <= dayStr && r.endDate >= dayStr);
  };

  // Helper to check public holiday
  const getHolidayForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return holidays.find(h => {
      if (h.date === dayStr) return true;
      if (h.isRecurring && dayStr.substring(5) === h.date.substring(5)) return true;
      return false;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-cyan-600" />
            Planning & Disponibilités de l'Équipe
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Vue d'ensemble des absences, présences et congés validés
          </p>
        </div>

        {/* Month Selector Buttons */}
        <div className="flex items-center space-x-2 self-start md:self-auto bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-900 dark:text-white px-3 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: fr })}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-xs">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Chercher un collaborateur..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none shrink-0"
          >
            <option value="ALL">Tous les départements</option>
            <option value="dept-eng">Engineering & Product</option>
            <option value="dept-hr">Human Resources</option>
            <option value="dept-mkt">Marketing & Sales</option>
            <option value="dept-fin">Finance & Operations</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 overflow-x-auto text-[11px] pt-1 sm:pt-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Congé Payé
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> RTT
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Maladie
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Férié
          </span>
        </div>
      </div>

      {/* Calendar Grid Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span>Chargement du planning...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 w-56 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-800">
                    Collaborateur / Salarié
                  </th>
                  {daysInMonth.map((day) => {
                    const weekend = isWeekend(day);
                    const holiday = getHolidayForDay(day);
                    return (
                      <th
                        key={day.toISOString()}
                        className={`py-2 px-1 text-center font-semibold min-w-[36px] max-w-[40px] border-r border-slate-200/60 dark:border-slate-800/60 ${
                          weekend ? 'bg-slate-100/70 dark:bg-slate-800/50 text-slate-400' : ''
                        } ${holiday ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-700' : 'text-slate-600 dark:text-slate-400'}`}
                      >
                        <div className="text-[10px] uppercase">{format(day, 'EEE', { locale: fr })}</div>
                        <div className="text-xs font-bold">{format(day, 'd')}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u, uIdx) => (
                  <tr key={u.uid ? `cal-user-${u.uid}-${uIdx}` : `cal-user-${uIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {u.displayName.charAt(0)}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">{u.displayName}</div>
                          <div className="text-[10px] text-slate-500 truncate">{u.jobTitle}</div>
                        </div>
                      </div>
                    </td>

                    {daysInMonth.map((day, dIdx) => {
                      const weekend = isWeekend(day);
                      const holiday = getHolidayForDay(day);
                      const leaveReq = getUserLeaveForDay(u.uid, day);
                      const cellKey = `cell-${u.uid}-${day.getTime()}-${dIdx}`;

                      if (holiday) {
                        return (
                          <td
                            key={cellKey}
                            title={`Férié: ${holiday.name}`}
                            className="p-1 text-center bg-amber-100/60 dark:bg-amber-950/40 border-r border-slate-200/40 dark:border-slate-800/40 text-[9px] text-amber-800 dark:text-amber-300 font-medium"
                          >
                            Férié
                          </td>
                        );
                      }

                      if (weekend) {
                        return (
                          <td
                            key={cellKey}
                            className="p-1 text-center bg-slate-100/60 dark:bg-slate-800/40 border-r border-slate-200/40 dark:border-slate-800/40"
                          />
                        );
                      }

                      if (leaveReq) {
                        const info = LEAVE_TYPES_INFO[leaveReq.leaveType] || LEAVE_TYPES_INFO['ANNUAL_PAID'];
                        return (
                          <td
                            key={cellKey}
                            title={`${u.displayName} en ${info.frenchLabel}: "${leaveReq.reason}"`}
                            className="p-0.5 border-r border-slate-200/40 dark:border-slate-800/40"
                          >
                            <div className={`w-full h-7 rounded-md ${info.badgeBg} ${info.badgeText} flex items-center justify-center text-[9px] font-bold border truncate px-1 shadow-2xs`}>
                              {info.frenchLabel.substring(0, 3)}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={cellKey}
                          className="p-1 border-r border-slate-200/40 dark:border-slate-800/40 text-center"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 inline-block" />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
