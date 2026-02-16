"use server"

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "@/lib/database.types";

/**
 * Verifies that a project exists and belongs to the given tenant.
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
        throw new Error("Unauthorized: Project context invalid or missing");
    }
}

export interface AnalysisSnapshotPayload {
    context_summary: string;
    problem_statement: string;
    stakeholders: string;
    evidence_notes: string;
    key_assumptions: string;
    risks_and_mitigations: string;
}

export async function createAnalysisSnapshot(
    projectId: string,
    title: string,
    payload: AnalysisSnapshotPayload
) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");

    await verifyProjectContext(supabase, projectId, tenant.tenantId);

    const { data, error } = await supabase
        .from("analysis_snapshots")
        .insert({
            tenant_id: tenant.tenantId,
            project_id: projectId,
            title,
            snapshot: payload as unknown as Json,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Error creating analysis snapshot: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/analysis`);
    return data;
}

export async function deleteAnalysisSnapshot(projectId: string, snapshotId: string) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");
    if (tenant.role === "member") throw new Error("Forbidden: Admin only");

    await verifyProjectContext(supabase, projectId, tenant.tenantId);

    const { error } = await supabase
        .from("analysis_snapshots")
        .delete()
        .eq("id", snapshotId)
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId);

    if (error) {
        throw new Error(`Error deleting analysis snapshot: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/analysis`);
    return { success: true };
}
