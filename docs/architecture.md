# AMM Platform — Initial Architecture (summary)

Layers:
- UI (React/Next.js for public + portals)
- Domain Services (TypeScript services implementing business logic)
- Repositories (Firebase Realtime Database adapters)
- Infra (Firebase Authentication, Realtime DB, Security Rules, Google Drive for files)

Key components to scaffold:
- `src/adapters` — legacy adapters (LegacyOlonaAdapter, LegacyEmployeeAdapter,...)
- `src/repositories` — repository interfaces and Firebase implementations
- `src/services` — business services (AuthService, MemberService, HRService, AttendanceService,...)
- `infra/firebase` — security rules, indexes, deployment scripts

Versioning & migrations:
- `APP_VERSION` and `DATA_SCHEMA_VERSION` enforced via env and MigrationManager

Security:
- Use Firebase Auth for credentials
- RBAC stored in `users` metadata and enforced by services + security rules
- Token secrets in environment or secret manager

Deployment:
- CI: run tests, lint, build, deploy infra rules
- Staging and production Firebase projects

