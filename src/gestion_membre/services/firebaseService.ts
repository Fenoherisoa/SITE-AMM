export const BASE_URL = "https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app";

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
  gps?: {
    latitude: number;
    longitude: number;
  };
  valim_panontaniana?: {
    [key: string]: boolean;
  };
  submitted_at?: string;
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
  tempCode?: string | null;
  tempCodeExpires?: string | null;
}

export interface ActionLog {
  id?: string;
  operator: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Transaction {
  id?: string;
  customId?: string;
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
  createdBy?: string;
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

// ----------------------------------------------------
// RESILIENT HTTP LAYER
// ----------------------------------------------------

/**
 * Executes a resilient fetch to Firebase RTDB:
 * 1. Tries same-origin proxy (/api/rtdb/...) to avoid CORS / adblocker / iframe issues
 * 2. Falls back to direct Firebase RTDB endpoint
 */
export async function requestRtdb(endpoint: string, options?: RequestInit): Promise<Response> {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // 1. First attempt: Same-origin proxy (instant, bypasses browser CORS & adblocker restrictions)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const proxyRes = await fetch(`/api/rtdb${cleanPath}`, {
      ...options,
      signal: options?.signal || controller.signal,
    });
    clearTimeout(timeoutId);
    if (proxyRes.ok) {
      return proxyRes;
    }
  } catch {
    // If proxy fails, gracefully proceed to direct fetch
  }

  // 2. Second attempt: Direct call to Firebase RTDB
  const directUrl = `${BASE_URL}${cleanPath}`;
  return await fetch(directUrl, options);
}

// ----------------------------------------------------
// API REQUEST SERVICES
// ----------------------------------------------------

export const FirebaseService = {
  // --- MEMBERS (OLONA) SERVICES ---
  async getMembers(): Promise<Member[]> {
    try {
      const res = await requestRtdb('/olona.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data) return [];
      const list: Member[] = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      
      // Store in memory / session storage cache for offline resilience
      try {
        sessionStorage.setItem('cached_members', JSON.stringify(list));
      } catch {
        // Ignore storage quota limits
      }
      return list;
    } catch (e) {
      console.warn("FirebaseService fallback (getMembers):", e);
      try {
        const cached = sessionStorage.getItem('cached_members');
        if (cached) return JSON.parse(cached);
      } catch {
        // ignore
      }
      return [];
    }
  },

  async saveMember(member: Member): Promise<void> {
    try {
      const res = await requestRtdb(`/olona/${member.id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (saveMember):", e);
      throw e;
    }
  },

  async deleteMember(memberId: string): Promise<void> {
    try {
      const res = await requestRtdb(`/olona/${memberId}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (deleteMember):", e);
      throw e;
    }
  },

  // --- ENQUETES SERVICES ---
  async getEnquetes(): Promise<Enquete[]> {
    try {
      const res = await requestRtdb('/enquetes.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data) return [];
      const list: Enquete[] = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      try {
        sessionStorage.setItem('cached_enquetes', JSON.stringify(list));
      } catch {}
      return list;
    } catch (e) {
      console.warn("FirebaseService fallback (getEnquetes):", e);
      try {
        const cached = sessionStorage.getItem('cached_enquetes');
        if (cached) return JSON.parse(cached);
      } catch {}
      return [];
    }
  },

  async updateEnqueteStatus(enqueteId: string, newStatus: string): Promise<void> {
    try {
      const res = await requestRtdb(`/enquetes/${enqueteId}/status.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStatus)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (updateEnqueteStatus):", e);
      throw e;
    }
  },

  async deleteEnquete(enqueteId: string): Promise<void> {
    try {
      const res = await requestRtdb(`/enquetes/${enqueteId}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (deleteEnquete):", e);
      throw e;
    }
  },

  // --- EVENTS SERVICES ---
  async getEvents(): Promise<CalendarEvent[]> {
    try {
      const res = await requestRtdb('/events.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data) return [];
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    } catch (e) {
      console.warn("FirebaseService fallback (getEvents):", e);
      return [];
    }
  },

  async saveEvent(event: CalendarEvent): Promise<void> {
    try {
      const res = await requestRtdb('/events.json', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (saveEvent):", e);
      throw e;
    }
  },

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const res = await requestRtdb(`/events/${eventId}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (deleteEvent):", e);
      throw e;
    }
  },

  // --- TOKEN POOL SERVICES ---
  async getTokens(): Promise<Record<string, { role: string; token_miasa: string }>> {
    try {
      const res = await requestRtdb('/token_pool.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json() || {};
    } catch (e) {
      console.warn("FirebaseService fallback (getTokens):", e);
      return {};
    }
  },

  async saveToken(uniqueId: string, payload: { role: string; token_miasa: string }): Promise<void> {
    try {
      const res = await requestRtdb(`/token_pool/${uniqueId}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (saveToken):", e);
      throw e;
    }
  },

  async deleteToken(tokenKey: string): Promise<void> {
    try {
      const res = await requestRtdb(`/token_pool/${tokenKey}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (deleteToken):", e);
      throw e;
    }
  },

  // --- ACCOUNTING CODES & SERVICES ---
  async getAccounting(): Promise<Transaction[]> {
    try {
      const res = await requestRtdb('/comptabilite.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data) return [];
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    } catch (e) {
      console.warn("FirebaseService fallback (getAccounting):", e);
      return [];
    }
  },

  async addAccounting(transaction: Transaction): Promise<{ name: string }> {
    try {
      const res = await requestRtdb('/comptabilite.json', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error("FirebaseService Error (addAccounting):", e);
      throw e;
    }
  },

  async deleteAccounting(id: string): Promise<void> {
    try {
      const res = await requestRtdb(`/comptabilite/${id}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (deleteAccounting):", e);
      throw e;
    }
  },

  async getMemberAccount(matricule: string): Promise<{ solde: number; solde_credit: number; solde_debit: number } | null> {
    try {
      const res = await requestRtdb(`/comptes/${matricule}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("FirebaseService fallback (getMemberAccount):", e);
      return null;
    }
  },

  async patchMemberAccount(matricule: string, update: Partial<{ solde: number; solde_credit: number; solde_debit: number }>): Promise<void> {
    try {
      const res = await requestRtdb(`/comptes/${matricule}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (patchMemberAccount):", e);
      throw e;
    }
  },

  // --- OPERATIONS CONTROLS/VALIDATIONS (72H) ---
  async getOperationRequests(): Promise<Record<string, OperationRequest>> {
    try {
      const res = await requestRtdb('/operationRequest.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json() || {};
    } catch (e) {
      console.warn("FirebaseService fallback (getOperationRequests):", e);
      return {};
    }
  },

  async deleteOperationRequest(key: string): Promise<void> {
    try {
      const res = await requestRtdb(`/operationRequest/${key}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (deleteOperationRequest):", e);
      throw e;
    }
  },

  // --- LOGGING ---
  async getLogs(): Promise<ActionLog[]> {
    try {
      const res = await requestRtdb('/logs.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data) return [];
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    } catch (e) {
      console.warn("FirebaseService fallback (getLogs):", e);
      return [];
    }
  },

  async pushLog(log: ActionLog): Promise<void> {
    try {
      await requestRtdb('/logs.json', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log)
      });
    } catch (e) {
      console.error("FirebaseService Error (pushLog):", e);
    }
  },

  async deleteLog(id: string): Promise<void> {
    try {
      const res = await requestRtdb(`/logs/${id}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (deleteLog):", e);
      throw e;
    }
  },

  // --- USER ACCOUNTS ---
  async getUsers(): Promise<Record<string, UserAccount>> {
    try {
      const res = await requestRtdb('/users.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json() || {};
    } catch (e) {
      console.warn("FirebaseService fallback (getUsers):", e);
      return {};
    }
  },

  async getUser(username: string): Promise<UserAccount | null> {
    try {
      const res = await requestRtdb(`/users/${username}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("FirebaseService fallback (getUser):", e);
      return null;
    }
  },

  async saveUser(username: string, user: UserAccount): Promise<void> {
    try {
      const res = await requestRtdb(`/users/${username}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (saveUser):", e);
      throw e;
    }
  },

  async deleteUser(username: string): Promise<void> {
    try {
      const res = await requestRtdb(`/users/${username}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (deleteUser):", e);
      throw e;
    }
  },

  // --- DOSSIERS HISTORY ---
  async getDossiers(): Promise<any> {
    try {
      const res = await requestRtdb('/dossiers.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("FirebaseService fallback (getDossiers):", e);
      return null;
    }
  },

  async deleteDossier(key: string): Promise<void> {
    try {
      const res = await requestRtdb(`/dossiers/${key}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (deleteDossier):", e);
      throw e;
    }
  },

  // --- PARAMETERS SERVICES ---
  async getParametres(): Promise<any> {
    try {
      const res = await requestRtdb('/parametres.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn("FirebaseService fallback (getParametres):", e);
      return null;
    }
  },

  async saveParametres(params: any): Promise<void> {
    try {
      const res = await requestRtdb('/parametres.json', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("FirebaseService Error (saveParametres):", e);
      throw e;
    }
  }
};
