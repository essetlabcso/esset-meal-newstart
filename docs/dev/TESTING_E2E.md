# E2E Testing Guide (Playwright)

This document describes how to run automated end-to-end smoke tests for the ESSET MEAL repository.

## Prerequisites

Ensure you have the following environment variables in your `.env.local`:

### Required for Unauthenticated Smoke Tests:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Required for Authenticated Smoke Tests:
- `SUPABASE_SERVICE_ROLE_KEY` (Used by the test runner to create and confirm test users via the Admin API).

> [!CAUTION]
> **Do NOT commit `SUPABASE_SERVICE_ROLE_KEY` to the repository.** This is a highly sensitive secret that bypasses all RLS.

## Commands

### Install Dependencies
```bash
npx playwright install chromium
```

### Run All Tests
```bash
npm run test:e2e
```

### Run Only Unauthenticated Suite
```bash
npx playwright test --project=unauth
```

### Run Only Authenticated Suite
```bash
npx playwright test --project=auth
```

## How it Works
1. **Unauthenticated Suite (`unauth`)**: Validates landing page reachability and branding without requiring a session.
2. **Setup (`setup`)**:
   - Uses `tests/auth.setup.ts`.
   - Idempotently creates/confirms a stable test user (`e2e.test@essetmeal.local`) via Supabase Admin API.
   - Logs in via the UI and saves the session to `playwright/.auth/storageState.json`.
3. **Authenticated Suite (`auth`)**: 
   - Depends on `setup`.
   - Uses the saved `storageState.json`.
   - Validates the complete critical path: Workspace -> Project -> Analysis -> ToC -> Publish.

## Graceful Skipping
If `SUPABASE_SERVICE_ROLE_KEY` is missing:
- The `setup` project will skip gracefully with a warning.
- The `auth` project tests will be skipped automatically, as they depend on the missing session.
- The `unauth` project will still run and pass.
