# P0 Reporting and Exports

Purpose: make snapshot-bound, audience-safe reporting non-negotiable and implementable across internal, donor, and community outputs.

Reference source of truth: [Rules of Engagement](../00_RULES_OF_ENGAGEMENT.md), [Specification Canonical Map](../01_SPEC_CANONICAL_MAP.md), [Architecture Master](../02_ARCHITECTURE_MASTER.md), [Domain Map](./DOMAIN_MAP.md), [P0 Roles and Permissions](./P0_ROLES_PERMISSIONS.md), [P0 Evidence Sensitivity and Visibility](./P0_EVIDENCE_VISIBILITY.md), and [P0 Strategy-to-MEAL Binding](./P0_STRATEGY_MEAL_BINDING.md).

## Report Types (P0)
- Internal (ops/management): operational performance tracking, delivery follow-up, and management review.
- Donor: formal project progress packages aligned to donor reporting requirements.
- Community-safe: public-facing summaries with aggregated/de-identified content only.

## Snapshot Context (P0)
Minimum metadata required for every generated report/export:
- ToC version ID (single immutable version).
- Time window/reporting period.
- Config hash (filters, disaggregation choices, and currency/units where applicable).
- Generated-by and generated-at.

## Generation Rules (P0)
- Reports must be generated from an explicit snapshot context; no unbounded "current state" exports.
- A single snapshot must not mix ToC versions.
- Report figures must be traceable to indicator, measurement, evidence, and decision links (high-level traceability rule).
- Re-generation using the same snapshot metadata must produce materially identical outputs.

## Completeness and Sanity Checks (Before Finalize)
- Required indicators for the selected scope are present.
- Required baseline and target values are present for reportable indicators.
- Required disaggregation fields are present and valid.
- Reporting period coverage is complete (no unaccounted required intervals).
- Measurements included in the report are bound to the selected ToC version context.
- Any blocking data-quality exceptions are resolved or explicitly annotated.

## Approval Trail Rules
Role authority is defined in [P0 Roles and Permissions](./P0_ROLES_PERMISSIONS.md).

- Internal exports: approvable by authorized project roles.
- Donor exports: require explicit approval by authorized Org Owner/Admin or delegated policy role.
- Community-safe exports: require safeguarding/privacy-aware approval before publication.

Every approval trail must record:
- Report/export artifact ID.
- Snapshot metadata reference.
- Approver role and identity context.
- Approval timestamp and decision (approved/rejected/request changes).
- Notes on exceptions, redactions, or required follow-up.

## Community-Safe Contract
Must follow [P0 Evidence Sensitivity and Visibility](./P0_EVIDENCE_VISIBILITY.md).

- Must never include raw sensitive attachments.
- Must never include identifying personal/case details.
- Must include de-identification/redaction notes when source content needed transformation.
- Must present only aggregated or de-identified content appropriate for community channels.

## Export Artifact Expectations
An export pack should include, at minimum:
- Rendered report artifact (for example PDF).
- Data appendix extract for permitted audience scope.
- Snapshot metadata manifest.
- Approval/audit summary.

Storage expectation (conceptual):
- Store export artifacts and manifests in an auditable repository scoped to org/project access controls, with retrieval by artifact ID and snapshot reference.

## Acceptance Checks (P0)
- Every report/export must include stored snapshot metadata.
- Re-running with the same snapshot metadata must be reproducible.
- A single report snapshot must not mix multiple ToC versions.
- Reports must not be generated from implicit "current state".
- Report outputs must be traceable to underlying indicator/measurement/evidence/decision links.
- Required baseline/target gaps must be flagged before finalization.
- Required disaggregation gaps must be flagged before finalization.
- Unauthorized users must not infer report/export artifact existence outside authorized scope (no existence leak).
- Donor exports must require explicit approval before release.
- Community-safe exports must require explicit approval before release.
- Community-safe outputs must never include raw sensitive attachments.
- Export packs must include both artifact content and snapshot metadata manifest.
