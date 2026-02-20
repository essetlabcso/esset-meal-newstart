const NULL_UUID = "00000000-0000-0000-0000-000000000000";

function cmpText(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function normalizeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function normalizeUuid(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function rowKindFrom(row) {
  const raw = normalizeText(row?.row_kind, "");
  if (raw) return raw;
  return row?.is_ghost ? "ghost_secondary" : "primary";
}

function rowKindRank(rowKind) {
  if (rowKind === "primary") return 0;
  if (rowKind === "ghost_secondary") return 1;
  return 2;
}

function reconciliationKeyOf(row) {
  return [
    `node:${normalizeText(row.node_id)}`,
    `goal:${normalizeText(row.goal_id, NULL_UUID)}`,
    `outcome:${normalizeText(row.outcome_id, NULL_UUID)}`,
    `output:${normalizeText(row.output_id, NULL_UUID)}`,
    `projection_parent:${normalizeText(row.projection_parent_id, NULL_UUID)}`,
    `kind:${normalizeText(row.row_kind)}`,
  ].join("|");
}

export function normalizeAndSortMatrixRows(rawRows) {
  const mapped = (Array.isArray(rawRows) ? rawRows : []).map((raw) => {
    const row_kind = rowKindFrom(raw);
    const is_ghost = row_kind === "ghost_secondary";

    const row = {
      tenant_id: normalizeUuid(raw?.tenant_id),
      project_id: normalizeUuid(raw?.project_id),
      toc_version_id: normalizeUuid(raw?.toc_version_id),
      node_id: normalizeText(raw?.node_id),
      primary_path_key: Array.isArray(raw?.primary_path_key) ? raw.primary_path_key.map(String) : [],
      path_key: Array.isArray(raw?.path_key) ? raw.path_key.map(String) : [],
      path_sort_key: normalizeText(raw?.path_sort_key),
      row_kind,
      is_ghost,
      source_edge_id: normalizeUuid(raw?.source_edge_id),
      source_edge_kind: normalizeText(raw?.source_edge_kind, null),
      projection_parent_id: normalizeUuid(raw?.projection_parent_id),
      primary_parent_id: normalizeUuid(raw?.primary_parent_id),
      goal_id: normalizeUuid(raw?.goal_id),
      outcome_id: normalizeUuid(raw?.outcome_id),
      output_id: normalizeUuid(raw?.output_id),
      depth: Number(raw?.depth ?? 0),
      node_type: normalizeText(raw?.node_type, null),
      node_title: normalizeText(raw?.node_title, null),
      node_description: normalizeText(raw?.node_description, null),
      node_narrative: normalizeText(raw?.node_narrative, null),
      footnote_slot: null,
    };

    return {
      ...row,
      reconciliation_key: reconciliationKeyOf(row),
    };
  });

  mapped.sort((a, b) => {
    const bySortKey = cmpText(a.path_sort_key, b.path_sort_key);
    if (bySortKey !== 0) return bySortKey;

    const byKind = rowKindRank(a.row_kind) - rowKindRank(b.row_kind);
    if (byKind !== 0) return byKind;

    const byNode = cmpText(a.node_id, b.node_id);
    if (byNode !== 0) return byNode;

    const byProjectionParent = cmpText(
      normalizeText(a.projection_parent_id, NULL_UUID),
      normalizeText(b.projection_parent_id, NULL_UUID)
    );
    if (byProjectionParent !== 0) return byProjectionParent;

    return cmpText(
      normalizeText(a.source_edge_id, NULL_UUID),
      normalizeText(b.source_edge_id, NULL_UUID)
    );
  });

  return mapped;
}

export async function readPublishedMatrixRows({ loadVersion, loadProjectionRows }) {
  const version = await loadVersion();
  if (!version || version.status !== "PUBLISHED") {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Published ToC version not found",
    };
  }

  const rows = await loadProjectionRows();
  return {
    ok: true,
    data: {
      rows: normalizeAndSortMatrixRows(rows),
    },
  };
}

export async function loadPublishedMatrixRows({
  supabase,
  tenantId,
  projectId,
  tocVersionId,
}) {
  return readPublishedMatrixRows({
    loadVersion: async () => {
      const { data, error } = await supabase
        .from("toc_versions")
        .select("id,status")
        .eq("id", tocVersionId)
        .eq("tenant_id", tenantId)
        .eq("project_id", projectId)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    },
    loadProjectionRows: async () => {
      const { data, error } = await supabase.rpc("read_toc_projection_matrix", {
        _tenant_id: tenantId,
        _project_id: projectId,
        _toc_version_id: tocVersionId,
      });

      if (error) {
        throw new Error(error.message || "Projection read failed");
      }

      return Array.isArray(data) ? data : [];
    },
  });
}
