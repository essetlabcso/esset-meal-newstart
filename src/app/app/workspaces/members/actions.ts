"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant, setActiveTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";

/**
 * Lists all members for the active tenant.
 */
export async function listMembers() {
    const supabase = await createClient();
    const activeTenant = await getActiveTenant(supabase);
    if (!activeTenant) throw new Error("No active workspace");

    const { data: members, error } = await supabase
        .from("org_memberships")
        .select("user_id, role, created_at, profiles(full_name, email)")
        .eq("org_id", activeTenant.tenantId);

    if (error) throw error;
    return members;
}

/**
 * Lists pending invites for the active tenant.
 * Only accessible by admin/owner.
 */
export async function listInvites() {
    const supabase = await createClient();
    const activeTenant = await getActiveTenant(supabase);
    if (!activeTenant) throw new Error("No active workspace");

    const { data: invites, error } = await supabase
        .from("org_invitations")
        .select("*")
        .eq("tenant_id", activeTenant.tenantId)
        .is("accepted_at", null);

    if (error) throw error;
    return invites;
}

/**
 * Creates a new invitation for the active tenant.
 * Calls the security definer RPC.
 */
export async function createInvite(email: string, role: "admin" | "member") {
    const supabase = await createClient();
    const activeTenant = await getActiveTenant(supabase);
    if (!activeTenant) throw new Error("No active workspace");

    const { data, error } = await supabase.rpc("create_org_invite", {
        p_tenant_id: activeTenant.tenantId,
        p_email: email,
        p_role: role,
    });

    if (error) throw error;

    revalidatePath("/app/workspaces/members");

    // Return the raw token for UI to display the link
    return data as unknown as { invite_id: string; raw_token: string };
}

/**
 * Revokes a pending invitation.
 */
export async function revokeInvite(inviteId: string) {
    const supabase = await createClient();
    const activeTenant = await getActiveTenant(supabase);
    if (!activeTenant) throw new Error("No active workspace");

    const { error } = await supabase
        .from("org_invitations")
        .delete()
        .eq("id", inviteId)
        .eq("tenant_id", activeTenant.tenantId);

    if (error) throw error;

    revalidatePath("/app/workspaces/members");
    return { success: true };
}

/**
 * Accepts an invitation using a raw token.
 */
export async function acceptInvite(token: string) {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("accept_org_invite", {
        p_token: token,
    });

    if (error) {
        console.error("Accept invite error:", error);
        return { success: false, error: error.message };
    }

    const { tenant_id } = data as unknown as { tenant_id: string };

    // Set active tenant for the user
    await setActiveTenant(supabase, tenant_id);

    revalidatePath("/app");
    return { success: true, tenantId: tenant_id };
}
