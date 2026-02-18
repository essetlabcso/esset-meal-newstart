# S0 Sanity Cleanup + Quarantine Report

Date: 2026-02-18  
Mode: ASK  
Objective: keep repo sanity-clean and drift-resistant by deleting only safe local junk (Bucket A), quarantining only ambiguous non-core files with evidence checks (Bucket B), and not touching protected S0 core artifacts.

## Step 0 Raw Command Outputs

### `git rev-parse --show-toplevel`
```text
D:/esset-meal-newstart/esset-meal-newstart
```

### `git status --porcelain=v1`
```text
(empty)
```

### `git diff --name-only`
```text
(empty)
```

### `git ls-files --others --exclude-standard`
```text
(empty)
```

## Protected S0 Core Artifact Tracking Check

```text
TRACKED src/lib/toc/gateAValidator.mjs
TRACKED src/lib/toc/publishService.mjs
TRACKED supabase/migrations/20260218040000_s0_schema_minimum_alignment.sql
TRACKED supabase/migrations/20260218050000_s0_rls_baseline_no_existence_leaks.sql
TRACKED supabase/migrations/20260218070000_s0_publish_atomic_rpc.sql
TRACKED supabase/tests/s0_publish_atomic_transaction.sql
TRACKED supabase/tests/s0_rls_cross_tenant_delete_zero_rows.sql
TRACKED supabase/tests/s0_toc_draft_crud_scope.sql
TRACKED tests/unit/gateAValidator.test.mjs
TRACKED tests/unit/publishService.test.mjs
TRACKED docs/PHASE_S0_PROOF_PACK.md
TRACKED docs/RESTART_PACK/S0/00_REPO_SNAPSHOT.md
TRACKED docs/RESTART_PACK/S0/03_TRACEABILITY_S0.md
TRACKED docs/RESTART_PACK/S0/04_PROOF_PACK_TEMPLATE.md
```

## Bucket A Presence Detection + Deletions

### Presence detection
```text
MISSING_DIR .next
MISSING_DIR node_modules
MISSING_DIR playwright-report
MISSING_DIR test-results
MISSING_DIR coverage
No *.log matches (empty output)
No .DS_Store/Thumbs.db/_WIP_*.patch/_WIP_*.txt matches (empty output)
```

### Tracked-path safety check
- No Bucket A targets were found, so no deletion candidates required `git ls-files -- <path>` verification.

### Deletions performed
- None.

## Bucket B Candidates + Evidence + Actions

Scan scope and filters:
- Pattern: `old|backup|tmp|draft|wip|unused|legacy|[-_]copy`
- Excluded: `.git/`, `docs/_QUARANTINE/`, protected S0 list, `docs/adr/*` entries referenced in `docs/01_DECISION_REGISTER.md`.

Result:
```text
No candidates found after exclusions.
```

Quarantine moves:
- None.

## `.gitignore` Audit

Required patterns check:
```text
FOUND /.next/
FOUND /node_modules
FOUND /playwright-report
FOUND /test-results
FOUND /coverage
FOUND *.log
FOUND .DS_Store
FOUND Thumbs.db
FOUND _WIP_*.patch
FOUND _WIP_*.txt
```

Changes to `.gitignore`:
- None required.

## Final `git status --porcelain=v1`

```text
(empty)
```
