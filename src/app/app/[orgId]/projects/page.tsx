import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrgScope } from "@/components/workspaces/OrgGuard";
import {
    readActiveProjectId,
    setActiveProjectId,
} from "@/lib/projects/context";
import { redirect } from "next/navigation";
import OrgTopBar from "@/components/shell/OrgTopBar";

export const dynamic = "force-dynamic";

export default async function OrgProjectsPage({
    params,
}: {
    params: Promise<{ orgId: string }>;
}) {
    const { orgId } = await params;
    await requireOrgScope(orgId);

    async function openProjectAction(formData: FormData) {
        "use server";

        const nextOrgId = String(formData.get("orgId") ?? "").trim();
        const projectId = String(formData.get("projectId") ?? "").trim();

        if (!nextOrgId || !projectId) {
            redirect(`/app/${orgId}/projects`);
        }

        await requireOrgScope(nextOrgId);

        const supabase = await createClient();
        const { data: project } = await supabase
            .from("projects")
            .select("id")
            .eq("id", projectId)
            .eq("tenant_id", nextOrgId)
            .maybeSingle();

        if (!project) {
            redirect(`/app/${nextOrgId}/projects`);
        }

        await setActiveProjectId(nextOrgId, projectId);
        redirect(`/app/${nextOrgId}/projects/${projectId}/home`);
    }

    const supabase = await createClient();
    const { data: projects } = await supabase
        .from("projects")
        .select("id, title, status, created_at")
        .eq("tenant_id", orgId)
        .order("created_at", { ascending: false });

    const persistedProjectId = await readActiveProjectId(orgId);
    const continueProject =
        persistedProjectId && projects
            ? projects.find((project) => project.id === persistedProjectId) ?? null
            : null;

    // Stale project IDs are simply ignored — no cookie delete in render path

    const singleProject =
        !continueProject && (projects?.length ?? 0) === 1 ? projects?.[0] ?? null : null;

    return (
        <>
            <OrgTopBar orgId={orgId} />
            <main className="esset-page-bg min-h-[calc(100vh-56px)] px-4 py-6 sm:px-6 sm:py-8">
                <div className="mx-auto w-full space-y-4" style={{ maxWidth: "var(--esset-container-max)" }}>
                    {continueProject ? (
                        <section className="esset-card p-5 sm:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-esset-ink">
                                        Continue where you left off
                                    </p>
                                    <p className="text-sm text-esset-muted">{continueProject.title}</p>
                                </div>
                                <form action={openProjectAction}>
                                    <input type="hidden" name="orgId" value={orgId} />
                                    <input type="hidden" name="projectId" value={continueProject.id} />
                                    <button
                                        type="submit"
                                        className="esset-btn-primary inline-flex items-center justify-center px-4 py-2.5"
                                    >
                                        Continue to last project
                                    </button>
                                </form>
                            </div>
                        </section>
                    ) : singleProject ? (
                        <section className="esset-card p-5 sm:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-esset-ink">
                                        One project available
                                    </p>
                                    <p className="text-sm text-esset-muted">{singleProject.title}</p>
                                </div>
                                <form action={openProjectAction}>
                                    <input type="hidden" name="orgId" value={orgId} />
                                    <input type="hidden" name="projectId" value={singleProject.id} />
                                    <button
                                        type="submit"
                                        className="esset-btn-primary inline-flex items-center justify-center px-4 py-2.5"
                                    >
                                        Continue
                                    </button>
                                </form>
                            </div>
                        </section>
                    ) : null}

                    <section className="esset-card p-6 sm:p-8">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-black text-esset-ink">Projects</h1>
                                <p className="mt-1 text-sm text-esset-muted">
                                    This list shows projects in the current workspace.
                                </p>
                                <p className="mt-1 text-sm font-semibold text-esset-teal-800">
                                    Select a project to open Project Home.
                                </p>
                            </div>
                            <Link
                                href={`/app/${orgId}/projects/new`}
                                className="esset-btn-primary inline-flex items-center justify-center px-4 py-2.5"
                            >
                                Create project
                            </Link>
                        </div>

                        {(projects?.length ?? 0) === 0 ? (
                            <div className="rounded-2xl border border-dashed border-esset-border bg-esset-bg px-4 py-8 text-center">
                                <p className="text-esset-muted">
                                    No projects yet. Create your first project to start mapping strategy
                                    and evidence.
                                </p>
                                <Link
                                    href={`/app/${orgId}/projects/new`}
                                    className="esset-btn-primary mt-4 inline-flex items-center justify-center px-4 py-2.5"
                                >
                                    Create project
                                </Link>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {projects?.map((project) => (
                                    <li
                                        key={project.id}
                                        className="rounded-xl border border-esset-border bg-esset-bg px-4 py-3"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <div className="font-semibold text-esset-ink">{project.title}</div>
                                                <div className="mt-1 text-xs uppercase tracking-wide text-esset-muted">
                                                    {project.status}
                                                </div>
                                            </div>
                                            <form action={openProjectAction}>
                                                <input type="hidden" name="orgId" value={orgId} />
                                                <input type="hidden" name="projectId" value={project.id} />
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="submit"
                                                        className="esset-btn-primary inline-flex items-center justify-center px-3 py-1.5 text-sm"
                                                    >
                                                        Open
                                                    </button>
                                                    <Link
                                                        href={`/app/${orgId}/projects/${project.id}/settings/metadata`}
                                                        className="inline-flex items-center justify-center rounded-[12px] border border-esset-border bg-white px-3 py-1.5 text-sm font-semibold text-esset-teal-800 hover:bg-esset-bg"
                                                    >
                                                        Settings
                                                    </Link>
                                                </div>
                                            </form>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}
