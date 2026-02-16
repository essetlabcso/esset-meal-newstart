# Phase 2 Slice 2.1 Report: WKS + PRJ + Active Org + Invisible Walls

## Scope
Implemented the vertical slice for workspace/org context, active org persistence, projects/reporting periods scoping, and RLS invisible-wall behavior.

## Acceptance Mapping

### 1) Workspace creation
- UI evidence: onboarding uses `createOrganization` and redirects to `/app` with active workspace set.
- DB evidence: `public.create_workspace` RPC inserts `organizations` and owner `org_memberships` atomically.
- Files: `src/app/app/actions.ts`, `supabase/migrations/20260216200000_fix_workspace_creation_atomic.sql`.

### 2) Invisible wall (no existence leaks)
- RLS evidence: users only read orgs/projects through membership policies (`is_tenant_member`, `is_org_admin`).
- Regression proof: `supabase/tests/rls_wks_prj.sql` asserts cross-org reads return 0 rows.
- App evidence: project lookup outside membership resolves to not-found route in project actions/page flow.
- Files: `supabase/migrations/20260215054710_gate4_projects.sql`, `supabase/migrations/20260216181717_gate20_privacy.sql`, `tests/gate22_wks_prj_context.e2e.spec.ts`.

### 3) Project creation + reporting periods
- UI evidence: project creation (`/app/projects/new`) and reporting periods setup (`/app/projects/[projectId]/reporting-periods`).
- DB evidence: `projects` and `reporting_periods` tables are tenant-scoped with RLS.
- Hardening: reporting period now enforces project-to-tenant consistency.
- Files: `src/app/app/projects/actions.ts`, `src/app/app/projects/[projectId]/actions.ts`, `supabase/migrations/20260216183700_gate21_projects_reporting_periods.sql`, `supabase/migrations/20260217090000_gate22_reporting_period_scope_guard.sql`.

### 4) Active org persistence
- Persisted in `profiles.active_tenant_id`.
- Enforced in app shell via `getActiveTenant` and workspace selector flow.
- Workspace create now sets active org deterministically after RPC success.
- Files: `supabase/migrations/20260215215400_gate6_active_tenant.sql`, `supabase/migrations/20260215215401_gate6_1_profiles_active_tenant_rls.sql`, `src/lib/tenant.ts`, `src/app/app/layout.tsx`, `src/app/app/workspaces/page.tsx`, `src/app/app/actions.ts`.

## Test and Proof Artifacts
- SQL RLS regression: `supabase/tests/rls_wks_prj.sql`.
- App-level e2e: `tests/gate22_wks_prj_context.e2e.spec.ts`.
- Existing flow proofs reused: `tests/gate21_projects_reporting_periods.e2e.spec.ts`, `tests/gate20_invite_flow.e2e.spec.ts`.

## Execution Log
- `npm run lint` -> PASS.
- `npm run build` -> PASS.
- `npx playwright test tests/smoke.spec.ts --project=unauth` -> PASS (4 passed).
- `npx playwright test tests/gate22_wks_prj_context.e2e.spec.ts --project=auth` -> SKIPPED (missing `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` in test runtime).
- `npx supabase db query --file supabase/tests/rls_wks_prj.sql` -> FAIL (`db query` subcommand unsupported in installed CLI).
- `npx supabase db reset` -> FAIL (Docker Desktop not available in this environment).

## RLS Proof Status
- Script is ready at `supabase/tests/rls_wks_prj.sql`.
- Execution is blocked in the current environment due missing Docker/Supabase local runtime.
