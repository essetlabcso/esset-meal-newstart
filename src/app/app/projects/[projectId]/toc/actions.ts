"use server"

import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

/**
 * Utility to verify project exists and belongs to the active tenant.
 */
async function verifyProjectContext(supabase: SupabaseClient<Database>, projectId: string, tenantId: string) {
    const { data: project, error } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("tenant_id", tenantId)
        .single();

    if (error || !project) {
        throw new Error("Unauthorized: Project context invalid");
    }
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

    if (error || !version) {
        throw new Error("Unauthorized: ToC version context invalid");
    }

    if (version.status !== "DRAFT") {
        throw new Error("Immutable: Cannot modify a published version");
    }

    return tenant;
}

export async function createTocDraft(
    projectId: string,
    snapshotId: string,
    fromVersionId?: string
) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");
    await verifyProjectContext(supabase, projectId, tenant.tenantId);

    const { data: newVersionId, error } = await supabase.rpc("create_toc_draft", {
        _tenant_id: tenant.tenantId,
        _project_id: projectId,
        _analysis_snapshot_id: snapshotId,
        _from_version_id: fromVersionId || undefined
    });

    if (error) {
        throw new Error(`Error creating ToC draft: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
    return newVersionId;
}

export async function publishToc(projectId: string, versionId: string) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");
    if (tenant.role === "member") throw new Error("Unauthorized: Admin role required for publish");
    await verifyProjectContext(supabase, projectId, tenant.tenantId);

    const { error } = await supabase.rpc("publish_toc_version", {
        _tenant_id: tenant.tenantId,
        _project_id: projectId,
        _version_id: versionId
    });

    if (error) {
        throw new Error(`Error publishing ToC: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
}

export async function addNode(
    projectId: string,
    versionId: string,
    nodeType: string,
    title: string,
    description: string
) {
    const supabase = await createClient();
    const tenant = await assertEditableContext(supabase, projectId, versionId);

    // Get existing nodes of this type in this version for row offset
    const { count } = await supabase
        .from("toc_nodes")
        .select("*", { count: "exact", head: true })
        .eq("toc_version_id", versionId)
        .eq("node_type", nodeType);

    const typeColumns: Record<string, number> = {
        GOAL: 0,
        OUTCOME: 250,
        OUTPUT: 500,
        ACTIVITY: 750
    };

    const pos_x = typeColumns[nodeType] || 0;
    const pos_y = (count || 0) * 100;

    const { data, error } = await supabase
        .from("toc_nodes")
        .insert({
            tenant_id: tenant.tenantId,
            toc_version_id: versionId,
            node_type: nodeType,
            title,
            description,
            pos_x,
            pos_y
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Error adding node: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
    return data;
}

export async function deleteNode(projectId: string, versionId: string, nodeId: string) {
    const supabase = await createClient();
    const tenant = await assertEditableContext(supabase, projectId, versionId);

    // 1. Delete connected edges first (source or target)
    const { error: eError } = await supabase
        .from("toc_edges")
        .delete()
        .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`)
        .eq("toc_version_id", versionId)
        .eq("tenant_id", tenant.tenantId);

    if (eError) throw new Error(`Error deleting node edges: ${eError.message}`);

    // 2. Delete the node
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

    // Update node
    const { error } = await supabase
        .from("toc_nodes")
        .update({ pos_x, pos_y })
        .eq("id", nodeId)
        .eq("toc_version_id", versionId)
        .eq("tenant_id", tenant.tenantId);

    if (error) {
        throw new Error(`Error updating node position: ${error.message}`);
    }

    // Usually avoid full revalidate for drag, but for consistency:
    revalidatePath(`/app/projects/${projectId}/toc`);
}

export async function addEdge(
    projectId: string,
    versionId: string,
    sourceId: string,
    targetId: string,
    edgeType: string = "CONTRIBUTES_TO"
) {
    const supabase = await createClient();
    const tenant = await assertEditableContext(supabase, projectId, versionId);

    if (sourceId === targetId) throw new Error("Validation: Source and target must be different");

    // Check for existing edge to prevent duplicates
    const { data: existing } = await supabase
        .from("toc_edges")
        .select("id, source_node_id, target_node_id, edge_type")
        .eq("toc_version_id", versionId)
        .eq("source_node_id", sourceId)
        .eq("target_node_id", targetId)
        .eq("tenant_id", tenant.tenantId)
        .maybeSingle();

    if (existing) return existing;

    const { data, error } = await supabase
        .from("toc_edges")
        .insert({
            tenant_id: tenant.tenantId,
            toc_version_id: versionId,
            source_node_id: sourceId,
            target_node_id: targetId,
            edge_type: edgeType
        })
        .select("id, source_node_id, target_node_id, edge_type")
        .single();

    if (error) {
        throw new Error(`Error adding edge: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
    return data;
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
