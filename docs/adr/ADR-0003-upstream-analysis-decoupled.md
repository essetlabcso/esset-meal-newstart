# ADR-0003: Upstream Analysis Decoupling

## Status
Accepted

## Context
Complex analysis logic and upstream data reporting often conflict with the performance and simplicity of the core ToC engine.

## Decision
Decouple **Upstream Analysis** from the core MEAL engine logic. Upstream reporting is an external consumer of the core engine's data products.

## Rationale
Decoupling prevents "analysis bloat" in the core ToC builder and ensures that changes to reporting requirements don't break the fundamental data model.

## Implications
- Analysis logic should be isolated in separate modules or services.
- Data exchange happens via strictly defined "Report Contracts".

## Spec Determinism
No analysis-specific fields should be added to the core `toc_nodes` or `toc_edges` tables.
