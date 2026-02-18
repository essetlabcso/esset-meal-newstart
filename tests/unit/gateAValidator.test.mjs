import test from "node:test";
import assert from "node:assert/strict";
import { validateGateA } from "../../src/lib/toc/gateAValidator.mjs";

function baseNodes() {
  return [
    { id: "g1", node_type: "GOAL", primary_parent_id: null },
    { id: "o1", node_type: "OUTCOME", primary_parent_id: "g1" },
    { id: "p1", node_type: "OUTPUT", primary_parent_id: "o1" },
    { id: "a1", node_type: "ACTIVITY", primary_parent_id: "p1" },
  ];
}

function baseEdges() {
  return [
    {
      id: "e1",
      source_node_id: "g1",
      target_node_id: "o1",
      edge_kind: "causal",
      mechanism: "Goal contributes to outcome",
      confidence: "medium",
      risk_flag: "none",
      sentinel_indicator_id: null,
    },
  ];
}

function hasCode(result, code) {
  return result.violations.some((v) => v.error_code === code);
}

test("GA-01 fail and pass fixtures", () => {
  const fail = validateGateA({
    nodes: [...baseNodes(), { id: "g2", node_type: "GOAL", primary_parent_id: null }],
    edges: baseEdges(),
    rlsBaselineOk: true,
  });
  assert.equal(hasCode(fail, "GA_ERR_GOAL_COUNT"), true);

  const pass = validateGateA({ nodes: baseNodes(), edges: baseEdges(), rlsBaselineOk: true });
  assert.equal(hasCode(pass, "GA_ERR_GOAL_COUNT"), false);
});

test("GA-02 fail and pass fixtures", () => {
  const nodes = baseNodes();
  nodes.find((n) => n.id === "p1").primary_parent_id = null;
  const fail = validateGateA({ nodes, edges: baseEdges(), rlsBaselineOk: true });
  assert.equal(hasCode(fail, "GA_ERR_ORPHANS"), true);

  const pass = validateGateA({ nodes: baseNodes(), edges: baseEdges(), rlsBaselineOk: true });
  assert.equal(hasCode(pass, "GA_ERR_ORPHANS"), false);
});

test("GA-03 fail and pass fixtures", () => {
  const nodes = baseNodes();
  nodes.find((n) => n.id === "p1").primary_parent_id = "g1";
  const fail = validateGateA({ nodes, edges: baseEdges(), rlsBaselineOk: true });
  assert.equal(hasCode(fail, "GA_ERR_TYPE_CHAIN"), true);

  const pass = validateGateA({ nodes: baseNodes(), edges: baseEdges(), rlsBaselineOk: true });
  assert.equal(hasCode(pass, "GA_ERR_TYPE_CHAIN"), false);
});

test("GA-04 fail and pass fixtures", () => {
  const edges = [
    ...baseEdges(),
    {
      id: "e2",
      source_node_id: "o1",
      target_node_id: "g1",
      edge_kind: "causal",
      mechanism: "Back edge",
      confidence: "medium",
      risk_flag: "none",
      sentinel_indicator_id: null,
    },
  ];
  const fail = validateGateA({ nodes: baseNodes(), edges, rlsBaselineOk: true });
  assert.equal(hasCode(fail, "GA_ERR_CAUSAL_CYCLE"), true);

  const pass = validateGateA({ nodes: baseNodes(), edges: baseEdges(), rlsBaselineOk: true });
  assert.equal(hasCode(pass, "GA_ERR_CAUSAL_CYCLE"), false);
});

test("GA-05 fail and pass fixtures", () => {
  const edges = [
    ...baseEdges(),
    {
      id: "e2",
      source_node_id: "g1",
      target_node_id: "o1",
      edge_kind: "causal",
      mechanism: "Duplicate",
      confidence: "medium",
      risk_flag: "none",
      sentinel_indicator_id: null,
    },
  ];
  const fail = validateGateA({ nodes: baseNodes(), edges, rlsBaselineOk: true });
  assert.equal(hasCode(fail, "GA_ERR_DUP_EDGE"), true);

  const pass = validateGateA({ nodes: baseNodes(), edges: baseEdges(), rlsBaselineOk: true });
  assert.equal(hasCode(pass, "GA_ERR_DUP_EDGE"), false);
});

test("GA-06 fail and pass fixtures", () => {
  const edges = baseEdges();
  edges[0].mechanism = "   ";
  const fail = validateGateA({ nodes: baseNodes(), edges, rlsBaselineOk: true });
  assert.equal(hasCode(fail, "GA_ERR_EDGE_MECH"), true);

  const pass = validateGateA({ nodes: baseNodes(), edges: baseEdges(), rlsBaselineOk: true });
  assert.equal(hasCode(pass, "GA_ERR_EDGE_MECH"), false);
});

test("GA-07 fail and pass fixtures", () => {
  const edgesFail = baseEdges();
  edgesFail[0].confidence = "low";
  edgesFail[0].sentinel_indicator_id = null;
  const fail = validateGateA({
    nodes: baseNodes(),
    edges: edgesFail,
    rlsBaselineOk: true,
  });
  assert.equal(hasCode(fail, "GA_ERR_SENTINEL"), true);

  const edgesPass = baseEdges();
  edgesPass[0].confidence = "low";
  edgesPass[0].sentinel_indicator_id = "sentinel-1";
  const pass = validateGateA({
    nodes: baseNodes(),
    edges: edgesPass,
    rlsBaselineOk: true,
  });
  assert.equal(hasCode(pass, "GA_ERR_SENTINEL"), false);
});

test("GA-08 fail and pass fixtures", () => {
  const fail = validateGateA({
    nodes: baseNodes(),
    edges: baseEdges(),
    rlsBaselineOk: false,
  });
  assert.equal(hasCode(fail, "GA_ERR_RLS_BASELINE"), true);

  const pass = validateGateA({
    nodes: baseNodes(),
    edges: baseEdges(),
    rlsBaselineOk: true,
  });
  assert.equal(hasCode(pass, "GA_ERR_RLS_BASELINE"), false);
});

test("deterministic ordering: sort by rule_id then entity_refs", () => {
  const result = validateGateA({
    nodes: [{ id: "g2", node_type: "GOAL" }, { id: "g1", node_type: "GOAL" }],
    edges: [
      {
        id: "e2",
        source_node_id: "g2",
        target_node_id: "g1",
        edge_kind: "causal",
        mechanism: "",
        confidence: "low",
        risk_flag: "none",
      },
      {
        id: "e1",
        source_node_id: "g1",
        target_node_id: "g2",
        edge_kind: "causal",
        mechanism: "",
        confidence: "low",
        risk_flag: "none",
      },
    ],
    rlsBaselineOk: false,
  });

  const pairs = result.violations.map((v) => `${v.rule_id}|${v.entity_refs.join(",")}`);
  const sorted = [...pairs].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(pairs, sorted);
});

