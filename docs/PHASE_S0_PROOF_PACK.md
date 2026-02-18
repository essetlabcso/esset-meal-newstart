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

## Runbook
```powershell
npx supabase db reset
npx supabase db query --file supabase/verify/s0_schema_verify.sql
npx supabase db query --file supabase/tests/toc_gate_a_publish.sql
npx supabase db query --file supabase/tests/s0_toc_gate_a_full.sql
npx supabase db query --file supabase/tests/s0_toc_projection_contract.sql
npx supabase db query --file supabase/tests/s0_export_manifest_hash.sql
npx supabase db query --file supabase/tests/s0_sec_stop_ship.sql
npm run lint
npm run build
npx playwright test tests/gate23_toc_publish.e2e.spec.ts --project=auth
npx playwright test tests/gate22_wks_prj_context.e2e.spec.ts --project=auth
npx playwright test tests/s0_export_auth.e2e.spec.ts --project=auth
node scripts/s0_spec_drift_check.mjs
```
