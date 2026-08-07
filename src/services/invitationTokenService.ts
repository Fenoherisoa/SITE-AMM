/**
 * Secure Invitation Token Management Service.
 * Implements token hashing before persistence to ensure raw invitation tokens are never stored.
 */

export interface InvitationRecord {
  id: string;
  email: string;
  tokenHash: string;
  role: string;
  department?: string;
  status: 'PENDING' | 'CONSUMED' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
  expiresAt: string;
}

class InvitationTokenService {
  private invitations: Map<string, InvitationRecord> = new Map();

  /**
   * Helper to compute a secure SHA-256 hash representation of an invitation token.
   */
  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generates a new invitation with a hashed token. Returns raw token for one-time dispatch only.
   */
  public async createInvitation(email: string, role: string, department?: string): Promise<{ rawToken: string; record: InvitationRecord }> {
    const rawToken = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const tokenHash = await this.hashToken(rawToken);

    const record: InvitationRecord = {
      id: `rec_${Date.now()}`,
      email: email.trim().toLowerCase(),
      tokenHash,
      role,
      department,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiration
    };

    this.invitations.set(tokenHash, record);
    return { rawToken, record };
  }

  /**
   * Validates and consumes an invitation token securely.
   */
  public async validateAndConsumeToken(rawToken: string): Promise<InvitationRecord> {
    const tokenHash = await this.hashToken(rawToken);
    const record = this.invitations.get(tokenHash);

    if (!record) {
      throw new Error('Jeton d\'invitation invalide ou inconnu.');
    }

    if (record.status === 'REVOKED') {
      throw new Error('Cette invitation a été révoquée par un administrateur.');
    }

    if (record.status === 'CONSUMED') {
      throw new Error('Cette invitation a déjà été utilisée.');
    }

    if (new Date(record.expiresAt) < new Date()) {
      record.status = 'EXPIRED';
      throw new Error('Cette invitation a expiré.');
    }

    record.status = 'CONSUMED';
    return record;
  }

  /**
   * Revokes an existing invitation.
   */
  public async revokeInvitation(tokenHash: string): Promise<boolean> {
    const record = this.invitations.get(tokenHash);
    if (record) {
      record.status = 'REVOKED';
      return true;
    }
    return false;
  }
}

export const invitationTokenService = new InvitationTokenService();
