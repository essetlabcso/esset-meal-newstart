# P0 ToC / Strategy Engine

Purpose: define the non-negotiable ToC backbone so strategy stays versioned, auditable, and connected to all downstream MEAL operations.

Reference source of truth: [Rules of Engagement](../00_RULES_OF_ENGAGEMENT.md), [Specification Canonical Map](../01_SPEC_CANONICAL_MAP.md), [Architecture Master](../02_ARCHITECTURE_MASTER.md), [Domain Map](./DOMAIN_MAP.md), [P0 Workflows](./P0_WORKFLOWS.md), and [P0 Strategy-to-MEAL Binding](./P0_STRATEGY_MEAL_BINDING.md).

## Scope
- ToC in ESSET MEAL is a versioned strategy model with explicit draft and published states.
- Draft is the only editable state.
- Published is immutable.
- Strategy changes after publish must use copy-on-write: open a new draft from the latest published version.

## View Rule: Graph and Matrix
- Graph and matrix are two views of the same underlying ToC data.
- Graph is the visual interaction view.
- Matrix/logframe is a projection for structured review and audit.
- Neither view may create a separate truth store.

## Minimum ToC Elements (P0)
- Nodes: at minimum outcome and output elements, plus other project-defined strategy nodes as needed.
- Links (edges): directional causal relationships between nodes.
- Assumptions on links: explicit assumptions attached to the relationship, not hidden in free text.

## Gate A Publish Checklist (Blocking)
Publish must be blocked if any of the following fail:
- ToC draft has missing required core nodes/paths.
- Required node-to-node links are incomplete or invalid.
- Critical links have no assumptions recorded.
- Required indicators are not mapped to relevant ToC elements.
- Required reporting period defaults are missing.
- Validation reports blocking errors.

## Version Binding Rules
The following must carry `toc_version_id` (or equivalent version context binding):
- Indicator mappings.
- Measurements/capture records.
- Evidence links to ToC/indicator context.
- Decision references that cite strategy context.
- Report snapshot contexts and exported artifacts.

## Don't Do This
- Do not edit a published ToC directly.
- Do not publish with orphan indicators (indicators not bound to ToC elements).
- Do not keep assumptions only in narrative notes without link-level binding.
- Do not mix data from multiple ToC versions in one reporting snapshot.
- Do not maintain separate graph and matrix truth stores.

## Acceptance Checks (P0)
- A ToC draft must be editable; a published ToC must be read-only.
- Publishing must create an immutable version snapshot.
- Any post-publish strategy change must create a new copy-on-write draft.
- Graph and matrix views must resolve to the same underlying ToC records.
- Every published ToC must include required node/link structure.
- Critical links must include assumptions before publish.
- Required indicators must be bound to at least one ToC element before publish.
- Gate A blocking errors must prevent publish.
- Downstream records that depend on strategy must carry ToC version binding.
- Reporting snapshots must reference one immutable ToC version.
- Users must be able to trace strategy-linked outputs back to the correct ToC version.
- Historical published ToC versions must remain queryable and unchanged over time.
