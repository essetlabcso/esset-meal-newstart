# P0 Roles and Permissions

Purpose: define pilot-ready access intent across workspace, project, strategy, and operations while preserving privacy and auditability.

Reference source of truth: [Rules of Engagement](../00_RULES_OF_ENGAGEMENT.md), [Specification Canonical Map](../01_SPEC_CANONICAL_MAP.md), [Architecture Master](../02_ARCHITECTURE_MASTER.md), [SPEC TRUTH - Roles and Access Control](../dev/SPEC_TRUTH_ROLES_AND_ACCESS.md), and [Domain Map](./DOMAIN_MAP.md).

## Principles
- No existence leak: users must not infer that another org, project, member, or artifact exists outside their authorized scope.
- Least-privilege: each role gets only the permissions needed for its responsibilities.
- Scope separation: org-level permissions manage workspace governance; project-level permissions manage delivery and operations inside a project.
- Safe defaults: new members start with minimal access until explicitly elevated.

## Roles and Permissions (P0)

### Org Owner / Org Admin
- WKS: create/manage workspace settings, manage org roster, send/revoke invites, set active org defaults.
- PRJ: create/archive projects, assign project roles, manage reporting period configuration.
- TOC: create/edit drafts, run Gate A checks, publish ToC versions.
- MSR: view all project measurement streams; can correct rejected imports.
- EVD: view sensitive and standard evidence according to project assignment.
- LRN: create/approve decisions and action plans.
- ACC: approve community-safe response notes for publication.
- RPT: generate and approve internal/donor/community exports.

### Org Member
- WKS: view own membership; cannot manage roster or org settings.
- PRJ: access assigned projects only.
- TOC: no publish permissions by default; draft access depends on project role.
- MSR/EVD/LRN/ACC/RPT: permissions come from project role assignment.

### Project Owner / Project Admin
- WKS: no org roster management unless also org admin.
- PRJ: manage project settings, periods, and project membership assignments.
- TOC: manage drafts and submit for publish; publish only if org-level policy allows.
- MSR: manage project capture setup and data quality triage.
- EVD: set evidence visibility/sensitivity inside project policy boundaries.
- LRN: facilitate reflection sessions and finalize decisions.
- ACC: approve project-level accountability outputs before org-level release.
- RPT: generate project reports and snapshots.

### Project Contributor (PM/MEAL)
- WKS: no org admin actions.
- PRJ: view project settings; limited edits where assigned.
- TOC: edit draft structures/assumptions/indicator mappings in assigned projects.
- MSR: create and validate measurements/imports.
- EVD: upload/link evidence and set allowed sensitivity tags.
- LRN: log reflections, decisions, and actions.
- ACC: draft response notes and link supporting evidence.
- RPT: run draft/internal reports; no final donor/community approval.

### Field Contributor (Data Capture Only)
- WKS/PRJ: no admin actions.
- TOC: read-only visibility to assigned capture-relevant elements.
- MSR: submit measurements and offline sync payloads for assigned forms.
- EVD: upload field evidence only to permitted buckets/tags.
- LRN/ACC: no decision approval; may submit input notes where enabled.
- RPT: no report generation privileges.

### Viewer (Read-Only)
- WKS: view own membership context only.
- PRJ: read assigned project summaries.
- TOC: read published ToC versions; no draft edits.
- MSR/EVD: read non-sensitive records they are authorized to view.
- LRN/ACC: read approved outputs only.
- RPT: view approved report outputs; no export generation.

## Invite and Membership Rules

### Invite
- Who can invite: Org Owner/Org Admin; Project Owner/Admin may invite only within delegated project scope if enabled by org policy.
- What an invite grants: account-to-org membership plus default baseline role; project access is separate assignment.
- Invite acceptance: user joins org membership and then resolves active org context on next app entry.

### Membership and Removal
- On role change: permissions update immediately for subsequent actions.
- On removal from org: all org/project access is revoked; active sessions must lose privileged actions.
- On removal from project only: org membership may remain, but project resources become invisible.

### Active Org Context
- Definition: the selected organization/workspace context used to scope every app query and action.
- Rule: actions must execute only within active org context plus role checks; context switching must not leak cross-org identifiers.

## Hard Boundaries
- Not case management IMS: no identifiable survivor/client case files, incident narratives, or referral case details.
- Evidence sensitivity handling:
  - Sensitive evidence is visible only to explicitly authorized project/org roles.
  - Community-facing outputs must use aggregated or de-identified content only.
  - Unauthorized users must receive no data and no existence leak signal.

## Acceptance Checks (P0)
- The system must enforce least-privilege defaults for new members.
- A user must not infer the existence of a project in another org.
- A non-admin must not list full org membership rosters.
- Only authorized roles must be able to send or revoke invites.
- Removing org membership must revoke project access immediately.
- A field contributor must be able to capture data but must not publish strategy or reports.
- A viewer must not create, edit, or approve operational records.
- A published ToC must remain read-only regardless of role, except via new draft creation.
- Report/export actions must run under explicit role checks and active org context.
- Sensitive evidence must not appear in community-safe outputs.
- Users without access must receive no cross-org/project identifiers in responses.
- Role or context changes must take effect without requiring data migration.
