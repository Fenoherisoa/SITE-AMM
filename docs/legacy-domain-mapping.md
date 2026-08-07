# Legacy → Domain Mapping

This document maps legacy Firebase nodes from `baseamm-9c2c7-default-rtdb-export.json` to canonical domain models, required adapters, repositories and services.

Each node includes: Firebase path, existing structure summary, primary keys, business identifiers, important fields, relationships, duplicates, sensitive fields, recommended domain model, adapter, repository, service, migration notes, read/write considerations and security requirements.

---

## Node: `olona`
1. Firebase path: `/olona` (map keyed by legacy business IDs like `AT-001`, `F-001`).
2. Existing structure: person records with fields such as `anarana`, `cin`, `cin_recto`, `cin_verso`, `commune`, `date_adhesion`, `date_naissance`, `matricule`, `photo`, `telephone`, `tetikasa`, etc.
3. Primary Firebase keys: legacy business key (e.g., `AT-001`).
4. Business identifiers: `id` field value (e.g., `AT-001`), and `matricule` (e.g., `AMM-003422`).
5. Important fields: `anarana` (name), `cin` (national id), `matricule`, `date_adhesion`, `telephone`, `photo`, `tetikasa` (project), address fields.
6. Relationships: may be referenced by `events` (participants), `messages` (conversations), and `metadata` for statistics. Not directly linked to `employees` unless domain logic defines mapping.
7. Possible duplicate/legacy: `employees` is separate — do not merge automatically.
8. Sensitive fields: `cin`, `cin_recto`, `cin_verso`, `telephone`, `photo` (PII).
9. Fields that must never be exposed publicly: `cin`, raw `cin_recto/verso` images, full contact details unless explicitly public.
10. Recommended domain model: `Member { id, matricule, name, dateOfBirth, adhesionDate, contact:{telephone}, address:{region,province,commune,fokontany,district}, photoUrl, project, metadata }`.
11. Required adapter: `LegacyOlonaAdapter` — map legacy keys/fields to `Member` domain model and handle missing fields.
12. Required repository: `MemberRepository` (interface) + `FirebaseMemberRepository` implementation using the adapter.
13. Required service: `MemberService` for business logic (search, filters, import/export, activation/archive).
14. Migration requirements: none immediate — use adapter to canonicalize reads/writes. If introducing new canonical node, create migration that copies via adapter and records mapping.
15. Read/write considerations: reads should paginate and use targeted queries; writes must preserve original `id`/`matricule` if creating back-compat records. Soft-delete preferred.
16. Security requirements: restrict read to users with `members.read`; hide `cin` and contact unless user has permission; enforce rules in Firebase Security Rules and service layer audit.

---

## Node: `employees`
1. Firebase path: `/employees` (map keyed by `RH-###`).
2. Existing structure: personnel records with `anarana`, `cin`, `date_naissance`, `matricule` (AMM-RH-...), `departments`, `poste`, `telephone`, `email_notification`, submitted timestamps, photo, etc.
3. Primary Firebase keys: business id (`RH-001`, etc.).
4. Business identifiers: `id` field (e.g., `RH-001`) and `matricule` (e.g., `AMM-RH-00001`).
5. Important fields: `anarana`, `cin`, `matricule`, `poste`, `departments`, `date_adhesion`, `telephone`, `email_notification`, `submitted_at`, photo.
6. Relationships: linked to `attendance` (employeeId), `pointage` (by matricule or RH id), `users` (if employee has login metadata), `departments`/`departements`, `positions`.
7. Possible duplicate/legacy: may overlap conceptually with `olona` (member), but treat separately.
8. Sensitive fields: `cin`, `cin_recto`, `cin_verso`, contact details, any salary fields (none in export), legal documents.
9. Fields that must never be exposed publicly: `cin`, personal contact unless permissioned; identity documents images.
10. Recommended domain model: `Employee { id, matricule, name, nationalId, birthDate, departments[], position, contact, submittedAt, photoUrl, metadata }`.
11. Required adapter: `LegacyEmployeeAdapter` to transform legacy employee record to `Employee` domain model.
12. Required repository: `EmployeeRepository` + `FirebaseEmployeeRepository` implementation.
13. Required service: `HRService` / `EmployeeService` for HR workflows, contracts, profile management.
14. Migration requirements: none immediate; if normalizing departments/positions, use adapter and migration with mapping table.
15. Read/write considerations: enforce role-based read (rh.read) and write (rh.update); protect PII and audit changes.
16. Security requirements: restrict full profile reads; log sensitive operations to `logs` with audit metadata.

---

## Node: `attendance`
1. Firebase path: `/attendance` (push-key map of check-in/out records).
2. Existing structure: records with `checkIn`, `checkOut`, `createdAt`, `date`, `employeeId`, `status`, `remark`.
3. Primary Firebase keys: push key (Firebase generated) — NOT a business identifier.
4. Business identifiers: `employeeId` (e.g., `RH-001`) and `date`.
5. Important fields: `checkIn`, `checkOut`, `status`, `remark`, `createdAt`.
6. Relationships: references `employees` via `employeeId`; used by reporting, `pointage` may aggregate daily presence.
7. Possible duplicate/legacy: `pointage` holds per-date summary by employee; both must be compatible.
8. Sensitive fields: timestamps tie to employees — PII context when combined with personal contact.
9. Fields that must never be exposed publicly: raw internal timestamps coupled with employee identity for public views.
10. Recommended domain model: `AttendanceRecord { id, employeeId, date, checkIn?, checkOut?, status, remark, createdAt, source }`.
11. Required adapter: `LegacyAttendanceAdapter` to present domain model and to write in legacy format when needed.
12. Required repository: `AttendanceRepository` + `FirebaseAttendanceRepository`.
13. Required service: `AttendanceService` for check-in/out, reports, daily aggregation.
14. Migration requirements: none — keep using the node; if normalizing IDs, create migration map.
15. Read/write considerations: writes must validate `employeeId` exists; limit realtime listeners; bulk queries must be paginated.
16. Security requirements: `attendance.read` and `attendance.manage` permissions; Firebase rules to prevent arbitrary writes and to enforce ownership/portal roles.

---

## Node: `pointage`
1. Firebase path: `/pointage` (date keyed map with nested map of `RH-###` => status strings).
2. Existing structure: `pointage['2026-07-06'] = { 'RH-001': 'PRESENT', 'RH-002': 'ABSENT', ... }`.
3. Primary Firebase keys: date string (ISO-like `YYYY-MM-DD`).
4. Business identifiers: employee business id keys inside each date map (e.g., `RH-001`).
5. Important fields: per-employee status string (PRESENT/ABSENT/...).
6. Relationships: derived/aggregated from `attendance` records; used by daily reports and roll-up statistics.
7. Possible duplicate/legacy: summary data overlapping with `attendance` — keep both and define authoritativeness.
8. Sensitive fields: mapping reveals presence per employee per date — considered sensitive.
9. Fields that must never be exposed publicly: full pointage datasets indexed by employee.
10. Recommended domain model: `PointageDay { date, statuses: Record<employeeId, PresenceStatus> }`.
11. Required adapter: `LegacyPointageAdapter` to read/write daily summaries and keep them consistent with `attendance`.
12. Required repository: `PointageRepository`.
13. Required service: `PointageService` for daily aggregation and reconciliation.
14. Migration requirements: if changing structure (e.g., move to per-employee subnodes), provide migration tool and preserve history.
15. Read/write considerations: writes to date node should be atomic and audited; use transactions for concurrent updates.
16. Security requirements: restrict reads and writes; role-based checks; prevent mass data exfiltration.

---

## Node: `departements` (legacy array)
1. Firebase path: `/departements` (array of objects).
2. Existing structure: array entries containing `id` numeric, `nom`, `description`, and `postes` array.
3. Primary Firebase keys: array index (legacy) — each item also has `id` numeric.
4. Business identifiers: `id` numeric inside each element.
5. Important fields: `nom`, `description`, `postes`.
6. Relationships: represents organizational units; `postes` reference position names; `employees` `departments`/`poste` may reference these.
7. Possible duplicate/legacy: `departments` (map) is separate — do not merge automatically.
8. Sensitive fields: none particularly sensitive but internal org structure.
9. Fields that must never be exposed publicly: internal notes if present in description.
10. Recommended domain model: `DepartmentCanonical { id, name, description, positions: PositionCanonical[] , legacySource: 'departements' }`.
11. Required adapter: `LegacyDepartementsArrayAdapter` to canonicalize array into map-based domain structure.
12. Required repository: `DepartmentRepository` supporting reads from both `departements` and `departments` legacy nodes.
13. Required service: `OrganizationService` to present canonical departments and positions.
14. Migration requirements: consider migrating array to canonical map with stable business ids and mapping table.
15. Read/write considerations: array writes must handle index instability; prefer canonical map for new writes.
16. Security requirements: department read/write permissions; admin-only edits.

---

## Node: `departments` (legacy map)
1. Firebase path: `/departments` (map keyed by push-ids).
2. Existing structure: object entries with `name` and `description`.
3. Primary Firebase keys: Firebase push-key.
4. Business identifiers: not present; consider creating canonical `departmentId` during adapter mapping.
5. Important fields: `name`, `description`.
6. Relationships: same domain as `departements` — use adapter to canonicalize both sources.
7. Possible duplicate/legacy: `departements` (array).
8. Sensitive fields: none.
9. Fields that must never be exposed publicly: internal notes if present.
10. Recommended domain model: same as `departements` canonical department model.
11. Required adapter: `LegacyDepartmentsMapAdapter`.
12. Required repository: same `DepartmentRepository` with logic to read both nodes.
13. Required service: `OrganizationService`.
14. Migration requirements: map push-key entries to canonical ids in migration if normalizing.
15. Read/write considerations: avoid writing to both sources; prefer canonical map moving forward.
16. Security requirements: admin-only edits; read permission gating.

---

## Node: `positions`
1. Firebase path: `/positions` (map keyed by push-ids)
2. Existing structure: `name`, `description`.
3. Primary Firebase keys: push-id
4. Business identifiers: none in export; `name` may serve as natural key.
5. Important fields: `name`, `description`.
6. Relationships: referenced by `departements` `postes` array and `employees.poste`.
7. Possible duplicate/legacy: positions may appear inside `departements.postes` as nested data.
8. Sensitive fields: none.
9. Fields that must never be exposed publicly: internal role responsibilities if sensitive.
10. Recommended domain model: `Position { id, name, description, departmentId? }`.
11. Required adapter: `LegacyPositionsAdapter` to dedupe nested definitions.
12. Required repository: `PositionRepository`.
13. Required service: `PositionService`.
14. Migration requirements: deduplicate and assign stable ids if normalizing.
15. Read/write considerations: canonicalize when creating/updating positions; map employee `poste` strings to position ids.
16. Security requirements: role-based management (roles.manage / positions.manage).

---

## Node: `events`
1. Firebase path: `/events` (map keyed by push-ids).
2. Existing structure: `title`, `date`, `desc`, possibly participants, images (not present in snippet).
3. Primary Firebase keys: push-id.
4. Business identifiers: none; consider generating `eventId`.
5. Important fields: `title`, `date`, `desc`, `participants` (if any), `visibility` (future), `status`.
6. Relationships: participants reference `olona` or `employees` via their ids; events may be public or private.
7. Possible duplicate/legacy: none observed.
8. Sensitive fields: participant lists if private.
9. Fields that must never be exposed publicly: private participant personal data, internal reports.
10. Recommended domain model: `Event { id, title, description, date, location?, participants: ParticipantRef[], visibility, images[], reports[] }`.
11. Required adapter: `LegacyEventAdapter`.
12. Required repository: `EventRepository`.
13. Required service: `EventService` (registration, publishing, reports).
14. Migration requirements: none immediate.
15. Read/write considerations: public events may be readable publicly; private events restricted.
16. Security requirements: `events.read` and `events.manage` permissions; enforce visibility in rules.

---

## Node: `users`
1. Firebase path: `/users` (map keyed by username-like keys in export).
2. Existing structure: entries with `cin`, `email`, `password` (plaintext in export), `permissions` object, `phone`, `role`.
3. Primary Firebase keys: legacy username keys (e.g., `admin`, `feno`, `mizaël`).
4. Business identifiers: legacy username; not authoritative for authentication.
5. Important fields: `role`, `permissions`, `email`, `phone`, `cin`.
6. Relationships: maps to Firebase Authentication `uid` values in future; used for RBAC and portal permissions. May map to `employees` via `cin` or `telephone`.
7. Possible duplicate/legacy: `pendingRequests` contains requested matricules with passwords.
8. Sensitive fields: `password` plaintext in export — critical security issue.
9. Fields that must never be exposed publicly: `password`, `permissions` raw if considered sensitive, `cin`.
10. Recommended domain model: `UserMetadata { uid?, username?, role, permissions: string[], email?, phone?, linkedEmployeeId?, status, createdAt }`.
11. Required adapter: `LegacyUserAdapter` to import metadata and to link to Firebase Auth accounts; must NOT migrate plaintext passwords into application credentials.
12. Required repository: `UserRepository` (metadata) + integration with Firebase Auth for credential management.
13. Required service: `AuthService` (account validation, provisioning, linking metadata to Auth uids) and `AdminService` for user management.
14. Migration requirements: create accounts in Firebase Authentication for legacy users — require explicit credential reset flows; DO NOT import plaintext passwords; send invites or require password reset.
15. Read/write considerations: sensitive read of `users` should be limited to super-admins; writes to metadata separate from Auth credential operations.
16. Security requirements: remove plaintext passwords from repository; rotate any tokens/credentials found; enforce admin-only access to `users` node via rules.

---

## Node: `pendingRequests`
1. Firebase path: `/pendingRequests`.
2. Existing structure: mapping keyed by `matricule` containing `contact`, `createdAt` (number), `matricule`, `nom`, `password` (plaintext), `statut`.
3. Primary Firebase keys: `matricule` strings (e.g., `AMM-RH-00004`).
4. Business identifiers: `matricule`.
5. Important fields: `contact`, `createdAt`, `nom`, `password` (plaintext), `statut`.
6. Relationships: represents account/registration requests for employees — will be linked to `employees` and `users` once approved.
7. Possible duplicate/legacy: `users` contains some active user entries; pendingRequests are pre-approval.
8. Sensitive fields: plaintext `password` values (critical), contact numbers.
9. Fields that must never be exposed publicly: `password`, sensitive contact metadata.
10. Recommended domain model: `PendingRequest { matricule, name, contact, createdAt, status, metadata }` — password must be treated as ephemeral input and not stored as plaintext.
11. Required adapter: `LegacyPendingRequestAdapter` that reads existing requests and migrates securely (hash or prompt reset) when approving.
12. Required repository: `PendingRequestRepository`.
13. Required service: `AccountValidationService` to move pending → review → approved → active and to provision Firebase Auth accounts.
14. Migration requirements: remove plaintext passwords, create invite/reset flow; log approvals in `logs` and audit.
15. Read/write considerations: only admin reviewers may see pending requests; password field must be removed or replaced by secure token before any migration.
16. Security requirements: admin-only access; never export plaintext passwords; rotate secrets.

---

## Node: `token_pool`
1. Firebase path: `/token_pool`.
2. Existing structure: map of role keys to objects `{ role, token_miasa }` where `token_miasa` looks like internal tokens used by legacy system.
3. Primary Firebase keys: token identifiers (e.g., `adherent`, `admin`, `token_libre_...`).
4. Business identifiers: role key names; token strings are secret.
5. Important fields: `role`, `token_miasa`.
6. Relationships: used for legacy onboarding/validation flows and possibly mobile app authentication.
7. Possible duplicate/legacy: may be legacy single-use tokens; modern system should not depend on these as credentials.
8. Sensitive fields: `token_miasa` (secrets) — critical.
9. Fields that must never be exposed publicly: `token_miasa` values.
10. Recommended domain model: `TokenPoolEntry { key, role, tokenMasked?, purpose }` — tokens must be kept in secret store, not in VCS.
11. Required adapter: `LegacyTokenPoolAdapter` to read entries and to migrate tokens into secure vault or to rotate them.
12. Required repository: `TokenPoolRepository` with read-only masked access in application logic.
13. Required service: `TokenService` to validate or rotate legacy tokens and to issue modern tokens or invite flows.
14. Migration requirements: identify all active tokens, rotate, and move to secret manager; replace use with Firebase Auth or ephemeral validation tokens.
15. Read/write considerations: disallow public reads; backend-only access with auditing.
16. Security requirements: disable direct frontend access; never commit tokens to Git; require rotation and secret management.

---

## Node: `logs`
1. Firebase path: `/logs`.
2. Existing structure: map of push-ids with `action`, `details`, `operator`, `timestamp`, sometimes `id`.
3. Primary Firebase keys: push-id.
4. Business identifiers: optional `id` inside log entries (legacy).
5. Important fields: `action`, `operator`, `details`, `timestamp`.
6. Relationships: audit trail for actions across users and services; reference to `users`, `employees` etc may appear in `details`.
7. Possible duplicate/legacy: multiple log formats; normalize via adapter.
8. Sensitive fields: `details` must not contain secrets or tokens.
9. Fields that must never be exposed publicly: any `details` containing PII or secrets.
10. Recommended domain model: `AuditLog { id, action, operatorUid?, operatorName, target?, details, timestamp, metadata }`.
11. Required adapter: `LegacyLogAdapter` to normalize legacy free-text details into structured audit records where possible.
12. Required repository: `LogRepository` with write-only append and restricted read.
13. Required service: `AuditService` to write logs for critical operations.
14. Migration requirements: none immediate; consider enriching logs with structured metadata.
15. Read/write considerations: writes are append-only; provide paged read for authorized auditors.
16. Security requirements: restrict reads to `audit.read`; redact sensitive content; protect against log injection.

---

## Node: `messages`
1. Firebase path: `/messages`.
2. Existing structure: map of conversation keys (e.g., `admin_feno`) containing `isRead` maps — minimal in export.
3. Primary Firebase keys: conversation keys.
4. Business identifiers: conversation id (string key).
5. Important fields: conversation participants, messages, read/unread flags, timestamps.
6. Relationships: references `users`, `employees`, `olona` for participants.
7. Possible duplicate/legacy: different conversation naming conventions.
8. Sensitive fields: message contents (PII, confidential communication).
9. Fields that must never be exposed publicly: message content, attachments, participant contact details.
10. Recommended domain model: `Conversation { id, participants[], messages[], unreadCounts, lastMessage }` and `Message { id, senderId, text, attachments, timestamp, readBy }`.
11. Required adapter: `LegacyMessageAdapter` to adapt simple legacy structures to canonical conversation/message models.
12. Required repository: `MessageRepository`.
13. Required service: `MessagingService` to manage conversations, permissions, notifications.
14. Migration requirements: none immediate; ensure retention policy.
15. Read/write considerations: enforce participant-level authorization, pagination, search indexing.
16. Security requirements: end-to-end privacy where required; restrict reads to participants and authorized staff; audit message access.

---

## Node: `parametres`
1. Firebase path: `/parametres`.
2. Existing structure: key-value institutional settings such as `nom_association`, `email`, `telephone`, `updatedAt`.
3. Primary Firebase keys: setting keys.
4. Business identifiers: none.
5. Important fields: `nom_association`, `email`, `siege_social`, `updatedAt`.
6. Relationships: used by public site and admin configuration UIs.
7. Possible duplicate/legacy: none.
8. Sensitive fields: contact email/phone less sensitive but still consider publication rules.
9. Fields that must never be exposed publicly: internal admin-only settings (if added later) like service account refs.
10. Recommended domain model: `AppConfig { name, email, phone, address, ideology, decreeDate, updatedAt }`.
11. Required adapter: `LegacyConfigAdapter`.
12. Required repository: `ConfigRepository`.
13. Required service: `ConfigurationService`.
14. Migration requirements: none immediate.
15. Read/write considerations: read allowed to authenticated users for UI; writes admin-only.
16. Security requirements: admin-only edits; validate changes and audit.

---

## Node: `metadata`
1. Firebase path: `/metadata`.
2. Existing structure: `last_matricule_number`, `last_update`.
3. Primary Firebase keys: metadata keys.
4. Business identifiers: none.
5. Important fields: `last_matricule_number` used to generate next matricule.
6. Relationships: used when creating new `employees` or `olona` entries.
7. Possible duplicate/legacy: none.
8. Sensitive fields: none.
9. Fields that must never be exposed publicly: not sensitive but avoid unauthenticated mutation.
10. Recommended domain model: `SystemMetadata { lastMatriculeNumber, lastUpdate, schemaVersion? }`.
11. Required adapter: none simple read adapter.
12. Required repository: `MetadataRepository`.
13. Required service: `IdentifierService` to allocate new matricules (must use transactional increments).
14. Migration requirements: track schema/data-version counters here.
15. Read/write considerations: writes restricted and atomic.
16. Security requirements: admin-only writes; audit increments.

---

## Other nodes discovered
- `events`, `logs`, `messages` covered above.
- `departements` vs `departments` (legacy array vs map) handled separately.
- `pointage` and `attendance` must be reconciled by `PointageService`.

---

### Compatibility & Versioning
- APP_VERSION: `1.0.0`
- DATA_SCHEMA_VERSION: `1`
- LEGACY_DATA_VERSION: `AMM-DATA-V1`

Compatibility mechanism:
- Each write operation MUST include `appVersion` and `dataSchemaVersion` metadata when performing migrations or writing new canonical nodes.
- `MigrationManager` must reject writes when `dataSchemaVersion` mismatch is detected (configurable per environment).

---

### Security notes (critical)
- Plaintext passwords found in `/users` and `/pendingRequests`. DO NOT import these as credentials.
- Tokens in `/token_pool` are secret; move to vault and rotate.
- Immediate remediation: remove or redact `password` and `token_miasa` values from any environment or exported artifacts; require password resets for legacy accounts.

