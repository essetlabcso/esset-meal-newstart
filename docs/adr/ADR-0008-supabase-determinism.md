# ADR-0008: Supabase Determinism Policy

## Status
Proposed

## Context
As we migrate to a new production environment, schema consistency and functional determinism are critical for multi-tenant isolation.

## Decision
All Supabase database operations must be strictly **deterministic**:
- No ad-hoc SQL changes in the Supabase Dashboard.
- All schema updates MUST be applied via 14-digit timestamp migration files.
- Every function and RPC must have a specific `SEARCH_PATH` set to `public` (or appropriate schema) to prevent search path injection.

## Rationale
Prevents environment drift and ensures that migrations can be re-run reliably across development, staging, and production.

## Implications
- Any manual SQL edit is a policy violation.
- Every RPC or migration change MUST be accompanied by a corresponding check in `supabase/verify/*.sql`.
- CI/CD pipelines will enforce migration integrity.

## Spec Determinism
The `docs/runbooks/rebuild/REBUILD_DB_CLEAN_RULES.md` runbook is the enforcement guide for this ADR.
