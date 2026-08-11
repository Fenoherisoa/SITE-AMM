import { parseISO, eachDayOfInterval, isWeekend, format, isSameDay } from 'date-fns';
import { PublicHoliday } from '../types';

export interface DayDetail {
  dateStr: string;
  formattedDate: string;
  dayName: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isWorkingDay: boolean;
}

export function calculateWorkingDays(
  startDateStr: string,
  endDateStr: string,
  holidays: PublicHoliday[] = [],
  isHalfDayStart: boolean = false,
  isHalfDayEnd: boolean = false
): { totalWorkingDays: number; totalCalendarDays: number; dayDetails: DayDetail[] } {
  if (!startDateStr || !endDateStr) {
    return { totalWorkingDays: 0, totalCalendarDays: 0, dayDetails: [] };
  }

  try {
    const start = parseISO(startDateStr);
    const end = parseISO(endDateStr);

    if (start > end) {
      return { totalWorkingDays: 0, totalCalendarDays: 0, dayDetails: [] };
    }

    const days = eachDayOfInterval({ start, end });
    const dayDetails: DayDetail[] = [];
    let workingDaysCount = 0;

    days.forEach((day, index) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const formattedDate = format(day, 'EEE, dd MMM yyyy');
      const dayName = format(day, 'EEEE');
      const weekend = isWeekend(day);
      
      const matchedHoliday = holidays.find(h => {
        if (h.date === dateStr) return true;
        if (h.isRecurring && dateStr.substring(5) === h.date.substring(5)) return true;
        return false;
      });

      const isHoliday = !!matchedHoliday;
      const isWorkingDay = !weekend && !isHoliday;

      if (isWorkingDay) {
        let dayValue = 1;
        if (index === 0 && isHalfDayStart) {
          dayValue -= 0.5;
        }
        if (index === days.length - 1 && isHalfDayEnd && days.length > 1) {
          dayValue -= 0.5;
        } else if (index === 0 && days.length === 1 && isHalfDayStart && isHalfDayEnd) {
          dayValue = 0.5; // Single day half-day
        }
        workingDaysCount += dayValue;
      }

      dayDetails.push({
        dateStr,
        formattedDate,
        dayName,
        isWeekend: weekend,
        isHoliday,
        holidayName: matchedHoliday?.name,
        isWorkingDay,
      });
    });

    return {
      totalWorkingDays: Math.max(0, workingDaysCount),
      totalCalendarDays: days.length,
      dayDetails,
    };
  } catch (error) {
    console.error('Error calculating working days:', error);
    return { totalWorkingDays: 0, totalCalendarDays: 0, dayDetails: [] };
  }
}

export const DEFAULT_HOLIDAYS_2026: PublicHoliday[] = [
  { id: 'h1', name: "New Year's Day / Jour de l'An", date: '2026-01-01', isRecurring: true },
  { id: 'h2', name: 'Easter Monday / Lundi de Pâques', date: '2026-04-06', isRecurring: false },
  { id: 'h3', name: 'Labor Day / Fête du Travail', date: '2026-05-01', isRecurring: true },
  { id: 'h4', name: 'WWII Victory Day / Victoire 1945', date: '2026-05-08', isRecurring: true },
  { id: 'h5', name: 'Ascension Day / Ascension', date: '2026-05-14', isRecurring: false },
  { id: 'h6', name: 'Whit Monday / Lundi de Pentecôte', date: '2026-05-25', isRecurring: false },
  { id: 'h7', name: 'Bastille Day / Fête Nationale', date: '2026-07-14', isRecurring: true },
  { id: 'h8', name: 'Assumption Day / Assomption', date: '2026-08-15', isRecurring: true },
  { id: 'h9', name: "All Saints' Day / Toussaint", date: '2026-11-01', isRecurring: true },
  { id: 'h10', name: 'Armistice Day / Armistice 1918', date: '2026-11-11', isRecurring: true },
  { id: 'h11', name: 'Christmas Day / Noël', date: '2026-12-25', isRecurring: true },
];
