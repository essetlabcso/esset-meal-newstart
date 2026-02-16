# P0 Strategy-to-MEAL Binding

Purpose: enforce the no-disconnect rule so strategy, monitoring, evidence, decisions, and reports remain version-consistent and auditable.

Reference source of truth: [Rules of Engagement](../00_RULES_OF_ENGAGEMENT.md), [Specification Canonical Map](../01_SPEC_CANONICAL_MAP.md), [Architecture Master](../02_ARCHITECTURE_MASTER.md), [Domain Map](./DOMAIN_MAP.md), [P0 Workflows](./P0_WORKFLOWS.md), and [P0 Data Capture, Offline, and Import](./P0_DATA_CAPTURE_OFFLINE.md).

## Binding Objects (Conceptual)
- ToC element (node/edge)
- Indicator
- Measurement method/tool
- Disaggregation schema
- Baseline/target
- Evidence link
- Decision link
- Report snapshot context

## P0 Binding Rules
- Indicators must bind to at least one ToC element in the published ToC version.
- Every measurement must bind to an indicator, reporting period, and ToC context (`toc_version_id` or equivalent bound version context).
- Disaggregation schema must be defined at indicator level and enforced during capture/import.
- Baseline and target must be defined at indicator level before indicator is considered report-ready.
- Method/tool definition must exist for each indicator (how measured, source channel, frequency, and responsible role).
- Evidence may link to measurements and/or decisions, but links must remain scope-safe (authorized org/project visibility).
- A decision that changes strategy must open a new ToC draft (copy-on-write), never edit the published version.
- Reporting and export must be snapshot-bound to one ToC version plus explicit period/config context.
- Matrix/logframe remains a projection of the same bound objects, not a separate source of truth.

## Minimum Metadata Per Item

### Indicator (must include)
- Indicator ID and title.
- Bound ToC element reference(s).
- Disaggregation schema definition.
- Baseline value and date/source.
- Target value and target period.
- Method/tool definition (collection method, frequency, owner).
- Active status and effective version context.

### Measurement (must include)
- Measurement ID (or stable external UUID from source).
- Indicator reference.
- Reporting period/date.
- Value and disaggregation payload.
- ToC version context binding.
- Capture channel/source and submitter context.

### Evidence (must include)
- Evidence ID and type.
- Sensitivity class and visibility scope.
- Link to measurement and/or decision (and optional ToC/indicator context).
- Source timestamp and uploader/owner context.

### Decision (must include)
- Decision ID and timestamp.
- Linked evidence reference(s).
- Linked ToC element/indicator context.
- Rationale (what changed and why).
- Action owner and due date.
- Strategy-change flag (if true, new draft ToC reference required).

## Acceptance Checks (P0)
- Every published indicator must have at least one valid ToC binding.
- An indicator without disaggregation schema must not be treated as capture-ready.
- An indicator without baseline and target must not be treated as report-ready.
- Every accepted measurement must include indicator, period, and version-bound ToC context.
- Measurements with invalid binding context must be rejected before reporting.
- Evidence links must resolve only within authorized org/project scope.
- A decision that changes strategy must create or reference a new draft ToC version.
- Published ToC versions must remain immutable after publish.
- Report generation must use a single snapshot context (single ToC version).
- A report must not mix measurements from incompatible ToC versions in one snapshot.
- Logframe/matrix views must reflect the same underlying bound objects as graph views.
- Users must be able to trace report figures back to indicator, measurement, evidence, and decision links.
