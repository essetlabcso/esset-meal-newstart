"use server"

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function listProjects() {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) return [];

    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("tenant_id", tenant.tenantId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error listing projects:", error);
        return [];
    }

    return data;
}

export async function createProject(formData: FormData) {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) throw new Error("Unauthorized: No active tenant");

    const title = formData.get("title") as string;
    const short_code = formData.get("short_code") as string;
    const description = formData.get("description") as string;
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;

    const { error } = await supabase.from("projects").insert({
        tenant_id: tenant.tenantId,
        title,
        short_code: short_code || null,
        description: description || null,
        start_date: start_date || null,
        end_date: end_date || null,
        status: "draft",
    });

    if (error) {
        throw new Error(`Error creating project: ${error.message}`);
    }

    revalidatePath("/app/projects");
    redirect("/app/projects");
}
