import LeftNav from "@/components/shell/LeftNav";
import TopContextBar from "@/components/shell/TopContextBar";
import { requireOrgScope } from "@/components/workspaces/OrgGuard";

import { listOrgProjects, requireProjectScope } from "@/lib/projects/scope";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectScopedLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ orgId: string; projectId: string }>;
}) {
    const { orgId, projectId } = await params;
    const orgContext = await requireOrgScope(orgId);
    const projectScope = await requireProjectScope(orgId, projectId);
    const projects = await listOrgProjects(orgId);

    if (projects.length === 0) {
        redirect(`/app/${orgId}/projects`);
    }



    return (
        <div className="min-h-screen bg-esset-bg">
            <TopContextBar
                orgId={orgId}
                currentProjectId={projectId}
                currentProjectTitle={projectScope.project.title}
                currentMembership={orgContext.currentMembership}
                memberships={orgContext.memberships}
                projects={projects.map((project) => ({
                    id: project.id,
                    title: project.title,
                }))}
                userEmail={orgContext.userEmail}
            />

            <main className="px-4 py-4 sm:px-6">
                <div
                    className="mx-auto flex w-full flex-col gap-4 md:flex-row"
                    style={{ maxWidth: "var(--esset-container-max)" }}
                >
                    <LeftNav orgId={orgId} projectId={projectId} />
                    <div className="min-w-0 flex-1">{children}</div>
                </div>
            </main>
        </div>
    );
}
