import { createClient } from "@/lib/supabase/server";
import { requireOrgScope } from "@/components/workspaces/OrgGuard";
import MembersClient from "@/app/app/[orgId]/settings/members/MembersClient";

export const dynamic = "force-dynamic";

type ProfileRow = {
    id: string;
    email: string | null;
    full_name: string | null;
};

export default async function MembersSettingsPage({
    params,
}: {
    params: Promise<{ orgId: string }>;
}) {
    const { orgId } = await params;
    await requireOrgScope(orgId, { requireOwner: true });

    const supabase = await createClient();

    const { data: memberships } = await supabase
        .from("org_memberships")
        .select("user_id, role")
        .eq("org_id", orgId)
        .order("created_at", { ascending: true });

    const userIds = memberships?.map((membership) => membership.user_id) ?? [];
    let profileMap = new Map<string, ProfileRow>();

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .in("id", userIds);

        profileMap = new Map(
            ((profiles ?? []) as ProfileRow[]).map((profile) => [profile.id, profile]),
        );
    }

    const members =
        memberships?.map((membership) => {
            const profile = profileMap.get(membership.user_id);
            return {
                userId: membership.user_id,
                email: profile?.email ?? membership.user_id,
                name: profile?.full_name ?? profile?.email ?? membership.user_id,
                role: membership.role,
                status: "Active" as const,
            };
        }) ?? [];

    const { data: invites } = await supabase
        .from("org_invitations")
        .select("id, email, role, expires_at")
        .eq("tenant_id", orgId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });

    const pendingInvites =
        invites?.map((invite) => ({
            id: invite.id,
            email: invite.email,
            role: invite.role,
            expiresAt: invite.expires_at,
        })) ?? [];

    return <MembersClient orgId={orgId} members={members} invites={pendingInvites} />;
}
