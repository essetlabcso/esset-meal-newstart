import { listMembers, listInvites, revokeInvite } from "./actions";
import MemberInviteForm from "./MemberInviteForm";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Database } from "@/lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type OrgMembership = Database["public"]["Tables"]["org_memberships"]["Row"] & {
    profiles: Profile | null;
};
type OrgInvitation = Database["public"]["Tables"]["org_invitations"]["Row"];

export default async function MembersPage() {
    const supabase = await createClient();
    const activeTenant = await getActiveTenant(supabase);

    if (!activeTenant) {
        redirect("/app/workspaces");
    }

    const isAdmin = activeTenant.role === "admin" || activeTenant.role === "owner";

    // Strict route-level guard for roster privacy
    if (!isAdmin) {
        redirect("/app");
    }

    const members = (await listMembers()) as unknown as OrgMembership[];
    const invites = (await listInvites()) as unknown as OrgInvitation[];

    async function handleRevoke(inviteId: string) {
        "use server";
        await revokeInvite(inviteId);
        revalidatePath("/app/workspaces/members");
    }

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white">Workspace Members</h1>
                    <p className="text-gray-400 mt-1">Manage who has access to {activeTenant.tenantName}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Members List */}
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                            <h2 className="font-semibold text-gray-100">Active Members</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {members.map((member) => (
                                <div key={member.user_id} className="px-6 py-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-gray-200">
                                            {member.profiles?.full_name || "Unknown User"}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {member.profiles?.email}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs font-medium uppercase tracking-wider px-2 py-1 bg-white/5 rounded text-gray-400">
                                            {member.role}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Invites */}
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                            <h2 className="font-semibold text-gray-100">Pending Invitations</h2>
                        </div>
                        <div className="divide-y divide-white/5">
                            {invites.length === 0 ? (
                                <div className="px-6 py-8 text-center text-gray-500 text-sm">
                                    No pending invitations
                                </div>
                            ) : (
                                invites.map((invite) => (
                                    <div key={invite.id} className="px-6 py-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-gray-200">{invite.email}</div>
                                            <div className="text-xs text-gray-500">
                                                Expires {new Date(invite.expires_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-medium uppercase tracking-wider px-2 py-1 bg-emerald-500/10 rounded text-emerald-400">
                                                {invite.role}
                                            </span>
                                            {isAdmin && (
                                                <form action={handleRevoke.bind(null, invite.id)}>
                                                    <button className="text-xs text-red-400 hover:text-red-300 transition-colors">
                                                        Revoke
                                                    </button>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {isAdmin ? (
                        <MemberInviteForm />
                    ) : (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                            <p className="text-sm text-amber-200/80">
                                Only workspace administrators can invite new members or manage permissions.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
