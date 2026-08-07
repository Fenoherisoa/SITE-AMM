export interface User {
  uid?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  permissions?: Record<string, boolean> | string[];
  accountStatus?: 'PENDING' | 'APPROVED' | 'INVITED' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED' | 'DISABLED' | 'ARCHIVED';
  portalAccess?: string[] | Record<string, boolean>;
  profile?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}
