# ESSET MEAL — Enhanced Master Specification (New Start Baseline) v0.1-final

**Status:** Final baseline for “New Start” rebuild  
**Primary Use:** Single source of truth for Codex-driven implementation (Gate-sized vertical slices)  
**Audience:** Product owner, lead architect, Codex (agent), full-stack implementers, QA/security  
**Non-negotiable architecture:** Option C Hybrid Graph–Relational (Strategy graph write-model + Ops relational write-model + Analytics read-model)

---

## 0) How to read and enforce this spec

### 0.1 Normative language
- **MUST** = hard requirement; violating it is a **stop-ship** bug.
- **SHOULD** = strongly recommended; allowed only with an explicit logged decision.
- **MAY** = optional; must be clearly flagged and isolated (feature flag / later phase).

### 0.2 What “deterministic” means here
For every critical requirement, this spec provides:
1) **Rule ID** (stable reference for traceability)  
2) **Expected system behavior** (exact)  
3) **Enforcement point** (DB constraint / server action / UI constraint / CI check)  
4) **Test/Proof** (minimum negative/positive test IDs)

### 0.3 Baseline scope (v0.1)
This baseline includes only what is required to ship the first high-integrity vertical slice:

**Slice S0 (“Draft → Gate A → Publish → New Draft → Snapshot-bound Export”)**
- Create/edit a Draft ToC using Wizard/Graph/Matrix
- Enforce multi-tenant safety + response silence
- Enforce Gate A at publish (hard blocks)
- Publish creates immutable version + spawns next draft (copy-on-write)
- Freeze Analysis Snapshot at publish
- Generate snapshot-bound Matrix (logframe) export with manifest
- Contribution Mode de-dup + reconciliation footnotes

Anything outside these behaviors is out of scope unless explicitly listed.

---

## 1) Product intent and non-goals

### 1.1 Product intent
ESSET MEAL turns planning into **project intelligence**:
- A living strategy (ToC) that can evolve safely and remain audit-defensible
- Evidence linked directly to strategy nodes (no orphaned data)
- Decisions and adaptations recorded with provenance
- Reports that remain reproducible even after strategy evolves
- Usable in low-bandwidth/offline realities

### 1.2 Explicit non-goals (hard line)
**NG-01 (MUST): ESSET MEAL is not a case management IMS.**  
It MUST NOT store identifiable survivor/client case files, medical records, or unaggregated referral/case histories.

**Integration pattern (allowed): “Aggregated Extract → Ingest”**
- External case systems may export **pre-aggregated** counts/rates (safe summaries)
- ESSET may ingest those aggregated tables for strategy monitoring
- ESSET MUST reject ingestion of row-level case files

**Enforcement:** schema + ingestion validators + export whitelists  
**Tests:** SEC-NG-01 ingest rejection tests

---

## 2) Canonical architecture: Option C (Hybrid Graph–Relational)

### 2.1 Three bounded engines
**ARCH-01 (MUST): Strategy Engine (graph write-model)**  
Stores the versioned ToC: nodes + edges + assumptions + edge metadata.

**ARCH-02 (MUST): MEAL Ops Engine (relational write-model)**  
Stores operational MEAL data linked to strategy versions/nodes:
Indicators, Measurements, Evidence, Decisions, Feedback.

**ARCH-03 (MUST): Analytics & Reporting Engine (read-model)**  
Produces denormalized reporting tables and exports, always bound to a snapshot context.

### 2.2 CQRS principle (kept practical)
**ARCH-04 (MUST): Input model ≠ Reporting model**  
The way users build strategy (messy, graph) MUST NOT be constrained by donor table formats.
The donor-format matrix is a projection/read-model.

### 2.3 Projection contract
**ARCH-05 (MUST): Single source of truth**
- A node exists **once** in the Strategy graph (single GUID).
- The Matrix view is a projection that may show **ghost rows** without duplicating nodes.

**ARCH-06 (MUST): Path Keys**
Each node MUST maintain projection metadata enabling deterministic placement and ghost rows:
- `path_key[]` for primary placement
- `ghost_path_keys[]` (or derived projection table) for secondary placements

**ARCH-07 (MUST): Edit propagation**
Editing a node’s text MUST update all projected occurrences (including ghost rows) instantly.

**Enforcement:** schema + projection builder + tests  
**Tests:** TOC-PROJ-01..04

---

## 3) Domain modules and workflow (CSO-friendly)

### 3.1 5-stage CSO journey (workflow-first)
1) **Analyze (ANL)** — context, stakeholders, power, risks, constraints  
2) **Strategy (TOC)** — build ToC (Wizard/Graph/Matrix) and publish versions  
3) **Evidence (IND/MSR/EVD)** — indicators + measurements + qualitative evidence  
4) **Learning (LRN)** — decisions tied to evidence and strategy versioning  
5) **Reports (RPT/EXP)** — snapshot-bound exports (donor + community-safe)

### 3.2 Workflow-first exit criteria
Each stage MUST define:
- required artifacts
- gate checks
- proof pack (tests + logs + manifest)

**Enforcement:** gate catalog + proof pack checklist  
**Tests:** WF-PROOF-*

---

## 4) Core data model (baseline entities and required fields)

> NOTE: This section defines **required fields and constraints**, not full SQL.  
> Exact schemas/migrations MUST implement these constraints.

### 4.1 Tenant and scope fields (required on all write tables)
**SEC-01 (MUST): Every write table MUST contain:**
- `org_id` (or workspace_id, but one canonical field MUST exist)
- `project_id`
- `created_by`
- `created_at`, `updated_at`

**SEC-02 (MUST): Every queryable table MUST be RLS-protected.**

### 4.2 Strategy Engine entities

#### 4.2.1 toc_versions
Required:
- `id` (UUID)
- `org_id`, `project_id`
- `version_label` (e.g., “v1.0”)
- `status` enum: `draft | published | archived`
- `source_version_id` (nullable; used for copy-on-write lineage)
- `linked_analysis_snapshot_id` (nullable on draft; MUST be set on publish)
- `published_at` (nullable; MUST be set on publish)

Constraints:
- Only **one active draft** per project at a time (unless explicitly allowed later)
- Published versions are immutable

#### 4.2.2 toc_nodes
Required:
- `id` (UUID) — stable node GUID
- `toc_version_id`
- `node_type` enum: `goal | outcome | output | activity`
- `title` (short)
- `narrative` (long, optional)
- `primary_parent_id` (nullable only for goal)
- `primary_path_key[]` (or equivalent derived primary path)
- `sphere` enum (optional in v0.1): `control | influence | interest` (if used, must be consistent)

Constraints:
- Exactly one goal per toc_version (Gate A)
- Every non-goal node MUST have exactly one `primary_parent_id` (Gate A)
- `primary_parent_id` MUST reference a node in same toc_version
- Node type transitions MUST respect hierarchy:
  - goal → outcome → output → activity (no skipping unless explicitly permitted and tested)

#### 4.2.3 toc_edges
This is the “smart edge” table.

Required:
- `id` (UUID)
- `toc_version_id`
- `from_node_id`, `to_node_id`
- `edge_kind` enum:
  - `causal` (participates in DAG checks and matrix projection logic)
  - `secondary_link` (creates ghost-row projection only; not a causal claim)
  - `feedback` (allowed annotation link; excluded from DAG validation)
- `mechanism` (text; required for causal edges)
- `confidence` enum: `high | medium | low`
- `risk_flag` enum: `none | high_risk`
- `sentinel_indicator_id` (nullable; required when risk/high or confidence low for causal edges)
- `created_by`, `created_at`

Constraints:
- Unique constraint for duplicates: `(toc_version_id, from_node_id, to_node_id, edge_kind)`
- Only `causal` edges participate in publish DAG validation

#### 4.2.4 toc_assumptions (or assumptions table)
Required:
- `id`
- `toc_version_id`
- `edge_id` (preferred) or `node_id`
- `assumption_text`
- `assumption_type` enum: `context | capacity | political | operational | other`
- `likelihood`, `impact` (optional but recommended)

### 4.3 Analysis Snapshot entity
**SNAP-01 (MUST): analysis_snapshots**
Required:
- `id`
- `org_id`, `project_id`
- `captured_at`
- `snapshot_jsonb` (immutable JSONB)
- `source` (e.g., “ANL module”)
Constraint:
- MUST be immutable once created.

### 4.4 Ops Engine entities (minimum binding fields)

#### 4.4.1 indicators
Required:
- `id`
- `org_id`, `project_id`
- `toc_version_id`
- `toc_node_id` (MUST reference outcome/output nodes; activity allowed only if explicitly enabled)
- `indicator_type` enum: `performance | sentinel`
- `definition`, `unit`, `disaggregation` (as applicable)
- `baseline`, `target` (optional but recommended)
Constraints:
- If a causal edge requires sentinel, sentinel_indicator_id MUST reference an indicator of type `sentinel`.

#### 4.4.2 measurements
Required:
- `id`
- `org_id`, `project_id`
- `indicator_id`
- `toc_version_id` (must match the indicator’s toc_version_id)
- `period_start`, `period_end` (or standard period_id)
- `value`
- `source` (form/import)
- `import_batch_id` (nullable)
Constraints:
- Version binding MUST be consistent (hard validation)

#### 4.4.3 evidence
Required:
- `id`
- `org_id`, `project_id`
- `toc_version_id`
- `toc_node_id` (optional but preferred)
- `evidence_type` enum: `story | photo | document | observation | other`
- `sensitivity_level` enum: `internal | restricted | community_safe`
- `content` (text) and/or `file_ref`
Constraints:
- Exports MUST filter evidence by safety level.

#### 4.4.4 decisions (learning)
Required:
- `id`
- `org_id`, `project_id`
- `toc_version_id` (the version the decision is referencing)
- `decision_text`
- `rationale`
- `evidence_links[]` (or join table)
- `decision_outcome` enum: `no_change | adapt_strategy | adapt_implementation`
Constraints:
- Decisions are append-only.

### 4.5 Reporting manifest
**RPT-01 (MUST): report_manifests**
Required:
- `id`
- `org_id`, `project_id`
- `toc_version_id`
- `analysis_snapshot_id`
- `time_window`
- `export_type` enum: `donor_pack | community_pack | internal_pack | matrix_csv | toc_pdf`
- `config_json`
- `hash` (of exported artifact contents)
Constraint:
- Re-running export with same manifest inputs MUST reproduce same hash (deterministic export).

---

## 5) Strategy Engine (Module 02) — deterministic behavior

### 5.1 Tri-state UX modes (single model, three views)
**TOC-UX-01 (MUST): Wizard, Graph, and Matrix are synchronized views of the same toc_version.**

#### 5.1.1 Wizard mode (“Interview, don’t draw”)
Wizard MUST:
- create nodes in correct hierarchy
- guide users from goal → outcomes → outputs → activities
- enforce **Friction Bump** for multi-parenting:

**TOC-UX-02 (MUST): “Add New” vs “Link Existing”**
- **Add New**: creates a new node and sets its `primary_parent_id`
- **Link Existing**: does not create a node; it creates a `toc_edges.edge_kind=secondary_link` and triggers ghost-row projection

Wizard MUST NOT allow drag-and-drop to create secondary relationships.

**Tests:** TOC-UX-02a (positive), TOC-UX-02b (negative)

#### 5.1.2 Graph mode (expert)
Graph MUST:
- show the causal DAG (causal edges)
- show secondary links distinctly (chain icon / cross-reference)
- show feedback edges as annotations (not structural)
- show “constraints/brick walls” if ANL flags a barrier affecting a node/edge

#### 5.1.3 Matrix mode (compliance)
Matrix MUST:
- render a 4x4-ish donor-friendly grid using the projection contract
- include ghost rows for secondary links without duplicating node records
- provide reconciliation footnotes for shared nodes

**TOC-MTX-01 (MUST): Matrix is projection only.**
Users MUST NOT “edit the matrix structure” directly in a way that violates primary-parent rules.
Any edits to content must write back to the underlying node record.

### 5.2 Multi-parenting: deterministic rules
**TOC-MP-01 (MUST): Primary Parent Rule**
Every non-goal node MUST have exactly one `primary_parent_id`.

**TOC-MP-02 (MUST): Secondary links never change primary placement**
Secondary links create ghost rows; they never replace `primary_parent_id`.

**TOC-MP-03 (MUST): Rehome is explicit**
Changing `primary_parent_id` (rehome) is only allowed via explicit action:
- requires confirmation
- requires recomputation of path keys
- MUST log an audit event
- MUST be blocked if it would create orphans or type violations

### 5.3 Smart Edges
**TOC-EDGE-01 (MUST): Causal edges carry theory**
Every `edge_kind=causal` MUST store:
- mechanism (why A causes B)
- confidence
- assumptions (at least one for critical edges)
- sentinel indicator if low-confidence or high-risk

**TOC-EDGE-02 (MUST): Feedback edges**
Edges marked `edge_kind=feedback` are allowed but:
- MUST NOT be used for matrix projection
- MUST NOT participate in DAG publish validation
- MUST be visually distinct

### 5.4 Projection algorithm (deterministic)
**TOC-PROJ-01 (MUST): Primary path key generation**
On draft save (or publish-precheck), compute `primary_path_key` for each node:
- Goal: `[goal_id]`
- Child: `parent.primary_path_key + [child_id]`

**TOC-PROJ-02 (MUST): Ghost row generation**
For each `secondary_link`:
- derive a `ghost_path_key` that places the existing node under the secondary parent’s primary path
- store ghost placement in `ghost_path_keys[]` or a derived projection table:
  - `toc_projections(toc_version_id, node_id, path_key, is_ghost, source_edge_id)`

**TOC-PROJ-03 (MUST): Content is not duplicated**
Ghost rows reference the same `toc_nodes.id`; they never clone nodes.

**TOC-PROJ-04 (MUST): Deterministic ordering**
Matrix row ordering MUST be stable:
- Sort by `path_key` (lexicographic by UUID sequence or by explicit `order_index` if provided)
- If a UI allows manual ordering, it MUST write `order_index` fields explicitly and deterministically.

### 5.5 Publish lifecycle (copy-on-write + snapshot binding)
**TOC-PUB-01 (MUST): Publish is a transaction**
Publish MUST be atomic:
1) Run Gate A validators (hard fail on any MUST)
2) Create analysis snapshot and bind it
3) Mark toc_version as published + set published_at
4) Spawn next draft as a deep copy (source_version_id = published version)

**TOC-PUB-02 (MUST): Immutability**
After publish:
- all writes to that toc_version MUST be rejected (DB-level protection)
- any edit occurs only on the new draft

---

## 6) Gate A (publish gate) — rule catalog (hard blocks)

Gate A MUST run on every publish attempt.

### 6.1 Gate A rule format
Each rule has:
- ID
- MUST/SHOULD
- Failure code (stable)
- Enforcement (DB / server / UI)
- Required test

### 6.2 Gate A MUST rules (baseline)
- **GA-01 (MUST) [GA_ERR_GOAL_COUNT]**: Exactly 1 goal node exists.
- **GA-02 (MUST) [GA_ERR_ORPHANS]**: No orphan nodes (every non-goal has primary_parent_id).
- **GA-03 (MUST) [GA_ERR_TYPE_CHAIN]**: Node types respect hierarchy (goal→outcome→output→activity).
- **GA-04 (MUST) [GA_ERR_CAUSAL_CYCLE]**: The causal graph is acyclic (feedback edges excluded).
- **GA-05 (MUST) [GA_ERR_DUP_EDGE]**: No duplicate edges per uniqueness constraint.
- **GA-06 (MUST) [GA_ERR_EDGE_MECH]**: Every causal edge has a mechanism description.
- **GA-07 (MUST) [GA_ERR_SENTINEL]**: Any causal edge with (confidence=low OR risk=high_risk) MUST have a sentinel indicator linked.
- **GA-08 (MUST) [GA_ERR_RLS_BASELINE]**: RLS baseline must be enabled for all required tables (publish refuses if DB lint fails or required policies missing).

### 6.3 Gate A SHOULD rules (publish allowed but flagged)
- **GA-S01 (SHOULD) [GA_WARN_OUTCOME_COVERAGE]**: Each Outcome SHOULD have ≥1 performance indicator OR an explicit “coverage exception record” (see 6.4).
- **GA-S02 (SHOULD) [GA_WARN_ASSUMPTIONS]**: Each causal edge SHOULD have at least one assumption record.

### 6.4 Coverage exceptions (controlled, auditable)
**GA-EX-01 (MUST if used): coverage_exception record**
If publishing with an uncovered outcome (GA-S01), the system MUST create a record:
- outcome_node_id
- rationale
- mitigation_plan
- due_date
- owner_user_id
This MUST appear in the export manifest and internal QA checklist.

---

## 7) Cross-module binding contracts (Strategy ↔ Ops ↔ Reporting)

### 7.1 Version binding
**BIND-01 (MUST): Every ops record is bound to a toc_version_id.**  
Indicators, measurements, evidence, decisions MUST carry toc_version_id.

**BIND-02 (MUST): No cross-version mismatches**
- A measurement toc_version_id MUST equal its indicator toc_version_id.
- Linking evidence to a node MUST match toc_version_id.

### 7.2 Decisions trigger copy-on-write intent
**BIND-03 (SHOULD): Decision-driven adaptation workflow**
If a decision outcome is `adapt_strategy`, the UI SHOULD guide the user to the current draft and propose edits, but must not mutate published versions.

### 7.3 Snapshot-bound reporting
**RPT-02 (MUST): All exports are snapshot-bound**
Any export MUST specify:
- org_id, project_id
- toc_version_id (published)
- linked_analysis_snapshot_id
- time window
and MUST store a report_manifest with a reproducibility hash.

---

## 8) Security & privacy model (Invisible Wall + response silence)

### 8.1 Tenant isolation
**SEC-03 (MUST): Invisible Wall**
RLS MUST enforce that a user in Org A cannot infer existence of Org B.

**SEC-04 (MUST): Response silence**
For unauthorized access attempts:
- return **404** or **0 rows**
- MUST NOT return 403/500 that reveal existence

### 8.2 Stop-ship negative tests
**SEC-TEST-01 (MUST): Cross-tenant read returns 0 rows**
Attempt to fetch a project from another org must yield 0 rows / not found.

**SEC-TEST-02 (MUST): Cross-tenant write is rejected silently**
Attempt insert/update with wrong org_id must fail (no leak).

**SEC-TEST-03 (MUST): No service role key in client bundle**
CI MUST scan build artifacts and fail if service keys are present.

### 8.3 Data safety
**SEC-PII-01 (MUST): Export whitelist**
Community-safe exports MUST contain only whitelisted fields and evidence labeled community_safe.

---

## 9) Offline + low-bandwidth rules (idempotent, safe imports)

### 9.1 Idempotent imports
**OFF-01 (MUST): import_batch_id**
Bulk imports MUST supply import_batch_id and stable row keys.
Re-importing the same batch MUST NOT duplicate data.

### 9.2 Row-level error contracts
**OFF-02 (MUST): Partial success**
Bulk import responses MUST return row-by-row status:
- success rows
- failed rows with machine-readable error codes + human messages

### 9.3 Draft-first safety
**OFF-03 (SHOULD): Local queue**
Wizard edits SHOULD support local batching and replay on reconnection.

---

## 10) Analytics & reporting: Contribution Mode only

### 10.1 Contribution mode
**AN-01 (MUST): Reject weighted allocation**
Weighted allocation (% splitting) is **not permitted** in v0.1 baseline.

**AN-02 (MUST): De-duplication by GUID**
Portfolio totals MUST deduplicate shared nodes/interventions using unique node IDs (GUIDs) to avoid double counting.

**AN-03 (MUST): Reconciliation footnotes**
Exports MUST generate footnotes identifying shared nodes and describing de-dup behavior.

---

## 11) Testing, gates, and proof packs (Codex execution contract)

### 11.1 Definition of Done (per Gate PR)
**DOD-01 (MUST): One Gate = one PR**
Each Gate MUST ship with:
- lint pass
- build pass
- unit tests pass
- RLS/security tests pass
- (if relevant) E2E pass
- proof pack attached (logs + manifest + screenshots where required)

### 11.2 Proof pack minimums (for Slice S0)
- Proof of Gate A pass (validator output or DB checks)
- Proof that published version is immutable (write attempt fails)
- Proof that new draft is created (source_version_id lineage)
- Proof of analysis snapshot binding (linked_analysis_snapshot_id set)
- Proof of export manifest + reproducibility hash
- Proof of SEC stop-ship tests passing

---

## Appendix A) Rule index (quick reference)
- ARCH-* Option C + projection contract
- TOC-* Strategy engine UX, edges, publish, projection
- GA-* Gate A publish rules
- SEC-* Security and response-silence
- OFF-* Offline/import integrity
- AN-* Analytics contribution mode
- DOD-* Gate proof requirements

---

## Appendix B) Minimum traceability skeleton (v0.1)
| Feature/Rule | Spec Rule IDs | Primary Entities | Enforcement | Tests |
|---|---|---|---|---|
| Draft ToC create/edit | TOC-UX-01/02 | toc_versions, toc_nodes | UI + server | TOC-UX-* |
| Multi-parent ghost rows | TOC-MP-01/02, TOC-PROJ-* | toc_edges, toc_projections | server/DB | TOC-PROJ-* |
| Publish lifecycle | TOC-PUB-* | toc_versions, analysis_snapshots | transaction | GA-* + TOC-PUB-* |
| Invisible Wall | SEC-03/04 | all tables | RLS + API | SEC-TEST-* |
| Snapshot export | RPT-02, RPT-01 | report_manifests | server | RPT-TEST-* |
| Contribution mode | AN-01..03 | analytics read-model | export engine | AN-TEST-* |

---

## Appendix C) Out-of-scope for v0.1 (explicit)
- Weighted allocation / % splitting
- Multiple concurrent drafts per project (unless later decision)
- Complex indicator libraries beyond node-linked indicators
- Full offline-first syncing (beyond safe imports + basic queue)
- Advanced portfolio analytics beyond contribution-mode de-dup + footnotes
