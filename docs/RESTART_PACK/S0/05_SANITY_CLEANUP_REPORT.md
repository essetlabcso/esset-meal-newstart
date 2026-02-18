# S0 Sanity Cleanup + Quarantine Report

Date: 2026-02-18  
Mode: ASK (deterministic)  
Objective: repo-wide cleanup/quarantine sweep without touching core S0 artifacts.

## Step 0 Raw Command Outputs

### `git rev-parse --show-toplevel`
```text
D:/esset-meal-newstart/esset-meal-newstart
```

### `git status --porcelain=v1`
```text
 M .gitignore
 M docs/PHASE_S0_PROOF_PACK.md
 M docs/RESTART_PACK/S0/00_REPO_SNAPSHOT.md
 M docs/RESTART_PACK/S0/03_TRACEABILITY_S0.md
 M docs/RESTART_PACK/S0/04_PROOF_PACK_TEMPLATE.md
 M src/app/app/projects/[projectId]/toc/actions.ts
 M src/app/app/projects/[projectId]/toc/page.tsx
?? src/lib/toc/
?? supabase/migrations/20260218040000_s0_schema_minimum_alignment.sql
?? supabase/migrations/20260218050000_s0_rls_baseline_no_existence_leaks.sql
?? supabase/migrations/20260218070000_s0_publish_atomic_rpc.sql
?? supabase/tests/s0_publish_atomic_transaction.sql
?? supabase/tests/s0_rls_cross_tenant_delete_zero_rows.sql
?? supabase/tests/s0_toc_draft_crud_scope.sql
?? tests/unit/
```

### `git diff --name-only`
```text
.gitignore
docs/PHASE_S0_PROOF_PACK.md
docs/RESTART_PACK/S0/00_REPO_SNAPSHOT.md
docs/RESTART_PACK/S0/03_TRACEABILITY_S0.md
docs/RESTART_PACK/S0/04_PROOF_PACK_TEMPLATE.md
src/app/app/projects/[projectId]/toc/actions.ts
src/app/app/projects/[projectId]/toc/page.tsx
warning: in the working copy of '.gitignore', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'docs/PHASE_S0_PROOF_PACK.md', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'docs/RESTART_PACK/S0/00_REPO_SNAPSHOT.md', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'docs/RESTART_PACK/S0/03_TRACEABILITY_S0.md', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'docs/RESTART_PACK/S0/04_PROOF_PACK_TEMPLATE.md', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/app/app/projects/[projectId]/toc/actions.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/app/app/projects/[projectId]/toc/page.tsx', LF will be replaced by CRLF the next time Git touches it
```

### `git ls-files --others --exclude-standard`
```text
src/lib/toc/gateAValidator.mjs
src/lib/toc/publishService.mjs
supabase/migrations/20260218040000_s0_schema_minimum_alignment.sql
supabase/migrations/20260218050000_s0_rls_baseline_no_existence_leaks.sql
supabase/migrations/20260218070000_s0_publish_atomic_rpc.sql
supabase/tests/s0_publish_atomic_transaction.sql
supabase/tests/s0_rls_cross_tenant_delete_zero_rows.sql
supabase/tests/s0_toc_draft_crud_scope.sql
tests/unit/gateAValidator.test.mjs
tests/unit/publishService.test.mjs
```

### Bucket A presence detection
```text
PRESENT_DIR .next
PRESENT_DIR node_modules
PRESENT_DIR playwright-report
PRESENT_DIR test-results
MISSING_DIR coverage
D:\esset-meal-newstart\esset-meal-newstart\_WIP_DIFF.patch
D:\esset-meal-newstart\esset-meal-newstart\_WIP_UNTRACKED.txt
D:\esset-meal-newstart\esset-meal-newstart\.next\dev\logs\next-development.log
```

## Bucket A (safe local cleanup) and Actions

Deleted local artifacts:
- `.next/`
- `node_modules/`
- `playwright-report/`
- `test-results/`
- `_WIP_DIFF.patch`
- `_WIP_UNTRACKED.txt`
- `*.log` artifacts discovered during sweep

Post-cleanup presence check:
```text
MISSING_DIR .next
MISSING_DIR node_modules
MISSING_DIR playwright-report
MISSING_DIR test-results
MISSING_DIR coverage
```

## Bucket B (quarantine candidates) and Actions

### Candidate 1: `docs/marketing/LANDING_PAGE_COPY.md`
- Action: moved to `docs/_QUARANTINE/20260218/docs/marketing/LANDING_PAGE_COPY.md`
- Why: ambiguous, non-canonical marketing copy; no active references in runtime/proof surfaces
- Evidence (`rg` before move): no matches under `docs src public` for `LANDING_PAGE_COPY`

### Candidate 2: `public/brand/legacy/`
- Action: moved to `docs/_QUARANTINE/20260218/public/brand/legacy/`
- Why: legacy duplicate/reference-only brand assets; not canonical runtime assets
- Evidence: branding integration plan marks legacy assets reference-only and non-canonical; runtime points to canonical `/brand/esset-logo-full.svg`

## .gitignore Audit (Bucket A patterns)

No new .gitignore lines were required in this sweep. Required patterns already present:
```text
   4: /node_modules
  14: /coverage
  15: /playwright-report
  16: /test-results
  19: /.next/
  26: .DS_Store
  27: Thumbs.db
  35: *.log
  36: _WIP_*.patch
  37: _WIP_*.txt
```

## Final git status --porcelain=v1
```text
(empty)
```

