export interface InvitationModel {
  id: string;
  createdBy?: string;
  createdAt: string;
  expiresAt?: string;
  consumed?: boolean;
  consumedBy?: string;
}
