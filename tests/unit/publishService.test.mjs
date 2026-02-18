import test from "node:test";
import assert from "node:assert/strict";
import { publishDraftWithGateA } from "../../src/lib/toc/publishService.mjs";

function validPayload() {
  return {
    found: true,
    nodes: [
      { id: "g1", node_type: "GOAL", primary_parent_id: null },
      { id: "o1", node_type: "OUTCOME", primary_parent_id: "g1" },
    ],
    edges: [
      {
        id: "e1",
        source_node_id: "g1",
        target_node_id: "o1",
        edge_kind: "causal",
        mechanism: "Mechanism text",
        confidence: "medium",
        risk_flag: "none",
        sentinel_indicator_id: null,
      },
    ],
    rlsBaselineOk: true,
  };
}

test("publish fails with structured GA errors when validator fails", async () => {
  let atomicCalled = false;
  const result = await publishDraftWithGateA({
    loadDraftPayload: async () => ({
      ...validPayload(),
      nodes: [{ id: "g1", node_type: "GOAL" }, { id: "g2", node_type: "GOAL" }],
    }),
    executeAtomicPublish: async () => {
      atomicCalled = true;
      return { ok: true, data: {} };
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "GA_VALIDATION_FAILED");
  assert.equal(Array.isArray(result.violations), true);
  assert.equal(result.violations.length > 0, true);
  assert.equal(result.violations[0].rule_id, "GA-01");
  assert.equal(atomicCalled, false);
});

test("publish succeeds when validator passes and atomic executor succeeds", async () => {
  const result = await publishDraftWithGateA({
    loadDraftPayload: async () => validPayload(),
    executeAtomicPublish: async () => ({
      ok: true,
      data: {
        published_version_id: "v-published",
        new_draft_version_id: "v-draft",
        linked_analysis_snapshot_id: "snap-freeze",
      },
    }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.data.published_version_id, "v-published");
  assert.equal(result.data.new_draft_version_id, "v-draft");
  assert.equal(result.data.linked_analysis_snapshot_id, "snap-freeze");
});

test("publish returns not found semantics when draft payload is missing", async () => {
  const result = await publishDraftWithGateA({
    loadDraftPayload: async () => ({ found: false }),
    executeAtomicPublish: async () => ({ ok: true, data: {} }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "NOT_FOUND");
  assert.equal(result.message, "Draft not found");
});

