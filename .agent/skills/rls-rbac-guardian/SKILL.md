---
name: RLS RBAC Guardian
description: Enforces Build Rule 6 (tenant boundary enforcement) by ensuring all data queries filter by tenant_id and RLS policies are correctly implemented for multi-tenant isolation and role-based access control.
---

# RLS RBAC Guardian

## Purpose

This skill enforces **Build Rule 6: Tenant Boundary Enforcement** from [`/docs/spec/03_RULES/BUILD_RULES.md`](../../../docs/spec/03_RULES/BUILD_RULES.md). It ensures that:
- All data queries enforce tenant isolation via `tenant_id` filtering
- Row Level Security (RLS) policies are correctly implemented
- Role-Based Access Control (RBAC) is enforced both at database and application layers
- No cross-tenant data leakage is possible

## Governed By

- [`/docs/spec/03_RULES/BUILD_RULES.md`](../../../docs/spec/03_RULES/BUILD_RULES.md) — Rule 6 (Tenant Isolation)
- [`/docs/spec/DDL_v1_1.sql`](../../../docs/spec/DDL_v1_1.sql) — Schema with tenant isolation columns
- [`/docs/spec/DDL_v1_1_SUPABASE_ADAPTED.md`](../../../docs/spec/DDL_v1_1_SUPABASE_ADAPTED.md) — RLS policy specifications
- [`/docs/RLS_ISOLATION_TEST.md`](../../../docs/RLS_ISOLATION_TEST.md) — Testing procedures

## Tenant Isolation Model

### Core Principle

> **Every user sees ONLY data from their active tenant. Cross-tenant access is IMPOSSIBLE.**

### Architecture Components

```
User → Active Tenant Cookie → RLS Policies + App Filters → Tenant-Scoped Data
```

**Layers of Isolation:**
1. **Database Layer:** RLS policies enforce tenant filtering at row level
2. **Application Layer:** All queries explicitly filter by `active_tenant_id`
3. **Session Layer:** Active tenant stored in secure cookie
4. **Workspace Switcher:** UI to change active tenant

## Compliance Checklist Template

Before implementing any data access logic, output:

```markdown
## RLS/RBAC Guardian Compliance — [Feature/Query Name]

**Date:** [ISO timestamp]  
**Skill:** rls-rbac-guardian  
**Affected Tables:** [List of tables accessed]

---

### 1. Schema Verification

**For EACH affected table:**

| Table Name | Has `tenant_id`? | Foreign Key to `organizations`? | RLS Enabled? |
|------------|------------------|--------------------------------|--------------|
| `[table_1]` | ✅/❌ | ✅/❌ | ✅/❌ |
| `[table_2]` | ✅/❌ | ✅/❌ | ✅/❌ |
| `[table_3]` | ✅/❌ | ✅/❌ | ✅/❌ |

**Schema Requirements:**
```sql
-- Every tenant-scoped table MUST have:
CREATE TABLE example_table (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- other columns
);

-- RLS MUST be enabled:
ALTER TABLE example_table ENABLE ROW LEVEL SECURITY;
```

**All Tables Have Tenant Isolation?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 2. RLS Policy Verification

**For EACH affected table, verify policies exist for:**

#### Table: `[table_name]`

**SELECT Policy:**
```sql
CREATE POLICY "tenant_select_[table_name]"
ON [table_name] FOR SELECT
USING (
  tenant_id IN (
    SELECT organization_id 
    FROM user_memberships 
    WHERE user_id = auth.uid()
  )
);
```
**Policy Exists?** ✅ YES / ❌ NO (BLOCKED if NO)

**INSERT Policy:**
```sql
CREATE POLICY "tenant_insert_[table_name]"
ON [table_name] FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT organization_id 
    FROM user_memberships 
    WHERE user_id = auth.uid()
  )
);
```
**Policy Exists?** ✅ YES / ❌ NO (BLOCKED if NO)

**UPDATE Policy:**
```sql
CREATE POLICY "tenant_update_[table_name]"
ON [table_name] FOR UPDATE
USING (
  tenant_id IN (
    SELECT organization_id 
    FROM user_memberships 
    WHERE user_id = auth.uid()
  )
);
```
**Policy Exists?** ✅ YES / ❌ NO (BLOCKED if NO)

**DELETE Policy:**
```sql
CREATE POLICY "tenant_delete_[table_name]"
ON [table_name] FOR DELETE
USING (
  tenant_id IN (
    SELECT organization_id 
    FROM user_memberships 
    WHERE user_id = auth.uid()
  )
);
```
**Policy Exists?** ✅ YES / ❌ NO (BLOCKED if NO)

**All RLS Policies Defined?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 3. Application-Layer Tenant Filtering

**Query Code Review:**

**File:** `[path to query file]`

**Query Pattern:**
```typescript
// ✅ CORRECT: Explicit tenant filter
const { data } = await supabase
  .from('[table_name]')
  .select()
  .eq('tenant_id', activeTenantId); // REQUIRED

// ❌ WRONG: No tenant filter
const { data } = await supabase
  .from('[table_name]')
  .select(); // CROSS-TENANT LEAK!
```

**Verification Checklist:**
- [ ] Active tenant ID retrieved from session/cookie
- [ ] Query includes `.eq('tenant_id', activeTenantId)`
- [ ] No queries bypass tenant filter
- [ ] Server actions validate tenant ownership before mutations

**All Queries Have Tenant Filter?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 4. Active Tenant Session Management

**Session Implementation:**

**Cookie Name:** `active_tenant_id`

**Flow:**
```typescript
// 1. Retrieve active tenant from cookie
const activeTenantId = cookies().get('active_tenant_id')?.value;

// 2. Validate user has membership in tenant
const { data: membership } = await supabase
  .from('user_memberships')
  .select()
  .eq('user_id', userId)
  .eq('organization_id', activeTenantId)
  .single();

// 3. If invalid, redirect to workspace selector
if (!membership) {
  redirect('/workspace/select');
}

// 4. Use in queries
const { data } = await supabase
  .from('projects')
  .select()
  .eq('tenant_id', activeTenantId);
```

**Session Management Implemented?** ✅ YES / ❌ NO (BLOCKED if NO)

**Invalid Tenant Redirect?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 5. Workspace Switcher UI

**Required Components:**

- [ ] `WorkspaceProvider` context for active tenant state
- [ ] `WorkspaceSwitcher` dropdown/UI component
- [ ] `/workspace/select` page for initial selection or errors

**Workspace Switcher Logic:**
```typescript
async function switchWorkspace(newTenantId: string) {
  // 1. Verify user has membership
  const membership = await verifyMembership(userId, newTenantId);
  if (!membership) {
    throw new Error('Access denied');
  }

  // 2. Update cookie
  cookies().set('active_tenant_id', newTenantId);

  // 3. Refresh page to reload data
  router.refresh();
}
```

**Workspace Switcher Exists?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 6. Role-Based Access Control (RBAC)

**User Roles from `user_memberships`:**
- `owner`: Full control
- `admin`: Manage projects, users
- `member`: View and edit assigned projects
- `guest`: Read-only access

**RBAC Enforcement Points:**

**Database Level:**
```sql
-- Example: Only owners can delete projects
CREATE POLICY "project_delete_owner_only"
ON projects FOR DELETE
USING (
  tenant_id IN (
    SELECT organization_id 
    FROM user_memberships 
    WHERE user_id = auth.uid() 
      AND role = 'owner'
  )
);
```

**Application Level:**
```typescript
// Check role before mutation
const { data: membership } = await supabase
  .from('user_memberships')
  .select('role')
  .eq('user_id', userId)
  .eq('organization_id', tenantId)
  .single();

if (membership.role !== 'owner' && membership.role !== 'admin') {
  throw new Error('Insufficient permissions');
}
```

**RBAC Policies Defined?** ✅ YES / ❌ NO (if applicable)

---

### 7. Cross-Tenant Leak Prevention

**Forbidden Patterns:**

**❌ WRONG: No tenant filter**
```typescript
const { data } = await supabase.from('projects').select();
// User sees ALL projects across ALL tenants!
```

**❌ WRONG: User-controllable tenant ID**
```typescript
const tenantId = req.query.tenantId; // Attacker can change this!
const { data } = await supabase
  .from('projects')
  .select()
  .eq('tenant_id', tenantId);
```

**❌ WRONG: Bypassing RLS with service role**
```typescript
const supabase = createClient(supabaseUrl, SERVICE_ROLE_KEY);
// Service role bypasses RLS! Only use for admin operations.
```

**✅ CORRECT: Session-based tenant filter**
```typescript
const activeTenantId = await getActiveTenantId(session);
const hasAccess = await verifyTenantMembership(userId, activeTenantId);
if (!hasAccess) throw new Error('Access denied');

const { data } = await supabase
  .from('projects')
  .select()
  .eq('tenant_id', activeTenantId);
```

**No Forbidden Patterns Detected?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 8. Testing Requirements

**RLS Isolation Tests (see [`/docs/RLS_ISOLATION_TEST.md`](../../../docs/RLS_ISOLATION_TEST.md)):**

- [ ] Test: User A in Tenant X cannot read Tenant Y data
- [ ] Test: User A in Tenant X cannot insert data with `tenant_id = Y`
- [ ] Test: User A in Tenant X cannot update Tenant Y data
- [ ] Test: User A in Tenant X cannot delete Tenant Y data
- [ ] Test: Switching workspaces updates visible data correctly
- [ ] Test: Invalid `active_tenant_id` redirects to `/workspace/select`

**Test File Location:** `/lib/__tests__/rls-isolation.test.ts`

**Example Test:**
```typescript
describe('RLS Tenant Isolation', () => {
  test('user cannot read cross-tenant data', async () => {
    const userA = await createUser('userA');
    const tenantX = await createTenant('Tenant X');
    const tenantY = await createTenant('Tenant Y');
    
    await addUserToTenant(userA.id, tenantX.id);
    await createProject({ tenant_id: tenantY.id, title: 'Secret Project' });

    const supabase = createClientForUser(userA.id);
    const { data } = await supabase
      .from('projects')
      .select()
      .eq('tenant_id', tenantY.id);

    expect(data).toHaveLength(0); // RLS blocks cross-tenant read
  });
});
```

**RLS Tests Passing?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 9. Security Audit Checklist

- [ ] All tables have `tenant_id` column (except auth/system tables)
- [ ] RLS enabled on all tenant-scoped tables
- [ ] All CRUD policies defined (SELECT, INSERT, UPDATE, DELETE)
- [ ] All queries include explicit `tenant_id` filter
- [ ] Active tenant retrieved from session, not user input
- [ ] Tenant membership verified before data access
- [ ] Service role client ONLY used for admin operations
- [ ] Workspace switcher validates membership before switching
- [ ] RLS isolation tests written and passing

**All Security Checks Pass?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 10. Decision

**Status:** ✅ APPROVED / ❌ BLOCKED

**Reason:** [Explanation]

**Required Actions Before Proceeding:**
1. [e.g., "Add RLS policies to `toc_nodes` table"]
2. [e.g., "Add tenant filter to all queries in projects/page.tsx"]
3. [e.g., "Write RLS isolation tests"]

---

**Checklist Complete.**
```

## Implementation Instructions

### Step 1: Verify Schema Compliance

**Check every table for:**
```typescript
async function verifyTableHasTenantIsolation(tableName: string) {
  // Check DDL for tenant_id column
  const hasTenantId = await grep_search({
    SearchPath: '/docs/spec/DDL_v1_1.sql',
    Query: `${tableName}`,
    IsRegex: false
  });

  // Verify column definition
  const hasColumn = hasTenantId.some(line => 
    line.includes('tenant_id') && line.includes('REFERENCES organizations')
  );

  return hasColumn;
}
```

### Step 2: Verify RLS Policies Exist

**Check Supabase or migration files:**
```sql
-- Query to check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = '[table_name]';
-- rowsecurity should be TRUE

-- Query to list policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = '[table_name]';
-- Should have SELECT, INSERT, UPDATE, DELETE policies
```

### Step 3: Audit Application Queries

**Scan codebase for Supabase queries:**
```typescript
// Use grep to find all .from() calls
const queries = await grep_search({
  SearchPath: '/app',
  Query: 'supabase.from\\(',
  IsRegex: true,
  Includes: ['*.ts', '*.tsx']
});

// For each query, verify .eq('tenant_id', ...) exists
queries.forEach(query => {
  const hasTenantFilter = query.includes('.eq(\'tenant_id\'');
  if (!hasTenantFilter) {
    console.warn(`VIOLATION: Missing tenant filter in ${query.file}:${query.line}`);
  }
});
```

### Step 4: Implement Active Tenant Helpers

```typescript
// lib/auth/get-active-tenant.ts

import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';

export async function getActiveTenantId(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get('active_tenant_id')?.value || null;
}

export async function verifyTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const supabase = createServerClient();
  
  const { data: membership } = await supabase
    .from('user_memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', tenantId)
    .single();

  return !!membership;
}

export async function requireActiveTenant(): Promise<string> {
  const tenantId = await getActiveTenantId();
  
  if (!tenantId) {
    redirect('/workspace/select');
  }

  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/sign-in');
  }

  const hasAccess = await verifyTenantAccess(user.id, tenantId);
  
  if (!hasAccess) {
    redirect('/workspace/select');
  }

  return tenantId;
}
```

### Step 5: Enforce in Server Actions

```typescript
// Example: Creating a project

'use server';

import { requireActiveTenant } from '@/lib/auth/get-active-tenant';

export async function createProject(formData: FormData) {
  const supabase = createServerClient();
  
  // 1. Get active tenant (validates access)
  const tenantId = await requireActiveTenant();

  // 2. Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // 3. Insert with tenant_id
  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: formData.get('title'),
      tenant_id: tenantId, // REQUIRED
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Step 6: Build Workspace Switcher

```typescript
// components/WorkspaceSwitcher.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function WorkspaceSwitcher({ 
  workspaces, 
  activeWorkspaceId 
}: { 
  workspaces: Workspace[], 
  activeWorkspaceId: string 
}) {
  const router = useRouter();

  async function switchWorkspace(workspaceId: string) {
    // Call server action to update cookie
    await switchActiveTenant(workspaceId);
    router.refresh(); // Reload data
  }

  return (
    <select 
      value={activeWorkspaceId} 
      onChange={(e) => switchWorkspace(e.target.value)}
    >
      {workspaces.map(ws => (
        <option key={ws.id} value={ws.id}>
          {ws.name}
        </option>
      ))}
    </select>
  );
}
```

### Step 7: Write RLS Isolation Tests

```typescript
// lib/__tests__/rls-isolation.test.ts

import { createClient } from '@supabase/supabase-js';

describe('RLS Tenant Isolation', () => {
  beforeAll(async () => {
    // Seed test data
  });

  test('User in Tenant A cannot read Tenant B projects', async () => {
    const userA = await createTestUser('user-a@example.com');
    const tenantA = await createTestTenant('Tenant A');
    const tenantB = await createTestTenant('Tenant B');
    
    await addUserToTenant(userA.id, tenantA.id);
    
    const projectB = await createProject({
      title: 'Secret Project',
      tenant_id: tenantB.id
    });

    // Login as User A
    const supabase = createClientAsUser(userA);

    // Try to read Tenant B project
    const { data, error } = await supabase
      .from('projects')
      .select()
      .eq('id', projectB.id)
      .single();

    expect(data).toBeNull(); // RLS blocks access
    expect(error).toBeTruthy();
  });

  test('User cannot insert data with different tenant_id', async () => {
    const userA = await createTestUser('user-a@example.com');
    const tenantA = await createTestTenant('Tenant A');
    const tenantB = await createTestTenant('Tenant B');
    
    await addUserToTenant(userA.id, tenantA.id);

    const supabase = createClientAsUser(userA);

    // Try to insert with Tenant B's ID
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: 'Malicious Project',
        tenant_id: tenantB.id // Different tenant!
      });

    expect(data).toBeNull();
    expect(error).toBeTruthy(); // RLS blocks insert
  });
});
```

## Integration with Other Skills

- **schema-first-builder:** Enforces `tenant_id` column exists before UI
- **spec-compliance-auditor:** Verifies RLS policies during pre-work audit
- **toc-graph-engine:** All ToC operations enforce tenant isolation

## Success Criteria

- ✅ All tenant-scoped tables have `tenant_id` + RLS policies
- ✅ All queries include explicit tenant filter
- ✅ Active tenant managed via session/cookie
- ✅ Workspace switcher validates membership
- ✅ RLS isolation tests pass (no cross-tenant leaks)
- ✅ RBAC enforced at DB and app layers

## Prohibited Actions

- ❌ Queries without `tenant_id` filter
- ❌ Using user-provided `tenant_id` (must come from session)
- ❌ Bypassing RLS with service role (except admin operations)
- ❌ Skipping tenant membership verification
- ❌ Allowing cross-tenant data access

## Maintenance

When adding new tables:
1. Add `tenant_id` column with foreign key
2. Enable RLS: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
3. Create SELECT, INSERT, UPDATE, DELETE policies
4. Add RLS isolation tests for new table
5. Re-run this skill's compliance checklist
