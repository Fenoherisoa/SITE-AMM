export const BASE_URL = "https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app/";

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
// API REQUEST SERVICES
// ----------------------------------------------------

export const FirebaseService = {
  // --- MEMBERS (OLONA) SERVICES ---
  async getMembers(): Promise<Member[]> {
    try {
      const res = await fetch(`${BASE_URL}/olona.json`);
      if (!res.ok) throw new Error("Erreur lors de la récupération des membres");
      const data = await res.json();
      if (!data) return [];
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    } catch (e) {
      console.error("FirebaseService Error (getMembers):", e);
      throw e;
    }
  },

  async saveMember(member: Member): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/olona/${member.id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member)
      });
      if (!res.ok) throw new Error("Erreur de sauvegarde du membre");
    } catch (e) {
      console.error("FirebaseService Error (saveMember):", e);
      throw e;
    }
  },

  async deleteMember(memberId: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/olona/${memberId}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erreur lors de l'effacement du membre");
    } catch (e) {
      console.error("FirebaseService Error (deleteMember):", e);
      throw e;
    }
  },

  // --- ENQUETES SERVICES ---
  async getEnquetes(): Promise<Enquete[]> {
    try {
      const res = await fetch(`${BASE_URL}/enquetes.json`);
      if (!res.ok) throw new Error("Erreur de chargement des enquêtes");
      const data = await res.json();
      if (!data) return [];
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    } catch (e) {
      console.error("FirebaseService Error (getEnquetes):", e);
      throw e;
    }
  },

  async updateEnqueteStatus(enqueteId: string, newStatus: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/enquetes/${enqueteId}/status.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStatus)
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour de l'enquête");
    } catch (e) {
      console.error("FirebaseService Error (updateEnqueteStatus):", e);
      throw e;
    }
  },

  async deleteEnquete(enqueteId: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/enquetes/${enqueteId}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erreur de suppression de l'enquête");
    } catch (e) {
      console.error("FirebaseService Error (deleteEnquete):", e);
      throw e;
    }
  },

  // --- EVENTS SERVICES ---
  async getEvents(): Promise<CalendarEvent[]> {
    try {
      const res = await fetch(`${BASE_URL}/events.json`);
      if (!res.ok) throw new Error("Erreur de chargement des événements");
      const data = await res.json();
      if (!data) return [];
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    } catch (e) {
      console.error("FirebaseService Error (getEvents):", e);
      throw e;
    }
  },

  async saveEvent(event: CalendarEvent): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/events.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
      });
      if (!res.ok) throw new Error("Erreur de sauvegarde de l'événement");
    } catch (e) {
      console.error("FirebaseService Error (saveEvent):", e);
      throw e;
    }
  },

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erreur de suppression de l'événement");
    } catch (e) {
      console.error("FirebaseService Error (deleteEvent):", e);
      throw e;
    }
  },

  // --- TOKEN POOL SERVICES ---
  async getTokens(): Promise<Record<string, { role: string; token_miasa: string }>> {
    try {
      const res = await fetch(`${BASE_URL}/token_pool.json`);
      if (!res.ok) throw new Error("Erreur lors du chargement des tokens");
      return await res.json() || {};
    } catch (e) {
      console.error("FirebaseService Error (getTokens):", e);
      throw e;
    }
  },

  async saveToken(uniqueId: string, payload: { role: string; token_miasa: string }): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/token_pool/${uniqueId}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Erreur lors de la génération du token");
    } catch (e) {
      console.error("FirebaseService Error (saveToken):", e);
      throw e;
    }
  },

  async deleteToken(tokenKey: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/token_pool/${tokenKey}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erreur de suppression du token");
    } catch (e) {
      console.error("FirebaseService Error (deleteToken):", e);
      throw e;
    }
  },

  // --- ACCOUNTING CODES & SERVICES ---
  async getAccounting(): Promise<Transaction[]> {
    try {
      const res = await fetch(`${BASE_URL}/comptabilite.json`);
      if (!res.ok) throw new Error("Erreur de chargement comptable");
      const data = await res.json();
      if (!data) return [];
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    } catch (e) {
      console.error("FirebaseService Error (getAccounting):", e);
      throw e;
    }
  },

  async addAccounting(transaction: Transaction): Promise<{ name: string }> {
    try {
      const res = await fetch(`${BASE_URL}/comptabilite.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction)
      });
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement de l'opération");
      return await res.json();
    } catch (e) {
      console.error("FirebaseService Error (addAccounting):", e);
      throw e;
    }
  },

  async deleteAccounting(id: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/comptabilite/${id}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erreur lors de l'effacement de l'opération");
    } catch (e) {
      console.error("FirebaseService Error (deleteAccounting):", e);
      throw e;
    }
  },

  async getMemberAccount(matricule: string): Promise<{ solde: number; solde_credit: number; solde_debit: number } | null> {
    try {
      const res = await fetch(`${BASE_URL}/comptes/${matricule}.json`);
      if (!res.ok) throw new Error("Erreur lors de l'acquisition du solde");
      return await res.json();
    } catch (e) {
      console.error("FirebaseService Error (getMemberAccount):", e);
      throw e;
    }
  },

  async patchMemberAccount(matricule: string, update: Partial<{ solde: number; solde_credit: number; solde_debit: number }>): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/comptes/${matricule}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update)
      });
      if (!res.ok) throw new Error("Erreur de modification du solde");
    } catch (e) {
      console.error("FirebaseService Error (patchMemberAccount):", e);
      throw e;
    }
  },

  // --- OPERATIONS CONTROLS/VALIDATIONS (72H) ---
  async getOperationRequests(): Promise<Record<string, OperationRequest>> {
    try {
      const res = await fetch(`${BASE_URL}/operationRequest.json`);
      if (!res.ok) throw new Error("Erreur de chargement des demandes d'opérations");
      return await res.json() || {};
    } catch (e) {
      console.error("FirebaseService Error (getOperationRequests):", e);
      throw e;
    }
  },

  async deleteOperationRequest(key: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/operationRequest/${key}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erreur de suppression de la demande d'opération");
    } catch (e) {
      console.error("FirebaseService Error (deleteOperationRequest):", e);
      throw e;
    }
  },

  // --- LOGGING ---
  async getLogs(): Promise<ActionLog[]> {
    try {
      const res = await fetch(`${BASE_URL}/logs.json`);
      if (!res.ok) throw new Error("Erreur lors du chargement des logs");
      const data = await res.json();
      if (!data) return [];
      return Object.keys(data).map(key => ({ id: key, ...data[key] }));
    } catch (e) {
      console.error("FirebaseService Error (getLogs):", e);
      throw e;
    }
  },

  async pushLog(log: ActionLog): Promise<void> {
    try {
      await fetch(`${BASE_URL}/logs.json`, {
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
      const res = await fetch(`${BASE_URL}/logs/${id}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erreur d'effacement du log");
    } catch (e) {
      console.error("FirebaseService Error (deleteLog):", e);
      throw e;
    }
  },

  // --- USER ACCOUNTS ---
  async getUsers(): Promise<Record<string, UserAccount>> {
    try {
      const res = await fetch(`${BASE_URL}/users.json`);
      if (!res.ok) throw new Error("Erreur de chargement des utilisateurs");
      return await res.json() || {};
    } catch (e) {
      console.error("FirebaseService Error (getUsers):", e);
      throw e;
    }
  },

  async getUser(username: string): Promise<UserAccount | null> {
    try {
      const res = await fetch(`${BASE_URL}/users/${username}.json`);
      if (!res.ok) throw new Error("Erreur lors de la récupération de l'utilisateur " + username);
      return await res.json();
    } catch (e) {
      console.error("FirebaseService Error (getUser):", e);
      throw e;
    }
  },

  async saveUser(username: string, user: UserAccount): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/users/${username}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user)
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde de l'utilisateur");
    } catch (e) {
      console.error("FirebaseService Error (saveUser):", e);
      throw e;
    }
  },

  async deleteUser(username: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/users/${username}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression de l'utilisateur");
    } catch (e) {
      console.error("FirebaseService Error (deleteUser):", e);
      throw e;
    }
  },

  // --- DOSSIERS HISTORY ---
  async getDossiers(): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/dossiers.json`);
      if (!res.ok) throw new Error("Erreur de chargement de l'historique des dossiers");
      return await res.json();
    } catch (e) {
      console.error("FirebaseService Error (getDossiers):", e);
      throw e;
    }
  },

  async deleteDossier(key: string): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/dossiers/${key}.json`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Erreur de suppression du dossier");
    } catch (e) {
      console.error("FirebaseService Error (deleteDossier):", e);
      throw e;
    }
  },

  // --- PARAMETERS SERVICES ---
  async getParametres(): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/parametres.json`);
      if (!res.ok) throw new Error("Erreur de chargement des paramètres");
      return await res.json();
    } catch (e) {
      console.error("FirebaseService Error (getParametres):", e);
      throw e;
    }
  },

  async saveParametres(params: any): Promise<void> {
    try {
      const res = await fetch(`${BASE_URL}/parametres.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error("Erreur de mise à jour des paramètres");
    } catch (e) {
      console.error("FirebaseService Error (saveParametres):", e);
      throw e;
    }
  }
};
