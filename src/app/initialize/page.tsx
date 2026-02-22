import Link from "next/link";
import { redirect } from "next/navigation";
import WorkspacePicker from "@/components/workspaces/WorkspacePicker";
import InviteJoinForm from "@/components/workspaces/InviteJoinForm";
import ToastNotice from "@/components/ui/ToastNotice";
import { createClient } from "@/lib/supabase/server";
import {
    canCreateWorkspace,
    clearPersistedActiveOrgId,
    getPersistedActiveOrgId,
    listWorkspaceMemberships,
    persistActiveOrgId,
} from "@/lib/workspaces";
import { extractInviteToken, sanitizeInternalPath } from "@/lib/routing";

type InitializeParams = {
    notice?: string;
    next?: string;
};

export default async function InitializePage({
    searchParams,
}: {
    searchParams: Promise<InitializeParams>;
}) {
    const params = await searchParams;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    const memberships = await listWorkspaceMemberships(supabase);
    const persistedActiveOrgId = await getPersistedActiveOrgId(supabase);
    let showAccessChanged = params.notice === "access-changed";
    let activeOrgId = persistedActiveOrgId;

    const hasPersistedMembership =
        !!activeOrgId &&
        memberships.some((membership) => membership.orgId === activeOrgId);

    if (activeOrgId && !hasPersistedMembership) {
        await clearPersistedActiveOrgId(supabase);
        activeOrgId = null;
        showAccessChanged = true;
    }

    const safeNextPath = sanitizeInternalPath(params.next ?? null);
    const inviteTokenFromNext = extractInviteToken(safeNextPath);

    if (memberships.length === 1) {
        const [singleMembership] = memberships;
        await persistActiveOrgId(supabase, singleMembership.orgId);
        redirect(`/app/${singleMembership.orgId}/dashboard`);
    }

    if (memberships.length > 1 && activeOrgId) {
        redirect(`/app/${activeOrgId}/dashboard`);
    }

    const workspaceCreationEnabled = canCreateWorkspace();

    return (
        <main className="esset-page-bg min-h-screen px-4 py-8 sm:px-6 sm:py-10">
            <div
                className="mx-auto flex w-full flex-col gap-6"
                style={{ maxWidth: "var(--esset-container-max)" }}
            >
                <header className="esset-shell-bg overflow-hidden rounded-[28px] px-6 py-8 text-white sm:px-10">
                    <h1 className="esset-h1 font-black">Workspace setup</h1>
                    <p className="mt-3 max-w-3xl text-base text-white/92">
                        Continue in your workspace. We keep access private and only show what
                        you can open.
                    </p>
                </header>

                {showAccessChanged ? (
                    <ToastNotice
                        message="Your workspace access has changed."
                        tone="warning"
                    />
                ) : null}

                {memberships.length === 0 ? (
                    <section className="grid gap-4 md:grid-cols-2">
                        <article className="esset-card p-6">
                            <h2 className="text-2xl font-extrabold text-esset-ink">
                                Create workspace
                            </h2>
                            <p className="mt-2 text-sm text-esset-muted">
                                Start a new workspace for your organization.
                            </p>

                            {workspaceCreationEnabled ? (
                                <Link
                                    href="/workspaces/new"
                                    className="esset-btn-primary mt-6 inline-flex w-full items-center justify-center px-4 py-2.5"
                                >
                                    Create workspace
                                </Link>
                            ) : (
                                <div className="mt-6 rounded-xl border border-esset-border bg-esset-bg px-4 py-3 text-sm text-esset-muted">
                                    Workspace creation is managed by your admin. Use an invite
                                    link.
                                </div>
                            )}
                        </article>

                        <article className="esset-card p-6">
                            <h2 className="text-2xl font-extrabold text-esset-ink">
                                Join via invite
                            </h2>
                            <p className="mt-2 text-sm text-esset-muted">
                                Ask your admin for an invite link to join an existing workspace.
                            </p>
                            <InviteJoinForm presetToken={inviteTokenFromNext ?? ""} />
                        </article>
                    </section>
                ) : null}

                {memberships.length > 1 ? (
                    <section>
                        <WorkspacePicker memberships={memberships} />
                    </section>
                ) : null}

                {safeNextPath && memberships.length === 0 ? (
                    <div className="text-sm text-esset-muted">
                        Invite continuation is ready. Use your invite token to continue.
                    </div>
                ) : null}
            </div>
        </main>
    );
}
