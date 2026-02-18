# S0 Sanity Cleanup + Quarantine Report

Date: 2026-02-18  
Mode: ASK  
Objective: make repo sanity-clean and drift-resistant by deleting only safe local junk and quarantining only ambiguous non-core files, without touching protected S0 core artifacts.

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

## Bucket A Detection and Deletions

### Presence detection
```text
MISSING_DIR .next
MISSING_DIR node_modules
MISSING_DIR playwright-report
MISSING_DIR test-results
MISSING_DIR coverage
No *.log found
No .DS_Store found
No Thumbs.db found
No _WIP_*.patch found
No _WIP_*.txt found
```

### Deletions performed
- None. No Bucket A artifacts were present.

## Bucket B Candidates, Evidence, and Actions

Matching heuristic outside existing quarantine (`old|backup|copy|tmp|draft|wip|unused|legacy`):

- Candidate: `docs/adr/ADR-0005-copy-on-write-versioning.md`
- `rg` evidence (`docs src public`):
```text
docs\01_DECISION_REGISTER.md:11:| [ADR-0005](./adr/ADR-0005-copy-on-write-versioning.md) | Copy-on-Write ToC Versioning | Accepted | 2026-02-14 |
docs\02_ARCHITECTURE_MASTER.md:39:**Governing ADRs:** ADR-0003, ADR-0005.
docs\02_ARCHITECTURE_MASTER.md:44:**Governing ADRs:** ADR-0005.
docs\03_UX_CANON.md:43:**Governing ADRs:** ADR-0003, ADR-0005, ADR-0004, ADR-0002.
docs\adr\ADR-0005-copy-on-write-versioning.md:1:# ADR-0005: Copy-on-Write ToC Versioning
```
- Action: kept in place (referenced canonical ADR).

Quarantine moves in this sweep:
- None.

## `.gitignore` Audit (Bucket A patterns)

Required patterns present:

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

No `.gitignore` updates were required.

## Final `git status --porcelain=v1`

```text
(empty)
```