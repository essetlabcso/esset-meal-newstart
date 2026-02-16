# ESSET MEAL Domain Map

## Modules (Boundaries and What Belongs Here)
- **WKS - Workspace and Access:** Orgs, membership, roles, invites, active-org context. Boundary: identity and access only, no project content.
- **PRJ - Projects:** Project metadata, reporting periods, project roles/settings (aggregation defaults, safe-mode defaults).
- **ANL - Analyze:** Upstream context analysis, problem framing, assumptions, stakeholders/relationships, risk foundations. Boundary: MEAL-safe only, no case files.
- **TOC - Strategy Engine:** ToC versions (draft/published), nodes/edges, assumptions on arrows, dual-view sync (graph <-> matrix). Publish requires Gate A and copy-on-write versioning.
- **IND - MEAL Design: Indicators:** Indicator definitions, disaggregation schema, mapping indicators to ToC nodes, targets/baselines.
- **MSR - Data Capture:** Forms/submissions, offline templates, batch imports with row-level errors. Boundary: measurements and evidence references, not long narrative case histories.
- **EVD - Evidence Library:** Evidence entries (docs/media/notes), sensitivity/visibility, links to ToC/indicators/decisions.
- **LRN - Learning and Decision Logging:** Reflection sessions, decisions, action items; decisions reference evidence and what changed/why.
- **ACC - Accountability Loop:** Feedback intake (including anonymous), response notes ("You said -> we did"), community-safe publishing rules.
- **ANX - Analytics Engine:** ToC hierarchy flattening, performance fact computation, refresh log, safe portfolio rollups.
- **RPT/EXP - Reporting and Exports:** Internal, donor, and community packs. Rule: always snapshot-bound (`toc_version_id` + time window + config).
- **SEC/OPS - Cross-Cutting:** RLS/invisible walls, audit events, release gates, regression checks, drift detection.

## How Modules Connect (System Spine)
- WKS -> PRJ: org-scoped projects live inside a workspace.
- PRJ -> TOC: each project has ToC versions; ToC is the backbone.
- TOC -> IND/MSR/EVD/LRN/ACC: every operational object links to a specific ToC element and respects version binding.
- Gate A -> Publish: ToC setup pack becomes immutable reporting reference.
- ANX -> RPT/EXP: reporting uses read-model outputs and stays snapshot-bound.
- OFF (inside MSR): offline UUID discipline and idempotent imports protect low-bandwidth operations.

## Never Mix These (Drift Preventers)
- Matrix/logframe is a projection, not a separate truth store.
- Published ToC is read-only; edits happen only through a new draft version (copy-on-write).
- Exports run only from snapshot-bound contexts; no non-reproducible "current state" exports.

Reference source of truth: **ESSET_MEAL_MASTER_SPEC_FINAL_v1**.

See also: [Platform Overview](./PLATFORM_OVERVIEW.md).
