import { ref, get, set, push } from 'firebase/database';
import { database } from './firebase';
import { 
  UserProfile, 
  LeaveBalance, 
  LeaveRequest, 
  Department, 
  PublicHoliday, 
  AuditLog, 
  LeaveType, 
  LeaveStatus 
} from '../types';
import { DEFAULT_HOLIDAYS_2026 } from './workingDays';

const CURRENT_YEAR = 2026;

// Database paths
export const COLS = {
  USERS: 'users',
  BALANCES: 'leaveBalances',
  REQUESTS: 'leaveRequests',
  DEPARTMENTS: 'departments',
  HOLIDAYS: 'holidays',
  LOGS: 'auditLogs',
};

// Default seed departments
export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-eng', name: 'Engineering & Product', code: 'ENG', managerName: 'Sarah Jenkins', minCoveragePercentage: 60 },
  { id: 'dept-hr', name: 'Human Resources', code: 'HR', managerName: 'Claire Moreau', minCoveragePercentage: 50 },
  { id: 'dept-mkt', name: 'Marketing & Sales', code: 'MKT', managerName: 'Marc Vane', minCoveragePercentage: 50 },
  { id: 'dept-fin', name: 'Finance & Operations', code: 'FIN', managerName: 'Alexandre Dupont', minCoveragePercentage: 50 },
];

// Sample seed demo users (matching fallback or actual auth accounts)
export const DEMO_PROFILES: UserProfile[] = [
  {
    uid: 'demo-emp-101',
    email: 'employee@company.com',
    displayName: 'Thomas Dubois',
    role: 'EMPLOYEE',
    departmentId: 'dept-eng',
    departmentName: 'Engineering & Product',
    jobTitle: 'Senior Frontend Engineer',
    joinedDate: '2023-03-15',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'demo-mgr-202',
    email: 'manager@company.com',
    displayName: 'Sarah Jenkins',
    role: 'MANAGER',
    departmentId: 'dept-eng',
    departmentName: 'Engineering & Product',
    jobTitle: 'Engineering Director',
    joinedDate: '2021-06-01',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'demo-hr-303',
    email: 'hr@company.com',
    displayName: 'Claire Moreau',
    role: 'HR',
    departmentId: 'dept-hr',
    departmentName: 'Human Resources',
    jobTitle: 'VP of People & Culture',
    joinedDate: '2020-01-10',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'demo-adm-404',
    email: 'admin@company.com',
    displayName: 'Alexandre Dupont',
    role: 'SUPER_ADMIN',
    departmentId: 'dept-fin',
    departmentName: 'Finance & Operations',
    jobTitle: 'Chief Operating Officer',
    joinedDate: '2019-09-01',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'demo-emp-102',
    email: 'lucas.bernard@company.com',
    displayName: 'Lucas Bernard',
    role: 'EMPLOYEE',
    departmentId: 'dept-eng',
    departmentName: 'Engineering & Product',
    jobTitle: 'Backend Developer',
    joinedDate: '2024-01-08',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    uid: 'demo-emp-103',
    email: 'emma.laurent@company.com',
    displayName: 'Emma Laurent',
    role: 'EMPLOYEE',
    departmentId: 'dept-mkt',
    departmentName: 'Marketing & Sales',
    jobTitle: 'Growth Marketing Manager',
    joinedDate: '2023-11-20',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  }
];

export function createDefaultBalance(userId: string): LeaveBalance {
  return {
    id: `${userId}_${CURRENT_YEAR}`,
    userId,
    year: CURRENT_YEAR,
    annualPaid: { total: 25, used: 8, pending: 3 },
    sickLeave: { total: 12, used: 2, pending: 0 },
    rtt: { total: 10, used: 4, pending: 1 },
    unpaid: { used: 0 },
    specialLeave: { total: 5, used: 1 },
    updatedAt: new Date().toISOString(),
  };
}

// Sample Leave Requests for initial rich UI state
export const SAMPLE_REQUESTS: Omit<LeaveRequest, 'id'>[] = [
  {
    userId: 'demo-emp-101',
    userDisplayName: 'Thomas Dubois',
    userEmail: 'employee@company.com',
    departmentId: 'dept-eng',
    departmentName: 'Engineering & Product',
    leaveType: 'ANNUAL_PAID',
    startDate: '2026-08-18',
    endDate: '2026-08-25',
    totalDays: 6,
    reason: 'Summer family vacation in the Alps',
    status: 'PENDING',
    createdAt: '2026-08-01T10:30:00.000Z',
    isHalfDayStart: false,
    isHalfDayEnd: false,
  },
  {
    userId: 'demo-emp-101',
    userDisplayName: 'Thomas Dubois',
    userEmail: 'employee@company.com',
    departmentId: 'dept-eng',
    departmentName: 'Engineering & Product',
    leaveType: 'RTT',
    startDate: '2026-07-10',
    endDate: '2026-07-10',
    totalDays: 1,
    reason: 'Personal administration appointment',
    status: 'APPROVED',
    createdAt: '2026-07-02T14:15:00.000Z',
    reviewedBy: 'demo-mgr-202',
    reviewerName: 'Sarah Jenkins',
    reviewerComment: 'Approved. Enjoy your day off!',
    reviewedAt: '2026-07-03T09:00:00.000Z',
  },
  {
    userId: 'demo-emp-102',
    userDisplayName: 'Lucas Bernard',
    userEmail: 'lucas.bernard@company.com',
    departmentId: 'dept-eng',
    departmentName: 'Engineering & Product',
    leaveType: 'ANNUAL_PAID',
    startDate: '2026-08-17',
    endDate: '2026-08-21',
    totalDays: 5,
    reason: 'Annual leave - South of France',
    status: 'APPROVED',
    createdAt: '2026-07-15T11:00:00.000Z',
    reviewedBy: 'demo-mgr-202',
    reviewerName: 'Sarah Jenkins',
    reviewerComment: 'Have a great rest, Lucas!',
    reviewedAt: '2026-07-16T15:20:00.000Z',
  },
  {
    userId: 'demo-emp-103',
    userDisplayName: 'Emma Laurent',
    userEmail: 'emma.laurent@company.com',
    departmentId: 'dept-mkt',
    departmentName: 'Marketing & Sales',
    leaveType: 'SICK_LEAVE',
    startDate: '2026-08-03',
    endDate: '2026-08-04',
    totalDays: 2,
    reason: 'Flu & medical doctor note attached',
    status: 'APPROVED',
    createdAt: '2026-08-03T08:00:00.000Z',
    reviewedBy: 'demo-hr-303',
    reviewerName: 'Claire Moreau',
    reviewerComment: 'Get well soon!',
    reviewedAt: '2026-08-03T09:30:00.000Z',
  },
  {
    userId: 'demo-mgr-202',
    userDisplayName: 'Sarah Jenkins',
    userEmail: 'manager@company.com',
    departmentId: 'dept-eng',
    departmentName: 'Engineering & Product',
    leaveType: 'ANNUAL_PAID',
    startDate: '2026-09-01',
    endDate: '2026-09-10',
    totalDays: 8,
    reason: 'Late summer trip',
    status: 'PENDING',
    createdAt: '2026-08-05T16:00:00.000Z',
  }
];

export async function ensureSeedDatabase(): Promise<boolean> {
  if (!database) return false;
  try {
    // Check if departments exist
    const deptRef = ref(database, COLS.DEPARTMENTS);
    const deptSnap = await get(deptRef);
    if (!deptSnap.exists()) {
      console.log('Seeding departments...');
      for (const dept of INITIAL_DEPARTMENTS) {
        await set(ref(database, `${COLS.DEPARTMENTS}/${dept.id}`), dept);
      }
    }

    // Check holidays
    const holiRef = ref(database, COLS.HOLIDAYS);
    const holiSnap = await get(holiRef);
    if (!holiSnap.exists()) {
      console.log('Seeding holidays...');
      for (const h of DEFAULT_HOLIDAYS_2026) {
        await set(ref(database, `${COLS.HOLIDAYS}/${h.id}`), h);
      }
    }

    // Check admin user specifically
    const adminRef = ref(database, `${COLS.USERS}/admin`);
    const adminSnap = await get(adminRef);
    if (!adminSnap.exists()) {
      console.log('Seeding admin user according to users.json schema...');
      await set(adminRef, {
        cin: "313011041925",
        email: "raveloarison777@gmail.com",
        password: "2241",
        permissions: {
          accounting: true,
          adhesion: true,
          calendar: true,
          enquetes: true,
          historique: true,
          historiquetrans: true,
          members: true,
          messenger: true,
          operations: true,
          overview: true,
          parametre: true,
          security: true
        },
        phone: "038 45 773 79",
        role: "ADMIN",
        displayName: "Administrator",
        uid: "admin",
        departmentName: "Direction Générale",
        jobTitle: "Administrateur Système"
      });
      const adminBal = createDefaultBalance("admin");
      await set(ref(database, `${COLS.BALANCES}/admin_2026`), adminBal);
    }

    // Check users
    const userRef = ref(database, COLS.USERS);
    const userSnap = await get(userRef);
    if (!userSnap.exists()) {
      console.log('Seeding demo profiles and balances...');
      for (const user of DEMO_PROFILES) {
        await set(ref(database, `${COLS.USERS}/${user.uid}`), user);
        const balance = createDefaultBalance(user.uid);
        await set(ref(database, `${COLS.BALANCES}/${balance.id}`), balance);
      }
      
      // Seed sample leave requests
      for (const req of SAMPLE_REQUESTS) {
        const newReqRef = push(ref(database, COLS.REQUESTS));
        await set(newReqRef, { id: newReqRef.key, ...req });
      }
      
      // Seed initial audit log
      const newLogRef = push(ref(database, COLS.LOGS));
      await set(newLogRef, {
        id: newLogRef.key,
        timestamp: new Date().toISOString(),
        actorId: 'system',
        actorName: 'System Setup',
        action: 'SYSTEM_INITIALIZED',
        details: 'Initial corporate leave management platform seeded with default departments, balances, and holidays.',
      });
    }

    return true;
  } catch (error) {
    console.warn('Seed database executed with note:', error);
    return false;
  }
}

