---
name: ToC Graph Engine
description: Enforces Build Rules 2-4 (hybrid graph-relational ToC model, versioning with draft vs published immutable snapshots, edge + node assumptions) and ensures correct graph operations.
---

# ToC Graph Engine

## Purpose

This skill enforces **Build Rules 2, 3, and 4** for Theory of Change (ToC) modeling:
- **Rule 2:** Hybrid graph-relational model (not pure tree)
- **Rule 3:** ToC versioning with draft vs. published immutable snapshots
- **Rule 4:** Assumptions can attach to both nodes and edges

## Governed By

- [`/docs/spec/03_RULES/BUILD_RULES.md`](../../../docs/spec/03_RULES/BUILD_RULES.md) — Rules 2, 3, 4
- [`/docs/spec/DDL_v1_1.sql`](../../../docs/spec/DDL_v1_1.sql) — Schema for `toc_nodes`, `toc_edges`, `toc_versions`, `toc_assumptions`
- [`/docs/spec/ERD_v1_1.md`](../../../docs/spec/ERD_v1_1.md) — ToC entity relationships
- [`/docs/spec/PRD_v1_1.md`](../../../docs/spec/PRD_v1_1.md) — ToC Builder requirements

## Core Architectural Principles

### 1. Hybrid Graph-Relational Model

**Schema Components:**

```sql
-- Relational: Nodes
CREATE TABLE toc_nodes (
  id UUID PRIMARY KEY,
  toc_version_id UUID NOT NULL REFERENCES toc_versions(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL CHECK (node_type IN ('GOAL', 'OUTCOME', 'OUTPUT', 'ACTIVITY')),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  tenant_id UUID NOT NULL REFERENCES organizations(id)
);

-- Graph: Edges
CREATE TABLE toc_edges (
  id UUID PRIMARY KEY,
  source_node_id UUID NOT NULL REFERENCES toc_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES toc_nodes(id) ON DELETE CASCADE,
  edge_type TEXT DEFAULT 'CONTRIBUTES_TO',
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  UNIQUE(source_node_id, target_node_id, edge_type)
);
```

**Why Hybrid?**
- **Graph structure** allows one OUTPUT to contribute to multiple OUTCOMEs
- **Relational storage** enables efficient querying, joins, and tenant isolation
- **Flexible causal chains** beyond strict parent-child trees

**Forbidden Patterns:**
- ❌ Adjacency list with `parent_id` (too rigid)
- ❌ JSONB nested tree structure (violates schema-first, breaks RLS)
- ❌ Materialized path (cannot represent multiple parents)

### 2. Version State Machine

```
DRAFT (mutable) → PUBLISH → PUBLISHED (immutable)
```

**States:**
- **DRAFT:** Active working version, editable
- **PUBLISHED:** Frozen snapshot, read-only

**Constraints:**
- ✅ Only ONE DRAFT version per project
- ✅ PUBLISHED versions CANNOT be edited
- ✅ Version numbers are sequential and unique per project

### 3. Assumptions on Nodes and Edges

```sql
-- Node assumptions
CREATE TABLE toc_assumptions (
  id UUID PRIMARY KEY,
  node_id UUID REFERENCES toc_nodes(id) ON DELETE CASCADE,
  assumption_text TEXT NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH'))
);

-- Edge assumptions (optional, for complex models)
CREATE TABLE toc_edge_assumptions (
  id UUID PRIMARY KEY,
  edge_id UUID REFERENCES toc_edges(id) ON DELETE CASCADE,
  assumption_text TEXT NOT NULL,
  risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH'))
);
```

## Compliance Checklist Template

Before implementing any ToC graph operations, output:

```markdown
## ToC Graph Engine Compliance — [Operation Name]

**Date:** [ISO timestamp]  
**Skill:** toc-graph-engine  
**Operation:** [e.g., "Add Node", "Create Edge", "Publish Version"]

---

### 1. Graph Model Verification

- [ ] Operation uses `toc_nodes` + `toc_edges` tables (hybrid model)
- [ ] NOT using adjacency list (`parent_id` column)
- [ ] NOT using JSONB tree structure
- [ ] Edges allow multiple parents (graph, not tree)

**Schema Pattern:** ✅ HYBRID GRAPH-RELATIONAL / ❌ OTHER (BLOCKED if OTHER)

---

### 2. Version State Validation

**Current ToC Version:**
- Version ID: `[UUID]`
- Project ID: `[UUID]`
- Status: `DRAFT` / `PUBLISHED`

**Operation Requirements:**
- [ ] If operation is CREATE/UPDATE/DELETE node → Version MUST be DRAFT
- [ ] If operation is CREATE/UPDATE/DELETE edge → Version MUST be DRAFT
- [ ] If operation is PUBLISH → Version MUST be DRAFT
- [ ] If operation is READ → Version can be DRAFT or PUBLISHED

**Can Modify Current Version?** ✅ YES (DRAFT) / ❌ NO (PUBLISHED BLOCKED)

**Version State Check:**
```sql
SELECT id, status 
FROM toc_versions 
WHERE id = :version_id;
```

**Status:** ✅ VALID / ❌ BLOCKED (cannot edit PUBLISHED version)

---

### 3. Version Constraint Verification

**For DRAFT versions:**
- [ ] Only ONE DRAFT exists per project
- [ ] Query to verify:
  ```sql
  SELECT COUNT(*) 
  FROM toc_versions 
  WHERE project_id = :project_id AND status = 'DRAFT';
  -- Result MUST be 0 or 1
  ```

**For PUBLISH operations:**
- [ ] Current version is DRAFT
- [ ] All validation gates pass (Gate A/B if required)
- [ ] Version number is next in sequence
- [ ] `published_at` timestamp will be set to NOW()

**Publishing SQL:**
```sql
UPDATE toc_versions
SET status = 'PUBLISHED',
    published_at = NOW()
WHERE id = :version_id
  AND status = 'DRAFT'
  AND project_id = :project_id;
```

**Version Constraints Valid?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 4. Node Operations

**Operation Type:** [CREATE / UPDATE / DELETE / READ]

**Node Details:**
- Node Type: [GOAL / OUTCOME / OUTPUT / ACTIVITY]
- Title: `[node title]`
- ToC Version: `[version_id]` (Status: DRAFT/PUBLISHED)

**Pre-Operation Checks:**
- [ ] Version is DRAFT (if CREATE/UPDATE/DELETE)
- [ ] Node type is valid (one of 4 types)
- [ ] Tenant isolation enforced (`tenant_id` filter)
- [ ] Metadata JSONB structure is valid (if applicable)

**Node SQL Template:**
```sql
-- CREATE
INSERT INTO toc_nodes (toc_version_id, node_type, title, tenant_id)
VALUES (:version_id, :node_type, :title, :tenant_id)
RETURNING id;

-- UPDATE
UPDATE toc_nodes
SET title = :title, metadata = :metadata
WHERE id = :node_id
  AND toc_version_id IN (SELECT id FROM toc_versions WHERE status = 'DRAFT');

-- DELETE
DELETE FROM toc_nodes
WHERE id = :node_id
  AND toc_version_id IN (SELECT id FROM toc_versions WHERE status = 'DRAFT');
```

**Node Operation Valid?** ✅ YES / ❌ NO (BLOCKED if editing PUBLISHED)

---

### 5. Edge Operations

**Operation Type:** [CREATE / UPDATE / DELETE / READ]

**Edge Details:**
- Source Node: `[source_node_id]` (Type: [GOAL/OUTCOME/OUTPUT/ACTIVITY])
- Target Node: `[target_node_id]` (Type: [GOAL/OUTCOME/OUTPUT/ACTIVITY])
- Edge Type: [CONTRIBUTES_TO / CAUSES / DEPENDS_ON]

**Graph Validity Checks:**
- [ ] Source and target nodes exist in same ToC version
- [ ] Edge direction is valid (e.g., Activity → Output, Output → Outcome)
- [ ] No circular dependencies (optional check for DAG enforcement)
- [ ] Unique constraint satisfied (source, target, edge_type)

**Edge SQL Template:**
```sql
-- CREATE
INSERT INTO toc_edges (source_node_id, target_node_id, edge_type, tenant_id)
VALUES (:source_id, :target_id, :edge_type, :tenant_id)
RETURNING id;

-- DELETE
DELETE FROM toc_edges
WHERE id = :edge_id
  AND EXISTS (
    SELECT 1 FROM toc_nodes n
    WHERE n.id = toc_edges.source_node_id
      AND n.toc_version_id IN (SELECT id FROM toc_versions WHERE status = 'DRAFT')
  );
```

**Edge Operation Valid?** ✅ YES / ❌ NO (BLOCKED if invalid)

---

### 6. Assumptions Handling

**Operation:** [ADD / UPDATE / DELETE / READ] assumption

**Assumption Type:** [NODE / EDGE]

**Assumptions Attached To:**
- If NODE → Node ID: `[node_id]`
- If EDGE → Edge ID: `[edge_id]`

**Pre-Operation Checks:**
- [ ] Parent node/edge exists
- [ ] Version is DRAFT (if modifying)
- [ ] Risk level is valid (LOW / MEDIUM / HIGH)

**Assumption SQL Templates:**
```sql
-- Create node assumption
INSERT INTO toc_assumptions (node_id, assumption_text, risk_level)
VALUES (:node_id, :text, :risk_level);

-- Create edge assumption (if edge assumptions table exists)
INSERT INTO toc_edge_assumptions (edge_id, assumption_text, risk_level)
VALUES (:edge_id, :text, :risk_level);
```

**Assumptions Valid?** ✅ YES / ❌ NO

---

### 7. Tenant Isolation

- [ ] All queries filter by `tenant_id`
- [ ] RLS policies active on `toc_nodes`, `toc_edges`, `toc_versions`
- [ ] User has membership in target tenant (`user_memberships` check)

**Tenant Filter Applied?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 8. Decision

**Status:** ✅ APPROVED / ❌ BLOCKED

**Reason:** [Explanation]

**Required Actions Before Proceeding:**
1. [e.g., "Confirm version is DRAFT"]
2. [e.g., "Apply edge uniqueness constraint"]

---

**Checklist Complete.**
```

## Implementation Instructions

### Step 1: Identify Operation Type

Extract from user request:
- **Node operation:** Create, update, delete, or read node
- **Edge operation:** Create, update, delete, or read edge
- **Version operation:** Create draft, publish version
- **Assumption operation:** Add or update assumptions

### Step 2: Load ToC Version State

```typescript
async function getTocVersionState(versionId: string) {
  const { data: version } = await supabase
    .from('toc_versions')
    .select('id, project_id, status, version_number, published_at')
    .eq('id', versionId)
    .single();
  
  return version;
}
```

### Step 3: Validate Version Editability

```typescript
function canEditVersion(version: TocVersion): boolean {
  if (version.status === 'PUBLISHED') {
    return false; // BLOCKED
  }
  return true; // DRAFT is editable
}
```

### Step 4: Enforce Graph Model

**Check for forbidden patterns:**
```typescript
// ❌ BLOCKED: Using parent_id instead of edges table
const forbiddenPattern = await grep_search({
  SearchPath: codeFilePath,
  Query: 'parent_id',
  IsRegex: false
});

if (forbiddenPattern.length > 0) {
  throw new Error('Build Rule 2 violation: Use toc_edges table, not parent_id');
}
```

### Step 5: Validate Node/Edge Operations

**For node creation:**
```typescript
async function createNode(versionId: string, nodeType: string, title: string, tenantId: string) {
  // 1. Check version is DRAFT
  const version = await getTocVersionState(versionId);
  if (version.status !== 'DRAFT') {
    throw new Error('Cannot edit PUBLISHED version');
  }

  // 2. Insert node
  const { data: node } = await supabase
    .from('toc_nodes')
    .insert({
      toc_version_id: versionId,
      node_type: nodeType,
      title: title,
      tenant_id: tenantId
    })
    .select()
    .single();

  return node;
}
```

**For edge creation:**
```typescript
async function createEdge(sourceId: string, targetId: string, tenantId: string) {
  // 1. Verify nodes exist in same version
  const { data: nodes } = await supabase
    .from('toc_nodes')
    .select('toc_version_id')
    .in('id', [sourceId, targetId]);

  if (nodes.length !== 2 || nodes[0].toc_version_id !== nodes[1].toc_version_id) {
    throw new Error('Nodes must be in same ToC version');
  }

  // 2. Check version is DRAFT
  const version = await getTocVersionState(nodes[0].toc_version_id);
  if (version.status !== 'DRAFT') {
    throw new Error('Cannot edit PUBLISHED version');
  }

  // 3. Create edge
  const { data: edge } = await supabase
    .from('toc_edges')
    .insert({
      source_node_id: sourceId,
      target_node_id: targetId,
      edge_type: 'CONTRIBUTES_TO',
      tenant_id: tenantId
    })
    .select()
    .single();

  return edge;
}
```

### Step 6: Publish Version

```typescript
async function publishVersion(versionId: string) {
  // 1. Validate current state
  const version = await getTocVersionState(versionId);
  if (version.status !== 'DRAFT') {
    throw new Error('Only DRAFT versions can be published');
  }

  // 2. Run validation gates (Gate A/B if required)
  const gatesPassed = await runGateValidation(versionId);
  if (!gatesPassed) {
    throw new Error('Gates must pass before publishing');
  }

  // 3. Publish
  const { data } = await supabase
    .from('toc_versions')
    .update({
      status: 'PUBLISHED',
      published_at: new Date().toISOString()
    })
    .eq('id', versionId)
    .eq('status', 'DRAFT') // Safety check
    .select()
    .single();

  return data;
}
```

### Step 7: Handle Assumptions

```typescript
async function addNodeAssumption(nodeId: string, text: string, riskLevel: string) {
  // 1. Verify node exists and is in DRAFT version
  const { data: node } = await supabase
    .from('toc_nodes')
    .select('toc_version_id, toc_versions(status)')
    .eq('id', nodeId)
    .single();

  if (node.toc_versions.status !== 'DRAFT') {
    throw new Error('Cannot edit assumptions on PUBLISHED version');
  }

  // 2. Create assumption
  const { data: assumption } = await supabase
    .from('toc_assumptions')
    .insert({
      node_id: nodeId,
      assumption_text: text,
      risk_level: riskLevel
    })
    .select()
    .single();

  return assumption;
}
```

### Step 8: Output Checklist

Generate compliance checklist with all validation results.

## Integration with Other Skills

- **schema-first-builder:** Verifies `toc_nodes`, `toc_edges`, `toc_versions` tables exist
- **gates-and-health-computation:** Called before publishing versions
- **rls-rbac-guardian:** Ensures tenant isolation on all ToC tables

## Success Criteria

- ✅ All ToC operations use hybrid graph-relational model
- ✅ PUBLISHED versions are never edited
- ✅ DRAFT versions enforce single-draft-per-project constraint
- ✅ Assumptions can attach to nodes and edges
- ✅ All operations enforce tenant isolation

## Prohibited Actions

- ❌ Using `parent_id` instead of `toc_edges` table
- ❌ Editing PUBLISHED versions
- ❌ Creating multiple DRAFT versions for same project
- ❌ Storing ToC structure in JSONB
- ❌ Allowing cross-tenant ToC access
