/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Actualite,
  ComptabiliteRecord,
  Compte,
  MemberRegistry,
  OperationRequest,
  UserRequest,
} from "./types";

const EXT_BASE_URL =
  "https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app";

// Pre-populated seed registry for AMM (if Firebase is empty or unreachable)
const SEED_MEMBERS: MemberRegistry[] = [
  {
    matricule: "AMM-0001",
    anarana: "Rakoto Hery",
    telephone: "0341122233",
    email: "rakoto.hery@gmail.com",
  },
  {
    matricule: "AMM-0002",
    anarana: "Rabe Jean",
    telephone: "0324455566",
    email: "rabe.jean@gmail.com",
  },
  {
    matricule: "AMM-0003",
    anarana: "Razafy Marie",
    telephone: "0337788899",
    email: "razafy.marie@gmail.com",
  },
  {
    matricule: "AMM-0004",
    anarana: "Randria Toky",
    telephone: "0342233344",
    email: "randria.toky@outlook.com",
  },
  {
    matricule: "AMM-0005",
    anarana: "Andry Nirina",
    telephone: "0329988877",
    email: "andry.nirina@yahoo.fr",
  },
];

const SEED_COMPTES: Record<string, Compte> = {
  "AMM-0001": {
    matricule: "AMM-0001",
    solde: 1250000,
    solde_credit: 1500000,
    solde_debit: 250000,
  },
  "AMM-0002": {
    matricule: "AMM-0002",
    solde: 450000,
    solde_credit: 500000,
    solde_debit: 50000,
  },
  "AMM-0003": {
    matricule: "AMM-0003",
    solde: 80000,
    solde_credit: 100000,
    solde_debit: 20000,
  },
};

const SEED_ACTUALITES: Actualite[] = [
  {
    id: "act1",
    title: "Assemblée Générale Ordinaire AMM",
    desc: "L'Association Malagasy Miray tiendra son assemblée générale ce samedi pour discuter de la restructuration financière et des nouveaux projets de soutien communautaire.",
    categorie: "Événement",
    date: "2026-06-20",
    createdAt: Date.now() - 2 * 24 * 3600 * 1000,
  },
  {
    id: "act2",
    title: "Nouveau taux de cotisation et de virement",
    desc: "Bénéficiez du service de virement direct ultra-sécurisé d'AMM pour l'entraide associative. Les frais pour les transferts internes d'AMM restent entièrement gratuits (0% de frais !).",
    categorie: "Finance",
    date: "2026-06-15",
    createdAt: Date.now() - 5 * 24 * 3600 * 1000,
  },
  {
    id: "act3",
    title: "Rappel important sur les retraits par Mobile Money",
    desc: "Pour tout retrait effectué via Mvola, Orange Money ou Airtel Money, les frais d'opérateur obligatoire de 5% sont déduits du montant total débité afin de garantir la transparence.",
    categorie: "Information",
    date: "2026-06-10",
    createdAt: Date.now() - 10 * 24 * 3600 * 1000,
  },
];

const SEED_COMPTABILITE: ComptabiliteRecord[] = [
  {
    id: "HIST1",
    matricule: "AMM-0001",
    karazana: "MIDITRA",
    motif: "Dépôt initial espèces direct",
    vola: 1500000,
    date: "10/06/2026",
    createdAt: Date.now() - 6 * 24 * 3600 * 1000,
    reference_audit: "AMM-DEP-9921",
    operateur: "Mvola",
  },
  {
    id: "HIST2",
    matricule: "AMM-0001",
    karazana: "MIVOAKA",
    motif: "Retrait d'urgence pharmacie",
    vola: 250000,
    date: "12/06/2026",
    createdAt: Date.now() - 4 * 24 * 3600 * 1000,
    reference_audit: "AMM-RET-8842",
    operateur: "Orange Money",
  },
  {
    id: "HIST3",
    matricule: "AMM-0002",
    karazana: "MIDITRA",
    motif: "Versement Mobile Money reçu",
    vola: 500000,
    date: "11/06/2026",
    createdAt: Date.now() - 5 * 24 * 3600 * 1000,
    reference_audit: "AMM-DEP-1102",
    operateur: "Airtel Money",
  },
  {
    id: "HIST4",
    matricule: "AMM-0002",
    karazana: "MIVOAKA",
    motif: "Cotisation semestrielle bureau",
    vola: 50000,
    date: "14/06/2026",
    createdAt: Date.now() - 2 * 24 * 3600 * 1000,
    reference_audit: "AMM-RET-2022",
    operateur: "Mvola",
  },
];

const SEED_EMPLOYEES = [
  {
    matricule: "EMP001",
    anarana: "Rakoto",
    telephone: "0340011122",
    email: "rakoto@etoile.mg",
  },
  {
    matricule: "EMP002",
    anarana: "Rasoa",
    telephone: "0331122334",
    email: "rasoa@etoile.mg",
  },
];

// Helper to load/save state locally
const getLocal = (key: string): any => {
  const item = localStorage.getItem(`amm_${key}`);
  return item ? JSON.parse(item) : null;
};

const setLocal = (key: string, data: any) => {
  localStorage.setItem(`amm_${key}`, JSON.stringify(data));
};

// Initialize default LocalStorage state with beautiful mock data
const initLocalStorage = () => {
  if (!getLocal("olona")) setLocal("olona", SEED_MEMBERS);
  if (!getLocal("comptes")) setLocal("comptes", SEED_COMPTES);
  if (!getLocal("events")) setLocal("events", SEED_ACTUALITES);
  if (!getLocal("comptabilite")) setLocal("comptabilite", SEED_COMPTABILITE);
  if (!getLocal("employees")) setLocal("employees", SEED_EMPLOYEES);
  if (!getLocal("operationRequests")) setLocal("operationRequests", []);
};

initLocalStorage();

// State to track if we're in "offline-fallback" mode
let isUsingFirebase = true;

// Clean Generic Request Helper
async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T | null> {
  if (!isUsingFirebase) return null;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000); // 4s timeout for snappy UI response
    const res = await fetch(`${EXT_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) throw new Error("HTTP Error");
    return (await res.json()) as T;
  } catch (e) {
    console.warn(
      `Firebase fetch failed for ${endpoint}. Falling back to local data store.`,
      e,
    );
    return null;
  }
}

export const dbService = {
  isOnline: () => isUsingFirebase,
  setOnlineMode: (online: boolean) => {
    isUsingFirebase = online;
  },

  // 1. Check Registry (Checks if Member is in AMM Registry of "olona")
  async checkMemberRegistry(
    matricule: string,
    name: string,
    contact: string,
  ): Promise<MemberRegistry | null> {
    const rawMatrix = matricule.toUpperCase().trim();
    const rawName = name.toLowerCase().trim();
    const rawContact = contact.toLowerCase().trim();

    // Helper function handinihana ny data
    const findMatch = (
      data: Record<string, MemberRegistry> | MemberRegistry[],
    ) => {
      const values = Array.isArray(data) ? data : Object.values(data);
      return values.find(
        (u: any) =>
          u &&
          u.matricule?.toUpperCase() === rawMatrix &&
          u.anarana?.toLowerCase() === rawName &&
          (u.telephone?.toLowerCase() === rawContact ||
            u.email?.toLowerCase() === rawContact),
      );
    };

    // 1. Jereo ao amin'ny olona.json (Firebase)
    const firebaseOlona =
      await request<Record<string, MemberRegistry>>("/olona.json");
    if (firebaseOlona) {
      const match = findMatch(firebaseOlona);
      if (match) return match as MemberRegistry;
    }

    // 2. Jereo ao amin'ny employees.json (Firebase vaovao)
    const firebaseEmployees =
      await request<Record<string, MemberRegistry>>("/employees.json");
    if (firebaseEmployees) {
      const match = findMatch(firebaseEmployees);
      if (match) return match as MemberRegistry;
    }

    // 3. Fallback to LocalStorage
    const localOlona = (getLocal("olona") as MemberRegistry[]) || [];
    const matchLocal = findMatch(localOlona);

    return matchLocal ? (matchLocal as MemberRegistry) : null;
  },

  // 2. Fetch User Access Request State
  async fetchUserRequest(matricule: string): Promise<UserRequest | null> {
    const rawMatrix = matricule.toUpperCase().trim();

    // Check Firebase
    const fbReq = await request<UserRequest>(
      `/pendingRequests/${rawMatrix}.json`,
    );
    if (fbReq) {
      const localRequests = getLocal("pendingRequests") || {};
      localRequests[rawMatrix] = fbReq;
      setLocal("pendingRequests", localRequests);
      return fbReq;
    }

    // Check Local
    const localRequests = getLocal("pendingRequests") || {};
    return (localRequests[rawMatrix] as UserRequest) || null;
  },

  // 3. Submit or Update User Request (Registration/Create PIN)
  async saveUserRequest(
    matricule: string,
    userReq: Partial<UserRequest>,
  ): Promise<boolean> {
    const rawMatrix = matricule.toUpperCase().trim();

    // Save to Local first
    const localRequests = getLocal("pendingRequests") || {};
    const existing = localRequests[rawMatrix] || {
      matricule: rawMatrix,
      createdAt: Date.now(),
    };
    const updated = { ...existing, ...userReq };
    localRequests[rawMatrix] = updated;
    setLocal("pendingRequests", localRequests);

    // Save to Firebase (Non-blocking background or best effort)
    const success = await request<any>(`/pendingRequests/${rawMatrix}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    return !!success || true;
  },

  // 4. Fetch Account Balance Information
  async fetchCompte(matricule: string): Promise<Compte> {
    const rawMatrix = matricule.toUpperCase().trim();

    // Check Firebase
    const fbCompte = await request<Compte>(`/comptes/${rawMatrix}.json`);
    if (fbCompte) {
      const comptes = getLocal("comptes") || {};
      comptes[rawMatrix] = fbCompte;
      setLocal("comptes", comptes);
      return fbCompte;
    }

    // Fallback to local
    const comptes = getLocal("comptes") || {};
    if (!comptes[rawMatrix]) {
      comptes[rawMatrix] = {
        matricule: rawMatrix,
        solde: 0,
        solde_credit: 0,
        solde_debit: 0,
      };
      setLocal("comptes", comptes);
    }
    return comptes[rawMatrix] as Compte;
  },

  // 5. Update Account Balance
  async updateCompte(
    matricule: string,
    solde: number,
    solde_credit: number,
    solde_debit: number,
  ): Promise<boolean> {
    const rawMatrix = matricule.toUpperCase().trim();
    const packet = { matricule: rawMatrix, solde, solde_credit, solde_debit };

    // Update Local
    const comptes = getLocal("comptes") || {};
    comptes[rawMatrix] = packet;
    setLocal("comptes", comptes);

    // Update Firebase
    const success = await request<any>(`/comptes/${rawMatrix}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(packet),
    });

    return !!success || true;
  },

  // 6. Submit a New Withdrawal / Deposit / Transfer Operation
  async submitOperation(
    op: Omit<OperationRequest, "id" | "createdAt" | "statut">,
  ): Promise<OperationRequest> {
    const opId = `OP${Date.now()}`;
    const newOp: OperationRequest = {
      ...op,
      id: opId,
      createdAt: Date.now(),
      statut: "pending",
    };

    // Save Local
    const localOps =
      (getLocal("operationRequests") as OperationRequest[]) || [];
    localOps.push(newOp);
    setLocal("operationRequests", localOps);

    // Save Firebase
    await request<any>(`/operationRequest/${opId}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOp),
    });

    return newOp;
  },

  // 7. Get All Operation Requests related to matricule
  async fetchOperations(matricule: string): Promise<OperationRequest[]> {
    const rawMatrix = matricule.toUpperCase().trim();

    // 1. Fetch Firebase ops
    const fbOps = await request<Record<string, any>>("/operationRequest.json");
    if (fbOps) {
      const fetchedList = Object.entries(fbOps).map(([id, o]) => ({
        ...(typeof o === "object" ? o : {}),
        id,
      })) as OperationRequest[];

      setLocal("operationRequests", fetchedList);
      return fetchedList
        .filter(
          (o) =>
            o && (o.matricule === rawMatrix || o.destinataire === rawMatrix),
        )
        .sort((a, b) => b.createdAt - a.createdAt);
    }

    // 2. Fetch Local
    const localOps =
      (getLocal("operationRequests") as OperationRequest[]) || [];
    return localOps
      .filter(
        (o) => o && (o.matricule === rawMatrix || o.destinataire === rawMatrix),
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  // 8. Fetch Accountant / Audit Logs (comptabilite.json)
  async fetchComptabilite(matricule: string): Promise<ComptabiliteRecord[]> {
    const rawMatrix = matricule.toUpperCase().trim();

    // Check Firebase
    const fbCompt = await request<Record<string, any>>("/comptabilite.json");
    if (fbCompt) {
      const fetchedList = Object.entries(fbCompt).map(([id, item]) => ({
        ...(typeof item === "object" ? item : {}),
        id,
      })) as ComptabiliteRecord[];
      setLocal("comptabilite", fetchedList);
      return fetchedList
        .filter((c) => c && c.matricule === rawMatrix)
        .sort((a, b) => b.createdAt - a.createdAt);
    }

    // Fallback Local
    const localC = (getLocal("comptabilite") as ComptabiliteRecord[]) || [];
    return localC
      .filter((c) => c && c.matricule === rawMatrix)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  // 9. Cancel a Pending Operation Transfer
  async cancelOperation(opId: string): Promise<boolean> {
    // 1. Update Local
    const localOps =
      (getLocal("operationRequests") as OperationRequest[]) || [];
    const index = localOps.findIndex((o) => o.id === opId);
    if (index !== -1) {
      localOps[index].statut = "cancelled";
      localOps[index].cancelledAt = Date.now();
      setLocal("operationRequests", localOps);
    }

    // 2. Update Firebase
    const success = await request<any>(`/operationRequest/${opId}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "cancelled", cancelledAt: Date.now() }),
    });

    return !!success || true;
  },

  // 10. Fetch News / Announcements Events
  async fetchActualites(): Promise<Actualite[]> {
    const fbNews = await request<Record<string, any>>("/events.json");
    if (fbNews) {
      const list = Object.entries(fbNews).map(([id, a]) => ({
        ...(typeof a === "object" ? a : {}),
        id,
      })) as Actualite[];
      setLocal("events", list);
      return list.sort((a, b) => b.createdAt - a.createdAt);
    }

    const localNews = (getLocal("events") as Actualite[]) || [];
    return localNews.sort((a, b) => b.createdAt - a.createdAt);
  },

  // 11. Process Transfers Automatically on loading/login or simulation
  async processAutoTransfers(): Promise<void> {
    try {
      const localRequests =
        (getLocal("operationRequests") as OperationRequest[]) || [];
      const now = Date.now();
      let modified = false;

      for (let op of localRequests) {
        if (op.type === "transfert" && op.statut === "pending") {
          const executionTime =
            op.executeAfter || op.createdAt + 24 * 3600 * 1000;
          if (now >= executionTime) {
            const destMatricule = op.destinataire;
            if (!destMatricule) continue;

            const comptes = getLocal("comptes") || {};
            const senderCompte = comptes[op.matricule] as Compte | undefined;
            const destCompte = comptes[destMatricule] as Compte | undefined;

            if (!destCompte) {
              op.statut = "cancelled";
              op.note = "Compte destinataire inexistant";
            } else if (!senderCompte || senderCompte.solde < op.montant) {
              op.statut = "cancelled";
              op.note =
                "Solde de l'émetteur insuffisant au moment de l'exécution";
            } else {
              senderCompte.solde -= op.montant;
              senderCompte.solde_debit += op.montant;

              destCompte.solde += op.montant;
              destCompte.solde_credit += op.montant;

              op.statut = "completed";
              op.executedAt = now;

              const hist =
                (getLocal("comptabilite") as ComptabiliteRecord[]) || [];
              const senderHistId = `TXS${Date.now()}`;
              hist.push({
                id: senderHistId,
                matricule: op.matricule,
                karazana: "MIVOAKA",
                motif: `Transfert envoyé à ${destMatricule} (Réf Op: ${op.id})`,
                vola: op.montant,
                date: new Date(now).toLocaleDateString("fr-FR"),
                createdAt: now,
                reference_audit: op.id,
              });

              const destHistId = `TXR${Date.now()}`;
              hist.push({
                id: destHistId,
                matricule: destMatricule,
                karazana: "MIDITRA",
                motif: `Transfert reçu de ${op.matricule} (Réf Op: ${op.id})`,
                vola: op.montant,
                date: new Date(now).toLocaleDateString("fr-FR"),
                createdAt: now,
                reference_audit: op.id,
              });

              setLocal("comptes", comptes);
              setLocal("comptabilite", hist);
            }
            modified = true;
          }
        }
      }

      if (modified) {
        setLocal("operationRequests", localRequests);

        for (const op of localRequests) {
          if (op.statut === "completed" || op.statut === "cancelled") {
            await request<any>(`/operationRequest/${op.id}.json`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                statut: op.statut,
                note: op.note || "",
                executedAt: op.executedAt || null,
              }),
            });

            const currentComptes = getLocal("comptes") || {};
            await request<any>(`/comptes/${op.matricule}.json`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(currentComptes[op.matricule]),
            });
            if (op.destinataire) {
              await request<any>(`/comptes/${op.destinataire}.json`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(currentComptes[op.destinataire]),
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("Exception sorting auto-transfers", e);
    }
  },

  // Admin simulation toolbox
  async simulateAdminAction(
    opId: string,
    action: "approve" | "reject",
  ): Promise<boolean> {
    const localOps =
      (getLocal("operationRequests") as OperationRequest[]) || [];
    const index = localOps.findIndex((o) => o.id === opId);
    if (index === -1) return false;

    const op = localOps[index];
    if (op.statut !== "pending") return false;

    const now = Date.now();
    const formattedDate = new Date(now).toLocaleDateString("fr-FR");

    if (action === "approve") {
      op.statut = "completed";
      op.executedAt = now;

      const comptes = getLocal("comptes") || {};
      const comp = comptes[op.matricule] || {
        matricule: op.matricule,
        solde: 0,
        solde_credit: 0,
        solde_debit: 0,
      };

      if (op.type === "depot") {
        comp.solde += op.montant;
        comp.solde_credit += op.montant;

        const hist = (getLocal("comptabilite") as ComptabiliteRecord[]) || [];
        hist.push({
          id: `HIST_DEP_${Date.now()}`,
          matricule: op.matricule,
          karazana: "MIDITRA",
          motif: `Dépôt validé (${op.operator || "Mobile Money"})`,
          vola: op.montant,
          date: formattedDate,
          createdAt: now,
          reference_audit: op.reference_transaction || op.id,
          operateur: op.operator,
        });
        setLocal("comptabilite", hist);
      } else if (op.type === "retrait") {
        comp.solde -= op.montant;
        comp.solde_debit += op.montant;

        const hist = (getLocal("comptabilite") as ComptabiliteRecord[]) || [];
        hist.push({
          id: `HIST_RET_${Date.now()}`,
          matricule: op.matricule,
          karazana: "MIVOAKA",
          motif: `Retrait validé (${op.operator || "Mobile Money"}) - Frais déduits`,
          vola: op.montant,
          date: formattedDate,
          createdAt: now,
          reference_audit: op.id,
          operateur: op.operator,
        });
        setLocal("comptabilite", hist);
      }

      comptes[op.matricule] = comp;
      setLocal("comptes", comptes);
    } else {
      op.statut = "rejected";
      op.note =
        "Demande rejetée par l'administrateur après vérification des fonds ou de la référence.";
    }

    setLocal("operationRequests", localOps);

    await request<any>(`/operationRequest/${opId}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(op),
    });

    if (action === "approve") {
      const currentComptes = getLocal("comptes") || {};
      await request<any>(`/comptes/${op.matricule}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentComptes[op.matricule]),
      });
    }

    return true;
  },
};
