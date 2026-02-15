# Architecture Master (v0.1)

## Skill Compliance Checklist
- [x] Consulted `schema-first-builder` for database determinism rules.
- [x] Consulted `toc-graph-engine` for hybrid model invariants.
- [x] Consulted `rls-rbac-guardian` for tenant boundary enforcement.
- [x] Consulted `spec-compliance-auditor` for canon alignment.

---

## A) Scope + Non-Negotiables
This document defines the architectural identity for the ESSET MEAL Clean Slate rebuild. Every component must adhere to these invariants.
**Governing ADRs:** ADR-0001, ADR-0007.

## B) System Intent: Compliance Graveyard → Project Intelligence
The platform is shifting from an extractive compliance tool to a strategic intelligence engine. Data is captured not just for reporting, but to power local adaptation and adaptive management.
**Governing ADRs:** ADR-0001, ADR-0002.

## C) Option C Tri-Engine Overview
The platform operates as a discrete Tri-Engine system:
1. **Graph Engine (Write Model):** Manages the strategy (ToC nodes, edges, assumptions).
2. **Relational Engine (Operations):** Captures results, evidence, and indicator measurements.
3. **Validation Engine (Read Model):** Computes health metrics, Gates A/B readiness, and denormalized analytics.
**Governing ADRs:** ADR-0002.

## D) Domain Module Boundaries
1. **ANL Module:** Upstream analysis/context setting.
2. **Strategy Engine (TOC):** Core logic for theory of change construction.
3. **Ops Engine:** Day-to-day MEAL data capture.
4. **Analytics Engine:** Portfolio-level aggregation.
5. **Evidence Library:** Media and document vault for verification.
6. **Learning/Accountability Loops:** Feedback and adaptation triggers.
**Governing ADRs:** ADR-0003.

## E) Core Data Contracts
- **ANL Snapshot → Strategy Version:** Every Theory of Change version MUST anchor to an immutable Analysis Snapshot ID.
- **Strategy Version → Ops Engine:** Indicators and assumptions are bound to a specific Strategy Version ID.
- **Ops Engine → Read Model:** Raw results are aggregated into materialized views for the Validation Engine.
**Governing ADRs:** ADR-0003, ADR-0005.

## F) Versioning + Time Travel
- **Copy-on-Write (CoW):** All edits happen in "Draft". Publishing creates an immutable incremented version.
- **Traceability:** Results are forever linked to the version of the strategy that was active at the time of capture.
**Governing ADRs:** ADR-0005.

## G) Multi-tenancy + Invisible Walls
Every table and function MUST include a `tenant_id` (canonical key name).

“This tenant_id rule applies to application-owned tables and functions in the public (and other app-controlled) schemas only; Supabase-managed/system schemas (e.g., auth, storage, extensions) are out of scope and must not be modified. “Global reference” tables (e.g., ISO codes) may omit tenant_id only if they are explicitly declared as global, are read-only, and are never joined in a way that can leak tenant data; otherwise they must carry tenant_id like all other app data.”

Usage of `org_id` or `workspace_id` is prohibited for core partitioning. Data access is governed by Strict RLS (invisible to other orgs), and consistency MUST be maintained across schema, RLS policies, and UI context filters.

**Enforcement rules:** `tenant_id` is the only canonical tenant key name. `tenant_id` must exist on every tenant-scoped table. Server actions must enforce org context and never trust client-supplied tenant IDs. RLS remains the enforcement layer; server-side scoping is a second guardrail.

**Governing ADRs:** ADR-0006.

## H) Supabase Determinism + Migration Discipline
- **Zero-Dashboard Policy:** No manual SQL.
- **14-Digit Migrations:** Sequential, timestamped files only.
- **RPC Safety:** Explicit `search_path=public` and `STABLE`/`IMMUTABLE` markers where applicable.
- **Verification Proof:** Every migration/RPC change MUST include a corresponding `supabase/verify/*.sql` check that proves the change (per ADR-0008).
**Governing ADRs:** ADR-0008.

## I) Read Model + Analytics Principles
Materialization is used to support low-bandwidth portfolio views without expensive real-time joins. Denormalization happens only at the "Read Model" layer.
**Governing ADRs:** ADR-0002.

## J) Governance + Gates
Each release gate requires automated proof of:
1. Workspace Onboarding Success
2. RLS Security Coverage
3. ToC Persistence Smoke Tests
4. Analytics Aggregate Sanity
**Governing ADRs:** ADR-0007, ADR-0010.

## K) Open Questions (TBD) + Decision Hooks
- [ ] Offline sync conflict resolution strategy (Requires ADR).
- [ ] Portfolio-wide indicator standardization vs local flexibility (Requires ADR).
- [ ] Real-time notification engine for adaptation triggers (Requires ADR).
