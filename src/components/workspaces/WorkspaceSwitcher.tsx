import { selectWorkspaceAction } from "@/lib/actions/workspaceActions";
import RoleBadge from "@/components/workspaces/RoleBadge";
import type { WorkspaceMembership } from "@/lib/workspaces";

type WorkspaceSwitcherProps = {
    current: WorkspaceMembership;
    memberships: WorkspaceMembership[];
};

export default function WorkspaceSwitcher({
    current,
    memberships,
}: WorkspaceSwitcherProps) {
    return (
        <details className="group relative">
            <summary className="esset-focus-dark flex cursor-pointer list-none items-center gap-3 rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-white marker:content-['']">
                <span className="text-sm font-semibold">{current.workspaceName}</span>
                <RoleBadge role={current.role} />
                <span className="text-xs opacity-80 group-open:rotate-180">v</span>
            </summary>

            <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-72 rounded-2xl border border-white/20 bg-esset-teal-900 p-3 shadow-2xl">
                <p className="px-2 pb-2 text-xs uppercase tracking-wider text-white/80">
                    Switch workspace
                </p>
                <ul className="space-y-2">
                    {memberships.map((membership) => (
                        <li key={membership.orgId}>
                            <form action={selectWorkspaceAction}>
                                <input type="hidden" name="orgId" value={membership.orgId} />
                                <button
                                    type="submit"
                                    className="esset-focus-dark flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-left hover:bg-white/12"
                                >
                                    <span className="text-sm font-semibold text-white">
                                        {membership.workspaceName}
                                    </span>
                                    <span className="rounded-full bg-white/14 px-2 py-0.5 text-[11px] font-semibold uppercase text-white">
                                        {membership.role}
                                    </span>
                                </button>
                            </form>
                        </li>
                    ))}
                </ul>
            </div>
        </details>
    );
}
