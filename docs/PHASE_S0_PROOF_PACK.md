# Phase S0 Proof Pack

Canonical spec (read-only): `docs/enhanced_master_spec_v0_1_18012026.md`

## Scope
- Vertical Slice S0 only: Draft -> Gate A -> Publish -> New Draft -> Snapshot-bound export.

## Rule Mapping
- Gate A hard blocks: `GA-01..GA-08`
- Publish lifecycle: `TOC-PUB-01`, `TOC-PUB-02`
- Projection contract: `ARCH-05..07`, `TOC-PROJ-01..04`, `TOC-MP-01/02`
- Snapshot-bound export: `RPT-01`, `RPT-02`
- Contribution mode only: `AN-01..03`
- Security stop-ship: `SEC-03/04`, `SEC-TEST-01..03`

## Evidence Scripts
- `supabase/tests/toc_gate_a_publish.sql`
- `supabase/tests/s0_toc_gate_a_full.sql`
- `supabase/tests/s0_toc_projection_contract.sql`
- `supabase/tests/s0_export_manifest_hash.sql`
- `supabase/tests/s0_sec_stop_ship.sql`
- `supabase/verify/s0_schema_verify.sql`
- `tests/unit/projectionContract.test.mjs`

## Docker Runtime Dependency
- DB proof is `BLOCKED` without Docker Desktop running.
- This is a runtime prerequisite, not a code/spec failure.
- When Docker Desktop is available, run the DB proof suite normally.

## Quick Start (Windows PowerShell)
1. `npx supabase start`
2. `npx supabase db reset`
3. `npm run proof:s0`

## Runbook
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
node --test tests/unit/gateAValidator.test.mjs tests/unit/publishService.test.mjs tests/unit/projectionContract.test.mjs
npx playwright test tests/gate23_toc_publish.e2e.spec.ts --project=auth
npx playwright test tests/gate22_wks_prj_context.e2e.spec.ts --project=auth
npx playwright test tests/s0_export_auth.e2e.spec.ts --project=auth
node scripts/s0_spec_drift_check.mjs
```
