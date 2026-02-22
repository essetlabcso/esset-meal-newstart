"use server";

import { createClient } from "@/lib/supabase/server";
import { clearPersistedActiveOrgId } from "@/lib/workspaces";

type BrandingResult = {
    ok: boolean;
    message?: string;
    error?: string;
};

async function assertOwner(orgId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { supabase, error: "Not authenticated" as const };
    }

    const { data: membership } = await supabase
        .from("org_memberships")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!membership) {
        await clearPersistedActiveOrgId(supabase);
        return { supabase, error: "Not found" as const };
    }

    if (membership.role !== "owner") {
        return { supabase, error: "Not found" as const };
    }

    return { supabase, error: null };
}

export async function saveBrandingAction(formData: FormData): Promise<BrandingResult> {
    const orgId = String(formData.get("orgId") ?? "").trim();
    const displayName = String(formData.get("displayName") ?? "").trim();

    if (!orgId || !displayName) {
        return { ok: false, error: "Display name is required." };
    }

    const { supabase, error: authError } = await assertOwner(orgId);
    if (authError) {
        return { ok: false, error: "Not found." };
    }

    const { error } = await supabase
        .from("organizations")
        .update({ name: displayName })
        .eq("id", orgId);

    if (error) {
        return { ok: false, error: "We couldn't save your changes. Try again." };
    }

    return { ok: true, message: "Workspace updated" };
}
