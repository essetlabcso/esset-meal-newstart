/**
 * Pure Gate A validator (no DB access).
 * Input payload is pre-fetched nodes/edges plus optional RLS baseline flag.
 */

const RULES = {
  GA01: {
    rule_id: "GA-01",
    error_code: "GA_ERR_GOAL_COUNT",
    message: "Exactly 1 goal node is required.",
  },
  GA02: {
    rule_id: "GA-02",
    error_code: "GA_ERR_ORPHANS",
    message: "Every non-goal node must have exactly one valid primary parent.",
  },
  GA03: {
    rule_id: "GA-03",
    error_code: "GA_ERR_TYPE_CHAIN",
    message: "Node hierarchy must follow GOAL->OUTCOME->OUTPUT->ACTIVITY.",
  },
  GA04: {
    rule_id: "GA-04",
    error_code: "GA_ERR_CAUSAL_CYCLE",
    message: "Causal graph must be acyclic (feedback edges excluded).",
  },
  GA05: {
    rule_id: "GA-05",
    error_code: "GA_ERR_DUP_EDGE",
    message: "Duplicate edges are not allowed per (from,to,edge_kind).",
  },
  GA06: {
    rule_id: "GA-06",
    error_code: "GA_ERR_EDGE_MECH",
    message: "Every causal edge must include a mechanism.",
  },
  GA07: {
    rule_id: "GA-07",
    error_code: "GA_ERR_SENTINEL",
    message: "Low-confidence/high-risk causal edges require sentinel indicator.",
  },
  GA08: {
    rule_id: "GA-08",
    error_code: "GA_ERR_RLS_BASELINE",
    message: "RLS baseline lint must pass before publish.",
  },
};

const TYPE_CHAIN = {
  OUTCOME: "GOAL",
  OUTPUT: "OUTCOME",
  ACTIVITY: "OUTPUT",
};

function normalizeNode(raw) {
  return {
    id: String(raw?.id ?? raw?.node_id ?? ""),
    node_type: String(raw?.node_type ?? raw?.type ?? "").toUpperCase(),
    primary_parent_id: raw?.primary_parent_id ?? raw?.primaryParentId ?? null,
  };
}

function normalizeEdge(raw) {
  return {
    id: String(raw?.id ?? raw?.edge_id ?? ""),
    from_node_id: raw?.source_node_id ?? raw?.from_node_id ?? raw?.sourceId ?? null,
    to_node_id: raw?.target_node_id ?? raw?.to_node_id ?? raw?.targetId ?? null,
    edge_kind: String(raw?.edge_kind ?? raw?.kind ?? "causal").toLowerCase(),
    mechanism: raw?.mechanism ?? null,
    confidence: String(raw?.confidence ?? "medium").toLowerCase(),
    risk_flag: String(raw?.risk_flag ?? "none").toLowerCase(),
    sentinel_indicator_id:
      raw?.sentinel_indicator_id ?? raw?.sentinelIndicatorId ?? null,
  };
}

function normalizeRefs(entity_refs) {
  return entity_refs
    .filter((v) => v !== null && v !== undefined && String(v) !== "")
    .map((v) => String(v))
    .sort((a, b) => a.localeCompare(b));
}

function mkViolation(rule, entity_refs) {
  return {
    rule_id: rule.rule_id,
    error_code: rule.error_code,
    message: rule.message,
    entity_refs: normalizeRefs(entity_refs),
  };
}

function hasCycle(causalEdges) {
  const adjacency = new Map();
  const nodes = new Set();
  for (const edge of causalEdges) {
    if (!edge.from_node_id || !edge.to_node_id) continue;
    const from = String(edge.from_node_id);
    const to = String(edge.to_node_id);
    nodes.add(from);
    nodes.add(to);
    const list = adjacency.get(from) || [];
    list.push(to);
    adjacency.set(from, list);
  }

  const color = new Map(); // 0/undefined unvisited, 1 visiting, 2 done
  const stack = [];
  const stackIndex = new Map();
  const cycleNodes = new Set();

  function dfs(nodeId) {
    color.set(nodeId, 1);
    stack.push(nodeId);
    stackIndex.set(nodeId, stack.length - 1);

    for (const next of adjacency.get(nodeId) || []) {
      const nextColor = color.get(next);
      if (!nextColor) {
        dfs(next);
        continue;
      }
      if (nextColor === 1) {
        const idx = stackIndex.get(next) ?? 0;
        for (let i = idx; i < stack.length; i += 1) {
          cycleNodes.add(stack[i]);
        }
        cycleNodes.add(next);
      }
    }

    stackIndex.delete(nodeId);
    stack.pop();
    color.set(nodeId, 2);
  }

  const orderedNodes = Array.from(nodes).sort((a, b) => a.localeCompare(b));
  for (const nodeId of orderedNodes) {
    if (!color.get(nodeId)) dfs(nodeId);
  }

  return Array.from(cycleNodes).sort((a, b) => a.localeCompare(b));
}

/**
 * @param {{
 *   nodes: Array<Record<string, unknown>>,
 *   edges: Array<Record<string, unknown>>,
 *   rlsBaselineOk?: boolean
 * }} input
 * @returns {{
 *   pass: boolean,
 *   violations: Array<{
 *     rule_id: string,
 *     error_code: string,
 *     message: string,
 *     entity_refs: string[]
 *   }>
 * }}
 */
export function validateGateA(input) {
  const nodes = Array.isArray(input?.nodes) ? input.nodes.map(normalizeNode) : [];
  const edges = Array.isArray(input?.edges) ? input.edges.map(normalizeEdge) : [];
  const rlsBaselineOk = input?.rlsBaselineOk ?? true;

  const violations = [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  // GA-01: exactly one goal
  const goalIds = nodes
    .filter((node) => node.node_type === "GOAL")
    .map((node) => node.id)
    .sort((a, b) => a.localeCompare(b));
  if (goalIds.length !== 1) {
    const refs = goalIds.length > 0 ? goalIds : [`goal_count=${goalIds.length}`];
    violations.push(mkViolation(RULES.GA01, refs));
  }

  // GA-02: no orphans for non-goals
  const orphanIds = nodes
    .filter((node) => node.node_type !== "GOAL")
    .filter(
      (node) =>
        !node.primary_parent_id || !nodeById.has(String(node.primary_parent_id))
    )
    .map((node) => node.id)
    .sort((a, b) => a.localeCompare(b));
  if (orphanIds.length > 0) {
    violations.push(mkViolation(RULES.GA02, orphanIds));
  }

  // GA-03: type chain hierarchy
  const badTypeChainRefs = [];
  for (const node of nodes) {
    if (node.node_type === "GOAL") continue;
    if (!node.primary_parent_id) continue;
    const parent = nodeById.get(String(node.primary_parent_id));
    if (!parent) continue;
    const expectedParentType = TYPE_CHAIN[node.node_type];
    if (!expectedParentType || parent.node_type !== expectedParentType) {
      badTypeChainRefs.push(`${node.id}:${parent.id}`);
    }
  }
  if (badTypeChainRefs.length > 0) {
    violations.push(mkViolation(RULES.GA03, badTypeChainRefs));
  }

  // GA-04: causal graph acyclic (feedback excluded)
  const causalEdges = edges.filter((edge) => edge.edge_kind === "causal");
  const cycleNodeRefs = hasCycle(causalEdges);
  if (cycleNodeRefs.length > 0) {
    violations.push(mkViolation(RULES.GA04, cycleNodeRefs));
  }

  // GA-05: duplicate edges per (from,to,edge_kind)
  const edgeMap = new Map();
  for (const edge of edges) {
    const from = edge.from_node_id ? String(edge.from_node_id) : "";
    const to = edge.to_node_id ? String(edge.to_node_id) : "";
    const key = `${from}::${to}::${edge.edge_kind}`;
    const list = edgeMap.get(key) || [];
    list.push(edge.id);
    edgeMap.set(key, list);
  }
  const duplicateEdgeRefs = [];
  for (const ids of edgeMap.values()) {
    if (ids.length > 1) duplicateEdgeRefs.push(...ids);
  }
  if (duplicateEdgeRefs.length > 0) {
    violations.push(mkViolation(RULES.GA05, duplicateEdgeRefs));
  }

  // GA-06: causal edges require mechanism text
  const missingMechanismRefs = causalEdges
    .filter((edge) => String(edge.mechanism ?? "").trim() === "")
    .map((edge) => edge.id);
  if (missingMechanismRefs.length > 0) {
    violations.push(mkViolation(RULES.GA06, missingMechanismRefs));
  }

  // GA-07: low-confidence/high-risk causal edges require sentinel indicator
  const missingSentinelRefs = causalEdges
    .filter(
      (edge) =>
        edge.confidence === "low" || edge.risk_flag === "high_risk"
    )
    .filter((edge) => !edge.sentinel_indicator_id)
    .map((edge) => edge.id);
  if (missingSentinelRefs.length > 0) {
    violations.push(mkViolation(RULES.GA07, missingSentinelRefs));
  }

  // GA-08: RLS baseline check result is provided by caller (no DB read here)
  if (!rlsBaselineOk) {
    violations.push(mkViolation(RULES.GA08, ["rls_baseline=false"]));
  }

  violations.sort((a, b) => {
    const byRule = a.rule_id.localeCompare(b.rule_id);
    if (byRule !== 0) return byRule;
    return a.entity_refs.join("|").localeCompare(b.entity_refs.join("|"));
  });

  return {
    pass: violations.length === 0,
    violations,
  };
}

