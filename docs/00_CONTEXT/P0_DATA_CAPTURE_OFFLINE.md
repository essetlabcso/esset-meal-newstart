# P0 Data Capture, Offline, and Import

Purpose: define pilot-ready rules for reliable data capture across low-bandwidth and batch workflows without duplicates, drift, or unsafe data.

Reference source of truth: [Rules of Engagement](../00_RULES_OF_ENGAGEMENT.md), [Specification Canonical Map](../01_SPEC_CANONICAL_MAP.md), [Architecture Master](../02_ARCHITECTURE_MASTER.md), [Domain Map](./DOMAIN_MAP.md), [P0 Workflows](./P0_WORKFLOWS.md), and [P0 Evidence Sensitivity and Visibility](./P0_EVIDENCE_VISIBILITY.md).

## Capture Channels (P0)
- In-app form: direct online entry in the project context.
- Offline template: pre-structured template for delayed sync when connectivity is unstable.
- Batch import: file-based multi-row submission for periodic uploads.
- Partner submission: scoped import pathway for approved partner-provided datasets.

## Idempotency and Dedupe Rule (P0)
- Each submission row must carry a stable external UUID (`external_submission_uuid`) generated at source.
- Uniqueness scope is org + project + capture context + `external_submission_uuid`.
- Re-sync or re-import of the same UUID must update status or return the prior accepted row, but must not create a second measurement record.
- "No duplicates" means one logical capture event maps to one canonical measurement row in the target period/context, even after retries.

## Validation Rules (P0)
- Required fields must be present before acceptance (indicator, value, date/period, source, actor as required).
- Disaggregation schema must match indicator definition (allowed keys, required disaggregation dimensions, valid value types).
- Reporting period binding must be valid for the selected project period window.
- ToC version context binding must be explicit and valid at capture time (`toc_version_id` or equivalent bound context).
- Project/org context must be resolved before processing; rows without valid scope are rejected.
- Evidence links (if provided) must reference authorized evidence artifacts in the same scope.

## Row-Level Error Contract (P0)
- Import and sync responses must report row-level outcomes: accepted, rejected, or accepted-with-warning.
- Users must see per-row error reasons with actionable guidance (missing field, invalid disaggregation, bad UUID, period mismatch, unauthorized scope).
- Accepted rows are persisted immediately and appear in logs; rejected rows are not persisted as measurements.
- Safe partial acceptance is allowed: valid rows succeed even when some rows fail.
- Users can correct only failed rows and resubmit without duplicating already accepted rows.
- Reprocessing a previously accepted UUID returns a dedupe result, not a duplicate insert.

## What Not to Capture
- Do not capture case management narratives, survivor/client case files, or referral case details.
- Do not capture direct personal identifiers unless explicitly allowed by approved data policy (out of P0 default scope).
- Do not upload unsafe evidence artifacts outside sensitivity rules.

For evidence class and visibility rules, see [P0 Evidence Sensitivity and Visibility](./P0_EVIDENCE_VISIBILITY.md).

## Acceptance Checks (P0)
- Every accepted row must have a stable external UUID.
- Re-sync of the same UUID must not create duplicate measurement rows.
- Validation must run before row acceptance for required fields and schema checks.
- Rows with invalid period binding must be rejected with a row-level reason.
- Rows without valid ToC version context binding must be rejected.
- Import/sync responses must include row-level status and reason for each failed row.
- Partial success must be supported: valid rows accepted, invalid rows rejected.
- Correct-and-resubmit must only process failed rows and preserve prior accepted rows.
- Processing must create an audit trail for who submitted, when, and via which channel.
- Unauthorized users must not infer the existence of rows in other orgs/projects (no existence leak).
- Partner submissions must be limited to approved project scope and role permissions.
- Capture outputs must remain reportable under the bound project period and context.
