# Security Rules Test Plan

This folder contains the manual and automated test plans for `security-rules.json`.

Manual test scenarios (use Firebase Emulator):

1. Unauthenticated
- Attempt to read `/employees` -> expect DENY
- Attempt to read `/parametres` -> expect DENY

2. Member (permissions: members.read)
- Read `/olona` -> ALLOW
- Read `/employees` -> DENY
- Read `/token_pool` -> DENY

3. HR (permissions: rh.read, rh.update)
- Read `/employees/*` -> ALLOW
- Write `/attendance/*` -> ALLOW if attendance.manage
- Read `/logs` -> DENY unless audit.read

4. Admin
- Read/Write `/users/*` -> ALLOW if users.manage
- Write `/parametres` -> ALLOW if settings.manage

5. Super Admin
- Full administrative access (subject to rules)

Automated test suggestion
- Use `firebase-tools` emulator and `@firebase/rules-unit-testing` to run JS tests that assert allow/deny on database operations for given auth contexts.

Test files should assert:
- Attempts to read `users/*/password` are denied
- Attempts to write `token_pool` are denied
- Attempts to write `logs` from client contexts are denied
- Conversation access requires `participants/{uid}: true` membership

