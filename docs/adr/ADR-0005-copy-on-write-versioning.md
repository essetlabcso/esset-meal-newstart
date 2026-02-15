# ADR-0005: Copy-on-Write ToC Versioning

## Status
Accepted

## Context
ToC versions must be immutable once published to ensure the integrity of historical MEAL data.

## Decision
Implement a **Copy-on-Write (CoW)** versioning system. 
- All edits occur on a single "Draft" version.
- Publishing creates an immutable snapshot (Version N).
- Publishing the next version (Version N+1) clones the current "Draft" and creates a new immutable snapshot.

## Rationale
Ensures that evidence and indicators linked to Version N are never affected by later changes to the ToC structure in Version N+1.

## Implications
- Published versions are Read-Only.
- The `toc_version_id` must be tracked in all result and evidence tables.

## Spec Determinism
Database schema must include a `published_at` timestamp and a `status` (draft/published) on the `toc_versions` table.
