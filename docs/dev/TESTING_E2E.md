# E2E Testing Guide (Playwright)

This document describes how to run automated end-to-end smoke tests for the ESSET MEAL repository.

## Prerequisites

Ensure you have the following environment variables in your `.env.local` or environment:

### Required for Unauthenticated Smoke Tests:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Required for Authenticated Smoke Tests:
- `SUPABASE_SERVICE_ROLE_KEY` (Used by the test runner to create and confirm test users via the Admin API).

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
npx playwright test --project=chromium-unauth
```

### Run Only Authenticated Suite
```bash
npx playwright test --project=chromium-auth
```

## How it Works
1. **Unauthenticated Suite**: Runs against `tests/smoke.spec.ts`. Validates landing page, branding, and sign-in reachability.
2. **Authenticated Suite**: 
   - Uses `tests/auth.setup.ts` to create a new confirmed user.
   - Saves the browser's storage state to `playwright/.auth/user.json`.
   - Runs `tests/auth.smoke.spec.ts` using that session.
   - Validates the complete path: Project Creation -> Analysis -> ToC Drafting -> Assumption Management -> Publishing.
