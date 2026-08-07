# Firebase Realtime Database Security Rules — Draft

This document explains the draft Realtime Database security rules in `security-rules.json` and the rationale.

Overview
- Purpose: protect legacy AMM Realtime Database nodes while enabling application-level RBAC and portal access.
- Do NOT deploy these rules without review and testing in an emulator/staging project.

Design principles
- Default deny: top-level `.read` and `.write` are `false`.
- Explicit allow: only specific nodes and operations grant access.
- Metadata-driven access: rules consult `/users/{uid}` metadata for `role`, `permissions`, and `linkedEmployeeId`.
- Legacy-safe: existing legacy fields such as `users/*/password` are preserved but protected from future reads/writes.
- Server/Admin operations: server-side admin SDK bypasses Realtime Database rules — use it for secret management and token rotation.

Helper concepts (applied inline in rules)
- isAuthenticated: `auth != null`
- isSuperAdmin: `root.child('users').child(auth.uid).child('role').val() === 'SUPER_ADMIN'`
- hasPermission: `root.child('users').child(auth.uid).child('permissions').child('<perm>').val() === true`
- linkedEmployee check: `root.child('users').child(auth.uid).child('linkedEmployeeId').val()`

Limitations & assumptions
- The legacy snapshot does not include `accountStatus` for all users. Rules therefore use **fallback** logic: presence of a `role` or explicit `accountStatus` is treated as activation for access checks. This is a temporary compatibility measure; see "Required metadata changes" below.
- `messages` node in the snapshot lacks explicit `participants` lists. The rules require `participants` to exist and to list UIDs — until messages are normalized, client access will be restricted. This is intentional to prevent unauthorized reads.

Node-specific summary

- `/users/*`
  - Read: user can read their own metadata or admins with `users.manage` or `SUPER_ADMIN`.
  - Write: only `SUPER_ADMIN` or `users.manage` permission.
  - `password` child: `.read` and `.write` set to `false` to prevent future exposure. Legacy plaintext value remains in DB but cannot be read/written via client rules.
  - `role`, `permissions`, `accountStatus` writes restricted to `SUPER_ADMIN` only.

- `/pendingRequests/*`
  - Read/Write: restricted to `SUPER_ADMIN` or `users.manage` permission (admin-only review).
  - `password` child: `.read` and `.write` set to `false`.
  - Note: If a public submission endpoint is desired, implement it as a Cloud Function that validates input and writes to a controlled path.

- `/token_pool`
  - `.read` and `.write` are `false` for clients. Server/admin SDK should manage secrets.

- `/logs`
  - Read: restricted to `SUPER_ADMIN` or `audit.read` permission.
  - Write: client writes are disallowed; audit writes should be done via trusted server processes (admin SDK).

- `/messages/*`
  - Read/Write: allowed only if the conversation contains a `participants/{uid}: true` entry listing the authenticated user, or `SUPER_ADMIN`.
  - Mutation of `participants` is only allowed for `SUPER_ADMIN` to prevent users granting themselves access.
  - Rationale: snapshot lacks participant lists; this rule enforces conversation membership explicitly.

- `/parametres`
  - Read: authenticated users.
  - Write: `SUPER_ADMIN` or `settings.manage` permission.

- `/metadata`
  - Read/Write: admin-only.

- `/departments`, `/departements`, `/positions`
  - Read: authenticated users.
  - Write: `SUPER_ADMIN` or `roles.manage` permission.

- `/employees/*`
  - Read: allowed for HR (`rh.read`) or admin or the employee themselves (via `linkedEmployeeId`).
  - Write: allowed for HR with `rh.update` or admin.
  - Sensitive children (`cin`, `cin_recto`, `cin_verso`) are restricted: `cin` readable only for HR/admin, others not readable by clients.
  - `matricule` write is blocked except for `SUPER_ADMIN`, and validated to equal the key.

- `/attendance/*`
  - Read: employee can read their own attendance records (if `linkedEmployeeId` matches), or users with `attendance.read` permission, or HR.
  - Write: users with `attendance.manage` or HR or `SUPER_ADMIN`.
  - Writes validated to include `employeeId` and `date`.

- `/pointage/*`
  - Read/Write: HR or users with `attendance` permissions; admin allowed.

- `/events/*`
  - Read: if `visibility === 'public'` then public read allowed; otherwise requires `events.read` permission or admin.
  - Write: `events.manage` permission or admin.

Immutability & validation
- Where applicable, rules validate that protected business identifiers such as `matricule` remain equal to the path key on writes.
- Rules prevent client writes to `password` fields, `token_pool`, and `logs` entries.

Required metadata changes before full rollout
1. Add `accountStatus` to `/users/{uid}` with values `PENDING|APPROVED|INVITED|ACTIVE|REJECTED|SUSPENDED|DISABLED|ARCHIVED`. Rules should be updated to check `accountStatus === 'ACTIVE'` instead of relying on `role` existence.
2. Normalize `messages` to include `participants` mapping of UIDs to booleans so membership checks can be enforced.
3. Add `linkedEmployeeId` to `/users/{uid}` for employees (mapping between Auth uid and `employees` business id) to allow employee self-service access.

Testing plan
- Use the Firebase Emulator to test these rules with different simulated `auth` contexts:
  - Unauthenticated: ensure private nodes deny read/write.
  - Member: verify member cannot read employees, payroll, token_pool.
  - HR: verify HR can read employees and attendance but not payroll/finance unless permissioned.
  - Admin: verify admin can manage users, roles, permissions, parametres, metadata.
  - Super Admin: full access.
- Test edge cases: attempt to write `users/*/password`, attempt to create a `messages` conversation with participants that include other UIDs, attempt to change an employee `matricule`.

Notes & limitations
- These rules rely on `/users/{uid}` metadata to contain `role`, `permissions`, `linkedEmployeeId`, and `accountStatus` for precise enforcement. If any of these are missing, the rules use conservative fallbacks (e.g., require explicit permissions or roles).
- If legacy data lacks these fields, plan a metadata normalization migration before enforcing stricter rules.

Next steps before deployment
1. Normalize metadata fields in a staging environment (accountStatus, linkedEmployeeId, participants arrays).
2. Run full security-rule tests in the Firebase Emulator using CI.
3. Review and approve rules with security stakeholders.
4. Deploy to staging, run integration tests, then schedule production deployment.

