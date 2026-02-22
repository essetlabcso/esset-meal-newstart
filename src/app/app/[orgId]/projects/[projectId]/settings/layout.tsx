import ProjectSettingsTabs from "@/components/projects/settings/ProjectSettingsTabs";
import { requireProjectScope } from "@/lib/projects/scope";

export const dynamic = "force-dynamic";

export default async function ProjectSettingsLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ orgId: string; projectId: string }>;
}) {
    const { orgId, projectId } = await params;
    const scope = await requireProjectScope(orgId, projectId);

    return (
        <div className="space-y-4">
            <section className="esset-card overflow-hidden">
                <header className="px-4 py-5 sm:px-6">
                    <h1 className="text-2xl font-black text-esset-ink">Project settings</h1>
                    <p className="mt-1 text-sm text-esset-muted">
                        Configure metadata, reporting periods, access, and defaults for{" "}
                        <span className="font-semibold text-esset-ink">{scope.project.title}</span>.
                    </p>
                </header>
                <ProjectSettingsTabs orgId={orgId} projectId={projectId} />
            </section>

            {children}
        </div>
    );
}
