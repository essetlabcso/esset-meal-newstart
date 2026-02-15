# ADR-0006: Invisible Walls (Tenant Boundary)

## Status
Accepted

## Context
The platform is multi-tenant. Data from Organization A must never be visible to Organization B.

## Decision
Enforce **"Invisible Walls"** (Strict Tenant Boundary Isolation).
- Every query MUST filter by `tenant_id` (org_id).
- Supabase Row Level Security (RLS) is the primary enforcement mechanism.
- Application-level middleware must verify the active organization context.

## Rationale
Cross-tenant data leaks are a critical security failure and violate the "Justice & Rights" core value.

## Implications
- Any query missing a `tenant_id` filter is considered a critical security bug.
- Unauthorized access attempts must return "0 rows" (invisible) rather than "403 Forbidden" where possible.

## Spec Determinism
All tables in the DDL must have RLS enabled and a `tenant_id` column.
