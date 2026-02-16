# P0 Workflows

Purpose: define pilot-ready end-to-end flows, scope limits, and acceptance checks for the core platform behaviors.

Reference source of truth: [Rules of Engagement](../00_RULES_OF_ENGAGEMENT.md), [Specification Canonical Map](../01_SPEC_CANONICAL_MAP.md), [Architecture Master](../02_ARCHITECTURE_MASTER.md), [Platform Overview](./PLATFORM_OVERVIEW.md), and [Domain Map](./DOMAIN_MAP.md).

## 1) ToC Setup Pack Publish (Gate A)

Who starts it: PM or MEAL specialist.

Entry condition:
- Workspace and project exist.
- User has permission to edit strategy draft.

Steps:
- Create or open a ToC draft version for the project.
- Add outcome/output nodes and directional links.
- Attach assumptions to relevant links.
- Map initial indicators to ToC nodes.
- Fill required project reporting window defaults.
- Run Gate A validation checks.
- Resolve validation gaps.
- Publish the ToC Setup Pack.

What gets created/updated (with version binding):
- Creates `toc_version` (draft -> published).
- Creates/updates ToC nodes, edges, assumptions bound to the draft version.
- Creates/updates indicator mappings bound to the published `toc_version_id`.

Definition of Done:
- ToC version is `published` and immutable.
- Gate A checks pass with no blocking errors.
- Indicator mappings are complete for required nodes.
- Published `toc_version_id` is available for downstream ops/reporting.

Don’t do this:
- Don’t edit a published ToC directly.
- Don’t publish without assumptions on critical links.
- Don’t leave indicators unbound to ToC elements.

## 2) Monitoring + Evidence Capture

Who starts it: Field staff, PM, or MEAL specialist.

Entry condition:
- A published ToC exists.
- Indicator definitions and capture template are available.

Steps:
- Select project, reporting period, and bound ToC version context.
- Capture quantitative measurements (form, offline template, or batch import).
- Attach evidence references (file/media/note) to related measurements.
- Validate required fields and disaggregation schema.
- Submit or sync (idempotent import for offline/batch paths).
- Review row-level import errors and correct failed rows.
- Confirm accepted records appear in measurement logs.

What gets created/updated (with version binding):
- Creates measurement records bound to `indicator_id` and reporting period.
- Creates evidence library entries with visibility/sensitivity metadata.
- Creates links from measurements/evidence to ToC elements via current `toc_version_id` context.

Definition of Done:
- All required measurements are accepted with zero unresolved blocking errors.
- Evidence links resolve and respect visibility controls.
- Submission/sync produces no duplicate records for the same external UUID.
- Captured records are queryable for analytics refresh.

Don’t do this:
- Don’t store case narratives or identifiable survivor/client records.
- Don’t upload evidence without sensitivity/visibility classification.
- Don’t import without stable UUIDs for offline/batch submissions.

## 3) Reflection -> Decision -> Action (Learning Loop)

Who starts it: PM or MEAL specialist, with executive participation as needed.

Entry condition:
- Latest monitoring data and evidence are available.
- Reflection session scope and participants are set.

Steps:
- Open reflection session for a specific period and ToC scope.
- Review indicator trends and linked evidence.
- Record interpretation of what changed and why.
- Propose one or more decisions.
- Link each decision to supporting evidence.
- Create action items with owner and due date.
- Mark decision status and publish session notes.

What gets created/updated (with version binding):
- Creates reflection session record.
- Creates decision log entries linked to evidence and ToC elements.
- Creates action items linked to decision IDs.
- If strategic change is required, opens new ToC draft version (copy-on-write), not an edit to published version.

Definition of Done:
- Every decision includes evidence links and rationale.
- Every accepted decision has at least one actionable follow-up.
- Decision log is time-stamped and attributable.
- Any strategy change request points to a new draft version ID.

Don’t do this:
- Don’t log decisions without evidence references.
- Don’t rewrite history by changing old decision records.
- Don’t treat published ToC edits as part of the learning loop.

## 4) Feedback -> Response Note -> Community-Safe Output (Accountability Loop)

Who starts it: Accountability focal point or PM.

Entry condition:
- Feedback channel is open (named or anonymous).
- Safe-output rules are configured.

Steps:
- Intake feedback and classify theme/severity/source type.
- Triage and assign owner for response drafting.
- Link relevant evidence, decisions, or actions.
- Draft response note in "You said -> we did" format.
- Apply privacy and safeguarding checks.
- Approve for community-safe publication.
- Publish output to configured audience channels.

What gets created/updated (with version binding):
- Creates feedback record (with anonymity flags where required).
- Creates response note linked to feedback and related decisions/actions.
- Creates publication artifact scoped to safe audience visibility.
- Maintains references to current ToC/period context where relevant.

Definition of Done:
- Feedback item has disposition status and owner.
- Response note is complete, approved, and published safely.
- Published output contains no identifying or unsafe details.
- Audit trail shows who approved and when.

Don’t do this:
- Don’t expose raw feedback that can identify individuals.
- Don’t publish response notes without safeguarding review.
- Don’t mix community output with internal-only operational notes.

## 5) Reporting + Exports (Snapshot-Bound)

Who starts it: Exec, PM, or MEAL specialist.

Entry condition:
- Reporting window is defined.
- Required data refresh has completed.

Steps:
- Select report type (internal, donor, community).
- Set report context: `toc_version_id`, time window, and config options.
- Run data checks for completeness and obvious anomalies.
- Generate report using analytics read model outputs.
- Review and approve content for target audience.
- Export package and record snapshot metadata.
- Store/export artifact for audit and future reproduction.

What gets created/updated (with version binding):
- Creates report context snapshot (`toc_version_id` + period + config hash).
- Creates report/export artifact linked to snapshot ID.
- Creates audit event trail for generation and approval.

Definition of Done:
- Report is reproducible from stored snapshot metadata.
- Output references a single immutable `toc_version_id`.
- Export package is audience-appropriate and approved.
- Re-run with same snapshot returns materially identical results.

Don’t do this:
- Don’t generate exports from unbounded "current state".
- Don’t mix data from multiple ToC versions in one snapshot.
- Don’t bypass approval for donor or community-facing outputs.
