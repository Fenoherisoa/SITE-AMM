# Plaintext Password Audit

## Scope
This audit summarizes the legacy plaintext-password exposure found in the exported Firebase snapshot without exposing password values.

## Findings
- `/users` records with password fields: 7
- `/pendingRequests` records with password fields: 3
- Assessment: plaintext password values appear to be present in the legacy snapshot.

## Application workflow dependency
- Current application code and adapters should treat password fields as legacy data only.
- The new architecture should not import or persist plaintext passwords into RTDB user metadata.

## Recommended treatment
- Provision Firebase Authentication accounts through a controlled invitation/reset flow.
- Mark legacy accounts as requiring a new password setup rather than migrating the old passwords.
- Keep the legacy snapshot read-only during the remediation phase.
