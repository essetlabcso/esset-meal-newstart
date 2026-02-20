/**
 * Option C projection contract helpers (TOC-PROJ-01..04).
 * Explicit field mapping:
 * - Primary parent relation: toc_nodes.primary_parent_id
 * - Secondary ghost trigger: toc_edges.edge_kind = 'secondary_link'
 * - Node order fields: toc_nodes.created_at, toc_nodes.id
 * - Ghost edge tie-breakers: toc_edges.created_at, toc_edges.id
 */

export const PROJECTION_FIELD_MAP = Object.freeze({
  primary_parent_field: "toc_nodes.primary_parent_id",
  secondary_edge_field: "toc_edges.edge_kind",
  secondary_edge_value: "secondary_link",
  node_order_fields: Object.freeze(["toc_nodes.created_at", "toc_nodes.id"]),
  edge_order_fields: Object.freeze(["toc_edges.created_at", "toc_edges.id"]),
});

const EPOCH_TOKEN = "1970-01-01T00:00:00.000Z";

function normalizeIso(value) {
  if (!value) return EPOCH_TOKEN;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return EPOCH_TOKEN;
  return parsed.toISOString();
}

function normalizeNode(raw) {
  const id = String(raw?.id ?? raw?.node_id ?? "");
  return {
    id,
    node_type: String(raw?.node_type ?? raw?.type ?? "").toUpperCase(),
    primary_parent_id: raw?.primary_parent_id ?? raw?.primaryParentId ?? null,
    created_at_iso: normalizeIso(raw?.created_at),
    title: raw?.title ?? raw?.node_title ?? null,
    description: raw?.description ?? raw?.node_description ?? null,
    narrative: raw?.narrative ?? raw?.node_narrative ?? null,
  };
}

function normalizeEdge(raw) {
  const id = String(raw?.id ?? raw?.edge_id ?? "");
  return {
    id,
    source_node_id:
      raw?.source_node_id ?? raw?.from_node_id ?? raw?.sourceId ?? null,
    target_node_id:
      raw?.target_node_id ?? raw?.to_node_id ?? raw?.targetId ?? null,
    edge_kind: String(raw?.edge_kind ?? raw?.kind ?? "causal").toLowerCase(),
    created_at_iso: normalizeIso(raw?.created_at),
  };
}

function nodeOrderToken(node) {
  return `${node.created_at_iso}:${node.id}`;
}

function edgeOrderToken(edge) {
  return `${edge.created_at_iso}:${edge.id}`;
}

function byTokenThenId(a, b, tokenOf) {
  const aToken = tokenOf(a);
  const bToken = tokenOf(b);
  if (aToken !== bToken) return aToken.localeCompare(bToken);
  return String(a.id).localeCompare(String(b.id));
}

function decorateSegments(pathKey) {
  return {
    goal_id: pathKey[0] ?? null,
    outcome_id: pathKey[1] ?? null,
    output_id: pathKey[2] ?? null,
    depth: pathKey.length,
  };
}

function rowKindRank(rowKind) {
  return rowKind === "primary" ? 0 : 1;
}

/**
 * @param {{
 *   nodes: Array<Record<string, unknown>>,
 *   edges: Array<Record<string, unknown>>
 * }} input
 * @returns {Array<{
 *   node_id: string,
 *   primary_path_key: string[],
 *   path_key: string[],
 *   path_sort_key: string,
 *   row_kind: "primary" | "ghost_secondary",
 *   is_ghost: boolean,
 *   source_edge_id: string | null,
 *   source_edge_kind: string | null,
 *   projection_parent_id: string | null,
 *   primary_parent_id: string | null,
 *   goal_id: string | null,
 *   outcome_id: string | null,
 *   output_id: string | null,
 *   depth: number,
 *   node_type: string | null,
 *   node_title: string | null,
 *   node_description: string | null,
 *   node_narrative: string | null
 * }>}
 */
export function buildProjectionRows(input) {
  const nodes = Array.isArray(input?.nodes)
    ? input.nodes.map(normalizeNode).filter((n) => n.id !== "")
    : [];
  const edges = Array.isArray(input?.edges)
    ? input.edges.map(normalizeEdge).filter((e) => e.id !== "")
    : [];

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const childrenByParent = new Map();
  for (const node of nodes) {
    if (!node.primary_parent_id) continue;
    const parentId = String(node.primary_parent_id);
    const list = childrenByParent.get(parentId) || [];
    list.push(node);
    childrenByParent.set(parentId, list);
  }
  for (const list of childrenByParent.values()) {
    list.sort((a, b) => byTokenThenId(a, b, nodeOrderToken));
  }

  const orderedNodes = [...nodes].sort((a, b) =>
    byTokenThenId(a, b, nodeOrderToken)
  );
  const goalRoots = orderedNodes.filter(
    (node) => node.node_type === "GOAL" && !node.primary_parent_id
  );
  const fallbackRoots = orderedNodes.filter((node) => !node.primary_parent_id);
  const roots =
    goalRoots.length > 0
      ? goalRoots
      : fallbackRoots.length > 0
        ? fallbackRoots
        : orderedNodes;

  const visited = new Set();
  const primaryPathByNode = new Map();
  const primarySortTokensByNode = new Map();
  const rows = [];

  function addPrimaryRow(node, primaryPathKey, pathSortTokens) {
    const segments = decorateSegments(primaryPathKey);
    rows.push({
      node_id: node.id,
      primary_path_key: primaryPathKey,
      path_key: primaryPathKey,
      path_sort_key: `${pathSortTokens.join("~")}|0|edge:none|node:${node.id}`,
      row_kind: "primary",
      is_ghost: false,
      source_edge_id: null,
      source_edge_kind: null,
      projection_parent_id: node.primary_parent_id ? String(node.primary_parent_id) : null,
      primary_parent_id: node.primary_parent_id ? String(node.primary_parent_id) : null,
      goal_id: segments.goal_id,
      outcome_id: segments.outcome_id,
      output_id: segments.output_id,
      depth: segments.depth,
      node_type: node.node_type || null,
      node_title: node.title ?? null,
      node_description: node.description ?? null,
      node_narrative: node.narrative ?? null,
    });
  }

  function traversePrimary(node, parentPathKey, parentSortTokens) {
    if (!node || visited.has(node.id)) return;
    if (parentPathKey.includes(node.id)) return;

    const pathKey = [...parentPathKey, node.id];
    const pathSortTokens = [...parentSortTokens, nodeOrderToken(node)];
    visited.add(node.id);
    primaryPathByNode.set(node.id, pathKey);
    primarySortTokensByNode.set(node.id, pathSortTokens);
    addPrimaryRow(node, pathKey, pathSortTokens);

    const children = childrenByParent.get(node.id) || [];
    for (const child of children) {
      traversePrimary(child, pathKey, pathSortTokens);
    }
  }

  for (const root of roots) {
    traversePrimary(root, [], []);
  }
  for (const node of orderedNodes) {
    if (!visited.has(node.id)) {
      traversePrimary(node, [], []);
    }
  }

  const ghostEdges = edges
    .filter((edge) => edge.edge_kind === "secondary_link")
    .sort((a, b) => byTokenThenId(a, b, edgeOrderToken));

  for (const edge of ghostEdges) {
    const parentId = edge.source_node_id ? String(edge.source_node_id) : null;
    const childId = edge.target_node_id ? String(edge.target_node_id) : null;
    if (!parentId || !childId) continue;

    const parent = nodeById.get(parentId);
    const child = nodeById.get(childId);
    if (!parent || !child) continue;

    const parentPath = primaryPathByNode.get(parentId);
    const parentSortTokens = primarySortTokensByNode.get(parentId);
    if (!parentPath || !parentSortTokens) continue;

    const childPrimaryPath = primaryPathByNode.get(childId) || [childId];
    const ghostPathKey = [...parentPath, childId];
    const ghostSortTokens = [...parentSortTokens, nodeOrderToken(child)];
    const segments = decorateSegments(ghostPathKey);

    rows.push({
      node_id: childId,
      primary_path_key: childPrimaryPath,
      path_key: ghostPathKey,
      path_sort_key: `${ghostSortTokens.join("~")}|1|${edgeOrderToken(edge)}|node:${childId}|parent:${parentId}`,
      row_kind: "ghost_secondary",
      is_ghost: true,
      source_edge_id: edge.id,
      source_edge_kind: "secondary_link",
      projection_parent_id: parentId,
      primary_parent_id: child.primary_parent_id ? String(child.primary_parent_id) : null,
      goal_id: segments.goal_id,
      outcome_id: segments.outcome_id,
      output_id: segments.output_id,
      depth: segments.depth,
      node_type: child.node_type || null,
      node_title: child.title ?? null,
      node_description: child.description ?? null,
      node_narrative: child.narrative ?? null,
    });
  }

  const dedupedRows = [];
  const seen = new Set();
  for (const row of rows) {
    const key = [
      row.row_kind,
      row.node_id,
      row.path_key.join(">"),
      row.source_edge_id ?? "",
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    dedupedRows.push(row);
  }

  dedupedRows.sort((a, b) => {
    const bySortKey = a.path_sort_key.localeCompare(b.path_sort_key);
    if (bySortKey !== 0) return bySortKey;
    const byKind = rowKindRank(a.row_kind) - rowKindRank(b.row_kind);
    if (byKind !== 0) return byKind;
    const byNode = a.node_id.localeCompare(b.node_id);
    if (byNode !== 0) return byNode;
    const byProjectionParent = String(a.projection_parent_id ?? "").localeCompare(
      String(b.projection_parent_id ?? "")
    );
    if (byProjectionParent !== 0) return byProjectionParent;
    return String(a.source_edge_id ?? "").localeCompare(String(b.source_edge_id ?? ""));
  });

  return dedupedRows;
}
