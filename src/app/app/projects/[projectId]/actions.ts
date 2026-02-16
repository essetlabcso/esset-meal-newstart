"use server"

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

export async function getProject(projectId: string) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) return notFound();

    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .single();

    if (error || !data) {
        return notFound();
    }

    return data;
}

export async function updateProject(projectId: string, formData: FormData) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");

    // Authorization check: RLS handles it, but we can do a quick role check if needed.
    // However, the rule is to trust RLS + server-side tenant scoping.

    const title = formData.get("title") as string;
    const short_code = formData.get("short_code") as string;
    const description = formData.get("description") as string;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;
    const status = formData.get("status") as "draft" | "active" | "closed" | "archived";

    const { error } = await supabase
        .from("projects")
        .update({
            title,
            short_code: short_code || null,
            description: description || null,
            start_date: start_date || null,
            end_date: end_date || null,
            status,
        })
        .eq("id", projectId)
        .eq("tenant_id", tenant.tenantId);

    if (error) {
        throw new Error(`Error updating project: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}`);
    revalidatePath("/app/projects");
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");

    const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
        .eq("tenant_id", tenant.tenantId);

    if (error) {
        throw new Error(`Error deleting project: ${error.message}`);
    }

    revalidatePath("/app/projects");
    redirect("/app/projects");
}

// Reporting Periods Actions

export async function listReportingPeriods(projectId: string) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) return [];

    const { data, error } = await supabase
        .from("reporting_periods")
        .select("*")
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .order("start_date", { ascending: true });

    if (error) {
        console.error("Error listing reporting periods:", error);
        return [];
    }

    return data;
}

export async function createReportingPeriod(projectId: string, formData: FormData) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");

    const label = formData.get("label") as string;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;

    const { error } = await supabase.from("reporting_periods").insert({
        tenant_id: tenant.tenantId,
        project_id: projectId,
        label,
        start_date,
        end_date,
    });

    if (error) {
        throw new Error(`Error creating reporting period: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/reporting-periods`);
}

export async function updateReportingPeriod(periodId: string, projectId: string, formData: FormData) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");

    const label = formData.get("label") as string;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;

    const { error } = await supabase
        .from("reporting_periods")
        .update({
            label,
            start_date,
            end_date,
        })
        .eq("id", periodId)
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId);

    if (error) {
        throw new Error(`Error updating reporting period: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/reporting-periods`);
}

export async function deleteReportingPeriod(periodId: string, projectId: string) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");

    const { error } = await supabase
        .from("reporting_periods")
        .delete()
        .eq("id", periodId)
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId);

    if (error) {
        throw new Error(`Error deleting reporting period: ${error.message}`);
    }

    revalidatePath(`/app/projects/${projectId}/reporting-periods`);
}
