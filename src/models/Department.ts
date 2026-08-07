export interface Department {
  id: string; // canonical id
  name: string;
  description?: string;
  positions?: string[]; // position ids or names
  legacySource?: string; // 'departements' | 'departments'
}
