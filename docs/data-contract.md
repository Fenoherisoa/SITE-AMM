# AMM Data Contract (v1) — Summary

Source: baseamm-9c2c7-default-rtdb-export.json

Top-level nodes observed:

- attendance: attendance records (push keys) with fields `checkIn`, `checkOut`, `createdAt`, `date`, `employeeId`, `status`, `remark`.
- departements: legacy array with `id`, `nom`, `description`, `postes`.
- departments: object map (push-id keys) with `name`, `description`.
- employees: map keyed by business IDs like `RH-001` containing personnel fields (see repository JSON). Preserve `id` and `matricule`.
- events: map of event objects.
- logs: audit-like entries with `timestamp`.
- messages: conversation containers.
- metadata: includes `last_matricule_number`, `last_update`.
- olona: legacy members collection (keys like AT-001, F-001).
- parametres: institutional settings with `updatedAt`.
- pendingRequests: pending account/operation requests.
- pointage: related to attendance; maintain compatibility.
- positions: (empty in export) reserve for canonical positions.
- token_pool: sensitive tokens — treat as secrets.
- users: application user metadata (do not store plaintext passwords).

Important constraints and rules:

- Business IDs (e.g., `RH-001`, `AMM-RH-00001`) are authoritative. Do not reassign or replace with push IDs.
- Maintain compatibility with `attendance` and `pointage` structures. Use adapters where the canonical domain model differs.
- `token_pool` and any token-like values are sensitive: do not copy secrets into repo; move to environment or secret manager and rotate.
- `users` node must be used for metadata and portal permissions; authentication will be handled by Firebase Authentication (no plaintext passwords in DB).
- `departements` (array) and `departments` (map) are distinct legacy representations; do not merge destructively — use adapter layer to canonicalize.

Next steps:

1. Produce a mapping file documenting each legacy node's sample schema and recommended canonical domain model mapping.
2. Design adapters to translate legacy nodes to domain models for `olona`, `employees`, `attendance`, `events`, `departements`/`departments`, `users`.
3. Draft Firebase Security Rules and MigrationManager plan.
