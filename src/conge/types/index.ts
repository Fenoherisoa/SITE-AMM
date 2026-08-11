export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'SUPER_ADMIN' | 'ADMIN' | string;

export type LeaveType = 
  | 'ANNUAL_PAID'          // Congé Payé
  | 'SICK_LEAVE'           // Congé Maladie
  | 'RTT'                  // RTT / Réduction du temps de travail
  | 'UNPAID'               // Congé Sans Solde
  | 'MATERNITY_PATERNITY'  // Congé Maternité / Paternité
  | 'SPECIAL_LEAVE';       // Congé Evénement Familial / Spécial

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface UserPermissions {
  accounting?: boolean;
  adhesion?: boolean;
  calendar?: boolean;
  enquetes?: boolean;
  historique?: boolean;
  historiquetrans?: boolean;
  members?: boolean;
  messenger?: boolean;
  operations?: boolean;
  overview?: boolean;
  parametre?: boolean;
  security?: boolean;
  [key: string]: boolean | undefined;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  departmentId?: string;
  departmentName?: string;
  jobTitle?: string;
  avatarUrl?: string;
  managerId?: string;
  joinedDate?: string;
  phone?: string;
  cin?: string;
  password?: string;
  permissions?: UserPermissions;
}

export interface LeaveBalanceCategory {
  total: number;
  used: number;
  pending: number;
}

export interface LeaveBalance {
  id: string; // userId_year
  userId: string;
  year: number;
  annualPaid: LeaveBalanceCategory;  // Congé Payé (e.g. 25 days)
  sickLeave: LeaveBalanceCategory;   // Congé Maladie (e.g. 15 days)
  rtt: LeaveBalanceCategory;         // RTT (e.g. 10 days)
  unpaid: { used: number };          // Congé sans solde
  specialLeave: { total: number; used: number };
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  departmentId: string;
  departmentName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  createdAt: string; // ISO timestamp
  updatedAt?: string;
  reviewedBy?: string;
  reviewerName?: string;
  reviewerComment?: string;
  reviewedAt?: string;
  isHalfDayStart?: boolean;
  isHalfDayEnd?: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string;
  managerName?: string;
  minCoveragePercentage: number; // e.g. 50% must be present
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  isRecurring?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
}

export interface LeaveTypeInfo {
  type: LeaveType;
  label: string;
  frenchLabel: string;
  color: string; // tailwind color class
  badgeBg: string;
  badgeText: string;
}

export const LEAVE_TYPES_INFO: Record<LeaveType, LeaveTypeInfo> = {
  ANNUAL_PAID: {
    type: 'ANNUAL_PAID',
    label: 'Annual Paid Leave',
    frenchLabel: 'Congé Payé',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  SICK_LEAVE: {
    type: 'SICK_LEAVE',
    label: 'Sick Leave',
    frenchLabel: 'Congé Maladie',
    color: 'rose',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
  RTT: {
    type: 'RTT',
    label: 'RTT (Time Off)',
    frenchLabel: 'RTT',
    color: 'cyan',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
  },
  UNPAID: {
    type: 'UNPAID',
    label: 'Unpaid Leave',
    frenchLabel: 'Congé Sans Solde',
    color: 'amber',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
  MATERNITY_PATERNITY: {
    type: 'MATERNITY_PATERNITY',
    label: 'Maternity/Paternity',
    frenchLabel: 'Congé Maternité / Paternité',
    color: 'purple',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800',
    badgeText: 'text-purple-700 dark:text-purple-300',
  },
  SPECIAL_LEAVE: {
    type: 'SPECIAL_LEAVE',
    label: 'Special / Family Leave',
    frenchLabel: 'Evénement Familial',
    color: 'indigo',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
  },
};
