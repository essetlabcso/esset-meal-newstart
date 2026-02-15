---
name: Gates and Health Computation
description: Enforces Build Rule 5 (Gate A/B readiness computed exactly per validation pack) and implements health metric calculations with compliance verification.
---

# Gates and Health Computation

## Purpose

This skill enforces **Build Rule 5: Gate A/B Readiness Computation** from [`/docs/spec/03_RULES/BUILD_RULES.md`](../../../docs/spec/03_RULES/BUILD_RULES.md). It ensures that all gate pass/fail logic and health metrics are computed using ONLY the exact rules defined in the Field Validation Pack.

## Governed By

- [`/docs/spec/03_RULES/BUILD_RULES.md`](../../../docs/spec/03_RULES/BUILD_RULES.md) — Rule 5 (Gate Computation)
- [`/docs/spec/Field_Validation_v1_1.md`](../../../docs/spec/Field_Validation_v1_1.md) — AUTHORITATIVE validation logic
- [`/docs/spec/PRD_v1_1.md`](../../../docs/spec/PRD_v1_1.md) — Gate A/B requirements
- [`/docs/spec/DDL_v1_1.sql`](../../../docs/spec/DDL_v1_1.sql) — Schema for projects, ToC, indicators

## Gate Definitions

### Gate A: Pre-Baseline Readiness

**Purpose:** Validates that a project is ready to proceed to baseline data collection.

**Data Source:** [`Field_Validation_v1_1.md`](../../../docs/spec/Field_Validation_v1_1.md) — Section: "Gate A Validation Rules"

**Required Checks:**
1. Project metadata completeness
2. ToC structure validity (all node types present, edges defined)
3. Indicator definitions (outcome/output indicators exist)
4. Baseline methodology defined
5. Ethics approval documented

### Gate B: Post-Baseline Readiness

**Purpose:** Validates that baseline data collection is complete and monitoring can begin.

**Data Source:** [`Field_Validation_v1_1.md`](../../../docs/spec/Field_Validation_v1_1.md) — Section: "Gate B Validation Rules"

**Required Checks:**
1. Baseline data entered for all indicators
2. Sample size targets met
3. Data quality checks passed
4. Baseline report generated
5. Monitoring plan approved

## Compliance Checklist Template

Before implementing gate computation logic, output:

```markdown
## Gates and Health Computation Compliance — [Implementation Area]

**Date:** [ISO timestamp]  
**Skill:** gates-and-health-computation  
**Gate Type:** [GATE A / GATE B / HEALTH METRICS]

---

### 1. Validation Pack Alignment

- [ ] Read [`Field_Validation_v1_1.md`](../../../docs/spec/Field_Validation_v1_1.md)
- [ ] Identified exact rules for:
  - [ ] Gate A (if applicable)
  - [ ] Gate B (if applicable)
  - [ ] Health metrics (if applicable)
- [ ] Extracted validation logic verbatim from spec

**Validation Pack Section Referenced:** [e.g., "Gate A Validation Rules, lines 45-78"]

---

### 2. Gate A Computation (if applicable)

**Gate A Rules from Validation Pack:**

| Rule ID | Requirement | Data Source | Pass Condition |
|---------|-------------|-------------|----------------|
| A1 | Project metadata complete | `projects` table | All required fields non-null |
| A2 | ToC structure valid | `toc_nodes`, `toc_edges` | Min 1 GOAL, 1 OUTCOME, 1 OUTPUT |
| A3 | Indicators defined | `indicators` table | Min 3 outcome indicators |
| A4 | Baseline methodology | `projects.baseline_methodology` | Non-null, min 50 chars |
| A5 | Ethics approval | `projects.ethics_approval_date` | Non-null, date in past |

**Implementation Function:**
```typescript
async function computeGateA(projectId: string): Promise<GateResult> {
  // MUST implement EXACT logic from validation pack
  const checks = [
    await checkA1_ProjectMetadata(projectId),
    await checkA2_TocStructure(projectId),
    await checkA3_Indicators(projectId),
    await checkA4_BaselineMethodology(projectId),
    await checkA5_EthicsApproval(projectId)
  ];

  const passed = checks.every(c => c.passed);
  const failures = checks.filter(c => !c.passed).map(c => c.reason);
  const score = checks.filter(c => c.passed).length / checks.length;

  return { passed, failures, score };
}
```

**Logic Matches Validation Pack?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 3. Gate B Computation (if applicable)

**Gate B Rules from Validation Pack:**

| Rule ID | Requirement | Data Source | Pass Condition |
|---------|-------------|-------------|----------------|
| B1 | Baseline data complete | `indicator_values` | All indicators have baseline value |
| B2 | Sample size met | `projects.baseline_sample_size` | Actual >= target |
| B3 | Data quality passed | `indicator_values.quality_flag` | All flags = 'VERIFIED' |
| B4 | Baseline report exists | `reports` table | Type = 'BASELINE', status = 'APPROVED' |
| B5 | Monitoring plan approved | `projects.monitoring_plan_approved` | TRUE |

**Implementation Function:**
```typescript
async function computeGateB(projectId: string): Promise<GateResult> {
  // MUST implement EXACT logic from validation pack
  const checks = [
    await checkB1_BaselineDataComplete(projectId),
    await checkB2_SampleSizeMet(projectId),
    await checkB3_DataQuality(projectId),
    await checkB4_BaselineReport(projectId),
    await checkB5_MonitoringPlan(projectId)
  ];

  const passed = checks.every(c => c.passed);
  const failures = checks.filter(c => !c.passed).map(c => c.reason);
  const score = checks.filter(c => c.passed).length / checks.length;

  return { passed, failures, score };
}
```

**Logic Matches Validation Pack?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 4. Health Metrics Computation (if applicable)

**Health Metrics from Validation Pack:**

| Metric | Calculation | Data Source | Formula |
|--------|-------------|-------------|---------|
| ToC Completeness | % of nodes with all metadata | `toc_nodes.metadata` | (nodes with metadata) / (total nodes) * 100 |
| Indicator Coverage | % of outcomes with indicators | `indicators` | (outcomes with indicators) / (total outcomes) * 100 |
| Data Freshness | Days since last data entry | `indicator_values.created_at` | NOW() - MAX(created_at) |
| Assumptions Documented | % of nodes with assumptions | `toc_assumptions` | (nodes with assumptions) / (total nodes) * 100 |

**Implementation Function:**
```typescript
async function computeHealthMetrics(projectId: string): Promise<HealthMetrics> {
  return {
    toc_completeness: await calculateTocCompleteness(projectId),
    indicator_coverage: await calculateIndicatorCoverage(projectId),
    data_freshness: await calculateDataFreshness(projectId),
    assumptions_documented: await calculateAssumptionsDocumented(projectId)
  };
}
```

**Calculations Match Validation Pack?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 5. Determinism Verification

**Gate/Health functions MUST be deterministic:**
- [ ] Same inputs → same outputs (no random values)
- [ ] No user overrides without audit trail
- [ ] No hardcoded pass/fail bypasses
- [ ] All logic traceable to validation pack

**Testing Plan:**
```typescript
// Example unit test
test('Gate A returns same result for same project state', async () => {
  const result1 = await computeGateA(projectId);
  const result2 = await computeGateA(projectId);
  expect(result1).toEqual(result2); // Must be identical
});
```

**Determinism Verified?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 6. Return Type Specification

**All gate functions MUST return:**
```typescript
interface GateResult {
  passed: boolean;           // Overall pass/fail
  failures: string[];        // Array of failure reasons
  score: number;             // 0.0 to 1.0 (percentage of checks passed)
  timestamp?: string;        // Optional: when computation ran
  details?: GateCheckDetail[]; // Optional: per-check results
}

interface GateCheckDetail {
  checkId: string;           // e.g., "A1", "B3"
  checkName: string;         // e.g., "Project Metadata Complete"
  passed: boolean;
  reason?: string;           // Why it failed (if applicable)
  actualValue?: any;         // Actual data value
  expectedValue?: any;       // Expected value
}
```

**Return Type Compliant?** ✅ YES / ❌ NO

---

### 7. Caching Strategy

**Performance Optimization:**
- [ ] Gate results CAN be cached per `project_id` + `toc_version_id`
- [ ] Cache MUST invalidate when:
  - Project metadata changes
  - ToC is edited (for DRAFT versions)
  - Indicators are added/updated
  - Baseline data is entered
- [ ] Published ToC versions CAN use permanent cache

**Cache Implementation:**
```typescript
async function getGateAResult(projectId: string): Promise<GateResult> {
  const cacheKey = `gate_a:${projectId}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Compute
  const result = await computeGateA(projectId);

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(result));

  return result;
}
```

**Caching Strategy Defined?** ✅ YES / ❌ NO

---

### 8. Forbidden Practices

**The following are STRICTLY PROHIBITED:**

- ❌ Hardcoding pass/fail without validation logic
  ```typescript
  // WRONG
  function computeGateA(projectId: string) {
    return { passed: true }; // NO!
  }
  ```

- ❌ Approximating or simplifying validation rules
  ```typescript
  // WRONG
  if (indicators.length > 0) { // Spec says "min 3 outcome indicators"
    // This is too relaxed!
  }
  ```

- ❌ Allowing user overrides without justification
  ```typescript
  // WRONG
  if (userOverride) {
    return { passed: true }; // Bypasses validation!
  }
  ```

- ❌ Using different logic than validation pack
  ```typescript
  // WRONG
  // Validation pack says check X, but code checks Y
  ```

**No Forbidden Practices?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 9. Testing Requirements

**Unit Tests MUST cover:**
- [ ] Each Gate A rule individually
- [ ] Each Gate B rule individually
- [ ] Edge cases (e.g., empty ToC, no indicators)
- [ ] Determinism (same input → same output)
- [ ] Failure scenarios (partial pass, all fail)

**Test File Location:** `/lib/validation/__tests__/gates.test.ts`

**Example Test:**
```typescript
describe('Gate A Computation', () => {
  test('A1: Project metadata complete', async () => {
    const project = createMockProject({ title: 'Test', description: 'Test Desc' });
    const result = await checkA1_ProjectMetadata(project.id);
    expect(result.passed).toBe(true);
  });

  test('A1: Project metadata incomplete (missing title)', async () => {
    const project = createMockProject({ title: null, description: 'Test Desc' });
    const result = await checkA1_ProjectMetadata(project.id);
    expect(result.passed).toBe(false);
    expect(result.reason).toContain('title');
  });
});
```

**Tests Written?** ✅ YES / ❌ NO (BLOCKED if NO)

---

### 10. Decision

**Status:** ✅ APPROVED / ❌ BLOCKED

**Reason:** [Explanation]

**Required Actions Before Proceeding:**
1. [e.g., "Extract exact Gate A rules from validation pack"]
2. [e.g., "Write unit tests for all checks"]
3. [e.g., "Remove hardcoded pass/fail logic"]

---

**Checklist Complete.**
```

## Implementation Instructions

### Step 1: Extract Rules from Validation Pack

**Process:**
1. Open [`Field_Validation_v1_1.md`](../../../docs/spec/Field_Validation_v1_1.md)
2. Locate "Gate A Validation Rules" section
3. Locate "Gate B Validation Rules" section
4. Copy EXACT requirements verbatim
5. Do NOT paraphrase or simplify

### Step 2: Implement Individual Checks

**Pattern:**
```typescript
// lib/validation/gate-a-checks.ts

interface CheckResult {
  passed: boolean;
  reason?: string;
  checkId: string;
  checkName: string;
}

export async function checkA1_ProjectMetadata(projectId: string): Promise<CheckResult> {
  const { data: project } = await supabase
    .from('projects')
    .select('title, description, start_date, end_date')
    .eq('id', projectId)
    .single();

  // EXACT LOGIC FROM VALIDATION PACK
  if (!project.title || !project.description || !project.start_date || !project.end_date) {
    return {
      passed: false,
      reason: 'Project metadata incomplete (missing title, description, or dates)',
      checkId: 'A1',
      checkName: 'Project Metadata Complete'
    };
  }

  return {
    passed: true,
    checkId: 'A1',
    checkName: 'Project Metadata Complete'
  };
}

export async function checkA2_TocStructure(projectId: string): Promise<CheckResult> {
  // Get active ToC version
  const { data: version } = await supabase
    .from('toc_versions')
    .select('id')
    .eq('project_id', projectId)
    .eq('status', 'DRAFT')
    .single();

  if (!version) {
    return {
      passed: false,
      reason: 'No active ToC version found',
      checkId: 'A2',
      checkName: 'ToC Structure Valid'
    };
  }

  // Get nodes by type
  const { data: nodes } = await supabase
    .from('toc_nodes')
    .select('node_type')
    .eq('toc_version_id', version.id);

  const hasGoal = nodes.some(n => n.node_type === 'GOAL');
  const hasOutcome = nodes.some(n => n.node_type === 'OUTCOME');
  const hasOutput = nodes.some(n => n.node_type === 'OUTPUT');

  // EXACT LOGIC FROM VALIDATION PACK
  if (!hasGoal || !hasOutcome || !hasOutput) {
    return {
      passed: false,
      reason: 'ToC must have at least 1 GOAL, 1 OUTCOME, and 1 OUTPUT',
      checkId: 'A2',
      checkName: 'ToC Structure Valid'
    };
  }

  return {
    passed: true,
    checkId: 'A2',
    checkName: 'ToC Structure Valid'
  };
}

// ... Continue for A3, A4, A5
```

### Step 3: Aggregate into Gate Functions

```typescript
// lib/validation/gate-a.ts

import { 
  checkA1_ProjectMetadata,
  checkA2_TocStructure,
  checkA3_Indicators,
  checkA4_BaselineMethodology,
  checkA5_EthicsApproval
} from './gate-a-checks';

export interface GateResult {
  passed: boolean;
  failures: string[];
  score: number;
  details: CheckResult[];
  timestamp: string;
}

export async function computeGateA(projectId: string): Promise<GateResult> {
  const checks = [
    await checkA1_ProjectMetadata(projectId),
    await checkA2_TocStructure(projectId),
    await checkA3_Indicators(projectId),
    await checkA4_BaselineMethodology(projectId),
    await checkA5_EthicsApproval(projectId)
  ];

  const passed = checks.every(c => c.passed);
  const failures = checks.filter(c => !c.passed).map(c => c.reason || 'Unknown failure');
  const score = checks.filter(c => c.passed).length / checks.length;

  return {
    passed,
    failures,
    score,
    details: checks,
    timestamp: new Date().toISOString()
  };
}
```

### Step 4: Implement Gate B (Same Pattern)

```typescript
// lib/validation/gate-b.ts

export async function computeGateB(projectId: string): Promise<GateResult> {
  const checks = [
    await checkB1_BaselineDataComplete(projectId),
    await checkB2_SampleSizeMet(projectId),
    await checkB3_DataQuality(projectId),
    await checkB4_BaselineReport(projectId),
    await checkB5_MonitoringPlan(projectId)
  ];

  // Same aggregation logic as Gate A
  // ...
}
```

### Step 5: Add Caching

```typescript
// lib/validation/cached-gates.ts

export async function getGateAResult(projectId: string, useCache = true): Promise<GateResult> {
  if (!useCache) {
    return computeGateA(projectId);
  }

  // Check cache (use Redis, in-memory, or DB table)
  const cacheKey = `gate_a:${projectId}`;
  const cached = await getCachedResult(cacheKey);
  
  if (cached) {
    return cached;
  }

  // Compute fresh
  const result = await computeGateA(projectId);

  // Cache for 1 hour
  await setCachedResult(cacheKey, result, 3600);

  return result;
}
```

### Step 6: Write Unit Tests

```typescript
// lib/validation/__tests__/gate-a.test.ts

describe('Gate A Computation', () => {
  beforeEach(async () => {
    await seedTestData();
  });

  test('passes when all checks pass', async () => {
    const project = await createCompleteProject();
    const result = await computeGateA(project.id);
    
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1.0);
    expect(result.failures).toHaveLength(0);
  });

  test('fails when project metadata incomplete', async () => {
    const project = await createProjectWithoutTitle();
    const result = await computeGateA(project.id);
    
    expect(result.passed).toBe(false);
    expect(result.failures).toContain('Project metadata incomplete');
  });

  test('is deterministic', async () => {
    const project = await createCompleteProject();
    const result1 = await computeGateA(project.id);
    const result2 = await computeGateA(project.id);
    
    expect(result1).toEqual(result2);
  });
});
```

## Success Criteria

- ✅ All gate logic matches Field Validation Pack exactly
- ✅ Functions are deterministic (testable)
- ✅ Return types match `GateResult` interface
- ✅ Unit tests cover all checks and edge cases
- ✅ Caching strategy implemented for performance
- ✅ No hardcoded or simplified logic

## Prohibited Actions

- ❌ Implementing gate logic WITHOUT reading validation pack
- ❌ Simplifying or approximating validation rules
- ❌ Allowing user overrides without audit trail
- ❌ Using non-deterministic logic (random, timestamps as thresholds)

## Integration with Other Skills

- **spec-compliance-auditor:** Verifies gate implementation matches spec
- **toc-graph-engine:** Calls Gate A/B before publishing ToC versions
- **schema-first-builder:** Ensures gate query tables exist
