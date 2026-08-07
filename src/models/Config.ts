export interface AppConfig {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  updatedAt?: string;
}

export interface SystemMetadata {
  lastMatriculeNumber?: number;
  lastUpdate?: string;
  dataSchemaVersion?: number;
}
