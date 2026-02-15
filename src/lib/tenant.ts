import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

export type TenantInfo = {
    tenantId: string;
    tenantName: string;
    role: string;
};

/**
 * Deterministically resolves the user's active tenant.
 * 1. Checks profiles.active_tenant_id.
 * 2. Validates user is still a member of that tenant.
 * 3. Fallback: If 1 membership remains, use it.
 * 4. Otherwise: Returns null (caller should redirect to workspace selector).
 */
export async function getActiveTenant(
    supabase: SupabaseClient<Database>,
): Promise<TenantInfo | null> {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // 1. Check profile for active_tenant_id
    const { data: profile } = await supabase
        .from("profiles")
        .select("active_tenant_id")
        .eq("id", user.id)
        .single();

    if (profile?.active_tenant_id) {
        // Validate membership
        const { data: membership } = await supabase
            .from("org_memberships")
            .select("role, organizations(name)")
            .eq("user_id", user.id)
            .eq("org_id", profile.active_tenant_id)
            .single();

        if (membership) {
            const org = membership.organizations;
            return {
                tenantId: profile.active_tenant_id,
                tenantName: Array.isArray(org) ? org[0]?.name : org?.name ?? "Unknown",
                role: membership.role,
            };
        }
    }

    // 2. Fallback: If exactly 1 membership exists, use it AND persist it
    const tenants = await listUserTenants(supabase);
    if (tenants.length === 1) {
        // Auto-set as active for future requests
        await supabase
            .from("profiles")
            .update({ active_tenant_id: tenants[0].tenantId })
            .eq("id", user.id);

        return tenants[0];
    }

    return null;
}

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

    // Map and sort
    return memberships
        .map((m) => {
            const org = m.organizations;
            return {
                tenantId: m.org_id,
                tenantName: Array.isArray(org) ? org[0]?.name : org?.name ?? "Unknown",
                role: m.role,
                createdAt: m.created_at,
            };
        })
        .sort((a, b) => {
            const roles = ["owner", "admin", "member"];
            const roleDiff = roles.indexOf(a.role) - roles.indexOf(b.role);
            if (roleDiff !== 0) return roleDiff;
            return (
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
        });
}

/**
 * Sets the user's active tenant in their profile.
 * Validates membership before updating.
 */
export async function setActiveTenant(
    supabase: SupabaseClient<Database>,
    tenantId: string,
) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // Validate membership
    const { data: membership, error: mError } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .eq("org_id", tenantId)
        .single();

    if (mError || !membership) {
        throw new Error("User is not a member of this workspace");
    }

    // Update profile
    const { error: pError } = await supabase
        .from("profiles")
        .update({ active_tenant_id: tenantId })
        .eq("id", user.id);

    if (pError) throw pError;

    return { success: true };
}
