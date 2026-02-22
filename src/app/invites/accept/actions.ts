"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { persistActiveOrgId } from "@/lib/workspaces";

type InviteAcceptState = {
    error?: string;
};

export async function acceptInviteAndContinueAction(
    _previousState: InviteAcceptState,
    formData: FormData,
): Promise<InviteAcceptState> {
    const token = String(formData.get("token") ?? "").trim();

    if (!token) {
        return {
            error: "This invite link isn't valid. Ask your admin for a new one.",
        };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/auth/sign-in?next=${encodeURIComponent(`/invites/accept?token=${token}`)}`);
    }

    const { data, error } = await supabase.rpc("accept_org_invite", {
        p_token: token,
    });

    if (error || !data) {
        return {
            error: "This invite link isn't valid. Ask your admin for a new one.",
        };
    }

    const tenantId =
        typeof data === "object" && data !== null && "tenant_id" in data
            ? String(data.tenant_id ?? "")
            : "";

    if (!tenantId) {
        return {
            error: "This invite link isn't valid. Ask your admin for a new one.",
        };
    }

    await persistActiveOrgId(supabase, tenantId);
    redirect(`/app/${tenantId}/dashboard?toast=invite-accepted`);
}
