import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
    clearPersistedActiveOrgId,
    listWorkspaceMemberships,
    persistActiveOrgId,
    type WorkspaceMembership,
} from "@/lib/workspaces";

export type OrgScopeContext = {
    orgId: string;
    currentMembership: WorkspaceMembership;
    memberships: WorkspaceMembership[];
    userEmail: string;
};

type OrgGuardOptions = {
    requireOwner?: boolean;
};

export async function requireOrgScope(
    orgId: string,
    options: OrgGuardOptions = {},
): Promise<OrgScopeContext> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    const memberships = await listWorkspaceMemberships(supabase);
    const currentMembership = memberships.find((membership) => membership.orgId === orgId);

    if (!currentMembership) {
        await clearPersistedActiveOrgId(supabase);
        notFound();
    }

    if (options.requireOwner && currentMembership.role !== "owner") {
        notFound();
    }

    await persistActiveOrgId(supabase, orgId);

    return {
        orgId,
        currentMembership,
        memberships,
        userEmail: user.email ?? "Signed-in user",
    };
}
