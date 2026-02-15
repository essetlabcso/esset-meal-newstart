# Asset Audit Register (New Start)

This register tracks assets identified during the "New Start" transition and their canonical status.

| ID | Asset Name | Category | Status | Decision / Note | Transfer Target |
|----|------------|----------|--------|-----------------|-----------------|
| **AAR-010** | Branding Kit | Branding | **KEEP** | Source available in `public/brand` and `public_brand_full.zip`. | `public/brand/`, `docs/05_BRANDING_INTEGRATION_PLAN.md` |
| **AAR-011** | Legacy Codebase | Code | **DISCARD** | Learning extraction only; not canonical. | N/A |
| **AAR-012** | Legacy docs export (`docs_full.zip`) | Documentation | **DIGEST** | Pattern library only; not canonical. | `docs/` (as reference only) |
| **AAR-013** | PRD v1.1 | Specs | **REFERENCE** | Baseline for business rules; to be replaced by New Start specs. | `docs/spec/PRD_v1_1.md` |
| **AAR-014** | DB Schema (Supabase) | Database | **DIGEST** | Extract multi-tenant + RLS patterns; re-author baseline schema in new repo. | `supabase/migrations/` |
| **AAR-015** | Brand Source Doc | Documentation | **KEEP** | Authoritative content (docs/brand/branding.md). | `docs/brand/branding.md` |

## Status Key
- **KEEP:** Maintained as part of the New Start core.
- **DISCARD:** Removed from current active development; archived.
- **DIGEST:** Information extracted and ported to new documentation.
- **REFERENCE:** Kept as background context but not authoritative.
