# AGENTS.md

## Required Commands
- Install deps: `npm install`
- Lint: `npm run lint`
- Build: `npm run build`
- E2E tests: `npm run test:e2e`
- Targeted auth e2e: `npx playwright test --project=auth`

## Guardrails
- Do not use service-role bypasses in app/runtime code paths.
- All exposed app data access must rely on user-session clients so RLS applies.
- RLS must be enabled and policy-protected for all exposed tables.
- Server actions must be tenant-scoped and return no-leak behavior for inaccessible org/project context.
