import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";

export async function getActiveTenant(supabase: SupabaseClient<Database>) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch memberships: treat the first membership tenant as active for Gate 4
    const { data: memberships } = await supabase
        .from("org_memberships")
        .select("org_id, role, organizations(id, name)")
        .eq("user_id", user.id)
        .limit(1);

    if (!memberships || memberships.length === 0) {
        return null;
    }

    const membership = memberships[0];
    const org = membership.organizations;

    return {
        tenantId: membership.org_id,
        tenantName: Array.isArray(org) ? org[0]?.name : org?.name,
        role: membership.role,
    };
}
