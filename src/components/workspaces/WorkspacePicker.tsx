import { selectWorkspaceAction } from "@/lib/actions/workspaceActions";
import type { WorkspaceMembership } from "@/lib/workspaces";

type WorkspacePickerProps = {
    memberships: WorkspaceMembership[];
};

export default function WorkspacePicker({ memberships }: WorkspacePickerProps) {
    return (
        <div className="esset-card w-full p-8 sm:p-10">
            <h1 className="esset-h2 font-extrabold text-esset-ink">Choose a workspace</h1>
            <p className="mt-2 text-sm text-esset-muted">
                Select the workspace you want to open.
            </p>

            <ul className="mt-7 space-y-3">
                {memberships.map((membership) => (
                    <li key={membership.orgId}>
                        <form action={selectWorkspaceAction}>
                            <input type="hidden" name="orgId" value={membership.orgId} />
                            <button
                                type="submit"
                                className="esset-input flex items-center justify-between text-left hover:border-esset-teal-800"
                            >
                                <span className="font-semibold text-esset-ink">
                                    {membership.workspaceName}
                                </span>
                                <span className="rounded-full bg-esset-bg px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-esset-teal-800">
                                    {membership.role}
                                </span>
                            </button>
                        </form>
                    </li>
                ))}
            </ul>
        </div>
    );
}
