# SITE-AMM
RIEN

# AMM Platform — Security Notes

Security-focused artifacts created in this phase:

- `security-rules.json` — draft Firebase Realtime Database security rules (DO NOT DEPLOY without review).
- `docs/firebase-security-rules.md` — explanation, rationale and testing instructions.
- `docs/auth-security-remediation.md` — remediation plan for legacy plaintext passwords and token pool.
- `tests/security/README.md` — security rules test plan to run in Firebase Emulator.

Before deploying rules to any production project:
1. Normalize required metadata (`accountStatus`, `linkedEmployeeId`, `participants` arrays).
2. Run the Firebase Emulator test suite and get sign-off.
3. Use a staged rollout and ensure backups.
