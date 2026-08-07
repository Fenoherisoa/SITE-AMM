export interface Role {
  name: string;
  description?: string;
}

export interface Permission {
  id: string; // e.g., members.read
  description?: string;
}

export interface PortalAccess {
  portalKey: string; // e.g., members, rh
  allowed: boolean;
}
