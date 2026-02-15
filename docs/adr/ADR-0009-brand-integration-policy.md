# ADR-0009: Brand Integration Policy

## Status
Proposed

## Context
The ESSET brand must be consistently applied across the platform to build trust and ensure a premium user experience.

## Decision
Establish a **Strict Brand Integration Policy**:
- **Canon Source:** `docs/brand/branding.md` is the absolute source of truth for brand metadata.
- **Mapping:** `docs/05_BRANDING_INTEGRATION_PLAN.md` provides the technical mapping from branding to implementation tokens.
- All UI components must use the tokens defined in the Integration Plan.
- No hardcoded hex values in CSS/components; use CSS variables.
- Logo usage must comply with the approved variants in `public/brand/`.

## Rationale
Consistency creates a professional and trustworthy environment for CSOs and community partners.

## Implications
- UI reviews will include a brand-compliance check.
- Custom styling that deviates from the Teal/Orange/Charcoal palette requires ADR approval.

## Spec Determinism
Design tokens must be initialized in `globals.css` using the project's primary colors.
