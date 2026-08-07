# Data Relationships

High-level relationships between legacy nodes (observed in export):

- `employees` (RH-...) ← `attendance` entries reference `employeeId` (RH-...)
- `employees` (RH-...) ← `pointage` daily statuses use RH-... as keys
- `employees` ↔ `users` — relationship possible via `cin`, `phone` or later explicit `linkedEmployeeId` in `users` metadata
- `olona` (members) ↔ `events` — participants may reference `olona` ids
- `departements` / `departments` → `positions` and `employees.poste` — organizational mapping
- `pendingRequests` → `employees` & `users` when approved (account provisioning)
- `logs` capture actions across `users`, `employees`, `attendance`, `pointage`, `pendingRequests`
- `messages` link `users` / `employees` / `olona` participants

Design recommendations:
- Maintain adapters to canonicalize data access and hide legacy inconsistencies from services/UI.
- Use `Metadata` to store mapping tables when migrating from legacy keys to canonical ids.
- Use `IdentifierService` to allocate new business ids and increment `metadata.last_matricule_number` atomically.
- Preserve legacy nodes in read-only mode until migration is validated. Any canonical writes should be accompanied by a migration record.

