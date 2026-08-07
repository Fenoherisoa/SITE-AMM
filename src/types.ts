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
