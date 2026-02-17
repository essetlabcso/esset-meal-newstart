# Phase 2 Slice 2.2 Report: ToC Draft -> Gate A Publish -> Immutable Spine

## Scope
Implemented the ToC strategy backbone slice with Gate A blockers, publish immutability, copy-on-write draft continuation, minimal ToC UI flow, and proof artifacts.

## Acceptance Mapping

### 1) Data model + RLS
- `toc_versions` extended with `source_version_id` for lineage.
- `toc_nodes` and `toc_edges` now carry `created_by` (default `auth.uid()`, backfilled, non-null).
- Duplicate edge prevention scoped per version via `toc_edges_unique_per_version`.
- Existing edge version-consistency trigger retained and enforced.
- Files: `supabase/migrations/20260217093000_gate23_toc_gate_a_publish_cow.sql`, prior ToC migrations (`gate5`, `gate5_1`, `gate5_1a`).

### 2) Gate A publish hard blockers
- Publish blocks if GOAL count is not exactly 1.
- Publish blocks on non-GOAL orphan nodes.
- On pass: draft becomes `PUBLISHED`, then new `DRAFT` is created from published version via copy-on-write and linked by `source_version_id`.
- File: `supabase/migrations/20260217093000_gate23_toc_gate_a_publish_cow.sql`.

### 3) Minimal UI flow
- Route `/app/projects/[projectId]/toc` already present and now surfaces publish validation errors inline.
- Publish action now returns specific error text from Gate A RPC.
- File: `src/app/app/projects/[projectId]/toc/actions.ts`, `src/app/app/projects/[projectId]/toc/page.tsx`.

### 4) Proof artifacts
- RLS zero-row proof: `supabase/tests/toc_rls_zero_rows.sql`.
- Gate A blocker + pass + copy-on-write proof: `supabase/tests/toc_gate_a_publish.sql`.
- E2E auth proof: `tests/gate23_toc_publish.e2e.spec.ts`.

## Command Log
- `npm run lint`
- `npm run build`
- `npx playwright test tests/smoke.spec.ts --project=unauth`
- `npx playwright test tests/gate23_toc_publish.e2e.spec.ts --project=auth`
- `npx supabase db query --file supabase/tests/toc_rls_zero_rows.sql`
- `npx supabase db reset`

## Execution Results
- `npm run lint`: PASS
- `npm run build`: PASS
- `npx playwright test tests/smoke.spec.ts --project=unauth`: PASS (`4 passed`)
- `npx playwright test tests/gate23_toc_publish.e2e.spec.ts --project=auth`: SKIPPED (`NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing`)
- `npx supabase db query --file supabase/tests/toc_rls_zero_rows.sql`: FAIL (`unknown flag: --file` in current CLI)
- `npx supabase db reset`: FAIL (Docker Desktop engine unavailable on this machine)

## RLS/Gate-A SQL Proof Status
- SQL proof scripts exist and include PASS markers:
  - `supabase/tests/toc_rls_zero_rows.sql` -> `{"result":"PASS","test":"toc_rls_zero_rows"}`
  - `supabase/tests/toc_gate_a_publish.sql` -> `{"result":"PASS","test":"toc_gate_a_publish"}`
- Local execution is blocked by environment prerequisites (Supabase CLI query subcommand support and Docker Desktop).
