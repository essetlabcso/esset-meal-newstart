# S0 Restart Baseline - Repo Snapshot

Snapshot date: 2026-02-18  
Scope: Vertical Slice S0 only (Draft -> Gate A -> Publish -> New Draft -> Snapshot-bound export)

## Canonical Presence Check
- Canonical spec present: `docs/enhanced_master_spec_v0_1_18012026.md`
- S0 proof pack present: `docs/PHASE_S0_PROOF_PACK.md`

## Sanity Inventory Command Standard (Required)
- Modified tracked files: `git diff --name-only`
- Untracked files (full paths): `git ls-files --others --exclude-standard | ForEach-Object { (Resolve-Path $_).Path }`
- Future sanity reports must use the commands above and include exact file paths.

## Key Tree View (S0 and Governance Surfaces)
```text
docs/
  enhanced_master_spec_v0_1_18012026.md
  PHASE_S0_PROOF_PACK.md
  00_00_SPEC_INDEX.md
  00_RULES_OF_ENGAGEMENT.md
  01_SPEC_CANONICAL_MAP.md
  01_DECISION_REGISTER.md
  02_ARCHITECTURE_MASTER.md
  00_CONTEXT/
    DOMAIN_MAP.md
    P0_WORKFLOWS.md
    P0_TOC_STRATEGY_ENGINE.md
    P0_STRATEGY_MEAL_BINDING.md
    P0_REPORTING_EXPORTS.md
    P0_ROLES_PERMISSIONS.md
    P0_EVIDENCE_VISIBILITY.md
    P0_DATA_CAPTURE_OFFLINE.md
    P0_LEARNING_DECISIONS.md
  adr/
    ADR-0001..ADR-0010

supabase/
  migrations/
    20260215061500_gate5_toc_graph.sql
    20260215184100_gate5_1_hardening.sql
    20260215184200_gate5_1a_fix_rls_qual.sql
    20260217093000_gate23_toc_gate_a_publish_cow.sql
    20260218020000_s0_canonical_slice.sql
    20260218113000_phase_e_projection_matrix_read_model.sql
  tests/
    toc_gate_a_publish.sql
    toc_rls_zero_rows.sql
    s0_toc_gate_a_full.sql
    s0_toc_projection_contract.sql
    s0_export_manifest_hash.sql
    s0_sec_stop_ship.sql
  verify/
    s0_schema_verify.sql

src/
  app/app/projects/[projectId]/toc/actions.ts
  app/app/projects/[projectId]/toc/page.tsx
  app/app/projects/[projectId]/toc/TocGraphClient.tsx
  lib/toc/projectionContract.mjs

tests/
  gate23_toc_publish.e2e.spec.ts
  gate22_wks_prj_context.e2e.spec.ts
  s0_export_auth.e2e.spec.ts
  unit/projectionContract.test.mjs

scripts/
  s0_spec_drift_check.mjs

.github/workflows/
  ci.yml
  s0_drift_guard.yml
```

## Existing Strategy Engine / ToC Implementation Baseline
- ToC draft/publish model exists with copy-on-write lineage and immutable published versions:
  - `supabase/migrations/20260217093000_gate23_toc_gate_a_publish_cow.sql`
  - `supabase/migrations/20260218020000_s0_canonical_slice.sql`
- S0 Gate A validator and publish transaction logic are present in DB migration layer:
  - `supabase/migrations/20260218020000_s0_canonical_slice.sql`
- Option C projection contract implementation artifacts are present:
  - `toc_nodes.primary_parent_id`, `toc_nodes.primary_path_key`
  - `toc_projections` + deterministic read-model function `read_toc_projection_matrix`
  - `supabase/migrations/20260218020000_s0_canonical_slice.sql`
  - `supabase/migrations/20260218113000_phase_e_projection_matrix_read_model.sql`
- Snapshot-bound export + manifest + deterministic hash artifacts are present:
  - `report_manifests` table and `export_matrix_csv` RPC
  - `supabase/migrations/20260218020000_s0_canonical_slice.sql`
- UI hooks for publish and matrix CSV export are present:
  - `src/app/app/projects/[projectId]/toc/actions.ts`
  - `src/app/app/projects/[projectId]/toc/page.tsx`

## Current S0 Proof Status
Verdict: **NO-GO** (runtime proof blocked in current environment)

Observed blockers:
- Local DB proof blocked: Docker engine unavailable (`dockerDesktopLinuxEngine` not found), preventing `supabase db reset` and `docker exec ... psql -f ...` steps.
- Auth E2E proof blocked: missing `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` causes auth setup skip.

What is currently proven in this environment:
- Lint and build pass.
- S0 drift guard script passes (`node scripts/s0_spec_drift_check.mjs`).

What is not runtime-proven yet:
- SQL proof scripts in `supabase/tests/*` and `supabase/verify/s0_schema_verify.sql`.
- Auth E2E proof scripts for Gate 22/Gate 23/S0 export.
