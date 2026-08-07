# Firebase Node Map

This file lists the top-level Firebase nodes observed in the provided export and a short schema reference.

- `/attendance` — push-keyed attendance records { checkIn, checkOut, createdAt, date, employeeId, status, remark }
- `/pointage` — date-keyed daily summary { YYYY-MM-DD: { RH-001: 'PRESENT', ... } }
- `/departements` — legacy array of department objects with `id`, `nom`, `description`, `postes` array
- `/departments` — legacy map keyed by push-ids with `name`, `description`
- `/positions` — map keyed by push-ids with `name`, `description`
- `/employees` — map keyed by business IDs (`RH-001`) with personnel fields including `matricule` (AMM-RH-...)
- `/olona` — legacy members map keyed by business IDs (`AT-001`, `F-001`) with personal fields
- `/events` — map of event entries with `title`, `date`, `desc`, etc.
- `/users` — legacy application users with metadata including (plaintext) `password`, `role`, `permissions`
- `/pendingRequests` — registration requests keyed by `matricule` containing ephemeral `password` (plaintext in export)
- `/token_pool` — role keys to `{ role, token_miasa }` (secret tokens)
- `/logs` — audit-like entries with `action`, `details`, `operator`, `timestamp`
- `/messages` — conversation map with read flags and minimal data in export
- `/parametres` — institutional settings
- `/metadata` — system metadata (`last_matricule_number`, `last_update`)

Notes:
- Keys that look like Firebase push-ids are not business IDs. Always treat `matricule`, `id`, and supplied `id` fields as the business identifiers.
- Sensitive nodes: `/users` (passwords), `/pendingRequests` (passwords), `/token_pool` (tokens). Handle with highest security.

