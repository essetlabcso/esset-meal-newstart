# S0 Restart Risk List (Top 10)

Context date: 2026-02-18  
Current proof verdict: **NO-GO** (environment blockers prevent full runtime proof)

## Top 10 Drift Risks and Mitigations

| ID | Risk | Why it matters | Mitigation | Evidence/Trigger |
|---|---|---|---|---|
| R1 | **Proof blocked by environment** (Docker missing) | SQL proofs cannot execute, so S0 cannot be promoted to GO with confidence | Install/start Docker Desktop; run `npx supabase db reset`; run all SQL proof scripts in `docs/PHASE_S0_PROOF_PACK.md` | Current blocker observed: `dockerDesktopLinuxEngine` missing |
| R2 | **Auth E2E blocked by missing env vars** | Gate 22/23 and export auth scenarios are skipped, hiding regressions | Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in test runtime; rerun auth E2E | Current blocker observed: Playwright auth setup skip |
| R3 | **RLS / no-existence-leak drift** | Violates SEC hard requirements; could leak cross-tenant existence | Keep SEC SQL and E2E stop-ship tests mandatory; fail CI on regressions | `supabase/tests/s0_sec_stop_ship.sql`, `supabase/tests/toc_rls_zero_rows.sql`, `tests/gate22_wks_prj_context.e2e.spec.ts` |
| R4 | **Gate A rule drift (GA-01..GA-08)** | Publish could pass invalid strategies; stop-ship quality failure | Keep GA validator and deterministic GA codes in DB; run full GA matrix test before release | `supabase/migrations/20260218020000_s0_canonical_slice.sql`, `supabase/tests/s0_toc_gate_a_full.sql` |
| R5 | **Publish transaction loses freeze-snapshot binding** | Breaks reproducibility and audit traceability | Keep TOC publish atomic; assert `linked_analysis_snapshot_id` freeze-copy behavior in proof scripts | `supabase/tests/toc_gate_a_publish.sql`, `supabase/tests/s0_export_manifest_hash.sql` |
| R6 | **Published ToC mutability regression** | Historical strategy can be rewritten, invalidating reporting | Keep DB-level immutability + COW flow tests; block direct edits to published versions | `supabase/tests/toc_gate_a_publish.sql`, `src/app/app/projects/[projectId]/toc/actions.ts` |
| R7 | **Projection drift: ghost rows duplicate nodes or unstable ordering** | Option C contract breaks; matrix reports become inconsistent | Keep `toc_projections` rebuild deterministic and enforce projection proof tests | `supabase/tests/s0_toc_projection_contract.sql`, `supabase/migrations/20260218020000_s0_canonical_slice.sql` |
| R8 | **Snapshot-bound export drift** (manifest/hash) | Exports become non-reproducible and non-auditable | Require `report_manifests` entry + SHA-256 reproducibility checks for every export | `supabase/tests/s0_export_manifest_hash.sql`, `supabase/verify/s0_schema_verify.sql` |
| R9 | **Weighted allocation reintroduced** | Violates AN-01 non-negotiable baseline | Keep explicit rejection path in export RPC and retain drift scan checks | `supabase/migrations/20260218020000_s0_canonical_slice.sql`, `scripts/s0_spec_drift_check.mjs` |
| R10 | **Spec/implementation drift** from canonical S0 rules | Teams may implement against outdated assumptions | Keep canonical path lock and rule-ID checks in CI + restart pack updates each phase | `.github/workflows/s0_drift_guard.yml`, `scripts/s0_spec_drift_check.mjs`, `docs/enhanced_master_spec_v0_1_18012026.md` |

## Immediate Exit Criteria to move from NO-GO to GO
1. Docker-backed SQL proof scripts all pass.
2. Auth E2E tests (Gate 22, Gate 23, S0 export) run and pass with required env vars.
3. Drift guard remains green (`S0_DRIFT_PASS`).
4. Proof pack result table updated with all PASS statuses.
