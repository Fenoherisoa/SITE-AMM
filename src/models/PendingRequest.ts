export interface PendingRequest {
  matricule: string;
  name: string;
  contact?: string;
  createdAt?: number | string;
  status?: string;
  // Indicates that legacy snapshot contained a plaintext password for this request.
  legacyPasswordPresent?: boolean;
  metadata?: Record<string, any>;
}
