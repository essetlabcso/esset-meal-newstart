# P0 Evidence Sensitivity and Visibility

Purpose: define pilot-ready evidence handling rules so teams can capture useful evidence while protecting people, privacy, and trust.

Reference source of truth: [Rules of Engagement](../00_RULES_OF_ENGAGEMENT.md), [Specification Canonical Map](../01_SPEC_CANONICAL_MAP.md), [Architecture Master](../02_ARCHITECTURE_MASTER.md), [P0 Roles and Permissions](./P0_ROLES_PERMISSIONS.md), and [Domain Map](./DOMAIN_MAP.md).

## Evidence Types (P0)
- Document (PDF, DOCX, spreadsheet extract)
- Photo
- Video
- Audio
- Note (structured narrative note)
- External link (URL to approved source)

## Sensitivity Classes (P0)
- Standard: operational evidence safe for normal project-team use.
- Sensitive: evidence that could expose individuals, locations, sensitive program details, or safeguarding concerns if mishandled.

## Visibility Scopes (P0)
- Project-team: visible to authorized users assigned to that project.
- Org-admin: visible only to Org Owner/Admin and explicitly authorized project admins.
- External/community: only aggregated or de-identified outputs; no raw evidence artifacts.

## Role Rules: Create, View, and Link Evidence
See role definitions in [P0 Roles and Permissions](./P0_ROLES_PERMISSIONS.md).

- Org Owner / Org Admin:
  - Can view standard and sensitive evidence within authorized org/project scope.
  - Can set or override visibility/sensitivity labels where policy permits.
  - Can approve evidence use in community-safe outputs.
- Project Owner / Project Admin:
  - Can create, view, and link evidence for assigned projects.
  - Can classify evidence as standard or sensitive within project policy.
  - Can propose community-safe output packages for final approval.
- Project Contributor (PM/MEAL):
  - Can create and link evidence in assigned projects.
  - Can view sensitive evidence only when explicitly granted.
  - Can draft redaction notes for publication candidates.
- Field Contributor:
  - Can upload evidence for assigned capture pathways.
  - Can view only evidence needed for field capture tasks.
  - Cannot publish or approve evidence for external/community use.
- Viewer:
  - Read-only access to authorized, non-sensitive evidence by default.
  - No create, edit, link, approval, or export authority.

## What Must Never Be Uploaded
- Identifiable survivor/client case files.
- Incident narratives with personally identifying details.
- Referral case details or direct identifiers (full names, personal phone numbers, exact home addresses, IDs).
- Raw media containing children or at-risk individuals without approved safeguarding basis.
- Credentials, secrets, or system tokens.

## Community-Safe Output Contract

### What Can Appear
- Aggregated trends, counts, rates, and summary findings.
- De-identified quotes or synthesized learning notes.
- Redacted visuals where identifying features are removed.
- Decision rationale linked to non-identifying evidence summaries.

### What Must Never Appear
- Raw sensitive attachments (photo/video/audio/document) from internal evidence records.
- Personal identifiers, precise household/location identifiers, or case-level narratives.
- Any artifact that allows re-identification by combination of fields.

### Approval Trail Expectation
- Every community-safe output must record: approver role, approval timestamp, source evidence references, and redaction/de-identification notes.
- Approval history must be auditable and tied to the published artifact context.

## Acceptance Checks (P0)
- Evidence records must carry one sensitivity class before final save.
- Evidence records must carry one visibility scope before they can be linked to reporting outputs.
- Users must only view evidence within their authorized org/project scope.
- A user without permission must not infer hidden evidence exists (no existence leak).
- Field contributors must be able to upload assigned evidence types but must not publish community outputs.
- Viewers must not create, edit, reclassify, or approve evidence.
- Sensitive evidence must require explicit authorization to view.
- Community outputs must include only aggregated or de-identified content.
- Community outputs must never include raw sensitive attachments.
- Publication of community-safe outputs must include an approval trail.
- Evidence linked to decisions/reports must preserve source linkage context.
- Removal of a user from org/project access must immediately prevent further evidence visibility.
