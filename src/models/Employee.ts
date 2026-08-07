export interface Employee {
  id: string; // RH-001 (business id)
  matricule: string; // AMM-RH-00001
  name: string; // anarana
  nationalId?: string; // cin
  birthDate?: string; // date_naissance
  departments?: string | string[];
  position?: string; // poste
  email?: string; // email_notification
  telephone?: string;
  photoUrl?: string;
  submittedAt?: string;
  metadata?: Record<string, any>;
}
