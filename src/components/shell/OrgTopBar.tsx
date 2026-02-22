import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listWorkspaceMemberships } from "@/lib/workspaces";
import WorkspaceSwitcher from "@/components/workspaces/WorkspaceSwitcher";
import RoleBadge from "@/components/workspaces/RoleBadge";
import { signOut } from "@/app/auth/actions";

type OrgTopBarProps = {
    orgId: string;
};

export default async function OrgTopBar({ orgId }: OrgTopBarProps) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const memberships = await listWorkspaceMemberships(supabase);
    const current = memberships.find((m) => m.orgId === orgId) ?? memberships[0];

    if (!current) {
        return null;
    }

    return (
        <header className="esset-shell-bg sticky top-0 z-20 px-4 py-3 sm:px-6">
            <div
                className="mx-auto flex items-center justify-between gap-4"
                style={{ maxWidth: "var(--esset-container-max)" }}
            >
                <div className="flex items-center gap-4">
                    <WorkspaceSwitcher current={current} memberships={memberships} />
                    <Link
                        href={`/app/${orgId}/projects`}
                        className="esset-focus-dark rounded-lg px-2 py-1 text-sm font-semibold text-white/90 hover:text-white"
                    >
                        Projects
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden items-center gap-2 sm:flex">
                        <span className="text-sm text-white/90">{user.email}</span>
                        <RoleBadge role={current.role} />
                    </div>
                    <form action={signOut}>
                        <button
                            type="submit"
                            className="esset-focus-dark rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
                        >
                            Sign out
                        </button>
                    </form>
                </div>
            </div>
        </header>
    );
}
