"use server"

import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

type DraftNodeType = "GOAL" | "OUTCOME" | "OUTPUT" | "ACTIVITY";
type DraftEdgeKind = "causal" | "secondary_link" | "feedback";
type DraftEdgeConfidence = "high" | "medium" | "low";
type DraftEdgeRiskFlag = "none" | "high_risk";

type CrudErrorCode = "NOT_FOUND" | "FORBIDDEN" | "VALIDATION" | "CONFLICT";

type CrudResult<T> =
    | { ok: true; data: T }
    | { ok: false; code: CrudErrorCode; message: string };

interface ScopedProject {
    tenantId: string;
    role: string;
}

interface DraftVersionRecord {
    id: string;
    status: string;
}

interface UnsafeSupabase {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: (table: string) => any;
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string; details?: string } | null }>;
}

const NODE_TYPES: DraftNodeType[] = ["GOAL", "OUTCOME", "OUTPUT", "ACTIVITY"];
const EDGE_KINDS: DraftEdgeKind[] = ["causal", "secondary_link", "feedback"];

function toUnsafeClient(supabase: SupabaseClient<Database>): UnsafeSupabase {
    return supabase as unknown as UnsafeSupabase;
}

function ok<T>(data: T): CrudResult<T> {
    return { ok: true, data };
}

function fail<T>(code: CrudErrorCode, message: string): CrudResult<T> {
    return { ok: false, code, message };
}

function isNodeType(value: string): value is DraftNodeType {
    return NODE_TYPES.includes(value as DraftNodeType);
}

function isEdgeKind(value: string): value is DraftEdgeKind {
    return EDGE_KINDS.includes(value as DraftEdgeKind);
}

/**
 * Utility to verify project exists and belongs to the active tenant.
 * Cross-org access resolves to "not found" semantics.
 */
async function verifyProjectContext(
    supabase: SupabaseClient<Database>,
    projectId: string,
    tenantId: string
) {
    const { data: project, error } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("tenant_id", tenantId)
        .single();

    if (error || !project) {
        throw new Error("Not found");
    }
}

async function resolveProjectScope(
    supabase: SupabaseClient<Database>,
    projectId: string
): Promise<CrudResult<ScopedProject>> {
    const tenant = await getActiveTenant(supabase);
    if (!tenant) return fail("FORBIDDEN", "Unauthorized: No active tenant");

    const { data: project, error } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .maybeSingle();

    if (error || !project) return fail("NOT_FOUND", "Project not found");

    return ok({
        tenantId: tenant.tenantId,
        role: tenant.role,
    });
}

/**
 * Strict check for editability:
 * - Active tenant exists
 * - Tenant role != "member"
 * - Project belongs to tenant
 * - Version belongs to tenant+project and status == "DRAFT"
 */
async function assertEditableContext(
    supabase: SupabaseClient<Database>,
    projectId: string,
    versionId: string
) {
    const tenant = await getActiveTenant(supabase);
    if (!tenant) throw new Error("Unauthorized: No active tenant");
    if (tenant.role === "member") throw new Error("Unauthorized: Member role is read-only");

    await verifyProjectContext(supabase, projectId, tenant.tenantId);

    const { data: version, error } = await supabase
        .from("toc_versions")
        .select("status")
        .eq("id", versionId)
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .single();

    if (error || !version || version.status !== "DRAFT") {
        throw new Error("Not found");
    }

    return tenant;
}

async function resolveDraftWriteScope(
    supabase: SupabaseClient<Database>,
    projectId: string,
    versionId: string
): Promise<CrudResult<ScopedProject & { version: DraftVersionRecord }>> {
    const scope = await resolveProjectScope(supabase, projectId);
    if (!scope.ok) return scope;

    if (scope.data.role === "member") {
        return fail("FORBIDDEN", "Unauthorized: Member role is read-only");
    }

    const { data: version, error } = await supabase
        .from("toc_versions")
        .select("id, status")
        .eq("id", versionId)
        .eq("project_id", projectId)
        .eq("tenant_id", scope.data.tenantId)
        .maybeSingle();

    if (error || !version || version.status !== "DRAFT") {
        return fail("NOT_FOUND", "Draft not found");
    }

    return ok({
        ...scope.data,
        version: version as DraftVersionRecord,
    });
}

export async function createDraftVersionAction(
    projectId: string,
    snapshotId: string,
    fromVersionId?: string
): Promise<CrudResult<{ versionId: string }>> {
    const supabase = await createClient();
    const scope = await resolveProjectScope(supabase, projectId);
    if (!scope.ok) return scope;

    const unsafe = toUnsafeClient(supabase);

    const { data: snapshot, error: snapshotError } = await unsafe
        .from("analysis_snapshots")
        .select("id")
        .eq("id", snapshotId)
        .eq("project_id", projectId)
        .eq("tenant_id", scope.data.tenantId)
        .maybeSingle();

    if (snapshotError || !snapshot) {
        return fail("NOT_FOUND", "Snapshot not found");
    }

    const { data, error } = await unsafe.rpc("create_toc_draft", {
        _tenant_id: scope.data.tenantId,
        _project_id: projectId,
        _analysis_snapshot_id: snapshotId,
        _from_version_id: fromVersionId || undefined
    });

    if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("draft already exists") || msg.includes("one_draft")) {
            return fail("CONFLICT", "A draft already exists for this project");
        }
        if (msg.includes("not found")) {
            return fail("NOT_FOUND", "Requested resource not found");
        }
        return fail("FORBIDDEN", `Unable to create draft: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
    return ok({ versionId: String(data) });
}

export interface UpsertDraftNodeInput {
    versionId: string;
    nodeType: DraftNodeType;
    title: string;
    description?: string | null;
    primaryParentId?: string | null;
    narrative?: string | null;
    nodeId?: string;
}

export async function upsertDraftNodeAction(
    projectId: string,
    input: UpsertDraftNodeInput
): Promise<CrudResult<{ node: Record<string, unknown> }>> {
    const supabase = await createClient();
    const scope = await resolveDraftWriteScope(supabase, projectId, input.versionId);
    if (!scope.ok) return scope;

    const unsafe = toUnsafeClient(supabase);

    if (!input.title.trim()) {
        return fail("VALIDATION", "Title is required");
    }

    if (input.nodeType === "GOAL" && input.primaryParentId) {
        return fail("VALIDATION", "GOAL nodes cannot have a primary parent");
    }

    if (input.nodeId && input.primaryParentId && input.nodeId === input.primaryParentId) {
        return fail("VALIDATION", "Node cannot be its own primary parent");
    }

    if (input.primaryParentId) {
        const { data: parentNode, error: parentError } = await unsafe
            .from("toc_nodes")
            .select("id")
            .eq("id", input.primaryParentId)
            .eq("toc_version_id", input.versionId)
            .eq("tenant_id", scope.data.tenantId)
            .maybeSingle();

        if (parentError || !parentNode) {
            return fail("NOT_FOUND", "Primary parent not found in draft");
        }
    }

    let data: Record<string, unknown> | null = null;
    let writeError: { message: string } | null = null;

    if (input.nodeId) {
        const { data: existingNode } = await unsafe
            .from("toc_nodes")
            .select("id")
            .eq("id", input.nodeId)
            .eq("toc_version_id", input.versionId)
            .eq("tenant_id", scope.data.tenantId)
            .maybeSingle();

        if (!existingNode) {
            return fail("NOT_FOUND", "Node not found");
        }

        const updatePayload: Record<string, unknown> = {
            node_type: input.nodeType,
            title: input.title.trim(),
            description: input.description ?? null,
            narrative: input.narrative ?? null,
            primary_parent_id: input.primaryParentId ?? null,
        };

        const updateResult = await unsafe
            .from("toc_nodes")
            .update(updatePayload)
            .eq("id", input.nodeId)
            .eq("toc_version_id", input.versionId)
            .eq("tenant_id", scope.data.tenantId)
            .select("id,node_type,title,description,narrative,pos_x,pos_y,primary_parent_id,toc_version_id,tenant_id")
            .maybeSingle();

        data = updateResult.data;
        writeError = updateResult.error;
    } else {
        const { count } = await supabase
            .from("toc_nodes")
            .select("*", { count: "exact", head: true })
            .eq("toc_version_id", input.versionId)
            .eq("node_type", input.nodeType);

        const typeColumns: Record<DraftNodeType, number> = {
            GOAL: 0,
            OUTCOME: 250,
            OUTPUT: 500,
            ACTIVITY: 750
        };

        const insertPayload: Record<string, unknown> = {
            tenant_id: scope.data.tenantId,
            toc_version_id: input.versionId,
            node_type: input.nodeType,
            title: input.title.trim(),
            description: input.description ?? null,
            narrative: input.narrative ?? null,
            primary_parent_id: input.primaryParentId ?? null,
            pos_x: typeColumns[input.nodeType],
            pos_y: (count || 0) * 100,
        };

        const insertResult = await unsafe
            .from("toc_nodes")
            .insert(insertPayload)
            .select("id,node_type,title,description,narrative,pos_x,pos_y,primary_parent_id,toc_version_id,tenant_id")
            .maybeSingle();

        data = insertResult.data;
        writeError = insertResult.error;
    }

    if (writeError) {
        return fail("VALIDATION", `Node write failed: ${writeError.message}`);
    }

    if (!data) {
        return fail("NOT_FOUND", "Node not found");
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
    return ok({ node: data });
}

export interface AddDraftEdgeInput {
    versionId: string;
    sourceNodeId: string;
    targetNodeId: string;
    edgeKind: DraftEdgeKind;
    edgeType?: string;
    mechanism?: string | null;
    confidence?: DraftEdgeConfidence;
    riskFlag?: DraftEdgeRiskFlag;
    sentinelIndicatorId?: string | null;
}

export async function addDraftEdgeAction(
    projectId: string,
    input: AddDraftEdgeInput
): Promise<CrudResult<{ edge: Record<string, unknown> }>> {
    const supabase = await createClient();
    const scope = await resolveDraftWriteScope(supabase, projectId, input.versionId);
    if (!scope.ok) return scope;

    if (input.sourceNodeId === input.targetNodeId) {
        return fail("VALIDATION", "Source and target must be different");
    }

    const unsafe = toUnsafeClient(supabase);

    const { data: nodes, error: nodeError } = await unsafe
        .from("toc_nodes")
        .select("id")
        .eq("toc_version_id", input.versionId)
        .eq("tenant_id", scope.data.tenantId)
        .in("id", [input.sourceNodeId, input.targetNodeId]);

    const nodeArray = Array.isArray(nodes) ? nodes : [];
    if (nodeError || nodeArray.length !== 2) {
        return fail("NOT_FOUND", "Source/target node not found in draft");
    }

    const existingEdgeResult = await unsafe
        .from("toc_edges")
        .select("id,source_node_id,target_node_id,edge_type,edge_kind")
        .eq("toc_version_id", input.versionId)
        .eq("tenant_id", scope.data.tenantId)
        .eq("source_node_id", input.sourceNodeId)
        .eq("target_node_id", input.targetNodeId)
        .eq("edge_kind", input.edgeKind)
        .maybeSingle();

    if (existingEdgeResult.data) {
        return ok({ edge: existingEdgeResult.data });
    }

    const insertPayload: Record<string, unknown> = {
        tenant_id: scope.data.tenantId,
        toc_version_id: input.versionId,
        source_node_id: input.sourceNodeId,
        target_node_id: input.targetNodeId,
        edge_type: input.edgeType || "CONTRIBUTES_TO",
        edge_kind: input.edgeKind,
        mechanism: input.mechanism ?? null,
        confidence: input.confidence || "medium",
        risk_flag: input.riskFlag || "none",
        sentinel_indicator_id: input.sentinelIndicatorId ?? null,
    };

    const { data: edge, error } = await unsafe
        .from("toc_edges")
        .insert(insertPayload)
        .select("id,source_node_id,target_node_id,edge_type,edge_kind,mechanism,confidence,risk_flag,sentinel_indicator_id")
        .maybeSingle();

    if (error) {
        return fail("VALIDATION", `Edge write failed: ${error.message}`);
    }

    if (!edge) {
        return fail("NOT_FOUND", "Edge not found");
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
    return ok({ edge });
}

export interface TocDraftReadPayload {
    draft: Record<string, unknown>;
    graph: {
        nodes: Array<Record<string, unknown>>;
        edges: Array<Record<string, unknown>>;
    };
    matrix: {
        rows: Array<Record<string, unknown>>;
    };
    wizard: {
        goal_node_id: string | null;
        counts: Record<DraftNodeType, number>;
    };
}

export async function readDraftPayloadAction(
    projectId: string,
    versionId?: string
): Promise<CrudResult<TocDraftReadPayload>> {
    const supabase = await createClient();
    const scope = await resolveProjectScope(supabase, projectId);
    if (!scope.ok) return scope;

    const unsafe = toUnsafeClient(supabase);

    let versionQuery = unsafe
        .from("toc_versions")
        .select("id,project_id,tenant_id,status,version_number,version_label,analysis_snapshot_id,created_at")
        .eq("tenant_id", scope.data.tenantId)
        .eq("project_id", projectId)
        .eq("status", "DRAFT");

    if (versionId) {
        versionQuery = versionQuery.eq("id", versionId);
    }

    const { data: versionRows, error: versionError } = await versionQuery
        .order("created_at", { ascending: false })
        .limit(1);

    const draftRow = Array.isArray(versionRows) ? versionRows[0] : null;
    if (versionError || !draftRow) {
        return fail("NOT_FOUND", "Draft not found");
    }

    const draftId = String(draftRow.id);

    const [nodesResult, edgesResult, nodeAssumptionsResult, edgeAssumptionsResult, projectionResult] =
        await Promise.all([
            unsafe
                .from("toc_nodes")
                .select("id,node_type,title,description,narrative,pos_x,pos_y,primary_parent_id,primary_path_key")
                .eq("toc_version_id", draftId)
                .eq("tenant_id", scope.data.tenantId),
            unsafe
                .from("toc_edges")
                .select("id,source_node_id,target_node_id,edge_type,edge_kind,mechanism,confidence,risk_flag,sentinel_indicator_id")
                .eq("toc_version_id", draftId)
                .eq("tenant_id", scope.data.tenantId),
            unsafe
                .from("toc_assumptions")
                .select("id,node_id,assumption_text,risk_level")
                .eq("toc_version_id", draftId)
                .eq("tenant_id", scope.data.tenantId),
            unsafe
                .from("toc_edge_assumptions")
                .select("id,edge_id,assumption_text,risk_level")
                .eq("toc_version_id", draftId)
                .eq("tenant_id", scope.data.tenantId),
            unsafe.rpc("read_toc_projection_matrix", {
                _tenant_id: scope.data.tenantId,
                _project_id: projectId,
                _toc_version_id: draftId,
            }),
        ]);

    if (nodesResult.error || edgesResult.error || nodeAssumptionsResult.error || edgeAssumptionsResult.error || projectionResult.error) {
        return fail("FORBIDDEN", "Unable to load draft payload");
    }

    const nodeRows: Array<Record<string, unknown>> = Array.isArray(nodesResult.data) ? nodesResult.data as Array<Record<string, unknown>> : [];
    const edgeRows: Array<Record<string, unknown>> = Array.isArray(edgesResult.data) ? edgesResult.data as Array<Record<string, unknown>> : [];
    const nodeAssumptions: Array<Record<string, unknown>> = Array.isArray(nodeAssumptionsResult.data) ? nodeAssumptionsResult.data as Array<Record<string, unknown>> : [];
    const edgeAssumptions: Array<Record<string, unknown>> = Array.isArray(edgeAssumptionsResult.data) ? edgeAssumptionsResult.data as Array<Record<string, unknown>> : [];
    const projections: Array<Record<string, unknown>> = Array.isArray(projectionResult.data) ? projectionResult.data as Array<Record<string, unknown>> : [];

    const primaryPathByNodeId = new Map<string, Array<unknown>>();
    for (const row of projections) {
        if (String(row.row_kind || "") !== "primary") continue;
        if (!Array.isArray(row.primary_path_key)) continue;
        primaryPathByNodeId.set(String(row.node_id), row.primary_path_key);
    }

    const nodeAssumptionMap = new Map<string, Array<Record<string, unknown>>>();
    for (const row of nodeAssumptions) {
        const nodeId = String(row.node_id);
        const list = nodeAssumptionMap.get(nodeId) || [];
        list.push(row);
        nodeAssumptionMap.set(nodeId, list);
    }

    const edgeAssumptionMap = new Map<string, Array<Record<string, unknown>>>();
    for (const row of edgeAssumptions) {
        const edgeId = String(row.edge_id);
        const list = edgeAssumptionMap.get(edgeId) || [];
        list.push(row);
        edgeAssumptionMap.set(edgeId, list);
    }

    const nodesWithAssumptions: Array<Record<string, unknown>> = nodeRows.map((node: Record<string, unknown>) => {
        const nodeId = String(node.id);
        return {
            ...node,
            primary_path_key: primaryPathByNodeId.get(nodeId) ?? node.primary_path_key ?? null,
            toc_assumptions: nodeAssumptionMap.get(nodeId) || [],
        };
    });

    const edgesWithAssumptions: Array<Record<string, unknown>> = edgeRows.map((edge: Record<string, unknown>) => ({
        ...edge,
        toc_edge_assumptions: edgeAssumptionMap.get(String(edge.id)) || [],
    }));

    const nodeById = new Map<string, Record<string, unknown>>();
    for (const node of nodesWithAssumptions) {
        nodeById.set(String(node.id), node);
    }

    const matrixRows = (projections.length > 0 ? projections : nodesWithAssumptions.map((node: Record<string, unknown>) => {
        const nodePath = Array.isArray(node.primary_path_key) && node.primary_path_key.length > 0
            ? node.primary_path_key
            : [node.id];
        const goalId = nodePath.length > 0 ? String(nodePath[0]) : null;
        const outcomeId = nodePath.length > 1 ? String(nodePath[1]) : null;
        const outputId = nodePath.length > 2 ? String(nodePath[2]) : null;
        const pathSortKey = `${nodePath.map(String).join("~")}|0|edge:none|node:${String(node.id)}`;
        return {
            node_id: node.id,
            primary_path_key: nodePath,
            path_key: nodePath,
            path_sort_key: pathSortKey,
            row_kind: "primary",
            is_ghost: false,
            source_edge_id: null,
            projection_parent_id: node.primary_parent_id ?? null,
            primary_parent_id: node.primary_parent_id ?? null,
            goal_id: goalId,
            outcome_id: outcomeId,
            output_id: outputId,
            depth: nodePath.length,
        };
    }))
        .map((row: Record<string, unknown>) => {
            const node = nodeById.get(String(row.node_id));
            const path = Array.isArray(row.path_key) ? row.path_key : [];
            const rowKind = String(row.row_kind || (row.is_ghost ? "ghost_secondary" : "primary"));
            return {
                node_id: row.node_id,
                node_type: row.node_type || node?.node_type || null,
                node_title: row.node_title || node?.title || null,
                node_description: row.node_description || node?.description || null,
                node_narrative: row.node_narrative || node?.narrative || null,
                path_key: path,
                path_display: path.map(String).join(">"),
                primary_path_key: Array.isArray(row.primary_path_key) ? row.primary_path_key : [],
                path_sort_key: String(row.path_sort_key || ""),
                row_kind: rowKind,
                is_ghost: rowKind === "ghost_secondary",
                source_edge_id: row.source_edge_id || null,
                projection_parent_id: row.projection_parent_id || null,
                primary_parent_id: row.primary_parent_id || null,
                goal_id: row.goal_id || null,
                outcome_id: row.outcome_id || null,
                output_id: row.output_id || null,
                depth: Number(row.depth ?? path.length),
            };
        })
        .sort((a, b) => {
            const nullUuid = "00000000-0000-0000-0000-000000000000";
            const bySortKey = String(a.path_sort_key).localeCompare(String(b.path_sort_key));
            if (bySortKey !== 0) return bySortKey;
            const byKind = String(a.row_kind).localeCompare(String(b.row_kind));
            if (byKind !== 0) return byKind;
            const byNode = String(a.node_id).localeCompare(String(b.node_id));
            if (byNode !== 0) return byNode;
            const byProjectionParent = String(a.projection_parent_id || nullUuid).localeCompare(String(b.projection_parent_id || nullUuid));
            if (byProjectionParent !== 0) return byProjectionParent;
            return String(a.source_edge_id || nullUuid).localeCompare(String(b.source_edge_id || nullUuid));
        });

    const counts: Record<DraftNodeType, number> = {
        GOAL: 0,
        OUTCOME: 0,
        OUTPUT: 0,
        ACTIVITY: 0,
    };

    let goalNodeId: string | null = null;
    for (const node of nodesWithAssumptions) {
        const type = String(node.node_type);
        if (isNodeType(type)) {
            counts[type] += 1;
            if (type === "GOAL" && !goalNodeId) goalNodeId = String(node.id);
        }
    }

    return ok({
        draft: draftRow,
        graph: {
            nodes: nodesWithAssumptions,
            edges: edgesWithAssumptions,
        },
        matrix: {
            rows: matrixRows,
        },
        wizard: {
            goal_node_id: goalNodeId,
            counts,
        },
    });
}

export async function createTocDraft(
    projectId: string,
    snapshotId: string,
    fromVersionId?: string
) {
    const result = await createDraftVersionAction(projectId, snapshotId, fromVersionId);
    if (!result.ok) {
        throw new Error(result.message);
    }
    return result.data.versionId;
}

export async function publishToc(projectId: string, versionId: string) {
    const supabase = await createClient();
    const scope = await resolveProjectScope(supabase, projectId);
    if (!scope.ok || scope.data.role === "member") {
        return {
            error: "Not found",
            gateCodes: [],
            gateResults: [],
        };
    }

    const unsafe = toUnsafeClient(supabase);
    const { publishDraftWithGateA } = await import("@/lib/toc/publishService.mjs");

    const publishResult = await publishDraftWithGateA({
        loadDraftPayload: async () => {
            const { data: draft, error: draftError } = await unsafe
                .from("toc_versions")
                .select("id")
                .eq("id", versionId)
                .eq("project_id", projectId)
                .eq("tenant_id", scope.data.tenantId)
                .eq("status", "DRAFT")
                .maybeSingle();

            if (draftError || !draft) {
                return { found: false };
            }

            const [nodesResult, edgesResult, rlsResult] = await Promise.all([
                unsafe
                    .from("toc_nodes")
                    .select("id,node_type,primary_parent_id")
                    .eq("toc_version_id", versionId)
                    .eq("tenant_id", scope.data.tenantId),
                unsafe
                    .from("toc_edges")
                    .select("id,source_node_id,target_node_id,edge_kind,mechanism,confidence,risk_flag,sentinel_indicator_id")
                    .eq("toc_version_id", versionId)
                    .eq("tenant_id", scope.data.tenantId),
                unsafe.rpc("ga_rls_baseline_ok", {}),
            ]);

            if (nodesResult.error || edgesResult.error || rlsResult.error) {
                return { found: false };
            }

            return {
                found: true,
                nodes: Array.isArray(nodesResult.data) ? nodesResult.data : [],
                edges: Array.isArray(edgesResult.data) ? edgesResult.data : [],
                rlsBaselineOk: Boolean(rlsResult.data),
            };
        },
        executeAtomicPublish: async () => {
            const { data, error } = await unsafe.rpc("publish_toc_version_atomic", {
                _tenant_id: scope.data.tenantId,
                _project_id: projectId,
                _version_id: versionId,
            });

            if (error || !data) {
                return {
                    ok: false,
                    code: "NOT_FOUND",
                    message: "Draft not found",
                };
            }

            const payload = data as {
                ok?: boolean;
                code?: string;
                message?: string;
            };

            if (payload.ok !== true) {
                return {
                    ok: false,
                    code: payload.code || "NOT_FOUND",
                    message: payload.message || "Draft not found",
                };
            }

            return { ok: true, data };
        },
    });

    if (!publishResult.ok) {
        if (publishResult.code === "GA_VALIDATION_FAILED") {
            const gateCodes = publishResult.violations.map((v: { error_code: string }) => v.error_code);
            return {
                error: "Gate A failed",
                gateCodes,
                gateResults: publishResult.violations,
            };
        }

        return {
            error: "Not found",
            gateCodes: [],
            gateResults: [],
        };
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
    return {
        data: publishResult.data,
        gateResults: [],
    };
}

export async function exportMatrixCsv(
    projectId: string,
    versionId: string,
    analysisSnapshotId: string,
    windowStart: string,
    windowEnd: string
) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) return { error: "Unauthorized: No active tenant" };
    await verifyProjectContext(supabase, projectId, tenant.tenantId);

    if (!analysisSnapshotId) {
        return { error: "analysis_snapshot_id is required" };
    }

    if (!windowStart || !windowEnd) {
        return { error: "window_start and window_end are required" };
    }

    const { data, error } = await (supabase as unknown as {
        rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
    }).rpc("export_matrix_csv", {
        _tenant_id: tenant.tenantId,
        _project_id: projectId,
        _toc_version_id: versionId,
        _analysis_snapshot_id: analysisSnapshotId,
        _window_start: windowStart,
        _window_end: windowEnd,
        _config_json: { allocation_mode: "contribution" }
    });

    if (error || !data) {
        return { error: error?.message || "Export failed" };
    }

    const payload = data as {
        manifest_id: string;
        csv_hash: string;
        config_hash: string;
        hash: string;
        row_count: number;
        schema_version: string;
        csv_text: string;
    };

    revalidatePath(`/app/projects/${projectId}/toc`);
    return {
        data: {
            manifestId: payload.manifest_id,
            csvHash: payload.csv_hash,
            configHash: payload.config_hash,
            hash: payload.hash,
            rowCount: payload.row_count,
            schemaVersion: payload.schema_version,
            csv: payload.csv_text,
        }
    };
}

export async function addNode(
    projectId: string,
    versionId: string,
    nodeType: string,
    title: string,
    description: string,
    primaryParentId?: string | null
) {
    if (!isNodeType(nodeType)) {
        throw new Error("Validation: Invalid node type");
    }

    const result = await upsertDraftNodeAction(projectId, {
        versionId,
        nodeType,
        title,
        description,
        primaryParentId: primaryParentId ?? null,
    });

    if (!result.ok) {
        throw new Error(result.message);
    }

    return result.data.node;
}

export async function updateNode(
    projectId: string,
    versionId: string,
    nodeId: string,
    nodeType: DraftNodeType,
    title: string,
    description: string,
    primaryParentId?: string | null
) {
    const result = await upsertDraftNodeAction(projectId, {
        versionId,
        nodeId,
        nodeType,
        title,
        description,
        primaryParentId: primaryParentId ?? null,
    });

    if (!result.ok) {
        throw new Error(result.message);
    }

    return result.data.node;
}

export async function deleteNode(projectId: string, versionId: string, nodeId: string) {
    const supabase = await createClient();
    const tenant = await assertEditableContext(supabase, projectId, versionId);

    const { error: eError } = await supabase
        .from("toc_edges")
        .delete()
        .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`)
        .eq("toc_version_id", versionId)
        .eq("tenant_id", tenant.tenantId);

    if (eError) throw new Error(`Error deleting node edges: ${eError.message}`);

    const { error: nError } = await supabase
        .from("toc_nodes")
        .delete()
        .eq("id", nodeId)
        .eq("toc_version_id", versionId)
        .eq("tenant_id", tenant.tenantId);

    if (nError) throw new Error(`Error deleting node: ${nError.message}`);

    revalidatePath(`/app/projects/${projectId}/toc`);
}

export async function updateNodePosition(
    projectId: string,
    versionId: string,
    nodeId: string,
    pos_x: number,
    pos_y: number
) {
    const supabase = await createClient();
    const tenant = await assertEditableContext(supabase, projectId, versionId);

    const { error } = await supabase
        .from("toc_nodes")
        .update({ pos_x, pos_y })
        .eq("id", nodeId)
        .eq("toc_version_id", versionId)
        .eq("tenant_id", tenant.tenantId);

    if (error) {
        throw new Error(`Error updating node position: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
}

export async function addEdge(
    projectId: string,
    versionId: string,
    sourceId: string,
    targetId: string,
    edgeType: string = "CONTRIBUTES_TO",
    edgeKind: DraftEdgeKind = "causal"
) {
    if (!isEdgeKind(edgeKind)) {
        throw new Error("Validation: Invalid edge kind");
    }

    const result = await addDraftEdgeAction(projectId, {
        versionId,
        sourceNodeId: sourceId,
        targetNodeId: targetId,
        edgeType,
        edgeKind,
    });

    if (!result.ok) {
        throw new Error(result.message);
    }

    const edge = result.data.edge;
    return {
        id: String(edge.id),
        source_node_id: String(edge.source_node_id),
        target_node_id: String(edge.target_node_id),
        edge_type: String(edge.edge_type || edgeType),
        edge_kind: String(edge.edge_kind || edgeKind),
    };
}

export async function deleteEdge(projectId: string, versionId: string, edgeId: string) {
    const supabase = await createClient();
    const tenant = await assertEditableContext(supabase, projectId, versionId);

    const { error } = await supabase
        .from("toc_edges")
        .delete()
        .eq("id", edgeId)
        .eq("toc_version_id", versionId)
        .eq("tenant_id", tenant.tenantId);

    if (error) throw new Error(`Error deleting edge: ${error.message}`);

    revalidatePath(`/app/projects/${projectId}/toc`);
}

export async function addNodeAssumption(
    projectId: string,
    versionId: string,
    nodeId: string,
    text: string,
    riskLevel: "LOW" | "MEDIUM" | "HIGH"
) {
    const supabase = await createClient();
    const tenant = await assertEditableContext(supabase, projectId, versionId);

    const { data, error } = await supabase
        .from("toc_assumptions")
        .insert({
            tenant_id: tenant.tenantId,
            toc_version_id: versionId,
            node_id: nodeId,
            assumption_text: text,
            risk_level: riskLevel
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Error adding assumption: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
    return data;
}

export async function addEdgeAssumption(
    projectId: string,
    versionId: string,
    edgeId: string,
    text: string,
    riskLevel: "LOW" | "MEDIUM" | "HIGH"
) {
    const supabase = await createClient();
    const tenant = await assertEditableContext(supabase, projectId, versionId);

    const { data, error } = await supabase
        .from("toc_edge_assumptions")
        .insert({
            tenant_id: tenant.tenantId,
            toc_version_id: versionId,
            edge_id: edgeId,
            assumption_text: text,
            risk_level: riskLevel
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Error adding edge assumption: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
    return data;
}

export async function deleteEdgeAssumption(
    projectId: string,
    versionId: string,
    edgeAssumptionId: string
) {
    const supabase = await createClient();
    const tenant = await assertEditableContext(supabase, projectId, versionId);

    const { error } = await supabase
        .from("toc_edge_assumptions")
        .delete()
        .eq("id", edgeAssumptionId)
        .eq("toc_version_id", versionId)
        .eq("tenant_id", tenant.tenantId);

    if (error) {
        throw new Error(`Error deleting edge assumption: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
}
