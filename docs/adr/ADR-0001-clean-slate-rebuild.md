# ADR-0001: Clean Slate Rebuild

## Status
Accepted

## Context
The legacy codebase and documentation have accumulated significant drift and fragmentation. Continuing to build on the existing foundation would lead to unsustainable technical debt.

## Decision
We are initiating a **Clean Slate Rebuild**. All legacy assets, code, and specifications are moved to an "Archived" status and are no longer canonical. 

## Rationale
Starting clean allow us to enforce strict governance, PowerShell-native command standards, and the Tri-Engine architecture from the ground up without being blocked by legacy patterns.

## Implications
- Existing `docs/` and `app/` content is for reference/learning only.
- New work must strictly follow the `docs/01_SPEC_CANONICAL_MAP.md`.

## Spec Determinism
The "New Start" begins with the Foundation Docs Pack v1.
