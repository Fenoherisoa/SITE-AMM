import { ref, get, set, update, push, remove } from 'firebase/database';
import { database } from './firebase';
import { COLS, createDefaultBalance, INITIAL_DEPARTMENTS } from './seedService';
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
import { calculateWorkingDays, DEFAULT_HOLIDAYS_2026 } from './workingDays';
export { calculateWorkingDays };

const CURRENT_YEAR = 2026;

/**
 * Audit Log Helper
 */
export async function createAuditLog(actorId: string, actorName: string, action: string, details: string) {
  if (!database) return;
  try {
    const newLogRef = push(ref(database, COLS.LOGS));
    await set(newLogRef, {
      id: newLogRef.key,
      timestamp: new Date().toISOString(),
      actorId,
      actorName,
      action,
      details,
    });
  } catch (err) {
    console.error('Error logging audit:', err);
  }
}

/**
 * USER PROFILES
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!database) return null;
  try {
    const snap = await get(ref(database, `${COLS.USERS}/${uid}`));
    if (snap.exists()) {
      return snap.val() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Error getting user profile:', err);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (!database) return;
  await update(ref(database, `${COLS.USERS}/${profile.uid}`), profile as any);
}

export async function getAllUsers(): Promise<UserProfile[]> {
  if (!database) return [];
  try {
    const snap = await get(ref(database, COLS.USERS));
    if (!snap.exists()) return [];
    const val = snap.val();
    return Object.values(val) as UserProfile[];
  } catch (err) {
    console.error('Error getting all users:', err);
    return [];
  }
}

/**
 * LEAVE BALANCES
 */
export async function getUserBalance(userId: string, year: number = CURRENT_YEAR): Promise<LeaveBalance> {
  const balanceId = `${userId}_${year}`;
  if (!database) return createDefaultBalance(userId);
  try {
    const snap = await get(ref(database, `${COLS.BALANCES}/${balanceId}`));
    if (snap.exists()) {
      return snap.val() as LeaveBalance;
    } else {
      // Create fallback balance
      const newBalance = createDefaultBalance(userId);
      await set(ref(database, `${COLS.BALANCES}/${balanceId}`), newBalance);
      return newBalance;
    }
  } catch (err) {
    console.error('Error getting user balance:', err);
    return createDefaultBalance(userId);
  }
}

export async function updateUserBalance(balance: LeaveBalance): Promise<void> {
  if (!database) return;
  balance.updatedAt = new Date().toISOString();
  await set(ref(database, `${COLS.BALANCES}/${balance.id}`), balance);
}

export async function getAllBalances(year: number = CURRENT_YEAR): Promise<LeaveBalance[]> {
  if (!database) return [];
  try {
    const snap = await get(ref(database, COLS.BALANCES));
    if (!snap.exists()) return [];
    const val = snap.val();
    const list = Object.values(val) as LeaveBalance[];
    return list.filter(b => b.year === year);
  } catch (err) {
    console.error('Error getting all balances:', err);
    return [];
  }
}

/**
 * LEAVE REQUESTS
 */
export async function createLeaveRequest(
  data: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>,
  holidays: PublicHoliday[] = []
): Promise<{ success: boolean; requestId?: string; message?: string }> {
  if (!database) return { success: false, message: 'Database not initialized.' };
  try {
    // 1. Calculate working days
    const calc = calculateWorkingDays(
      data.startDate, 
      data.endDate, 
      holidays, 
      data.isHalfDayStart, 
      data.isHalfDayEnd
    );

    if (calc.totalWorkingDays <= 0) {
      return { 
        success: false, 
        message: 'The selected date range contains no valid working days (weekends or public holidays).' 
      };
    }

    const requestedDays = calc.totalWorkingDays;

    // 2. Validate user's leave balance
    const balance = await getUserBalance(data.userId, CURRENT_YEAR);
    let categoryKey: keyof LeaveBalance | null = null;
    let availableDays = 999; // Default for unpaid/special

    if (data.leaveType === 'ANNUAL_PAID') {
      categoryKey = 'annualPaid';
      availableDays = balance.annualPaid.total - balance.annualPaid.used - balance.annualPaid.pending;
    } else if (data.leaveType === 'SICK_LEAVE') {
      categoryKey = 'sickLeave';
      availableDays = balance.sickLeave.total - balance.sickLeave.used - balance.sickLeave.pending;
    } else if (data.leaveType === 'RTT') {
      categoryKey = 'rtt';
      availableDays = balance.rtt.total - balance.rtt.used - balance.rtt.pending;
    }

    if (categoryKey && requestedDays > availableDays) {
      return {
        success: false,
        message: `Insufficient leave credit. Requested ${requestedDays} day(s), but only ${availableDays} day(s) remaining available.`,
      };
    }

    // 3. Create request document in RTDB
    const newReqRef = push(ref(database, COLS.REQUESTS));
    const requestId = newReqRef.key || Date.now().toString();

    const newRequest: LeaveRequest = {
      ...data,
      id: requestId,
      totalDays: requestedDays,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    await set(newReqRef, newRequest);

    // 4. Update balance pending counter
    if (categoryKey) {
      const updatedBalance = { ...balance };
      if (data.leaveType === 'ANNUAL_PAID') {
        updatedBalance.annualPaid.pending += requestedDays;
      } else if (data.leaveType === 'SICK_LEAVE') {
        updatedBalance.sickLeave.pending += requestedDays;
      } else if (data.leaveType === 'RTT') {
        updatedBalance.rtt.pending += requestedDays;
      }
      await updateUserBalance(updatedBalance);
    }

    await createAuditLog(
      data.userId,
      data.userDisplayName,
      'SUBMIT_LEAVE_REQUEST',
      `Submitted ${data.leaveType} request for ${requestedDays} day(s) (${data.startDate} to ${data.endDate}).`
    );

    return { success: true, requestId };
  } catch (error: any) {
    console.error('Error creating leave request:', error);
    return { success: false, message: error.message || 'Failed to submit request.' };
  }
}

export async function approveLeaveRequest(
  requestId: string,
  reviewerId: string,
  reviewerName: string,
  comment: string = ''
): Promise<{ success: boolean; message?: string }> {
  if (!database) return { success: false, message: 'Database not initialized.' };
  try {
    const reqRef = ref(database, `${COLS.REQUESTS}/${requestId}`);
    const snap = await get(reqRef);
    if (!snap.exists()) {
      return { success: false, message: 'Request not found.' };
    }

    const request = snap.val() as LeaveRequest;
    if (request.status !== 'PENDING') {
      return { success: false, message: `Request is already ${request.status}.` };
    }

    // Update Request status
    await update(reqRef, {
      status: 'APPROVED',
      reviewedBy: reviewerId,
      reviewerName: reviewerName,
      reviewerComment: comment,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Deduct Balance
    const balance = await getUserBalance(request.userId, CURRENT_YEAR);
    const days = request.totalDays;

    if (request.leaveType === 'ANNUAL_PAID') {
      balance.annualPaid.pending = Math.max(0, balance.annualPaid.pending - days);
      balance.annualPaid.used += days;
    } else if (request.leaveType === 'SICK_LEAVE') {
      balance.sickLeave.pending = Math.max(0, balance.sickLeave.pending - days);
      balance.sickLeave.used += days;
    } else if (request.leaveType === 'RTT') {
      balance.rtt.pending = Math.max(0, balance.rtt.pending - days);
      balance.rtt.used += days;
    } else if (request.leaveType === 'UNPAID') {
      balance.unpaid.used += days;
    } else if (request.leaveType === 'SPECIAL_LEAVE') {
      balance.specialLeave.used += days;
    }

    await updateUserBalance(balance);

    await createAuditLog(
      reviewerId,
      reviewerName,
      'APPROVE_LEAVE_REQUEST',
      `Approved request #${requestId} for ${request.userDisplayName} (${request.leaveType}, ${days} days).`
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error approving request:', error);
    return { success: false, message: error.message || 'Failed to approve request.' };
  }
}

export async function rejectLeaveRequest(
  requestId: string,
  reviewerId: string,
  reviewerName: string,
  comment: string = ''
): Promise<{ success: boolean; message?: string }> {
  if (!database) return { success: false, message: 'Database not initialized.' };
  try {
    const reqRef = ref(database, `${COLS.REQUESTS}/${requestId}`);
    const snap = await get(reqRef);
    if (!snap.exists()) {
      return { success: false, message: 'Request not found.' };
    }

    const request = snap.val() as LeaveRequest;
    if (request.status !== 'PENDING') {
      return { success: false, message: `Request is already ${request.status}.` };
    }

    // Update Request status
    await update(reqRef, {
      status: 'REJECTED',
      reviewedBy: reviewerId,
      reviewerName: reviewerName,
      reviewerComment: comment,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Restore pending balance
    const balance = await getUserBalance(request.userId, CURRENT_YEAR);
    const days = request.totalDays;

    if (request.leaveType === 'ANNUAL_PAID') {
      balance.annualPaid.pending = Math.max(0, balance.annualPaid.pending - days);
    } else if (request.leaveType === 'SICK_LEAVE') {
      balance.sickLeave.pending = Math.max(0, balance.sickLeave.pending - days);
    } else if (request.leaveType === 'RTT') {
      balance.rtt.pending = Math.max(0, balance.rtt.pending - days);
    }

    await updateUserBalance(balance);

    await createAuditLog(
      reviewerId,
      reviewerName,
      'REJECT_LEAVE_REQUEST',
      `Rejected request #${requestId} for ${request.userDisplayName}. Reason: ${comment || 'N/A'}`
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error rejecting request:', error);
    return { success: false, message: error.message || 'Failed to reject request.' };
  }
}

export async function cancelLeaveRequest(
  requestId: string,
  actorId: string,
  actorName: string
): Promise<{ success: boolean; message?: string }> {
  if (!database) return { success: false, message: 'Database not initialized.' };
  try {
    const reqRef = ref(database, `${COLS.REQUESTS}/${requestId}`);
    const snap = await get(reqRef);
    if (!snap.exists()) {
      return { success: false, message: 'Request not found.' };
    }

    const request = snap.val() as LeaveRequest;
    const oldStatus = request.status;

    if (oldStatus === 'CANCELLED' || oldStatus === 'REJECTED') {
      return { success: false, message: `Request is already ${oldStatus}.` };
    }

    await update(reqRef, {
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    });

    // Restore balance if it was pending or approved
    const balance = await getUserBalance(request.userId, CURRENT_YEAR);
    const days = request.totalDays;

    if (oldStatus === 'PENDING') {
      if (request.leaveType === 'ANNUAL_PAID') balance.annualPaid.pending = Math.max(0, balance.annualPaid.pending - days);
      if (request.leaveType === 'SICK_LEAVE') balance.sickLeave.pending = Math.max(0, balance.sickLeave.pending - days);
      if (request.leaveType === 'RTT') balance.rtt.pending = Math.max(0, balance.rtt.pending - days);
    } else if (oldStatus === 'APPROVED') {
      if (request.leaveType === 'ANNUAL_PAID') balance.annualPaid.used = Math.max(0, balance.annualPaid.used - days);
      if (request.leaveType === 'SICK_LEAVE') balance.sickLeave.used = Math.max(0, balance.sickLeave.used - days);
      if (request.leaveType === 'RTT') balance.rtt.used = Math.max(0, balance.rtt.used - days);
      if (request.leaveType === 'UNPAID') balance.unpaid.used = Math.max(0, balance.unpaid.used - days);
      if (request.leaveType === 'SPECIAL_LEAVE') balance.specialLeave.used = Math.max(0, balance.specialLeave.used - days);
    }

    await updateUserBalance(balance);

    await createAuditLog(
      actorId,
      actorName,
      'CANCEL_LEAVE_REQUEST',
      `Cancelled leave request #${requestId} (${request.leaveType}, ${days} days).`
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling request:', error);
    return { success: false, message: error.message || 'Failed to cancel request.' };
  }
}

export async function getLeaveRequests(filters?: {
  userId?: string;
  departmentId?: string;
  status?: LeaveStatus;
}): Promise<LeaveRequest[]> {
  if (!database) return [];
  try {
    const snap = await get(ref(database, COLS.REQUESTS));
    if (!snap.exists()) return [];

    const val = snap.val();
    let results: LeaveRequest[] = Object.keys(val).map(key => ({
      id: key,
      ...val[key],
    }));

    if (filters?.userId) {
      results = results.filter(r => r.userId === filters.userId);
    }
    if (filters?.departmentId) {
      results = results.filter(r => r.departmentId === filters.departmentId);
    }
    if (filters?.status) {
      results = results.filter(r => r.status === filters.status);
    }

    // Sort newest first
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error getting leave requests:', err);
    return [];
  }
}

/**
 * DEPARTMENT COVERAGE CHECK / CONFLICT DETECTOR
 */
export async function checkDepartmentCoverageConflict(
  departmentId: string,
  startDateStr: string,
  endDateStr: string,
  excludeUserId?: string
): Promise<{
  hasWarning: boolean;
  absentCount: number;
  totalDeptUsers: number;
  absentPercentage: number;
  minCoveragePercentage: number;
  message?: string;
}> {
  try {
    const allUsers = await getAllUsers();
    const deptUsers = allUsers.filter(u => u.departmentId === departmentId);
    const totalDeptUsers = deptUsers.length || 1;

    // Fetch department details
    let minCoveragePercentage = 50;
    if (database) {
      const deptSnap = await get(ref(database, `${COLS.DEPARTMENTS}/${departmentId}`));
      if (deptSnap.exists()) {
        minCoveragePercentage = (deptSnap.val() as Department).minCoveragePercentage || 50;
      }
    }

    // Get all approved requests in department overlapping date
    const allRequests = await getLeaveRequests({ departmentId, status: 'APPROVED' });
    const pendingRequests = await getLeaveRequests({ departmentId, status: 'PENDING' });
    
    const combined = [...allRequests, ...pendingRequests];

    const overlappingUserIds = new Set<string>();

    combined.forEach(req => {
      if (excludeUserId && req.userId === excludeUserId) return;
      
      // Overlap check: req.startDate <= endDate && req.endDate >= startDate
      if (req.startDate <= endDateStr && req.endDate >= startDateStr) {
        overlappingUserIds.add(req.userId);
      }
    });

    // Adding current prospective requester
    const prospectiveAbsent = overlappingUserIds.size + 1;
    const prospectivePresent = Math.max(0, totalDeptUsers - prospectiveAbsent);
    const presentPercentage = Math.round((prospectivePresent / totalDeptUsers) * 100);

    const hasWarning = presentPercentage < minCoveragePercentage;

    return {
      hasWarning,
      absentCount: prospectiveAbsent,
      totalDeptUsers,
      absentPercentage: 100 - presentPercentage,
      minCoveragePercentage,
      message: hasWarning 
        ? `Coverage Warning: Approving this request will result in ${prospectiveAbsent}/${totalDeptUsers} staff absent (${presentPercentage}% present), which drops below the department minimum threshold of ${minCoveragePercentage}% coverage.`
        : undefined
    };
  } catch (err) {
    console.error('Error checking department coverage:', err);
    return {
      hasWarning: false,
      absentCount: 0,
      totalDeptUsers: 1,
      absentPercentage: 0,
      minCoveragePercentage: 50,
    };
  }
}

/**
 * DEPARTMENTS & HOLIDAYS
 */
export async function getDepartments(): Promise<Department[]> {
  if (!database) return INITIAL_DEPARTMENTS;
  try {
    const snap = await get(ref(database, COLS.DEPARTMENTS));
    if (!snap.exists()) return INITIAL_DEPARTMENTS;
    const val = snap.val();
    return Object.keys(val).map(key => ({ id: key, ...val[key] }));
  } catch (err) {
    console.error('Error getting departments:', err);
    return INITIAL_DEPARTMENTS;
  }
}

export async function saveDepartment(dept: Department): Promise<void> {
  if (!database) return;
  await set(ref(database, `${COLS.DEPARTMENTS}/${dept.id}`), dept);
}

export async function getPublicHolidays(): Promise<PublicHoliday[]> {
  if (!database) return DEFAULT_HOLIDAYS_2026;
  try {
    const snap = await get(ref(database, COLS.HOLIDAYS));
    if (!snap.exists()) return DEFAULT_HOLIDAYS_2026;
    const val = snap.val();
    return Object.keys(val).map(key => ({ id: key, ...val[key] }));
  } catch (err) {
    console.error('Error getting public holidays:', err);
    return DEFAULT_HOLIDAYS_2026;
  }
}

export async function addPublicHoliday(holiday: Omit<PublicHoliday, 'id'>): Promise<void> {
  if (!database) return;
  const newHolRef = push(ref(database, COLS.HOLIDAYS));
  await set(newHolRef, { id: newHolRef.key, ...holiday });
}

export async function deletePublicHoliday(id: string): Promise<void> {
  if (!database) return;
  await remove(ref(database, `${COLS.HOLIDAYS}/${id}`));
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  if (!database) return [];
  try {
    const snap = await get(ref(database, COLS.LOGS));
    if (!snap.exists()) return [];
    const val = snap.val();
    const logs = Object.keys(val).map(key => ({ id: key, ...val[key] })) as AuditLog[];
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    console.error('Error getting audit logs:', err);
    return [];
  }
}

