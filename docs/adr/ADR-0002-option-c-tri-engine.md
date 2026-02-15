# ADR-0002: Option C Tri-Engine Architecture

## Status
Accepted

## Context
The platform needs to balance flexible ToC graph modeling with structured MEAL reporting and data validation.

## Decision
Adopt **Option C (Tri-Engine Architecture)** as the non-negotiable architectural baseline.
1. **Graph Engine:** Manages the hybrid ToC model.
2. **Relational Engine:** Handles structured results and evidence.
3. **Validation Engine:** Enforces Gates A/B and health metrics.

## Rationale
Option C provides the best balance of flexibility for practitioners and rigor for analysts, supporting the "Evidence That Matters" core value.

## Implications
- All data operations must respect the boundaries of these three engines.
- Schema design must support the hybrid graph-relational model.

## Spec Determinism
Module specs MUST be audited against the `toc-graph-engine` and `gates-and-health-computation` skills.
