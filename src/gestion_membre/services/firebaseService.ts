import { DataLayer } from '../../offline/dataLayer';
import { storageManager } from '../../offline/storage/StorageManager';
import { syncLogger } from '../../offline/sync/syncLogger';

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

export async function requestRtdb(endpoint: string, options?: RequestInit): Promise<Response> {
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // 1. Essai avec le proxy interne
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const proxyRes = await fetch(`/api/rtdb${cleanPath}`, {
      ...options,
      signal: options?.signal || controller.signal,
    });
    clearTimeout(timeoutId);
    if (proxyRes.ok || proxyRes.status === 404) {
      return proxyRes;
    }
  } catch {
    // Continuer vers l'accès direct
  }

  // 2. Appel direct Firebase
  const directUrl = `${BASE_URL}${cleanPath}`;
  return await fetch(directUrl, options);
}

// ----------------------------------------------------
// API REQUEST SERVICES (AVEC OFFLINE-FIRST NÉCESSAIRE)
// ----------------------------------------------------

export const FirebaseService = {
  // --- MEMBERS (OLONA) SERVICES ---
  async getMembers(): Promise<Member[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      const res = await requestRtdb('/olona.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data) {
        const list: Member[] = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        // Mettre en cache dans la base locale persistante
        const adapter = await storageManager.getAdapter();
        await adapter.putBatch('olona', list.map(m => ({ id: m.id, data: m })));
        return list;
      }
    } catch {
      // Fallback local
    }

    const localList = await DataLayer.queryAll<Member>('olona');
    return localList;
  },

  async saveMember(member: Member): Promise<void> {
    // 1. Sauvegarde locale immédiate dans IndexedDB + mise en file d'attente
    await DataLayer.saveRecord('olona', member.id, member);
    syncLogger.log('info', `Membre ${member.matricule} enregistré localement`, 'LOCAL');

    // 2. Si en ligne, envoi direct vers Firebase
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const res = await requestRtdb(`/olona/${member.id}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(member)
        });
        if (res.ok) {
          syncLogger.log('success', `Membre ${member.matricule} synchronisé avec Firebase`, 'CLOUD');
        }
      } catch (e) {
        console.warn('Envoi direct Firebase échoué, conservé en file d’attente:', e);
      }
    }
  },

  async deleteMember(memberId: string): Promise<void> {
    // 1. Suppression locale immédiate
    await DataLayer.deleteRecord('olona', memberId);

    // 2. Si en ligne, suppression directe dans Firebase
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/olona/${memberId}.json`, { method: "DELETE" });
      } catch (e) {
        console.warn('Suppression directe Firebase différée:', e);
      }
    }
  },

  // --- ENQUETES SERVICES ---
  async getEnquetes(): Promise<Enquete[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      const res = await requestRtdb('/enquetes.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data) {
        const list: Enquete[] = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        const adapter = await storageManager.getAdapter();
        await adapter.putBatch('enquetes', list.map(e => ({ id: e.id || e.unique_id || 'enq', data: e })));
        return list;
      }
    } catch {}

    return await DataLayer.queryAll<Enquete>('enquetes');
  },

  async updateEnqueteStatus(enqueteId: string, newStatus: string): Promise<void> {
    const existing = await DataLayer.getById<Enquete>('enquetes', enqueteId);
    const updated = existing ? { ...existing, status: newStatus } : { id: enqueteId, status: newStatus };
    await DataLayer.saveRecord('enquetes', enqueteId, updated);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/enquetes/${enqueteId}/status.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newStatus)
        });
      } catch (e) {
        console.warn('Status enquete direct échoué, différé:', e);
      }
    }
  },

  async deleteEnquete(enqueteId: string): Promise<void> {
    await DataLayer.deleteRecord('enquetes', enqueteId);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/enquetes/${enqueteId}.json`, { method: "DELETE" });
      } catch {}
    }
  },

  // --- EVENTS SERVICES ---
  async getEvents(): Promise<CalendarEvent[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      const res = await requestRtdb('/events.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        const adapter = await storageManager.getAdapter();
        await adapter.putBatch('events', list.map(ev => ({ id: ev.id, data: ev })));
        return list;
      }
    } catch {}

    return await DataLayer.queryAll<CalendarEvent>('events');
  },

  async saveEvent(event: CalendarEvent): Promise<void> {
    const eventId = event.id || `EVT_${Date.now()}`;
    const fullEvent = { ...event, id: eventId };
    await DataLayer.saveRecord('events', eventId, fullEvent, true);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/events/${eventId}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullEvent)
        });
      } catch {}
    }
  },

  async deleteEvent(eventId: string): Promise<void> {
    await DataLayer.deleteRecord('events', eventId);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/events/${eventId}.json`, { method: "DELETE" });
      } catch {}
    }
  },

  // --- TOKEN POOL SERVICES ---
  async getTokens(): Promise<Record<string, { role: string; token_miasa: string }>> {
    try {
      const res = await requestRtdb('/token_pool.json');
      if (res.ok) {
        const data = await res.json();
        return data || {};
      }
    } catch {}
    return {};
  },

  async saveToken(uniqueId: string, payload: { role: string; token_miasa: string }): Promise<void> {
    await DataLayer.saveRecord('token_pool', uniqueId, payload);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/token_pool/${uniqueId}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch {}
    }
  },

  async deleteToken(tokenKey: string): Promise<void> {
    await DataLayer.deleteRecord('token_pool', tokenKey);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/token_pool/${tokenKey}.json`, { method: "DELETE" });
      } catch {}
    }
  },

  // --- ACCOUNTING CODES & SERVICES ---
  async getAccounting(): Promise<Transaction[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      const res = await requestRtdb('/comptabilite.json');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const list: Transaction[] = Object.keys(data).map(key => ({ id: key, ...data[key] }));
          const adapter = await storageManager.getAdapter();
          await adapter.putBatch('comptabilite', list.map(tx => ({ id: tx.id || tx.customId || 'tx', data: tx })));
          return list;
        }
      }
    } catch {}

    return await DataLayer.queryAll<Transaction>('comptabilite');
  },

  async addAccounting(transaction: Transaction): Promise<{ name: string }> {
    const txId = transaction.id || transaction.customId || `TX_${Date.now()}`;
    const fullTx = { ...transaction, id: txId };
    await DataLayer.saveRecord('comptabilite', txId, fullTx, true);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const res = await requestRtdb(`/comptabilite/${txId}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullTx)
        });
        if (res.ok) {
          return { name: txId };
        }
      } catch {}
    }
    return { name: txId };
  },

  async deleteAccounting(id: string): Promise<void> {
    await DataLayer.deleteRecord('comptabilite', id);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/comptabilite/${id}.json`, { method: "DELETE" });
      } catch {}
    }
  },

  async getMemberAccount(matricule: string): Promise<{ solde: number; solde_credit: number; solde_debit: number } | null> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      const res = await requestRtdb(`/comptes/${matricule}.json`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          await DataLayer.saveRecord('comptes', matricule, data);
          return data;
        }
      }
    } catch {}

    const localAccount = await DataLayer.getById<{ solde: number; solde_credit: number; solde_debit: number }>('comptes', matricule);
    return localAccount;
  },

  async patchMemberAccount(matricule: string, update: Partial<{ solde: number; solde_credit: number; solde_debit: number }>): Promise<void> {
    const existing = await DataLayer.getById<any>('comptes', matricule) || { solde: 0, solde_credit: 0, solde_debit: 0 };
    const merged = { ...existing, ...update };
    await DataLayer.saveRecord('comptes', matricule, merged);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/comptes/${matricule}.json`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update)
        });
      } catch {}
    }
  },

  // --- OPERATIONS CONTROLS/VALIDATIONS (72H) ---
  async getOperationRequests(): Promise<Record<string, OperationRequest>> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      const res = await requestRtdb('/operationRequest.json');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const adapter = await storageManager.getAdapter();
          for (const [k, v] of Object.entries(data)) {
            await adapter.put('operationRequest', k, v);
          }
          return data;
        }
      }
    } catch {}

    const list = await DataLayer.queryAll<OperationRequest>('operationRequest');
    const result: Record<string, OperationRequest> = {};
    list.forEach(op => {
      const key = op.key || op.id || 'op';
      result[key] = op;
    });
    return result;
  },

  async deleteOperationRequest(key: string): Promise<void> {
    await DataLayer.deleteRecord('operationRequest', key);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/operationRequest/${key}.json`, { method: "DELETE" });
      } catch {}
    }
  },

  // --- LOGGING ---
  async getLogs(): Promise<ActionLog[]> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      const res = await requestRtdb('/logs.json');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
          const adapter = await storageManager.getAdapter();
          await adapter.putBatch('logs', list.map(l => ({ id: l.id, data: l })));
          return list;
        }
      }
    } catch {}

    return await DataLayer.queryAll<ActionLog>('logs');
  },

  async pushLog(log: ActionLog): Promise<void> {
    const logId = log.id || `LOG_${Date.now()}`;
    await DataLayer.saveRecord('logs', logId, { ...log, id: logId }, true);

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/logs/${logId}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(log)
        });
      } catch {}
    }
  },

  async deleteLog(id: string): Promise<void> {
    await DataLayer.deleteRecord('logs', id);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/logs/${id}.json`, { method: "DELETE" });
      } catch {}
    }
  },

  // --- USER ACCOUNTS ---
  async getUsers(): Promise<Record<string, UserAccount>> {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Offline');
      }
      const res = await requestRtdb('/users.json');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const adapter = await storageManager.getAdapter();
          for (const [k, v] of Object.entries(data)) {
            await adapter.put('users', k, v);
          }
          return data;
        }
      }
    } catch {}

    const list = await DataLayer.queryAll<UserAccount>('users');
    const result: Record<string, UserAccount> = {};
    list.forEach(u => {
      result[u.username] = u;
    });
    return result;
  },

  async getUser(username: string): Promise<UserAccount | null> {
    try {
      const res = await requestRtdb(`/users/${username}.json`);
      if (res.ok) return await res.json();
    } catch {}
    return await DataLayer.getById<UserAccount>('users', username);
  },

  async saveUser(username: string, user: UserAccount): Promise<void> {
    await DataLayer.saveRecord('users', username, user);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/users/${username}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user)
        });
      } catch {}
    }
  },

  async deleteUser(username: string): Promise<void> {
    await DataLayer.deleteRecord('users', username);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/users/${username}.json`, { method: "DELETE" });
      } catch {}
    }
  },

  // --- DOSSIERS HISTORY ---
  async getDossiers(): Promise<any> {
    try {
      const res = await requestRtdb('/dossiers.json');
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async deleteDossier(key: string): Promise<void> {
    await DataLayer.deleteRecord('dossiers', key);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb(`/dossiers/${key}.json`, { method: "DELETE" });
      } catch {}
    }
  },

  // --- PARAMETERS SERVICES ---
  async getParametres(): Promise<any> {
    try {
      const res = await requestRtdb('/parametres.json');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          await DataLayer.saveRecord('parametres', 'global', data);
          return data;
        }
      }
    } catch {}
    return await DataLayer.getById<any>('parametres', 'global');
  },

  async saveParametres(params: any): Promise<void> {
    await DataLayer.saveRecord('parametres', 'global', params);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        await requestRtdb('/parametres.json', {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params)
        });
      } catch {}
    }
  }
};
