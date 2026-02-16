# SPEC TRUTH — Roles and Access Control

This document defines the current state of role-based access control (RBAC) and tenant isolation in ESSET MEAL.

## Current Roles (DB & App)

| Role | Meaning |
| :--- | :--- |
| **owner** | The creator of the organization. Has full administrative control. |
| **admin** | Invited administrator. Has identical permissions to owner in current implementation. |
| **member** | Standard user. View-only access to most sensitive configuration. |

## Feature-Specific Permissions (TODAY)

| Feature | owner/admin | member | Note |
| :--- | :---: | :---: | :--- |
| **Workspace Members** | Manage | View-only | `is_org_admin` checked in server actions. |
| **Create Project** | Yes | Yes | Currently any member can create projects. |
| **Edit ToC Draft** | Yes | Yes | Currently any member can edit drafts. |
| **Publish ToC** | Yes | No | `is_org_admin` checked in `publishToc`. |
| **Analysis Snapshots** | Manage | Manage | Scoped strictly to project/tenant via RLS. |
| **Reporting Periods** | Manage | View-only | Creator or admin can manage. Scoped by tenant + project. |

## Out-of-Scope (Future Gates)

The following capabilities are **NOT** implemented yet:
- **Consortium / Multi-CSO Governance**: Cross-tenant data sharing or aggregate reporting.
- **Granular Project Roles**: Roles defined per-project rather than per-org.
- **Approval Workflows**: Multi-step sign-off for ToC publishing.

## Security Enforcement

- **Database**: RLS policies enforce `tenant_id` isolation for all tables.
- **Roster Privacy**: `org_memberships` SELECT policy restricts visibility:
  - Non-admins can only see their own membership row.
  - Admins/Owners can see the full roster.
- **Server Actions**: Use `public.is_org_admin(_org_id)` helper for administrative operations.
- **Middleware/Layout**: Ensures user is signed in and has an active tenant context.
