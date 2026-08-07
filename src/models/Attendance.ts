export interface AttendanceRecord {
  id: string; // firebase push key
  employeeId: string; // RH-001
  date: string; // YYYY-MM-DD
  checkIn?: string; // ISO timestamp
  checkOut?: string; // ISO timestamp
  status?: string; // present/absent
  remark?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}
