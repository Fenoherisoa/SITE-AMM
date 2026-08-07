import crypto from 'crypto';

export interface Invitation {
  tokenHash: string;
  createdAt: string;
  expiresAt?: string;
  createdBy?: string;
  consumed?: boolean;
  consumedBy?: string;
}

export class InvitationTokenService {
  // In-memory store used for initial implementation; production should use secure datastore and secret management.
  private store: Map<string, Invitation> = new Map();

  createInvitation(ttlMinutes = 60, createdBy?: string): string {
    const raw = crypto.randomBytes(24).toString('hex');
    const tokenHash = this.hash(raw);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60000).toISOString();
    this.store.set(tokenHash, { tokenHash, createdAt: now.toISOString(), expiresAt, createdBy, consumed: false });
    return raw; // raw token returned to caller; do NOT persist raw token in logs
  }

  validateInvitation(rawToken: string): boolean {
    const tokenHash = this.hash(rawToken);
    const entry = this.store.get(tokenHash);
    if (!entry) return false;
    if (entry.consumed) return false;
    if (entry.expiresAt && new Date() > new Date(entry.expiresAt)) return false;
    return true;
  }

  consumeInvitation(rawToken: string, consumedBy?: string): boolean {
    const tokenHash = this.hash(rawToken);
    const entry = this.store.get(tokenHash);
    if (!entry) return false;
    if (!this.validateInvitation(rawToken)) return false;
    entry.consumed = true;
    entry.consumedBy = consumedBy;
    this.store.set(tokenHash, entry);
    return true;
  }

  revokeInvitation(rawToken: string): boolean {
    const tokenHash = this.hash(rawToken);
    return !!this.store.delete(tokenHash);
  }

  private hash(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
