import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { persistActiveOrgId } from "@/lib/workspaces";

export type ScopedProject = {
    id: string;
    title: string;
    status: string;
    description: string | null;
};

export type ProjectScope = {
    orgId: string;
    projectId: string;
    role: string;
    userEmail: string;
    project: ScopedProject;
};

export async function listOrgProjects(orgId: string): Promise<ScopedProject[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("projects")
        .select("id, title, status, description")
        .eq("tenant_id", orgId)
        .order("created_at", { ascending: false });

    if (error || !data) {
        return [];
    }

    return data;
}

export async function isProjectAccessible(orgId: string, projectId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("tenant_id", orgId)
        .maybeSingle();

    if (error || !data) {
        return false;
    }

    return true;
}

export async function requireProjectScope(
    orgId: string,
    projectId: string,
): Promise<ProjectScope> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    const { data: membership } = await supabase
        .from("org_memberships")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) {
        notFound();
    }

    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, title, status, description")
        .eq("id", projectId)
        .eq("tenant_id", orgId)
        .maybeSingle();

    if (projectError || !project) {
        notFound();
    }

    await persistActiveOrgId(supabase, orgId);

    return {
        orgId,
        projectId,
        role: membership.role,
        userEmail: user.email ?? "Signed-in user",
        project,
    };
}
