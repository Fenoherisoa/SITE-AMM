import { AttendanceRecord } from '../../models/Attendance';

export interface IAttendanceRepository {
  getById(id: string): Promise<AttendanceRecord | null>;
  listByEmployee(employeeId: string, from?: string, to?: string): Promise<AttendanceRecord[]>;
  create(record: AttendanceRecord): Promise<string>;
  update(id: string, patch: Partial<AttendanceRecord>): Promise<void>;
}
