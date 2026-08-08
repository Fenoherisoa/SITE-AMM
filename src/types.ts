export type PageRoute = 
  | 'home' 
  | 'about' 
  | 'activities' 
  | 'agriculture' 
  | 'livestock' 
  | 'arts' 
  | 'training' 
  | 'events' 
  | 'news' 
  | 'gallery' 
  | 'contact' 
  | 'login' 
  | 'forgot-password' 
  | 'reset-password' 
  | 'change-password' 
  | 'espace' 
  | 'access-denied';

export type AccountStatus = 
  | 'PENDING' 
  | 'APPROVED' 
  | 'INVITED' 
  | 'ACTIVE' 
  | 'REJECTED' 
  | 'SUSPENDED' 
  | 'DISABLED' 
  | 'ARCHIVED';

export interface UserMetadata {
  uid: string;
  email: string;
  displayName: string;
  role: 'MEMBER' | 'COORDINATOR' | 'ADMIN' | 'APPLICANT';
  status: AccountStatus;
  permissions?: string[];
  cin?: string;
  department?: string;
  memberSince?: string;
  avatarUrl?: string;
  phone?: string;
  location?: string;
  portalAccess?: boolean;
  linkedEmployeeId?: string;
}

export interface Member {
  id: string;
  fullName: string;
  cin: string;
  phone: string;
  email: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING' | 'ARCHIVED';
  registrationDate: string;
  membershipType: 'Producteur' | 'Artisan' | 'Éleveur' | 'Formateur' | 'Adhérent Sympathisant' | 'Membre d\'Honneur';
  department?: string;
  photoUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivitySector {
  id: string;
  slug: 'agriculture' | 'livestock' | 'arts' | 'training' | 'community';
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  objectives: string[];
  keyProjects: string[];
  iconName: string;
  heroImage: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  fullContent?: string;
  date: string;
  time?: string;
  location: string;
  category: 'Agriculture' | 'Livestock' | 'Arts' | 'Training' | 'Community';
  status: 'upcoming' | 'ongoing' | 'past';
  image: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  author: string;
  image: string;
  readTime: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Activities' | 'Agriculture' | 'Livestock' | 'Training' | 'Arts' | 'Events' | 'Community';
  imageUrl: string;
  caption: string;
  date: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface StorageService {
  uploadFile(file: File, folder: string): Promise<{ url: string; fileId: string }>;
  getFileUrl(fileId: string): Promise<string>;
  deleteFile(fileId: string): Promise<boolean>;
}


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