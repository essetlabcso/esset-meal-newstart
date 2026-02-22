"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
    canCreateWorkspace,
    listWorkspaceMemberships,
    persistActiveOrgId,
} from "@/lib/workspaces";

type WorkspaceCreateState = {
    error?: string;
    fieldErrors?: {
        workspaceName?: string;
    };
};

export async function selectWorkspaceAction(formData: FormData) {
    const orgId = String(formData.get("orgId") ?? "").trim();

    if (!orgId) {
        return;
    }

    const supabase = await createClient();
    const memberships = await listWorkspaceMemberships(supabase);
    const hasMembership = memberships.some((membership) => membership.orgId === orgId);

    if (!hasMembership) {
        redirect("/initialize?notice=access-changed");
    }

    await persistActiveOrgId(supabase, orgId);
    redirect(`/app/${orgId}/dashboard`);
}

export async function createWorkspaceAction(
    _previousState: WorkspaceCreateState,
    formData: FormData,
): Promise<WorkspaceCreateState> {
    if (!canCreateWorkspace()) {
        return {
            error: "Workspace creation is managed by your admin. Use an invite link.",
        };
    }

    const workspaceName = String(formData.get("workspaceName") ?? "").trim();
    const fieldErrors: WorkspaceCreateState["fieldErrors"] = {};

    if (!workspaceName) {
        fieldErrors.workspaceName = "Workspace name is required.";
    }

    if (fieldErrors.workspaceName) {
        return { fieldErrors };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    const { data: orgId, error } = await supabase.rpc("create_workspace", {
        p_name: workspaceName,
    });

    if (error || !orgId) {
        return {
            error: "We couldn't finish setting up your workspace. Please try again.",
        };
    }

    const { data: ownerMembership } = await supabase
        .from("org_memberships")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .eq("role", "owner")
        .maybeSingle();

    if (!ownerMembership) {
        return {
            error: "We couldn't finish setting up your workspace. Please try again.",
        };
    }

    await persistActiveOrgId(supabase, orgId);
    redirect(`/app/${orgId}/dashboard?toast=workspace-created`);
}
