# ESSET MEAL Platform - Project Intelligence for CSOs (Overview)

## Who It Is For (Primary Users)
- CSO executives: decide, prioritize, defend pivots, and demonstrate credibility to donors and boards.
- Program and project managers: keep delivery aligned while reality changes and coordinate partners.
- MEAL specialists: design and run a MEAL system that stays connected to strategy and evidence.
- Field staff and partners: capture usable data and evidence in low-bandwidth conditions.

## The Real Problems We Solve (Plain Language)
- Static Theories of Change (ToCs) that stop matching reality after the first months.
- Disconnected evidence (photos, docs, spreadsheets) that cannot answer "so what?"
- Adaptation without a trail, so changes cannot be justified later.
- Reporting that breaks because it depends on manual compilation and version drift.
- Low-bandwidth and offline constraints that cause lost data, duplicates, and confusion.

## What ESSET MEAL Is (Positioning)
ESSET MEAL is a MEAL operating system that keeps strategy -> evidence -> decisions -> reporting connected and reproducible.

It gives CSOs a place to build a living Theory of Change, link indicators and evidence, track decisions, and export reports that remain stable as projects adapt.

Reference source of truth: [Rules of Engagement](../00_RULES_OF_ENGAGEMENT.md), [Specification Canonical Map](../01_SPEC_CANONICAL_MAP.md), and [Architecture Master](../02_ARCHITECTURE_MASTER.md).

## What ESSET MEAL Is Not (Hard Boundaries)
- Not a case management IMS.
- No identifiable survivor/client case files, incident narratives, or referral case details.
- Safeguarding integration is only through aggregated, de-identified datasets with enforced safeguards.

## Core Promise (What Must Stay True)
- One strategy backbone (ToC) that everything anchors to.
- Versioned time-travel: published strategy is immutable; changes happen via a new draft (copy-on-write).
- Snapshot-bound reporting: every report/export is reproducible as-of a specific strategy version, period, and configuration.

## How It Works at a Glance (Option C)
- Strategy Engine (graph write model): versioned ToC with nodes, edges, and assumptions.
- MEAL Ops Engine (relational write model): indicators, measurements, evidence, learning, and accountability.
- Analytics and Reporting Engine (read model): fast rollups and reproducible reporting layers.

## Minimum Workflows (P0 Pilot-Ready)
- Workspace -> Project -> ToC draft (graph or matrix) -> assumptions -> indicators -> Gate A -> publish ToC Setup Pack.
- Monitoring and evidence capture (quantitative plus evidence library).
- Reflection -> decision -> action (learning loop).
- Feedback -> response note -> community-safe outputs (accountability loop).
- Reporting and exports (internal, donor, community) plus time-travel snapshots.

## Trust, Safety, and Invisible Walls
Org and project isolation are non-negotiable: RLS-first, silent-by-default, and no existence leaks.

See also: [Domain Map](./DOMAIN_MAP.md).

