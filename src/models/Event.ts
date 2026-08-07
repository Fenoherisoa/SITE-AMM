export interface EventModel {
  id: string;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  participants?: string[]; // member or employee ids
  visibility?: 'public' | 'private';
  images?: string[];
  reports?: any[];
}
