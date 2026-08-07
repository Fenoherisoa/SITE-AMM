export interface Member {
  id: string; // legacy key like AT-001 or F-001
  matricule?: string;
  name: string; // anarana
  nationalId?: string; // cin
  dateOfBirth?: string; // date_naissance
  adhesionDate?: string; // date_adhesion
  contact?: { telephone?: string };
  address?: { region?: string; province?: string; commune?: string; district?: string; fokontany?: string };
  photoUrl?: string;
  project?: string; // tetikasa
  metadata?: Record<string, any>;
}
