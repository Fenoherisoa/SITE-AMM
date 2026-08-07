# Token Pool Audit

## Scope
This report inventories the legacy `/token_pool` structure in the local Firebase export and maps the repository dependencies that touch it. No real token values are included.

## Node structure
- Path: `/token_pool`
- Record count: 13
- Field names observed: `role`, `token_miasa`
- Shape: map of role-based entries to objects containing a role and a secret-like token field.

## Code references
- [src/adapters/legacy/LegacyTokenPoolAdapter.ts](src/adapters/legacy/LegacyTokenPoolAdapter.ts) reads the node and masks the token field for domain mapping.
- [tests/security/fixtures/fixtures.json](tests/security/fixtures/fixtures.json) includes a synthetic token-pool fixture for emulator tests.
- [security-rules.json](security-rules.json) denies ordinary client reads and writes to `/token_pool`.

## Dependency map
- Legacy import/export artifacts contain `/token_pool` values and should be treated as sensitive material.
- Application code should not depend on `/token_pool` for authentication.
- The future authentication authority is Firebase Authentication.

## Risk classification
- Risk: High
- Reason: the node contains secret-like values and could be used for legacy privileged access if exposed.

## Recommended replacement
- Replace any legacy token-based authentication with Firebase Authentication and short-lived invitation tokens.
- Use a secure secret manager for any remaining non-user-facing service credentials, not the RTDB node.

## Migration strategy
1. Inventory and classify token records.
2. Rotate each token under governance before any consumer switch-over.
3. Replace application callers with Firebase Authentication and invitation flows.
4. Stop reading `/token_pool` in the application layer.
5. Retain the legacy node only as archived data until explicit approval is granted for removal.

## Rotation strategy
- Rotate tokens out-of-band with the owning system.
- Never rotate tokens automatically in this repository.
- Store replacements only in a secret manager or dedicated secure service.
