import Link from "next/link";
import RoleBadge from "@/components/workspaces/RoleBadge";
import ToastNotice from "@/components/ui/ToastNotice";
import { requireOrgScope } from "@/components/workspaces/OrgGuard";
import { readActiveProjectId, setActiveProjectId } from "@/lib/projects/context";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const TOAST_COPY: Record<string, string> = {
    "workspace-created": "Workspace created",
    "invite-accepted": "Invite accepted",
    "member-updated": "Member updated",
    "member-removed": "Member removed",
    "workspace-updated": "Workspace updated",
};

export default async function DashboardPage({
    params,
    searchParams,
}: {
    params: Promise<{ orgId: string }>;
    searchParams: Promise<{ toast?: string }>;
}) {
    const { orgId } = await params;
    const { toast } = await searchParams;
    const context = await requireOrgScope(orgId);
    const supabase = await createClient();
    const persistedProjectId = await readActiveProjectId(orgId);
    let continueProject: { id: string; title: string } | null = null;

    if (persistedProjectId) {
        const { data: persistedProject } = await supabase
            .from("projects")
            .select("id, title")
            .eq("id", persistedProjectId)
            .eq("tenant_id", orgId)
            .maybeSingle();

        if (persistedProject) {
            continueProject = persistedProject;
        }
        // Stale project IDs are simply ignored — no cookie delete in render path
    }

    const { data: projects } = await supabase
        .from("projects")
        .select("id, title")
        .eq("tenant_id", orgId)
        .order("created_at", { ascending: false })
        .limit(3);

    const hasProjects = (projects?.length ?? 0) > 0;
    const toastMessage = toast ? TOAST_COPY[toast] : null;

    return (
        <div className="space-y-5">
            {toastMessage ? <ToastNotice message={toastMessage} tone="success" /> : null}

            <section className="esset-card p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="esset-h2 font-black text-esset-ink">
                        {context.currentMembership.workspaceName}
                    </h1>
                    <RoleBadge role={context.currentMembership.role} tone="light" />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                    {continueProject ? (
                        <form
                            action={async () => {
                                "use server";
                                await setActiveProjectId(orgId, continueProject!.id);
                                redirect(`/app/${orgId}/projects/${continueProject!.id}/home`);
                            }}
                        >
                            <button
                                type="submit"
                                className="esset-btn-primary inline-flex items-center justify-center px-4 py-2.5"
                            >
                                Continue to last project
                            </button>
                        </form>
                    ) : null}
                    <Link
                        href={`/app/${orgId}/projects`}
                        className={`${continueProject ? "rounded-[14px] border border-esset-border bg-white text-esset-teal-800 hover:bg-esset-bg" : "esset-btn-primary"} inline-flex items-center justify-center px-4 py-2.5`}
                    >
                        Go to projects
                    </Link>
                    {context.currentMembership.role === "owner" ? (
                        <Link
                            href={`/app/${orgId}/settings/members`}
                            className="inline-flex items-center justify-center rounded-[14px] border border-esset-border bg-white px-4 py-2.5 font-semibold text-esset-teal-800 hover:bg-esset-bg"
                        >
                            Invite teammates
                        </Link>
                    ) : null}
                </div>
            </section>

            <section className="esset-card p-6 sm:p-8">
                {hasProjects ? (
                    <div className="space-y-3">
                        <h2 className="text-xl font-extrabold text-esset-ink">Recent projects</h2>
                        <ul className="space-y-2">
                            {projects?.map((project) => (
                                <li
                                    key={project.id}
                                    className="rounded-xl border border-esset-border bg-esset-bg px-3 py-2 text-sm font-semibold text-esset-ink"
                                >
                                    {project.title}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-xl font-extrabold text-esset-ink">Projects</h2>
                        <p className="text-esset-muted">
                            No projects yet. Create your first project to start mapping strategy
                            and evidence.
                        </p>
                        <Link
                            href={`/app/${orgId}/projects/new`}
                            className="esset-btn-primary inline-flex items-center justify-center px-4 py-2.5"
                        >
                            Create project
                        </Link>
                    </div>
                )}
            </section>
        </div>
    );
}
