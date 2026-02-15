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
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");
    await verifyProjectContext(supabase, projectId, tenant.tenantId);

    const { data, error } = await supabase
        .from("toc_nodes")
        .insert({
            tenant_id: tenant.tenantId,
            toc_version_id: versionId,
            node_type: nodeType,
            title,
            description
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Error adding node: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
    return data;
}

export async function addEdge(
    projectId: string,
    versionId: string,
    sourceId: string,
    targetId: string,
    edgeType: string = "CONTRIBUTES_TO"
) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");
    await verifyProjectContext(supabase, projectId, tenant.tenantId);

    const { data, error } = await supabase
        .from("toc_edges")
        .insert({
            tenant_id: tenant.tenantId,
            toc_version_id: versionId,
            source_node_id: sourceId,
            target_node_id: targetId,
            edge_type: edgeType
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Error adding edge: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/toc`);
    return data;
}

export async function addNodeAssumption(
    projectId: string,
    versionId: string,
    nodeId: string,
    text: string,
    riskLevel: "LOW" | "MEDIUM" | "HIGH"
) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");
    await verifyProjectContext(supabase, projectId, tenant.tenantId);

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
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");
    await verifyProjectContext(supabase, projectId, tenant.tenantId);

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
