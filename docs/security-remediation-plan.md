# Security Remediation Plan

## 1. Current risks
- Legacy export contains plaintext password fields in `/users` and `/pendingRequests`.
- Legacy export contains secret-like token values in `/token_pool`.
- The application should not depend on legacy passwords or tokens for authentication.

## 2. Confirmed sensitive nodes
- `/users` — potential password fields and account metadata.
- `/pendingRequests` — request payloads that may include plaintext passwords.
- `/token_pool` — secret-like token values.

## 3. Secret scan findings
- Repository scan found password-field references and token-pool references in the export, docs, fixtures, and adapter code.
- No secrets were printed; all findings are documented in masked form.

## 4. Plaintext password findings
- 7 `/users` records and 3 `/pendingRequests` records include password fields in the legacy export.
- The remediation path is to stop using these values and require Firebase Authentication password setup.

## 5. `/token_pool` findings
- 13 token records were found with `token_miasa` fields.
- The application should stop using `/token_pool` as an authentication mechanism.

## 6. Authentication replacement
- Use Firebase Authentication as the future authentication authority.
- Keep RTDB user metadata separate and metadata-only.

## 7. Invitation architecture
- Use an `InvitationTokenService`-style short-lived, single-use, hashed invitation token flow.
- Never persist raw invitation tokens in logs or database.

## 8. Migration phases
- Stage A: Audit and document legacy fields.
- Stage B: Build replacement authentication flows.
- Stage C: Provision Firebase Auth accounts.
- Stage D: Force password reset or new-password creation.
- Stage E: Verify activation.
- Stage F: Stop application reads of legacy passwords.
- Stage G: Stop application reads of `/token_pool`.
- Stage H: Retain archived legacy data under governance.
- Stage I: Remove or quarantine legacy secrets only after explicit approval.

## 9. Rollback strategy
- Keep the legacy export read-only and backed up.
- If migration fails, revert application logic to the pre-migration state while leaving the legacy snapshot intact.

## 10. Data-retention considerations
- Retain the legacy export and a backup copy for audit and compliance purposes.
- Do not delete or mutate production data during this phase.

## 11. Production safety requirements
- No production database modification.
- No password migration.
- No token deletion or rotation.
- No deployment.
- No production credentials added.

## 12. Required manual approvals
- Approval to provision Firebase Auth accounts.
- Approval to rotate or retire legacy secrets.
- Approval to remove or quarantine legacy data after verification.

## 13. Security validation checklist
- Secret scan passes.
- Emulator security tests pass.
- Rules block `/token_pool` and legacy password reads.
- New authentication paths use Firebase Authentication abstractions.
