# S0 Canon Map (Enhanced Master Spec -> P0 Contracts -> Repo Artifacts)

Canonical source of truth: `docs/enhanced_master_spec_v0_1_18012026.md` (read-only)

Status legend:
- `Implemented (code)` = present in repo artifacts.
- `Runtime-proven` = executed proof command passed locally.
- `Blocked` = proof exists but runtime execution blocked by environment.

| S0 Requirement | Rule IDs | Existing P0 Contract(s) | S0 Repo Artifact(s) | Current State | Missing Work |
|---|---|---|---|---|---|
| Draft -> Gate A -> Publish -> New Draft spine | TOC-PUB-01, TOC-PUB-02, GA-01..GA-08 | `docs/00_CONTEXT/P0_WORKFLOWS.md`, `docs/00_CONTEXT/P0_TOC_STRATEGY_ENGINE.md` | `supabase/migrations/20260218020000_s0_canonical_slice.sql`, `supabase/tests/toc_gate_a_publish.sql`, `supabase/tests/s0_toc_gate_a_full.sql`, `src/app/app/projects/[projectId]/toc/actions.ts` | Implemented (code), proof blocked | Run DB proof scripts with Docker + local Supabase up |
| Immutable published versions + copy-on-write | TOC-PUB-02, GA-01..GA-08 | `docs/00_CONTEXT/P0_TOC_STRATEGY_ENGINE.md`, `docs/00_CONTEXT/P0_LEARNING_DECISIONS.md` | `supabase/migrations/20260217093000_gate23_toc_gate_a_publish_cow.sql`, `supabase/migrations/20260218020000_s0_canonical_slice.sql`, `supabase/tests/toc_gate_a_publish.sql` | Implemented (code), proof blocked | Execute SQL proof and auth E2E in env with auth vars |
| Freeze analysis snapshot at publish and bind to published version | TOC-PUB-01, SNAP-01, RPT-02 | `docs/00_CONTEXT/P0_WORKFLOWS.md`, `docs/00_CONTEXT/P0_STRATEGY_MEAL_BINDING.md`, `docs/00_CONTEXT/P0_REPORTING_EXPORTS.md` | `supabase/migrations/20260218020000_s0_canonical_slice.sql`, `supabase/tests/toc_gate_a_publish.sql`, `supabase/tests/s0_export_manifest_hash.sql` | Implemented (code), proof blocked | Validate in SQL runtime that freeze-copy ID is set and reused by export |
| Option C projection contract (single GUID, ghost rows, deterministic ordering) | ARCH-05, ARCH-06, ARCH-07, TOC-PROJ-01..04, TOC-MP-01/02, TOC-MTX-01 | `docs/00_CONTEXT/DOMAIN_MAP.md`, `docs/00_CONTEXT/P0_TOC_STRATEGY_ENGINE.md`, `docs/00_CONTEXT/P0_STRATEGY_MEAL_BINDING.md` | `supabase/migrations/20260218020000_s0_canonical_slice.sql`, `supabase/tests/s0_toc_projection_contract.sql` | Implemented (code), proof blocked | Run projection SQL proof and validate matrix behavior in app runtime |
| Snapshot-bound matrix export + manifest + deterministic hash | RPT-01, RPT-02 | `docs/00_CONTEXT/P0_REPORTING_EXPORTS.md`, `docs/00_CONTEXT/P0_WORKFLOWS.md` | `supabase/migrations/20260218020000_s0_canonical_slice.sql`, `supabase/tests/s0_export_manifest_hash.sql`, `src/app/app/projects/[projectId]/toc/actions.ts`, `src/app/app/projects/[projectId]/toc/page.tsx` | Implemented (code), proof blocked | Run export SQL proof and auth E2E export flow |
| Contribution mode only (reject weighted allocation) + de-dup footnotes | AN-01, AN-02, AN-03 | `docs/00_CONTEXT/P0_REPORTING_EXPORTS.md`, `docs/00_CONTEXT/P0_STRATEGY_MEAL_BINDING.md` | `supabase/migrations/20260218020000_s0_canonical_slice.sql`, `supabase/tests/s0_export_manifest_hash.sql` | Implemented (code), proof blocked | Runtime verify rejection path + deterministic output proof |
| Multi-tenant security and no existence leak (404/0 rows) | SEC-03, SEC-04, SEC-TEST-01, SEC-TEST-02 | `docs/00_CONTEXT/P0_ROLES_PERMISSIONS.md`, `docs/00_CONTEXT/DOMAIN_MAP.md`, `docs/00_CONTEXT/P0_EVIDENCE_VISIBILITY.md` | `supabase/tests/toc_rls_zero_rows.sql`, `supabase/tests/s0_sec_stop_ship.sql`, `tests/gate22_wks_prj_context.e2e.spec.ts` | Tests exist, proof blocked/partially skipped | Execute SQL + E2E in full env; confirm read=0 rows/not found and write rejection |
| CI drift prevention + no service-role key in client bundle | SEC-TEST-03, DOD-01 | `docs/00_RULES_OF_ENGAGEMENT.md`, `docs/01_SPEC_CANONICAL_MAP.md`, `docs/02_ARCHITECTURE_MASTER.md` | `.github/workflows/s0_drift_guard.yml`, `scripts/s0_spec_drift_check.mjs` | Runtime-proven (`S0_DRIFT_PASS`) | Keep workflow green in CI after env blockers resolved |
| S0 proof-pack discipline and traceability | DOD-01, Section 11.2 proof minimums | `docs/00_CONTEXT/P0_WORKFLOWS.md`, `docs/00_00_SPEC_INDEX.md`, `docs/PHASE_S0_PROOF_PACK.md` | `docs/PHASE_S0_PROOF_PACK.md`, `docs/RESTART_PACK/S0/00_REPO_SNAPSHOT.md`, `docs/RESTART_PACK/S0/02_RISK_LIST.md` | Implemented (docs) | Rerun full proof pack in valid runtime and update verdict to GO only when all pass |

## Governance Alignment Notes
- Canonical governance chain exists and is discoverable:
  - `docs/00_RULES_OF_ENGAGEMENT.md`
  - `docs/01_SPEC_CANONICAL_MAP.md`
  - `docs/01_DECISION_REGISTER.md`
  - `docs/adr/ADR-0001..ADR-0010`
- P0 contract suite is complete and indexed in `docs/00_00_SPEC_INDEX.md`.
- Current blocker is not missing contracts; blocker is runtime environment for proof execution.
