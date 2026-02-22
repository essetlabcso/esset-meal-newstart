import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { setActiveTenant } from "@/lib/tenant";

type AppSupabase = SupabaseClient<Database>;

export type WorkspaceMembership = {
    orgId: string;
    workspaceName: string;
    role: string;
};

function normalizeWorkspaceName(
    organizations: { name: string } | { name: string }[] | null,
    fallback: string,
) {
    if (!organizations) {
        return fallback;
    }

    if (Array.isArray(organizations)) {
        return organizations[0]?.name ?? fallback;
    }

    return organizations.name ?? fallback;
}

export async function listWorkspaceMemberships(
    supabase: AppSupabase,
): Promise<WorkspaceMembership[]> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("org_memberships")
        .select("org_id, role, created_at, organizations(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    if (error || !data) {
        return [];
    }

    return data.map((membership) => ({
        orgId: membership.org_id,
        workspaceName: normalizeWorkspaceName(
            membership.organizations,
            "Workspace",
        ),
        role: membership.role,
    }));
}

export async function getPersistedActiveOrgId(supabase: AppSupabase) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data } = await supabase
        .from("profiles")
        .select("active_tenant_id")
        .eq("id", user.id)
        .maybeSingle();

    return data?.active_tenant_id ?? null;
}

export async function persistActiveOrgId(supabase: AppSupabase, orgId: string) {
    await setActiveTenant(supabase, orgId);
}

export async function clearPersistedActiveOrgId(supabase: AppSupabase) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return;
    }

    await supabase
        .from("profiles")
        .update({ active_tenant_id: null })
        .eq("id", user.id);
}

export function canCreateWorkspace() {
    return process.env.NEXT_PUBLIC_INVITE_ONLY_MODE !== "true";
}

export function hasOwnerLikeAccess(role: string) {
    return role === "owner" || role === "admin";
}
