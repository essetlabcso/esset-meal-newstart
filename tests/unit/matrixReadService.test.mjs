import test from "node:test";
import assert from "node:assert/strict";
import { readPublishedMatrixRows } from "../../src/lib/toc/matrixReadService.mjs";

function sampleProjectionRows() {
  return [
    {
      toc_version_id: "v1",
      node_id: "x",
      path_key: ["g", "o1", "x"],
      path_sort_key: "20260218100100000000:o1~20260218100300000000:x|0|edge:none|node:x",
      row_kind: "primary",
      source_edge_id: null,
      projection_parent_id: "o1",
      primary_parent_id: "o1",
      goal_id: "g",
      outcome_id: "o1",
      output_id: "x",
      node_type: "OUTPUT",
      node_title: "Shared Output",
    },
    {
      toc_version_id: "v1",
      node_id: "x",
      path_key: ["g", "o2", "x"],
      path_sort_key:
        "20260218100200000000:o2~20260218100300000000:x|1|20260218100400000000:e-secondary|node:x|parent:o2",
      row_kind: "ghost_secondary",
      source_edge_id: "e-secondary",
      projection_parent_id: "o2",
      primary_parent_id: "o1",
      goal_id: "g",
      outcome_id: "o2",
      output_id: "x",
      node_type: "OUTPUT",
      node_title: "Shared Output",
    },
    {
      toc_version_id: "v1",
      node_id: "g",
      path_key: ["g"],
      path_sort_key: "20260218100000000000:g|0|edge:none|node:g",
      row_kind: "primary",
      source_edge_id: null,
      projection_parent_id: null,
      primary_parent_id: null,
      goal_id: "g",
      outcome_id: null,
      output_id: null,
      node_type: "GOAL",
      node_title: "Goal",
    },
  ];
}

test("ordering is stable across repeated calls", async () => {
  const rows = sampleProjectionRows();
  let callCount = 0;

  const loadProjectionRows = async () => {
    callCount += 1;
    if (callCount % 2 === 1) return [rows[2], rows[0], rows[1]];
    return [rows[1], rows[2], rows[0]];
  };

  const run1 = await readPublishedMatrixRows({
    loadVersion: async () => ({ id: "v1", status: "PUBLISHED" }),
    loadProjectionRows,
  });
  const run2 = await readPublishedMatrixRows({
    loadVersion: async () => ({ id: "v1", status: "PUBLISHED" }),
    loadProjectionRows,
  });

  assert.equal(run1.ok, true);
  assert.equal(run2.ok, true);

  const stable = (rowsData) =>
    rowsData.map(
      (row) =>
        `${row.path_sort_key}|${row.row_kind}|${row.node_id}|${row.projection_parent_id ?? ""}|${row.source_edge_id ?? ""}`
    );

  assert.deepEqual(stable(run1.data.rows), stable(run2.data.rows));
});

test("ghost flags are derived from row_kind and secondary-link ghost rows remain ghost", async () => {
  const result = await readPublishedMatrixRows({
    loadVersion: async () => ({ id: "v1", status: "PUBLISHED" }),
    loadProjectionRows: async () => sampleProjectionRows(),
  });

  assert.equal(result.ok, true);
  const rows = result.data.rows;
  const xRows = rows.filter((row) => row.node_id === "x");

  assert.equal(xRows.length, 2);
  const primary = xRows.find((row) => row.row_kind === "primary");
  const ghost = xRows.find((row) => row.row_kind === "ghost_secondary");

  assert.ok(primary);
  assert.ok(ghost);
  assert.equal(primary.is_ghost, false);
  assert.equal(ghost.is_ghost, true);
  assert.equal(typeof ghost.reconciliation_key, "string");
  assert.equal(ghost.footnote_slot, null);
});

test("published-only contract rejects DRAFT versions", async () => {
  const result = await readPublishedMatrixRows({
    loadVersion: async () => ({ id: "v1", status: "DRAFT" }),
    loadProjectionRows: async () => sampleProjectionRows(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "NOT_FOUND");
  assert.equal(result.message, "Published ToC version not found");
});
