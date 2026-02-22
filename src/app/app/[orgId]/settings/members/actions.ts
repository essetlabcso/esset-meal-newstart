"use server";

import { createClient } from "@/lib/supabase/server";
import { clearPersistedActiveOrgId } from "@/lib/workspaces";

type ActionResult = {
    ok: boolean;
    message?: string;
    error?: string;
    inviteLink?: string;
};

const ALLOWED_ROLES = new Set(["owner", "admin", "member"]);

async function assertOwner(orgId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { supabase, user: null, error: "Not authenticated" as const };
    }

    const { data: membership } = await supabase
        .from("org_memberships")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) {
        await clearPersistedActiveOrgId(supabase);
        return { supabase, user, error: "Not found" as const };
    }

    if (membership.role !== "owner") {
        return { supabase, user, error: "Not found" as const };
    }

    return { supabase, user, error: null };
}

export async function changeMemberRoleAction(formData: FormData): Promise<ActionResult> {
    const orgId = String(formData.get("orgId") ?? "").trim();
    const userId = String(formData.get("memberUserId") ?? "").trim();
    const role = String(formData.get("role") ?? "").trim();

    if (!orgId || !userId || !ALLOWED_ROLES.has(role)) {
        return { ok: false, error: "Invalid request." };
    }

    const { supabase, error: authError } = await assertOwner(orgId);
    if (authError) {
        return { ok: false, error: "Not found." };
    }

    const { error } = await supabase
        .from("org_memberships")
        .update({ role })
        .eq("org_id", orgId)
        .eq("user_id", userId);

    if (error) {
        return { ok: false, error: "We couldn't update this member. Please try again." };
    }

    return { ok: true, message: "Member updated" };
}

export async function deactivateMemberAction(formData: FormData): Promise<ActionResult> {
    const orgId = String(formData.get("orgId") ?? "").trim();
    const userId = String(formData.get("memberUserId") ?? "").trim();

    if (!orgId || !userId) {
        return { ok: false, error: "Invalid request." };
    }

    const { supabase, user, error: authError } = await assertOwner(orgId);
    if (authError) {
        return { ok: false, error: "Not found." };
    }

    if (user && user.id === userId) {
        return { ok: false, error: "You cannot deactivate your own owner access." };
    }

    const { error } = await supabase
        .from("org_memberships")
        .delete()
        .eq("org_id", orgId)
        .eq("user_id", userId);

    if (error) {
        return { ok: false, error: "We couldn't update this member. Please try again." };
    }

    return { ok: true, message: "Member updated" };
}

export async function removeMemberAction(formData: FormData): Promise<ActionResult> {
    const result = await deactivateMemberAction(formData);
    if (!result.ok) {
        return result;
    }

    return { ok: true, message: "Member removed" };
}

export async function sendInviteAction(formData: FormData): Promise<ActionResult> {
    const orgId = String(formData.get("orgId") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const role = String(formData.get("role") ?? "member").trim();
    const expiryDays = Number(formData.get("expiryDays") ?? 7);

    if (!orgId || !email || !ALLOWED_ROLES.has(role)) {
        return { ok: false, error: "Invalid request." };
    }

    if (![3, 7, 14].includes(expiryDays)) {
        return { ok: false, error: "Choose a valid expiry option." };
    }

    const { supabase, error: authError } = await assertOwner(orgId);
    if (authError) {
        return { ok: false, error: "Not found." };
    }

    const { data, error } = await supabase.rpc("create_org_invite", {
        p_tenant_id: orgId,
        p_email: email,
        p_role: role,
    });

    if (error || !data) {
        return { ok: false, error: "We couldn't send this invite. Please try again." };
    }

    const inviteData =
        typeof data === "object" && data !== null
            ? (data as { invite_id?: string; raw_token?: string })
            : {};

    if (inviteData.invite_id && expiryDays !== 7) {
        const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
        await supabase
            .from("org_invitations")
            .update({ expires_at: expiresAt.toISOString() })
            .eq("id", inviteData.invite_id)
            .eq("tenant_id", orgId);
    }

    const inviteLink = inviteData.raw_token
        ? `/invites/accept?token=${inviteData.raw_token}`
        : undefined;

    return { ok: true, message: "Invite sent", inviteLink };
}

export async function revokeInviteAction(formData: FormData): Promise<ActionResult> {
    const orgId = String(formData.get("orgId") ?? "").trim();
    const inviteId = String(formData.get("inviteId") ?? "").trim();

    if (!orgId || !inviteId) {
        return { ok: false, error: "Invalid request." };
    }

    const { supabase, error: authError } = await assertOwner(orgId);
    if (authError) {
        return { ok: false, error: "Not found." };
    }

    const { error } = await supabase
        .from("org_invitations")
        .delete()
        .eq("id", inviteId)
        .eq("tenant_id", orgId);

    if (error) {
        return { ok: false, error: "We couldn't revoke this invite." };
    }

    return { ok: true, message: "Member updated" };
}
