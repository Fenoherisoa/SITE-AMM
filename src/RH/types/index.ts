export type Role = 'Super Admin' | 'RH' | 'Comptable' | 'Directeur' | 'ADMIN' | 'admin'

export interface Department {
  id: string
  name: string
  description?: string
}

export interface Position {
  id: string
  name: string
  description?: string
}

export interface Employee {
  id: string
  employeeId: string
  matricule?: string
  anarana?: string
  nom: string
  prenom: string
  sexe: string
  telephone: string
  email?: string
  departmentId: string
  positionId: string
  salaryBase: number
  status: 'Active' | 'Inactive'
  isMember: boolean
  memberId?: string | null
  province?: string
  region?: string
  district?: string
  commune?: string
  fokontany?: string
  cin?: string
  date_naissance?: string
  email_notification?: string
  genre?: string
  submitted_at?: string
  createdAt?: string
}

export interface PayrollEntry {
  id: string
  employeeId: string
  month: string
  baseSalary: number
  bonus: number
  deductions: number
  netSalary: number
  createdAt: string
}

export interface AttendanceRecord {
  id: string
  employeeId: string
  date: string
  checkIn?: string
  checkOut?: string
  status: 'present' | 'absent' | 'late'
  createdAt: string
}

export interface LeaveRequest {
  id: string
  employeeId: string
  startDate: string
  endDate: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface AppUser {
  uid: string
  username?: string
  email?: string
  role: Role
  name?: string
  cin?: string
  phone?: string
  permissions?: Record<string, boolean>
  status?: 'active' | 'inactive'
  password?: string
  createdAt?: string
}

export interface RHRecord {
  id: string
  anarana: string
  genre: string
  date_naissance: string
  lieu_naissance: string
  cin: string
  date_delivrance: string
  lieu_delivrance: string
  cin_recto?: string
  cin_verso?: string
  province?: string
  region?: string
  district?: string
  commune?: string
  fokontany?: string
  telephone: string
  email_notification: string
  tetikasa: string
  date_adhesion: string
  matricule: string
  submitted_at: string
  status?: 'active' | 'inactive'
}

export interface EmployeeAccount {
  matricule: string
  solde: number
  solde_credit: number
  solde_debit: number
}

export interface AccountingTransaction {
  id?: string
  customId: string
  date: string
  karazana: 'MIDITRA' | 'FIVOAHANA'
  matricule: string
  memberName: string
  motif: string
  vola: number
}
