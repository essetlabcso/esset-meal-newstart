# ADR-0007: Canon and ADR Governance

## Status
Accepted

## Context
The repository needs a clear mechanism for managing the "New Start" specifications and architectural evolution.

## Decision
Establish a **Canon + ADR Governance** model.
- The `docs/01_SPEC_CANONICAL_MAP.md` is the root of truth.
- Architecture Decision Records (ADRs) are used to propose and approve changes to the canon.
- Module specs (PRD, Technical Specs) are derived from and must comply with ADRs.

## Rationale
Prevents documentation drift and ensures that all developers and agents are working from the same authorized baseline.

## Implications
- Implementation work cannot start until an ADR or Spec exists.
- The `ADR_TEMPLATE.md` must be followed for all new decisions.

## Spec Determinism
The `docs/01_DECISION_REGISTER.md` must be kept in sync with the `docs/adr/` folder.
