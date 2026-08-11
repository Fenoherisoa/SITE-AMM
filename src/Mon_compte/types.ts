/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'mg' | 'fr' | 'en';

export type UserStatus = 'pending' | 'approved' | 'active' | 'rejected';

export interface UserRequest {
  matricule: string;
  nom: string;
  contact: string;
  statut: UserStatus;
  createdAt: number;
  password?: string | null;
}

export interface Compte {
  matricule: string;
  solde: number;
  solde_credit: number;
  solde_debit: number;
}

export type OperationType = 'depot' | 'retrait' | 'transfert';

export type OperationStatus = 'pending' | 'completed' | 'cancelled' | 'rejected';

export type MobileOperator = 'Mvola' | 'Orange Money' | 'Airtel Money';

export interface OperationRequest {
  id: string; // Unique ID prefixed with OP
  matricule: string; // Requester matricule
  memberName: string;
  type: OperationType;
  montant: number;
  frais?: number; // E.g., 5% fee for retraits
  operator?: MobileOperator | string;
  numero_telephone?: string;
  reference_transaction?: string; // VERY IMPORTANT: Transaction Reference Number for audit trail
  motif?: string; // Description or purpose
  statut: OperationStatus;
  createdAt: number;
  executeAfter?: number | null; // Scheduled execution for transfers (24h)
  destinataire?: string | null; // Recipient matricule for transfers
  traitement?: string; // Description of treatment timeline (e.g. "24h (auto)", "72h (admin)")
  executedAt?: number;
  cancelledAt?: number;
  note?: string; // Reason for cancel/rejection/approvals
}

export interface ComptabiliteRecord {
  id: string;
  matricule: string;
  karazana: 'MIDITRA' | 'MIVOAKA'; // "MIDITRA" = Deposit/Credit, "MIVOAKA" = Withdrawal/Debit
  motif: string;
  vola: number;
  date?: string;
  createdAt: number;
  reference_audit?: string; // Linking back to the transaction reference or operation ID
  operateur?: string;
  numero_compte_dest?: string;
}

export interface Actualite {
  id: string;
  title: string;
  desc: string;
  categorie: string;
  date?: string;
  createdAt: number;
}

export interface MemberRegistry {
  matricule: string;
  anarana: string;
  telephone: string;
  email: string;
}
