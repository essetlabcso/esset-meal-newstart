# ADR-0004: Wizard-First/Graph-First Tri-Mode UX

## Status
Accepted

## Context
Users have varying levels of technical proficiency and differing needs (linear creation vs. complex mapping).

## Decision
Implement a **Tri-Mode UX** strategy:
1. **Wizard-First:** Simplified step-by-step creation for new users.
2. **Graph-First:** Advanced interactive mapping for complex ToCs.
3. **Matrix-First (Audit):** Structured list-view for validation and bulk updates.

## Rationale
Supports the "Digital Simplicity" and "Co-Creation" values by meeting users where their skills and contexts are.

## Implications
- Application must support consistent data synchronization across all three modes.
- UI components must be modular and reusable in different layout contexts.

## Spec Determinism
Wireframes and UI specs must define behaviors for all three modes.
