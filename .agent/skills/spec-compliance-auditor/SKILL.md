---
name: Spec Compliance Auditor
description: Pre-work verification skill that audits proposed implementation against all governing specification documents and outputs a compliance checklist before any code is written.
---

# Spec Compliance Auditor

## Purpose

This skill performs **pre-implementation compliance verification** against all governing specification documents. It MUST be invoked before beginning ANY implementation work to ensure adherence to project standards and non-negotiable rules.

## Governed By

This skill enforces compliance with:

- [`/docs/spec/00_SPEC_INDEX.md`](../../../docs/spec/00_SPEC_INDEX.md) — Specification index and conflict resolution
- [`/docs/spec/03_RULES/BUILD_RULES.md`](../../../docs/spec/03_RULES/BUILD_RULES.md) — Non-negotiable architectural constraints
- [`/docs/spec/PRD_v1_1.md`](../../../docs/spec/PRD_v1_1.md) — Product requirements
- [`/docs/spec/Field_Validation_v1_1.md`](../../../docs/spec/Field_Validation_v1_1.md) — Validation and computation rules
- [`/docs/spec/ERD_v1_1.md`](../../../docs/spec/ERD_v1_1.md) — Data model
- [`/docs/spec/DDL_v1_1.sql`](../../../docs/spec/DDL_v1_1.sql) — Database schema
- [`/docs/spec/Wireframe_v1_1.md`](../../../docs/spec/Wireframe_v1_1.md) — UI specification

## Usage

### When to Use

Invoke this skill **before** starting:
- New feature implementation
- Schema changes
- UI component development
- Validation logic updates
- Security/RLS policy changes

### Workflow

```
1. Read proposed work description
2. Identify governing spec documents
3. Load relevant spec sections
4. Check for Build Rule violations
5. Verify schema-first compliance
6. Check tenant isolation requirements
7. Output compliance checklist
8. Flag conflicts for escalation
9. Approve or BLOCK proceeding
```

## Compliance Checklist Template

When invoked, this skill MUST output the following checklist:

```markdown
## Spec Compliance Audit — [Feature/Work Name]

**Audit Date:** [ISO timestamp]  
**Audited By:** spec-compliance-auditor  
**Work Description:** [Brief summary of proposed work]

---

### Governing Specifications

- [ ] Read `/docs/spec/00_SPEC_INDEX.md`
- [ ] Read `/docs/spec/03_RULES/BUILD_RULES.md`
- [ ] Identified governing spec documents:
  - [ ] PRD: [relevant sections]
  - [ ] Field Validation: [relevant sections]
  - [ ] ERD: [relevant tables/relationships]
  - [ ] DDL: [relevant schema objects]
  - [ ] Wireframe: [relevant screens]

---

### Build Rule Compliance

| Rule | Compliant? | Notes |
|------|------------|-------|
| **Rule 1: Schema-First** | ✅/❌ | Schema exists: Yes/No. If No, BLOCKED. |
| **Rule 2: Graph-Relational ToC** | ✅/❌ | Uses hybrid model: Yes/No/N/A |
| **Rule 3: ToC Versioning** | ✅/❌ | Respects draft/published: Yes/No/N/A |
| **Rule 4: Edge+Node Assumptions** | ✅/❌ | Supports both: Yes/No/N/A |
| **Rule 5: Gate A/B Logic** | ✅/❌ | Uses exact validation pack logic: Yes/No/N/A |
| **Rule 6: Tenant Isolation** | ✅/❌ | Enforces `tenant_id` + RLS: Yes/No |

**Overall Build Rule Status:** ✅ PASS / ❌ BLOCKED

---

### Schema Verification

- [ ] Required tables exist in DDL
- [ ] Required columns exist with correct types
- [ ] Foreign key relationships defined
- [ ] Tenant isolation column present (`tenant_id`)
- [ ] RLS policies defined
- [ ] Indexes defined for performance

**Missing Schema Objects:** [List any missing tables/columns]

---

### Conflict Detection

- [ ] No conflicts detected between spec documents
- [ ] Precedence rule applied (if conflicts exist): [Document A] > [Document B]
- [ ] Conflicts requiring escalation: [List or "None"]

---

### Risk Assessment

**High Risks:**
- [Any Build Rule violations]
- [Missing schema requirements]
- [Tenant isolation gaps]

**Medium Risks:**
- [Ambiguous requirements]
- [Performance concerns]

**Low Risks:**
- [Minor UX deviations]

---

### Decision

**Status:** ✅ APPROVED TO PROCEED / ⚠️ APPROVED WITH CAUTIONS / ❌ BLOCKED

**Reason:** [Brief explanation]

**Required Actions Before Proceeding:**
1. [Action 1, if any]
2. [Action 2, if any]

**Escalation Required:** YES/NO  
**Escalation Reason:** [If YES, explain what needs user review]

---

**Audit Complete.**
```

## Implementation Instructions

### Step 1: Receive Work Request

Extract from the user request:
- Feature name
- Affected components (UI, DB, logic)
- Data entities involved
- User roles affected

### Step 2: Load Governing Specs

Read the relevant sections from:

**Always Required:**
- `/docs/spec/00_SPEC_INDEX.md` (conflict resolution rules)
- `/docs/spec/03_RULES/BUILD_RULES.md` (non-negotiables)

**Conditionally Required:**
- If DB changes → Read `DDL_v1_1.sql` and `ERD_v1_1.md`
- If validation logic → Read `Field_Validation_v1_1.md`
- If UI work → Read `Wireframe_v1_1.md`
- For all work → Skim `PRD_v1_1.md` for business context

### Step 3: Check Build Rules

For EACH of the 6 Build Rules, determine:
- **N/A:** This rule doesn't apply to the current work
- **✅ Compliant:** Work adheres to the rule
- **❌ Violation:** Work violates the rule → BLOCK

**Critical Checks:**

**Rule 1 (Schema-First):**
```typescript
if (work involves UI data binding) {
  const schemaExists = checkDDL(entityName);
  if (!schemaExists) {
    return BLOCKED("Schema must exist before UI");
  }
}
```

**Rule 6 (Tenant Isolation):**
```typescript
if (work involves data queries) {
  const hasTenantFilter = checkCode("tenant_id");
  const hasRLSPolicy = checkDDL(`POLICY on ${tableName}`);
  if (!hasTenantFilter || !hasRLSPolicy) {
    return BLOCKED("Missing tenant isolation");
  }
}
```

### Step 4: Verify Schema Alignment

If work touches database:
1. Parse `DDL_v1_1.sql` for referenced tables
2. Verify all required columns exist
3. Check foreign key constraints
4. Confirm RLS policies are defined

### Step 5: Detect Conflicts

Use conflict resolution protocol from `00_SPEC_INDEX.md`:
- Check precedence levels
- Apply domain-specific authority
- Flag Build Rule overrides

### Step 6: Output Checklist

Generate the compliance checklist using the template above. Populate ALL fields.

### Step 7: Make Decision

**APPROVED TO PROCEED:**
- All Build Rules pass or N/A
- Schema exists (if required)
- No unresolved conflicts

**APPROVED WITH CAUTIONS:**
- Minor risks identified
- User should be aware but can proceed

**BLOCKED:**
- Any Build Rule violation
- Missing schema (Rule 1)
- Unresolved spec conflicts

### Step 8: Escalate if Needed

If BLOCKED or high-risk cautions:
```typescript
notify_user({
  PathsToReview: ['/path/to/compliance-checklist.md'],
  BlockedOnUser: true,
  Message: "Spec compliance audit detected violations. Review required.",
  ShouldAutoProceed: false
});
```

## Example Usage

### Scenario 1: Adding New ToC Node Type

**User Request:** "Add a new node type: MILESTONE"

**Audit Process:**
1. Read Build Rules → Rule 2 (Graph-Relational) applies
2. Check DDL → `toc_nodes.node_type` has CHECK constraint
3. Violation: Adding new type requires DDL update first
4. **Decision:** ❌ BLOCKED until schema updated

### Scenario 2: Building Gate A Computation

**User Request:** "Implement Gate A readiness check"

**Audit Process:**
1. Read Build Rules → Rule 5 (Gate Logic) applies
2. Read Field Validation Pack → Extract exact logic
3. Schema check → `projects`, `toc_versions` tables exist
4. Compliance: Must use exact validation pack logic
5. **Decision:** ✅ APPROVED with note to reference validation pack

## Success Criteria

This skill is successful when:
- ✅ Compliance checklist is output BEFORE any code is written
- ✅ All Build Rule violations are caught and blocked
- ✅ Conflicts are detected and resolved per spec index
- ✅ User is notified of any escalations
- ✅ Implementation only proceeds after approval

## Prohibited Actions

This skill MUST NOT:
- ❌ Approve work that violates Build Rules
- ❌ Skip checklist generation
- ❌ Assume compliance without reading spec documents
- ❌ Proceed with ambiguous or conflicting requirements

## Maintenance

When spec documents are updated:
1. Update this skill to reference new versions
2. Update checklist template if new rules added
3. Re-audit any work approved under old specs
