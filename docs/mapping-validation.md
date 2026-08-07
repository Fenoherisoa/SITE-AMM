# Mapping Validation — Legacy → Domain

This document validates the legacy-to-domain mapping against the provided JSON snapshot (`baseamm-9c2c7-default-rtdb-export.json`).

Validation markers:
- CONFIRMED: field/node exists in snapshot exactly or with equivalent name.
- INFERRED: field is not directly present but reasonably derived from existing fields.
- UNCONFIRMED: relationship or field is not present in snapshot and cannot be assumed.

---

## Summary counts
- Confirmed mappings (nodes with at least core fields confirmed): 12
- Inferred mappings: 4
- Unconfirmed mappings: 3

(See node-by-node details below.)

---

## Node validations

1) `olona` — CONFIRMED
- Node path: `/olona` — present in snapshot.
- Confirmed fields: `anarana`, `cin`, `cin_recto`, `cin_verso`, `commune`, `date_adhesion`, `date_naissance`, `matricule`, `photo`, `telephone`, `tetikasa`, `region`, `province`, `fokontany`, `district`, `id`.
- Model mapping in `src/models/Member.ts`: `id`, `matricule`, `name`, `nationalId`, `dateOfBirth`, `adhesionDate`, `contact.telephone`, `address.*`, `project` — all CONFIRMED as mapped from legacy keys via `LegacyOlonaAdapter`.
- Relationships: `events` participation is UNCONFIRMED (no `participants` shown in snapshot events).
- Sensitive: `cin`, `cin_recto`, `cin_verso`, `telephone`, `photo` — CONFIRMED sensitive.

2) `employees` — CONFIRMED
- Node path: `/employees` — present.
- Confirmed fields: `anarana`, `cin`, `matricule`, `poste`, `departments` (string), `telephone`, `email_notification`, `submitted_at`, `id`, `date_naissance` — observed in snapshot.
- Model mapping in `src/models/Employee.ts` maps these fields. `name` is adapter-mapped from `anarana` — CONFIRMED mapping.
- Relationships: `attendance.employeeId` references these `RH-` ids — CONFIRMED; relationship to `departments` node is INFERRED because `employees.departments` stores a string (department name) not a cross-reference id.
- Sensitive: `cin` and related identity fields — CONFIRMED sensitive.

3) `attendance` — CONFIRMED
- Node path: `/attendance` — present.
- Confirmed fields: `checkIn`, `checkOut`, `createdAt`, `date`, `employeeId`, `status`, `remark` — observed in snapshot.
- `AttendanceRecord` model fields reflect these — CONFIRMED.
- Relationship `Attendance.employeeId` → `employees.id` — CONFIRMED (employeeId values like `RH-001`).

4) `pointage` — CONFIRMED
- Node path: `/pointage` — present.
- Structure: date-keyed map where each date contains `RH-...` keys mapping to status strings (e.g., `PRESENT`, `ABSENT`) — CONFIRMED.
- Model `PointageDay` and `LegacyPointageAdapter` support this — CONFIRMED.
- Relationship `Pointage` → `Employee` by keys is CONFIRMED.

5) `departements` (array) — CONFIRMED
- Node path: `/departements` — present as an array in snapshot.
- Confirmed fields in elements: `id` (numeric), `nom`, `description`, `postes` array with `id` and `name` — observed.
- `LegacyDepartmentsAdapter.fromArrayItem` maps these — CONFIRMED.

6) `departments` (map) — CONFIRMED
- Node path: `/departments` — present as a map keyed by push-ids.
- Confirmed fields: `name`, `description` — observed.
- Duplicate/legacy: both `departements` array and `departments` map exist — CONFIRMED legacy duplication; do not merge automatically.

7) `positions` — CONFIRMED
- Node path: `/positions` — present as map.
- Confirmed fields: `name`, `description` — observed.
- Note: some `departements.postes` embed similar position objects — confirmed duplication.

8) `events` — PARTIALLY CONFIRMED
- Node path: `/events` — present.
- Confirmed fields: `title`, `date`, `desc` (description) — observed in snapshot entries.
- Inferred/UNCONFIRMED fields: `participants`, `visibility`, `images`, `reports` — NOT present in the provided snapshot (UNCONFIRMED). The `EventModel` contains optional arrays for these; they are INFERRED and must be treated as optional and UNCONFIRMED until validated.

9) `users` — PARTIALLY CONFIRMED
- Node path: `/users` — present.
- Confirmed fields: `role`, `permissions` (object of booleans), `email`, `phone` (phone/`phone`), `cin`, `password` (plaintext in snapshot) — observed.
- Security: plaintext `password` observed in snapshot — CRITICAL and CONFIRMED sensitive.
- Mapping: `UserMetadata` model does NOT store `password` (by design). Presence of `password` is recorded via validation docs and adapters must NOT migrate it — CONFIRMED security requirement.
- Relationship `User` → Firebase Auth `uid`: UNCONFIRMED (not present in snapshot).
- Relationship `User` → `employees`: INFERRED (possible via `cin`/phone matching), UNCONFIRMED until explicit linkage fields exist.

10) `pendingRequests` — CONFIRMED (sensitive)
- Node path: `/pendingRequests` — present.
- Confirmed fields: `matricule` (key), `contact`, `createdAt` (number), `nom`, `password` (plaintext), `statut` — observed.
- Model `PendingRequest` updated to include `legacyPasswordPresent` to record presence without storing secret — matches snapshot handling.
- Security: plaintext passwords confirmed — critical.

11) `token_pool` — CONFIRMED (sensitive)
- Node path: `/token_pool` — present.
- Confirmed fields: entries with `role`, `token_miasa` — observed.
- `token_miasa` values are secrets — CONFIRMED sensitive; adapters mask them.

12) `logs` — CONFIRMED
- Node path: `/logs` — present.
- Confirmed fields: `action`, `details`, `operator`, `timestamp`, sometimes `id` — observed.
- `LegacyLogAdapter` maps these fields — CONFIRMED.

13) `messages` — PARTIALLY CONFIRMED
- Node path: `/messages` — present.
- Confirmed structure: conversation-level keys (e.g., `admin_feno`) containing `isRead` maps — observed.
- Unconfirmed: message content, message-level timestamps, sender ids — NOT present in snapshot (UNCONFIRMED). The `Conversation`/`Message` models include fields that are INFERRED; treat them as optional and validate when full message data is observed.

14) `parametres` — CONFIRMED
- Node path: `/parametres` — present.
- Confirmed fields: `nom_association`, `email`, `telephone`, `siege_social`, `date_decret`, `decret`, `ideologie`, `updatedAt` — observed.

15) `metadata` — CONFIRMED
- Node path: `/metadata` — present.
- Confirmed fields: `last_matricule_number`, `last_update` — observed.
- Use for identifier allocation — CONFIRMED but ensure atomic increments and audit.

---

## Relationships validation
- Employee → Attendance: CONFIRMED (`attendance.employeeId` contains `RH-...` ids).
- Pointage → Employee: CONFIRMED (pointage date nodes use `RH-...` keys).
- Employee → Department: INFERRED — `employees.departments` contains a string value (department name) but it is NOT a guaranteed cross-reference to `/departments` push-ids. Relationship must be treated as string-valued unless normalized. Marked INFERRED.
- Employee → Position: INFERRED — `employees.poste` contains position name string; does not store `positions` push-id. INFERRED.
- Event → Participants: UNCONFIRMED — events in snapshot do not include `participants` arrays.
- User → Role: CONFIRMED (`users.*.role` exists).
- User → Portal Access: CONFIRMED (legacy `permissions` object exists), but portal-to-permission mapping is INFERRED (no explicit portal list).

---

## Missing information
- No explicit `uid` or `authUid` linking `users` entries to Firebase Authentication — UNCONFIRMED.
- No structured `participants` in `events` — UNCONFIRMED.
- Messages lack per-message details in snapshot — UNCONFIRMED.
- No salary/finance data present in the export — absence confirmed; if present elsewhere, it's not in this snapshot.

---

## Duplicate / legacy structures
- `departements` (array) vs `departments` (map) — both present and contain similar organization info. CONFIRMED duplicate/legacy structures.
- `positions` appear both as a dedicated node and embedded inside `departements.postes` — CONFIRMED duplication.
- `pointage` and `attendance` both store attendance-related data at different granularities — CONFIRMED complementary structures.

---

## Security-sensitive structures (confirmed)
- `/users` — plaintext `password` values in snapshot — CRITICAL.
- `/pendingRequests` — plaintext `password` values — CRITICAL.
- `/token_pool` — `token_miasa` secret tokens — CRITICAL.
- Identity fields: `cin`, `cin_recto`, `cin_verso` in `employees` and `olona` — sensitive PII.
- Contact info: `telephone`, `email` in multiple nodes — sensitive.

Do NOT copy secrets into code or commit them. Adapters must mark presence but never include secret values.

---

## Potential migration risks
- Migrating plaintext passwords into Firebase Auth without forcing resets would create security risk — DO NOT import plaintext passwords; instead, create invite/reset flows.
- Moving `token_pool` tokens into application config without rotation will expose active tokens — require rotation and vaulting.
- Normalizing `departements`/`departments` and `positions` must maintain mapping to legacy IDs; keep a migration mapping table.
- Converting `employees.departments` string to a department id must be done conservatively and verified.

---

## Model / Interface issues found and fixes
- `PendingRequest` model lacked indication that legacy plaintext `password` existed. Fixed by adding `legacyPasswordPresent?: boolean` to `src/models/PendingRequest.ts` and adding `LegacyPendingRequestAdapter` to detect presence without exposing secret.
- No other model/interface mismatches detected against the snapshot. Adapters are intentionally conservative: they map legacy keys into domain fields and avoid copying secrets.

---

## Recommended next architecture step
1. Implement `AuthService` and `UserRepository` (metadata-only) to support secure provisioning: do NOT import plaintext passwords. Implement invite/password-reset flows and mark legacy accounts requiring reset.
2. Implement `TokenService` to inventory `/token_pool`, mask tokens in-app, and plan rotation to a secrets manager.
3. Implement `EmployeeRepository` and `MemberRepository` (read-only first) using adapters.
4. Implement `AttendanceRepository` and `PointageService` to reconcile and ensure consistency.
5. Draft precise Firebase Security Rules that enforce `auth != null`, role checks, and deny access to the sensitive nodes unless authorized.

---

## Final report
- Number of confirmed mappings: 12 (nodes with core fields observed and mapped).
- Number of inferred mappings: 4 (employee→department, employee→position, user→employee linkage, event participants existence).
- Number of unconfirmed mappings: 3 (event participants, message contents, user→auth uid).
- Model/interface issues found: 1 (PendingRequest model updated to mark legacy password presence).
- Security issues found: plaintext passwords in `/users` and `/pendingRequests`; secret tokens in `/token_pool`; PII fields (`cin`, images). Immediate remediation required before any migration.
- Is architecture ready for Firebase integration? PARTIALLY. Data model mappings are validated for read usage. Before full integration:
  - Remove/rotate secrets found in snapshot from any shared storage.
  - Implement secure onboarding (no plaintext imports).
  - Finalize Firebase Security Rules and plan for adapter-based read/write flows.

