import test from "node:test";
import assert from "node:assert/strict";
import {
  PROJECTION_FIELD_MAP,
  buildProjectionRows,
} from "../../src/lib/toc/projectionContract.mjs";

function sampleGraph() {
  return {
    nodes: [
      {
        id: "g",
        node_type: "GOAL",
        primary_parent_id: null,
        created_at: "2026-02-18T10:00:00.000Z",
        title: "Goal G",
      },
      {
        id: "o1",
        node_type: "OUTCOME",
        primary_parent_id: "g",
        created_at: "2026-02-18T10:01:00.000Z",
        title: "Outcome O1",
      },
      {
        id: "o2",
        node_type: "OUTCOME",
        primary_parent_id: "g",
        created_at: "2026-02-18T10:02:00.000Z",
        title: "Outcome O2",
      },
      {
        id: "x",
        node_type: "OUTPUT",
        primary_parent_id: "o1",
        created_at: "2026-02-18T10:03:00.000Z",
        title: "Output X",
        description: "Output X description",
        narrative: "Output X narrative",
      },
    ],
    edges: [
      {
        id: "e-secondary",
        source_node_id: "o2",
        target_node_id: "x",
        edge_kind: "secondary_link",
        created_at: "2026-02-18T10:04:00.000Z",
      },
    ],
  };
}

test("shared output node has one primary row and one ghost row with same node_id", () => {
  const graph = sampleGraph();
  assert.equal(graph.nodes.filter((node) => node.id === "x").length, 1);
  assert.equal(
    PROJECTION_FIELD_MAP.primary_parent_field,
    "toc_nodes.primary_parent_id"
  );
  assert.equal(PROJECTION_FIELD_MAP.secondary_edge_value, "secondary_link");

  const rows = buildProjectionRows(graph);
  const xRows = rows.filter((row) => row.node_id === "x");

  assert.equal(xRows.length, 2);
  assert.deepEqual(
    xRows.map((row) => row.row_kind).sort(),
    ["ghost_secondary", "primary"]
  );
  assert.equal(new Set(xRows.map((row) => row.node_id)).size, 1);
});

test("ghost rows are generated only from secondary_link edges", () => {
  const graph = sampleGraph();
  graph.edges.push({
    id: "e-causal",
    source_node_id: "o2",
    target_node_id: "x",
    edge_kind: "causal",
    created_at: "2026-02-18T10:05:00.000Z",
  });

  const edgeKindById = new Map(
    graph.edges.map((edge) => [edge.id, edge.edge_kind])
  );
  const rows = buildProjectionRows(graph);
  const ghostRows = rows.filter((row) => row.row_kind === "ghost_secondary");

  assert.equal(ghostRows.length > 0, true);
  for (const row of ghostRows) {
    assert.equal(edgeKindById.get(row.source_edge_id), "secondary_link");
  }
});

test("ordering is stable across repeated projection runs", () => {
  const graph = sampleGraph();
  const sameGraphDifferentInputOrder = {
    nodes: [graph.nodes[3], graph.nodes[1], graph.nodes[0], graph.nodes[2]],
    edges: [...graph.edges],
  };

  const run1 = buildProjectionRows(sameGraphDifferentInputOrder);
  const run2 = buildProjectionRows(sameGraphDifferentInputOrder);

  const toStableIdentifiers = (rows) =>
    rows.map(
      (row) =>
        `${row.path_sort_key}|${row.row_kind}|${row.node_id}|${row.projection_parent_id ?? ""}|${row.primary_parent_id ?? ""}`
    );

  assert.deepEqual(toStableIdentifiers(run1), toStableIdentifiers(run2));
});

test("node content edits propagate to every projection row for that node", () => {
  const graph = sampleGraph();
  const originalRows = buildProjectionRows(graph).filter((row) => row.node_id === "x");
  assert.equal(originalRows.length, 2);
  assert.deepEqual(new Set(originalRows.map((row) => row.node_title)), new Set(["Output X"]));
  assert.deepEqual(
    new Set(originalRows.map((row) => row.node_description)),
    new Set(["Output X description"])
  );
  assert.deepEqual(
    new Set(originalRows.map((row) => row.node_narrative)),
    new Set(["Output X narrative"])
  );

  const editedGraph = sampleGraph();
  const editedNode = editedGraph.nodes.find((node) => node.id === "x");
  editedNode.title = "Output X (Edited)";
  editedNode.description = "Output X description (Edited)";
  editedNode.narrative = "Output X narrative (Edited)";
  const editedRows = buildProjectionRows(editedGraph).filter((row) => row.node_id === "x");

  assert.equal(editedRows.length, 2);
  assert.deepEqual(
    new Set(editedRows.map((row) => row.node_title)),
    new Set(["Output X (Edited)"])
  );
  assert.deepEqual(
    new Set(editedRows.map((row) => row.node_description)),
    new Set(["Output X description (Edited)"])
  );
  assert.deepEqual(
    new Set(editedRows.map((row) => row.node_narrative)),
    new Set(["Output X narrative (Edited)"])
  );
});
