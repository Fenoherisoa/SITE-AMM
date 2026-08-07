# Running Firebase Realtime Database Security Rules Tests (Emulator Only)

Prerequisites
- Node.js and npm installed
- `firebase-tools` installed globally or available via `npx`

1. Install dev dependencies

```bash
npm install
```

2. Start the Realtime Database emulator (in a separate terminal)

```bash
# from repo root
npx firebase emulators:start --only database --project site-amm-test
```

By default the emulator listens on localhost:9000 and sets `FIREBASE_DATABASE_EMULATOR_HOST` for child processes started by the emulator.

3. Run the rules test suite

```bash
npm run test:rules
```

Notes
- The test suite will refuse to run if `FIREBASE_DATABASE_EMULATOR_HOST` is not present to avoid accidentally targeting production.
- Tests seed synthetic fixtures only; they will not modify any production data.

## CI

A GitHub Actions workflow runs these tests in the Firebase Emulator without using production credentials. The workflow:

- checks out the repository
- installs dependencies with `npm ci`
- starts the Realtime Database emulator for project `site-amm-test`
- runs `npm run typecheck` and `npm run test:rules`
- stops the emulator

The workflow file is `.github/workflows/firebase-rules.yml`.

