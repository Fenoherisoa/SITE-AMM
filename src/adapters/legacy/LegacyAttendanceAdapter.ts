import { AttendanceRecord } from '../../models/Attendance';

export class LegacyAttendanceAdapter {
  static toDomain(id: string, legacy: any): AttendanceRecord {
    return {
      id,
      employeeId: legacy.employeeId,
      date: legacy.date,
      checkIn: legacy.checkIn || undefined,
      checkOut: legacy.checkOut || undefined,
      status: legacy.status || undefined,
      remark: legacy.remark || undefined,
      createdAt: legacy.createdAt || undefined
    };
  }
}
