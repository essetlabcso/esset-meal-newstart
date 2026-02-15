# ADR-0010: Agent Skills Curation & Use

## Status
Proposed

## Context
AI agents (like Antigravity) need structured guidance to perform complex tasks within the ESSET MEAL codebase.

## Decision
Standardize **Agent Skills Curation**:
- Skills are maintained in `.agent/skills/`.
- Each skill MUST have a `SKILL.md` defining its governance and compliance rules.
- Agents MUST consult relevant skills before performing data-bound or architectural changes.

## Rationale
Ensures that autonomous agents adhere to the project's high standards and non-negotiable rules.

## Implications
- New features may require the creation of new specialized skills.
- Existing skills must be audited for alignment with the New Start.

## Spec Determinism
The `docs/02_AGENT_SKILLS_INDEX.md` provides the authoritative mapping of domains to required agent skills.
