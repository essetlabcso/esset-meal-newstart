import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

export type TenantInfo = {
    tenantId: string;
    tenantName: string;
    role: string;
};

/**
 * Lists all organizations the user is a member of.
 * Ordered by role priority (owner, admin, member) and then created_at.
 */
export async function listUserTenants(
    supabase: SupabaseClient<Database>,
): Promise<TenantInfo[]> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data: memberships } = await supabase
        .from("org_memberships")
        .select("org_id, role, created_at, organizations(name)")
        .eq("user_id", user.id);

    if (!memberships) return [];

    const roles = ["owner", "admin", "member"];

    // Map and sort
    return memberships
        .map((m) => {
            const org = m.organizations;
            const orgName = Array.isArray(org) ? org[0]?.name : org?.name;
            return {
                tenantId: m.org_id,
                tenantName: orgName ?? "Unknown",
                role: m.role,
                createdAt: m.created_at,
            };
        })
        .sort((a, b) => {
            // Stable role sorting: owner > admin > member > others
            const aIdx = roles.indexOf(a.role);
            const bIdx = roles.indexOf(b.role);

            const aVal = aIdx === -1 ? 99 : aIdx;
            const bVal = bIdx === -1 ? 99 : bIdx;

            if (aVal !== bVal) return aVal - bVal;

            // Secondary sort: oldest first
            return (
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
        });
}

/**
 * Deterministically resolves the user's active tenant.
 * 1. Checks profiles.active_tenant_id.
 * 2. Validates user is still a member of that tenant.
 * 3. Fallback: If 1 membership remains, use it AND persist it.
 * 4. Otherwise: Returns null (caller should redirect to workspace selector).
 */
export async function getActiveTenant(
    supabase: SupabaseClient<Database>,
): Promise<TenantInfo | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch profile and memberships in parallel for efficiency
    const [profileRes, tenants] = await Promise.all([
        supabase
            .from("profiles")
            .select("active_tenant_id")
            .eq("id", user.id)
            .single(),
        listUserTenants(supabase)
    ]);

    const activeId = profileRes.data?.active_tenant_id;

    // 1. If active_tenant_id is set, validate it exists in user's memberships
    if (activeId) {
        const membership = tenants.find(t => t.tenantId === activeId);
        if (membership) return membership;

        // Best effort clear invalid active_tenant_id
        await supabase
            .from("profiles")
            .update({ active_tenant_id: null })
            .eq("id", user.id);
    }

    // 2. If 0 memberships -> null
    if (tenants.length === 0) return null;

    // 3. Fallback: If exactly 1 membership exists, auto-persist it
    if (tenants.length === 1) {
        const singleTenant = tenants[0];
        // Only update if it wasn't already set to this one (idempotency)
        if (activeId !== singleTenant.tenantId) {
            await supabase
                .from("profiles")
                .update({ active_tenant_id: singleTenant.tenantId })
                .eq("id", user.id);
        }
        return singleTenant;
    }

    // 4. Multiple memberships but no valid active selection -> null
    return null;
}

/**
 * Sets the user's active tenant in their profile.
 * Relies on Gate 6.1 RLS WITH CHECK (membership constraint) for safety.
 */
export async function setActiveTenant(
    supabase: SupabaseClient<Database>,
    tenantId: string,
) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Update profile - RLS will block if tenantId is not in org_memberships
    const { error } = await supabase
        .from("profiles")
        .update({ active_tenant_id: tenantId })
        .eq("id", user.id);

    if (error) throw error;

    return { success: true };
}
