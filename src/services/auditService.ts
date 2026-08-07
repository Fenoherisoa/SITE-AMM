export type AuditEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_UPDATED'
  | 'INVITATION_CREATED'
  | 'INVITATION_CONSUMED'
  | 'ACCOUNT_APPROVED'
  | 'ACCOUNT_SUSPENDED'
  | 'ROLE_CHANGED'
  | 'PERMISSION_CHANGED';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  userUid?: string;
  userEmail?: string;
  ipAddress?: string;
  details?: string;
}

class AuditService {
  private logs: AuditLogEntry[] = [];

  public logEvent(eventType: AuditEventType, userEmail?: string, userUid?: string, details?: string): AuditLogEntry {
    // Sanitize any potential sensitive strings from details
    const sanitizedDetails = details ? this.sanitizeDetails(details) : undefined;
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      eventType,
      userEmail,
      userUid,
      details: sanitizedDetails
    };

    this.logs.unshift(entry);
    // Keep in-memory logs bounded to last 200 entries
    if (this.logs.length > 200) {
      this.logs.pop();
    }

    console.log(`[AuditService] [${entry.timestamp}] ${entry.eventType} | User: ${userEmail || 'N/A'}`);
    return entry;
  }

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  private sanitizeDetails(raw: string): string {
    // Mask potential passwords, tokens, or credentials
    return raw
      .replace(/password\s*=\s*[^\s&]+/gi, 'password=***REDACTED***')
      .replace(/token\s*=\s*[^\s&]+/gi, 'token=***REDACTED***')
      .replace(/secret\s*=\s*[^\s&]+/gi, 'secret=***REDACTED***');
  }
}

export const auditService = new AuditService();
