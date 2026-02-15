---
name: Schema-First Builder
description: Enforces Build Rule 1 (Schema-First Development) by ensuring database schema exists and migrations are applied before any data-bound UI is created. Outputs compliance checklist.
---

# Schema-First Builder

## Purpose

This skill enforces **Build Rule 1: Schema-First Development** from [`/docs/spec/03_RULES/BUILD_RULES.md`](../../../docs/spec/03_RULES/BUILD_RULES.md). It ensures that no data-bound UI components are created until the corresponding database schema exists and migrations are applied.

## Governed By

- [`/docs/spec/03_RULES/BUILD_RULES.md`](../../../docs/spec/03_RULES/BUILD_RULES.md) — Rule 1 (Schema-First)
- [`/docs/spec/DDL_v1_1.sql`](../../../docs/spec/DDL_v1_1.sql) — Authoritative schema definition
- [`/docs/spec/ERD_v1_1.md`](../../../docs/spec/ERD_v1_1.md) — Conceptual data model
- [`/docs/spec/DDL_v1_1_SUPABASE_ADAPTED.md`](../../../docs/spec/DDL_v1_1_SUPABASE_ADAPTED.md) — RLS and auth adaptations

## Workflow Enforcement

### Mandatory Development Sequence

```
1. Define DDL (in /docs/spec/DDL_v1_1.sql or migration file)
     ↓
2. Apply migration to Supabase
     ↓
3. Generate TypeScript types (supabase gen types)
     ↓
4. Build UI components with typed queries
```

**Violation Example:**
```typescript
// ❌ BLOCKED: Building form before schema exists
export function NewEntityForm() {
  const [name, setName] = useState('');
  // No schema defined for 'entities' table!
}
```

**Correct Approach:**
```sql
-- 1. First: Define schema
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
```typescript
// 2. Then: Build typed UI
import { Database } from '@/types/supabase';
type Entity = Database['public']['Tables']['entities']['Row'];

export function NewEntityForm() {
  const [name, setName] = useState('');
  const { data } = await supabase.from('entities').insert({ name });
}
```

## Compliance Checklist Template

Before building any data-bound UI, output this checklist:

```markdown
## Schema-First Compliance — [Component/Feature Name]

**Date:** [ISO timestamp]  
**Skill:** schema-first-builder  
**Entity:** [Table/entity name, e.g., "toc_nodes"]

---

### 1. Schema Definition

- [ ] Schema defined in `/docs/spec/DDL_v1_1.sql` OR migration file
- [ ] Table name: `[table_name]`
- [ ] Required columns defined:
  - [ ] `id` (Primary Key)
  - [ ] `tenant_id` (Foreign Key to organizations)
  - [ ] [Column 1]
  - [ ] [Column 2]
  - [ ] ...
- [ ] Foreign key constraints defined
- [ ] Check constraints applied (if applicable)
- [ ] Indexes created for performance

**DDL Snippet:**
```sql
CREATE TABLE [table_name] (
  -- Paste relevant DDL here
);
```

---

### 2. Migration Status

**Migration File:** `/supabase/migrations/[timestamp]_[description].sql`

- [ ] Migration file created
- [ ] Migration applied to Supabase (check via Supabase dashboard or CLI)
- [ ] Migration verified (table exists in DB)

**Verification Command:**
```bash
# Run this to confirm migration status
npx supabase db diff
```

**Migration Applied?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 3. TypeScript Type Generation

- [ ] Types generated from Supabase schema
- [ ] Type file location: `/types/supabase.ts` or via auto-generation
- [ ] Type import path confirmed

**Generation Command:**
```bash
npx supabase gen types typescript --project-id [project-ref] > types/supabase.ts
```

**Type Definition Verified:**
```typescript
import { Database } from '@/types/supabase';
type [EntityName] = Database['public']['Tables']['[table_name]']['Row'];
```

**Types Generated?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 4. RLS Policy Verification

- [ ] RLS enabled on table: `ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;`
- [ ] SELECT policy defined (tenant isolation)
- [ ] INSERT policy defined (tenant isolation)
- [ ] UPDATE policy defined (tenant isolation)
- [ ] DELETE policy defined (tenant isolation)

**RLS Policies Exist?** ✅ YES / ❌ NO (BLOCKED if NO for non-scaffold UI)

---

### 5. UI Component Readiness

**Component Type:** [Form / Table / Card / Detail View]

- [ ] Schema exists (verified above)
- [ ] Types available (verified above)
- [ ] RLS policies active (verified above)
- [ ] Query logic uses typed Supabase client
- [ ] Tenant filtering applied in queries

**Component File:** `/components/[ComponentName].tsx`

**Scaffold or Production?**
- [ ] SCAFFOLD (temporary, no real data binding)
- [ ] PRODUCTION (data-bound, requires full schema)

---

### 6. Decision

**Status:** ✅ APPROVED TO BUILD UI / ❌ BLOCKED — SCHEMA MISSING

**Reason:** [Explanation]

**Required Actions Before Building UI:**
1. [e.g., "Apply migration 20260117_add_toc_nodes.sql"]
2. [e.g., "Generate TypeScript types"]
3. [e.g., "Verify RLS policies in Supabase dashboard"]

---

**Checklist Complete.**
```

## Implementation Instructions

### Step 1: Identify Data Entity

From the user request, extract:
- Entity name (e.g., "ToC Node", "Indicator", "Project")
- Expected table name (e.g., `toc_nodes`, `indicators`, `projects`)

### Step 2: Check Schema Existence

```typescript
// Pseudo-code for verification
async function verifySchema(tableName: string) {
  // 1. Search DDL_v1_1.sql for table definition
  const ddlExists = await grep_search({
    SearchPath: '/docs/spec/DDL_v1_1.sql',
    Query: `CREATE TABLE ${tableName}`,
    IsRegex: false
  });

  // 2. Check migration files
  const migrationExists = await find_by_name({
    SearchDirectory: '/supabase/migrations',
    Pattern: `*${tableName}*`,
    Extensions: ['sql']
  });

  return ddlExists.length > 0 || migrationExists.length > 0;
}
```

### Step 3: Verify Migration Applied

**Option A: Check Supabase Dashboard**
- Navigate to Table Editor
- Confirm table exists with expected columns

**Option B: Query via Supabase Client**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = '[table_name]';
```

### Step 4: Verify TypeScript Types

Check for type definition:
```typescript
import { Database } from '@/types/supabase';
type ExpectedEntity = Database['public']['Tables']['[table_name]']['Row'];
```

If types missing, instruct:
```bash
# Generate types
npx supabase gen types typescript \
  --project-id [project-ref] \
  --schema public \
  > types/supabase.ts
```

### Step 5: Verify RLS Policies

Check DDL or migration files for:
```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_select" ON [table_name]
FOR SELECT USING (tenant_id IN (
  SELECT organization_id FROM user_memberships WHERE user_id = auth.uid()
));
```

### Step 6: Output Checklist

Generate the compliance checklist template with all boxes checked or unchecked.

### Step 7: Make Decision

**✅ APPROVED TO BUILD UI:**
- Schema exists in DDL or migration
- Migration applied to Supabase
- Types generated
- RLS policies defined

**❌ BLOCKED:**
- Schema missing → MUST create DDL/migration first
- Migration not applied → MUST apply before UI work
- Types not generated → MUST generate before coding

### Step 8: Create Schema if Missing

If blocked, provide template migration:

```sql
-- /supabase/migrations/[timestamp]_create_[table_name].sql

CREATE TABLE [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Add entity-specific columns here
  name TEXT NOT NULL,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY "tenant_select" ON [table_name]
FOR SELECT USING (
  tenant_id IN (
    SELECT organization_id FROM user_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "tenant_insert" ON [table_name]
FOR INSERT WITH CHECK (
  tenant_id IN (
    SELECT organization_id FROM user_memberships WHERE user_id = auth.uid()
  )
);

-- Add indexes
CREATE INDEX idx_[table_name]_tenant ON [table_name](tenant_id);
CREATE INDEX idx_[table_name]_created_at ON [table_name](created_at DESC);
```

## Example Workflows

### Scenario 1: Building ToC Node Form (Schema Exists)

**User Request:** "Create a form to add ToC nodes"

**Audit Process:**
1. Entity: `toc_nodes`
2. Check DDL → `CREATE TABLE toc_nodes` found ✅
3. Check migration → Applied to Supabase ✅
4. Check types → `Database['public']['Tables']['toc_nodes']` exists ✅
5. Check RLS → Policies defined ✅
6. **Decision:** ✅ APPROVED TO BUILD UI

### Scenario 2: Building Indicator Tracker (Schema Missing)

**User Request:** "Create indicator tracking UI"

**Audit Process:**
1. Entity: `indicator_tracking`
2. Check DDL → NOT FOUND ❌
3. **Decision:** ❌ BLOCKED
4. **Action:** Create migration for `indicator_tracking` table
5. Output template migration
6. Notify user to apply migration first

## Integration with Other Skills

This skill works in conjunction with:
- **spec-compliance-auditor:** Calls this skill during compliance verification
- **toc-graph-engine:** Ensures ToC schema exists before graph operations
- **rls-rbac-guardian:** Verifies RLS policies are in place

## Success Criteria

This skill succeeds when:
- ✅ All UI components have corresponding schema definitions
- ✅ No data-bound code exists without migrations applied
- ✅ TypeScript types are always generated from schema
- ✅ Schema-first violations are caught and blocked

## Prohibited Actions

This skill MUST NOT:
- ❌ Approve UI development without schema verification
- ❌ Create JSONB-based "schemaless" data structures (violates Rule 1)
- ❌ Allow placeholder/mock data structures in production code
- ❌ Skip RLS policy verification

## Maintenance

When schema changes occur:
1. Update DDL in `/docs/spec/DDL_v1_1.sql` or create migration
2. Apply migration to Supabase
3. Regenerate TypeScript types
4. Re-run this skill's checklist for affected UI components
