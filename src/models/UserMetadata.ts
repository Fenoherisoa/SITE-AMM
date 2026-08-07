export interface UserMetadata {
  uid?: string; // Firebase Auth uid when linked
  username?: string; // legacy key
  role?: string;
  permissions?: Record<string, boolean> | string[];
  email?: string;
  phone?: string;
  linkedEmployeeId?: string;
  status?: string; // pending/active/suspended
}
