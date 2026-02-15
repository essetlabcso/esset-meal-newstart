"use server"

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

export async function createAnalysisSnapshot(
    projectId: string,
    title: string,
    notes: string
) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");

    // Verify project belongs to tenant
    const { data: project, error: pError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .single();

    if (pError || !project) {
        throw new Error("Unauthorized: Project not found in tenant context");
    }

    const { data, error } = await supabase
        .from("analysis_snapshots")
        .insert({
            tenant_id: tenant.tenantId,
            project_id: projectId,
            title,
            snapshot: { notes },
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Error creating analysis snapshot: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/analysis`);
    return data;
}
