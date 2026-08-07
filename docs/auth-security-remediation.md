# Auth Security Remediation Plan

This document outlines the remediation plan for legacy plaintext passwords and token secrets observed in the JSON export, and the secure authentication + onboarding architecture.

## 1. Legacy plaintext password issue
- Location: `/users` and `/pendingRequests` contain plaintext `password` fields in the exported snapshot.
- Risk: immediate compromise if snapshot or database is exposed.
- Remediation strategy (non-destructive):
  1. Treat values as sensitive and do not read or expose them at any point.
  2. Implement onboarding/invite flows that require users to set passwords in Firebase Authentication (no import of legacy plaintext).
  3. Implement a migration path that marks legacy accounts as `INVITED` and sends secure invitations.
  4. After migration and verification, consider secure redaction or archival of plaintext values as a separate, auditable operation.

## 2. Legacy token issue
- Location: `/token_pool` contains `token_miasa` secret strings.
- Risk: tokens may be used for authentication or privileged operations.
- Remediation strategy:
  1. Do not use token values as credentials in the new system.
  2. Inventory all tokens and move them into a secure secrets manager (e.g., Vault, Google Secret Manager).
  3. Rotate tokens and replace usages with modern authorization (Firebase Auth + service accounts + short-lived tokens).

## 3. New Firebase Authentication architecture
- Use Firebase Authentication for credentials (email/password, OIDC, phone, etc.).
- Store user metadata in Realtime Database `/users` (metadata-only) and link to Firebase Auth `uid`.
- Do NOT store passwords or tokens in the DB.
- Implement server-side `AuthService` that calls `AuthRepository` abstraction (FirebaseAuthAdapter).

## 4. Secure onboarding architecture
- Administrator reviews `pendingRequests` and approves.
- Approval triggers creation of an `Invitation` (single-use, short-lived token) via `InvitationTokenService`.
- Invitation is sent to the user's contact (SMS/email) with a link to set up a Firebase Authentication account.
- Upon successful account creation, the user is linked to the metadata entry and account status updated to `ACTIVE`.
- All operations audited in `/logs` without secrets.

## 5. Password reset architecture
- Use Firebase's password reset link generation.
- Standard flow: user requests password reset → system sends reset link (no account enumeration leak) → user resets password in Firebase Auth.
- Audit reset requests.

## 6. Account lifecycle
- Enforce lifecycle states in application metadata and AuthorizationService.
- Do not grant access solely because Firebase account exists — application must confirm `accountStatus === 'ACTIVE'`.

## 7. Portal authorization
- Portal access determined by `portalAccess` field in user metadata and permissions.
- Authorization enforced at service layer and in Firebase Security Rules.

## 8. RBAC foundation
- Roles and permissions stored in metadata.
- Example permission ids: `members.read`, `members.create`, `payroll.manage`.
- Keep permission checks in AuthorizationService and in rules.

## 9. Audit requirements
- Capture authentication events: login success/failure, logout, password reset requested, password changed, invitation created/consumed, account lifecycle changes.
- Do NOT include any secrets or tokens in logs.

## 10. Migration/remediation plan (future)
- Inventory sensitive fields and communicate remediation plan to stakeholders.
- Approve a migration window; during migration:
  - Create Firebase Auth accounts (via invite flow), do NOT import plaintext passwords.
  - Rotate `token_pool` secrets and migrate usages.
  - After successful validation and backups, perform controlled redaction of plaintext password fields.

