# UX Canon (v0.1)

## Skill Compliance Checklist
- [x] Consulted `toc-graph-engine` for Wizard vs Graph interaction rules.
- [x] Consulted `spec-compliance-auditor` for hierarchy alignment.

---

## A) UX Non-Negotiables
Strategy creation is **Wizard-first**. Visualization is **Graph-first**. Users are never presented with a blank canvas without a structured starting point.
**Governing ADRs:** ADR-0004.

## B) Personas + Modes
- **Novice (Grassroots):** Wizard Mode (step-by-step). Constrained editing.
- **Specialist (MEAL Pro):** Guided Canvas. Advanced node/edge properties.
- **Admin (Organization):** Pro Mode. System configuration and tenant management.
**Governing ADRs:** ADR-0004.

## C) Navigation + IA
The Information Architecture is anchored around the Strategy Version.
- **Core Tabs:** ANL, Strategy, Ops, Analytics, Evidence, Learning, Admin.
**Governing ADRs:** ADR-0004.

## D) Anti-Canvas-Paralysis Patterns
- **Progressive Disclosure:** Hide complex fields until relevant.
- **Next Best Action:** UI prompts for missing links or invalid assumptions.
- **Completion Meter:** Visual feedback based on Hivos steps progress.
**Governing ADRs:** ADR-0004.

## E) Hivos 8-Step UX Flow Mapping
1. **Steps 1–5 (Context/Stakeholders):** Handled in the **ANL Module**.
   - **Done Criteria (Step 1-5):** Context snapshot saved; Stakeholder map populated (min 3 roles); Context narrative > 100 chars.
2. **Step 6 (Outcomes/TOC):** Handled in the **Strategy Engine**.
   - **Done Criteria (Step 6):** Minimum one Impact and one Outcome node; Logic path validated (all nodes reachable).
3. **Step 7 (Indicators/Assumptions):** Handled in the **Strategy Engine**.
4. **Step 8 (MEAL Plan):** Handled in the **Ops Engine**.
**Done Criteria:** A step is "Done" when all mandatory validation rules for that step are passed.
**Governing ADRs:** ADR-0002, ADR-0004.

## F) Defensible Adaptation UX
- **Triggers:** Change in context (ANL update) or failed assumption (Ops data) triggers a "Review Required" badge on the affected ToC node.
- **Rationale Logging:** Lightweight popover to record *why* an adaptation was made during an edit session.
**Governing ADRs:** ADR-0003, ADR-0005, ADR-0004, ADR-0002.

## I) UX Telemetry for Learning
Log feature usage and friction points to identify where users struggle with the Hivos flow. **Strict privacy:** No logging of sensitive community data; audit logs must respect tenant boundaries.
**Governing ADRs:** ADR-0006, ADR-0001.

## J) UX Open Questions (TBD) + Decision Hooks
- **Accessibility + Inclusion Baselines:** (Requires ADR) Define WCAG compliance and low-literacy icon mappings.
- **Offline/Low-bandwidth Posture:** (Requires ADR) Define local-first capture and sync-conflict resolution.
- [ ] Bulk indicator import from CSV vs manual entry (Requires ADR).
- [ ] Collaborative real-time editing (Multi-user) conflict UI (Requires ADR).
- [ ] Mobile-native capture vs PWA (Requires ADR).
