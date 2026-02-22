import { redirect } from "next/navigation";
import Link from "next/link";
import WorkspaceSwitcher from "@/components/workspaces/WorkspaceSwitcher";
import RoleBadge from "@/components/workspaces/RoleBadge";
import ProjectSelectorForm from "@/components/shell/ProjectSelectorForm";
import { signOut } from "@/app/auth/actions";
import { setActiveProjectId } from "@/lib/projects/context";
import { isProjectAccessible } from "@/lib/projects/scope";
import type { WorkspaceMembership } from "@/lib/workspaces";

type ProjectSummary = {
    id: string;
    title: string;
};

type TopContextBarProps = {
    orgId: string;
    currentProjectId: string;
    currentProjectTitle: string;
    currentMembership: WorkspaceMembership;
    memberships: WorkspaceMembership[];
    projects: ProjectSummary[];
    userEmail: string;
};

export default function TopContextBar({
    orgId,
    currentProjectId,
    currentProjectTitle,
    currentMembership,
    memberships,
    projects,
    userEmail,
}: TopContextBarProps) {
    async function handleProjectSelect(formData: FormData) {
        "use server";
        const projectId = String(formData.get("projectId") ?? "").trim();
        if (!projectId) {
            return;
        }

        const isAccessible = await isProjectAccessible(orgId, projectId);
        if (!isAccessible) {
            redirect(`/app/${orgId}/projects`);
        }

        await setActiveProjectId(orgId, projectId);
        redirect(`/app/${orgId}/projects/${projectId}/home`);
    }

    return (
        <header className="esset-shell-bg sticky top-0 z-20 px-4 py-3 text-white sm:px-6">
            <div
                className="mx-auto flex w-full flex-col gap-3"
                style={{ maxWidth: "var(--esset-container-max)" }}
            >
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <WorkspaceSwitcher current={currentMembership} memberships={memberships} />

                    <div className="flex flex-wrap items-center gap-2">
                        <details className="relative">
                            <summary className="esset-focus-dark list-none cursor-pointer rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold">
                                {userEmail}
                            </summary>
                            <div className="absolute right-0 top-[calc(100%+0.5rem)] w-48 rounded-xl border border-white/20 bg-esset-teal-900 p-2 shadow-xl">
                                <form action={signOut}>
                                    <button
                                        type="submit"
                                        className="esset-focus-dark block w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-white hover:bg-white/10"
                                    >
                                        Sign out
                                    </button>
                                </form>
                            </div>
                        </details>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <ProjectSelectorForm
                        orgId={orgId}
                        currentProjectId={currentProjectId}
                        projects={projects}
                        action={handleProjectSelect}
                    />
                    <Link
                        href={`/app/${orgId}/projects`}
                        className="esset-btn-secondary esset-focus-dark inline-flex items-center justify-center px-3 py-2 text-sm"
                    >
                        Projects
                    </Link>

                    <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                        Reporting period: Not set
                    </span>

                    <RoleBadge role={currentMembership.role} />
                    <span className="text-sm font-semibold text-white/90">{currentProjectTitle}</span>
                </div>
            </div>
        </header>
    );
}
