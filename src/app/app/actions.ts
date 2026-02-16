"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setActiveTenant } from "@/lib/tenant";

export async function createOrganization(formData: FormData) {
    const name = (formData.get("name") as string)?.trim();

    if (!name) {
        return { error: "Organization name is required." };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    const { data: orgId, error } = await supabase.rpc("create_workspace", {
        p_name: name,
    });

    if (error || !orgId) {
        console.error("Failed to create organization via RPC:", {
            code: error?.code,
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            userId: user.id,
        });
        return { error: "Could not create workspace. Please try again." };
    }

    // Deterministic active-org context after creation.
    try {
        await setActiveTenant(supabase, orgId);
    } catch (setActiveError) {
        console.error("Failed setting active workspace after creation:", setActiveError);
        return { error: "Workspace created, but active workspace could not be set." };
    }

    redirect("/app");
}
