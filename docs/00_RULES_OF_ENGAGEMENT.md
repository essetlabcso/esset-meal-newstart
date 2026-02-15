# Rules of Engagement (New Start)

## 1. Clean Slate Rebuild
This repository is a **Clean Slate Rebuild**. Legacy code, documentation, and technical specifications from previous iterations are considered **archived reference only** and are NOT canonical unless explicitly imported into the current `docs/` hierarchy.

## 2. Command Line Usage
All terminal operations MUST use **PowerShell-native** commands. 
- Do NOT use `fd`, `ripgrep` (unless pre-installed and approved), or other external utilities that are not part of the standard Windows PowerShell environment.
- Use `Get-ChildItem`, `Select-String`, and other standard cmdlets.

## 3. Scope Boundaries
- **Core Engine:** Focus on the Tri-Engine architecture (Wizard-first, Graph-first, Option C).
- **Separation of Concerns:** Keep "Analysis" and "Upstream" logic decoupled from the core MEAL engine logic.
- **Spec-First:** No data-bound UI should be created before the underlying schema is defined and migrated.

## 4. Documentation Governance
- **Canonical Map:** `docs/01_SPEC_CANONICAL_MAP.md` defines the source of truth.
- **ADR Lead:** Architectural decisions MUST be documented as ADRs before implementation.
- **No Drifting:** Implementation must match the spec. If the spec is wrong, update the spec and the ADR first.

## 5. Interaction Protocol
- **Concise communication:** Keep updates brief and technical.
- **Evidence-based:** Propose changes based on established requirements in the `docs/spec` folder.
