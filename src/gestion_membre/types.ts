export interface Member {
  id: string;
  matricule: string;
  anarana: string;
  cin?: string;
  cin_recto?: string;
  cin_verso?: string;
  commune?: string;
  date_adhesion?: string;
  date_delivrance?: string;
  date_duplicata?: string;
  date_naissance?: string;
  district?: string;
  fokontany?: string;
  genre?: string;
  lieu_delivrance?: string;
  lieu_duplicata?: string;
  lieu_naissance?: string;
  photo?: string;
  province?: string;
  region?: string;
  telephone?: string;
  tetikasa: string;
  email_notification?: string;
  solde?: number;
  solde_credit?: number;
  solde_debit?: number;
  submitted_at?: string;
}

export interface Enquete {
  id?: string;
  unique_id?: string;
  anarana_olona?: string;
  matricule_olona?: string;
  tetikasa_olona?: string;
  ezaka_ilaina?: string;
  sokajy_mponina?: string;
  fidiram_bola?: number | string;
  status?: string; 
  enqueteur?: string;
  adresse_exacte?: string;
  fokontany?: string;
  commune?: string;
  distrika?: string;
  faritra?: string;
  faritany?: string;
  points_calculated?: number;
  gps?: {
    latitude: number;
    longitude: number;
  };
  valim_panontaniana?: {
    [key: string]: boolean;
  };
  submitted_at?: string;
}

export interface ActionLog {
  id?: string;
  operator: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface UserAccount {
  username: string;
  password?: string;
  role?: string;
  permissions?: {
    [key: string]: boolean;
  };
  email?: string;
  phone?: string;
  cin?: string;
}

export interface Transaction {
  id?: string;
  memberId: string;
  matricule: string;
  memberName: string;
  karazana: "MIDITRA" | "MIVOAKA";
  vola: number;
  motif: string;
  operator: string;
  numero_telephone?: string;
  reference_transaction?: string;
  date: string;
  customId?: string;
  createdBy?: string;
  currentBalance?: number;
}

export interface CalendarEvent {
  id?: string;
  date: string;
  title: string;
  desc: string;
}

export interface OperationRequest {
  key?: string;
  id?: string;
  matricule: string;
  memberName: string;
  type: string;
  montant: number;
  motif: string;
  numero_telephone?: string;
  operator?: string;
  reference_transaction?: string;
  createdAt: string;
  statut: string;
}

export interface ChatMessage {
  id?: string;
  sender: string;
  role: string;
  text: string;
  timestamp: string;
  status: string;
  edited?: boolean;
  locked?: boolean;
}

export interface AssociationParams {
  nom_association: string;
  ideologie: string;
  decret: string;
  date_decret: string;
  telephone: string;
  email: string;
  siege_social: string;
  lieu: string;
}

export interface Dossier {
  key: string;
  numero: string;
  type: string;
  nom: string;
  matricule: string;
  cin?: string;
  mois: string;
  annee: number | string;
  date_emission: string;
  user_id?: string;
}
