# S0 Proof Pack Template (A2)

Use this template after running `docs/PHASE_S0_PROOF_PACK.md`.

Canonical source: `docs/enhanced_master_spec_v0_1_18012026.md` (read-only)

---

## 1) Execution Metadata
- Date:
- Operator:
- Branch:
- Commit SHA:
- Environment:
  - Docker Desktop running: `Yes/No`
  - Supabase local DB reachable: `Yes/No`
  - Auth test env set (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`): `Yes/No`

## 2) Runbook Commands (exact)
Paste exact commands executed and keep order identical to `docs/PHASE_S0_PROOF_PACK.md`.
DB steps require Docker Desktop running.

### Docker Runtime Dependency
- DB proof is `BLOCKED` without Docker Desktop running.
- This is a runtime prerequisite, not a code/spec failure.
- When Docker Desktop is available, run the DB proof suite normally.

```powershell
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Output "DOCKER_NOT_RUNNING: DB proofs are blocked"
  throw "DB proof run blocked: Docker Desktop is required."
}

npx supabase db reset
$DB_CONTAINER = docker ps --format "{{.Names}}" | Where-Object { $_ -like "supabase_db_*" } | Select-Object -First 1
if (-not $DB_CONTAINER) { throw "Supabase DB container not found after reset. DB proofs are blocked." }
docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/verify/s0_schema_verify.sql
docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/toc_gate_a_publish.sql
docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/s0_toc_gate_a_full.sql
docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/s0_toc_projection_contract.sql
docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/s0_export_manifest_hash.sql
docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/s0_sec_stop_ship.sql
docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/s0_rls_cross_tenant_delete_zero_rows.sql
npm run lint
npm run build
# Command to run unit tests
node --test tests/unit/gateAValidator.test.mjs tests/unit/publishService.test.mjs
npx playwright test tests/gate23_toc_publish.e2e.spec.ts --project=auth
npx playwright test tests/gate22_wks_prj_context.e2e.spec.ts --project=auth
npx playwright test tests/s0_export_auth.e2e.spec.ts --project=auth
node scripts/s0_spec_drift_check.mjs
```

## 3) Results Table (Step -> PASS/FAIL -> Evidence)
| Step | PASS/FAIL | Evidence Snippet |
|---|---|---|
| `docker info *> $null` |  |  |
| `npx supabase db reset` |  |  |
| `docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/verify/s0_schema_verify.sql` |  |  |
| `docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/toc_gate_a_publish.sql` |  |  |
| `docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/s0_toc_gate_a_full.sql` |  |  |
| `docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/s0_toc_projection_contract.sql` |  |  |
| `docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/s0_export_manifest_hash.sql` |  |  |
| `docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/s0_sec_stop_ship.sql` |  |  |
| `docker exec -i $DB_CONTAINER psql -U postgres -d postgres -f supabase/tests/s0_rls_cross_tenant_delete_zero_rows.sql` |  |  |
| `npm run lint` |  |  |
| `npm run build` |  |  |
| `node --test tests/unit/gateAValidator.test.mjs tests/unit/publishService.test.mjs` |  |  |
| `npx playwright test tests/gate23_toc_publish.e2e.spec.ts --project=auth` |  |  |
| `npx playwright test tests/gate22_wks_prj_context.e2e.spec.ts --project=auth` |  |  |
| `npx playwright test tests/s0_export_auth.e2e.spec.ts --project=auth` |  |  |
| `node scripts/s0_spec_drift_check.mjs` |  |  |

## 4) Rule-ID Verification Checklist

### Gate A and Publish
- [ ] `GA-01..GA-08` implemented and tested.
- [ ] `TOC-PUB-01` atomic publish proven.
- [ ] `SNAP-01` freeze snapshot copy proven.
- [ ] `TOC-PUB-02` immutability + copy-on-write proven.

Evidence paths:
- `supabase/migrations/20260218020000_s0_canonical_slice.sql`
- `supabase/tests/toc_gate_a_publish.sql`
- `supabase/tests/s0_toc_gate_a_full.sql`
- `tests/gate23_toc_publish.e2e.spec.ts`

### Projection Contract
- [ ] `ARCH-05`, `ARCH-06`, `ARCH-07` proven.
- [ ] `TOC-PROJ-01..04` proven (primary path keys + ghost rows + deterministic ordering).
- [ ] `TOC-MP-01/02` proven (no duplicate node truth).

Evidence paths:
- `supabase/migrations/20260218020000_s0_canonical_slice.sql`
- `supabase/tests/s0_toc_projection_contract.sql`

### Snapshot-Bound Export
- [ ] `RPT-01` manifest persistence proven.
- [ ] `RPT-02` snapshot-bound export proven.
- [ ] `AN-01` weighted allocation rejection proven.
- [ ] `AN-02/03` contribution-mode de-dup and footnotes proven.

Evidence paths:
- `supabase/migrations/20260218020000_s0_canonical_slice.sql`
- `supabase/tests/s0_export_manifest_hash.sql`
- `tests/s0_export_auth.e2e.spec.ts`

### Security Stop-Ship
- [ ] `SEC-03/04` invisible wall + no existence leak proven.
- [ ] `SEC-TEST-01` cross-tenant read `0 rows/not found` proven.
- [ ] `SEC-TEST-02` cross-tenant write rejected safely proven.
- [ ] `SEC-TEST-03` no service key in client bundle proven.

Evidence paths:
- `supabase/tests/s0_sec_stop_ship.sql`
- `supabase/tests/toc_rls_zero_rows.sql`
- `tests/gate22_wks_prj_context.e2e.spec.ts`
- `scripts/s0_spec_drift_check.mjs`

## 5) Blockers and Risk Notes
- Blocker:
- Impacted proof steps:
- Mitigation applied:
- Residual risk:

## 6) GO/NO-GO
- Verdict: `GO / NO-GO`
- Reason:
- Required follow-up (if NO-GO):

## 7) Artifact Index
- Logs:
- Screenshots:
- SQL outputs:
- CI links:
- Related restart docs:
  - `docs/RESTART_PACK/S0/00_REPO_SNAPSHOT.md`
  - `docs/RESTART_PACK/S0/01_CANON_MAP.md`
  - `docs/RESTART_PACK/S0/02_RISK_LIST.md`
  - `docs/RESTART_PACK/S0/03_TRACEABILITY_S0.md`
