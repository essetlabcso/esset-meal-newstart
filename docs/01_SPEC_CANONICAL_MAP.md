# Specification Canonical Map (v0.1)

## 1. Hierarchy of Authority
For the New Start, documents follow this order of precedence for conflict resolution (Tier-0):

1. **Strategic Directive + Rules of Engagement (highest authority):** `docs/00_RULES_OF_ENGAGEMENT.md`.
2. **Architecture Decision Records (ADRs):** `docs/adr/*.md`.
3. **Architecture Master + UX Canon (planned):** Future foundational specs.
4. **Approved Module Specs:** Focused functional/technical specifications.
5. **Database Migration Files (NEW repo only):** `supabase/migrations/*.sql`.
6. **Legacy Reference Assets:** `docs/spec/*` and legacy migrations.

## 2. Preventing Drift
- **Implementation must mirror Documentation:** Any deviation between code and the canonical specifications is considered a bug.
- **Spec Updates First:** To change an implementation pattern, the corresponding ADR or Spec document must be updated and approved first.
- **Reference-Only Status:** All content in `docs/spec/*` and legacy migrations are for background context and business logic extraction only; they are NOT authoritative implementation targets.
- **Agent Skill Enforcement:** Use `spec-compliance-auditor` to verify any new code against this map.

## 3. Authoritative Document Index
| Document Path | Status | Ownership |
|---------------|--------|-----------|
| `docs/00_RULES_OF_ENGAGEMENT.md` | Authoritative | Technical Lead |
| `docs/01_SPEC_CANONICAL_MAP.md` | Authoritative | Project Management |
| `docs/brand/branding.md` | Authoritative | Brand Source of Truth |
| `docs/01_DECISION_REGISTER.md` | Authoritative | Core Architects |
| `docs/adr/ADR-*.md` | Authoritative | Architecture Board |
| `docs/05_BRANDING_INTEGRATION_PLAN.md` | Authoritative | Design/UI Lead |
| `docs/spec/PRD_v1_1.md` | Reference | Business Stakeholders |
