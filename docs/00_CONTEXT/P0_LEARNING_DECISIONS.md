# P0 Learning and Decision Log

Purpose: lock the adaptation trail into a deterministic contract so reflection, decisions, actions, and strategy changes remain traceable and reproducible.

Reference source of truth: [Rules of Engagement](../00_RULES_OF_ENGAGEMENT.md), [Specification Canonical Map](../01_SPEC_CANONICAL_MAP.md), [Architecture Master](../02_ARCHITECTURE_MASTER.md), [Domain Map](./DOMAIN_MAP.md), [P0 Workflows](./P0_WORKFLOWS.md), [P0 Strategy-to-MEAL Binding](./P0_STRATEGY_MEAL_BINDING.md), and [P0 Evidence Sensitivity and Visibility](./P0_EVIDENCE_VISIBILITY.md).

## Core Objects (Conceptual)
- Reflection Session: time-bound review event for a project and ToC scope.
- Decision: explicit choice with rationale, evidence links, and status.
- Action Item: assigned follow-up task created from a decision.
- Adaptation Trigger: condition that prompts reconsideration (indicator drift, failed assumption, contextual change, safeguarding signal).
- Outcome of Decision: observed result status after action execution (improved/no change/worsened/deferred).

## Decision Quality Minimums (P0)
Every decision record must include:
- Evidence link(s) to supporting measurements/evidence artifacts.
- Rationale in plain language: what changed and why.
- Scope reference: project and relevant ToC element(s).
- Decision owner (accountable person/role).
- Due date or review date.
- Status (`proposed`, `approved`, `in_progress`, `completed`, `deferred`, or `rejected`).

## Adaptation Rules (P0)
- Decisions that change strategy must not edit the published ToC.
- A strategy-changing decision must open a new ToC draft (copy-on-write) and reference the triggering decision ID.
- The new draft must preserve historical links to prior published versions and the originating reflection context.
- Non-strategy decisions may proceed as action items without creating a new ToC draft.

## Accountability Integration (Community-Safe)
- Decisions may be referenced in community-safe outputs as summarized, non-identifying statements.
- Community-safe outputs may include: issue theme, action taken, current status, and high-level rationale.
- Community-safe outputs must not expose raw sensitive evidence, personal identifiers, or confidential operational details.
- If a decision references sensitive evidence, public output must point to de-identified summary text only.

## Deterministic Logging Rules
- Reflection sessions, decisions, and action items are append-first records.
- Historical decision content is immutable; updates occur by status transition and linked update notes, not overwrite.
- Every decision transition must carry audit context (who changed what, when).
- Action item completion must update decision outcome state or review checkpoint.

## Acceptance Checks (P0)
- Every reflection session must be linked to project and period context.
- Every approved decision must include at least one evidence link.
- Every approved decision must include rationale (what changed and why).
- Every decision must include owner, due/review date, and status.
- Historical decision log entries must remain immutable after creation.
- Status changes must be auditable with actor and timestamp.
- A strategy-changing decision must create or reference a new copy-on-write ToC draft.
- Published ToC versions must never be edited directly from a decision action.
- Every action item must reference a decision ID.
- Decision outcomes must be recordable and queryable for later review.
- Community-safe outputs must reference decisions without exposing sensitive evidence.
- Decision records must remain compatible with snapshot-bound reporting contexts.
