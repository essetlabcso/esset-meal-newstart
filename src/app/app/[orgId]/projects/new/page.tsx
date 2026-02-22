import Link from "next/link";
import { requireOrgScope } from "@/components/workspaces/OrgGuard";

export const dynamic = "force-dynamic";

export default async function ScopedProjectCreatePlaceholderPage({
    params,
}: {
    params: Promise<{ orgId: string }>;
}) {
    const { orgId } = await params;
    await requireOrgScope(orgId);

    return (
        <section className="esset-card p-6 sm:p-8">
            <h1 className="text-2xl font-black text-esset-ink">Create project</h1>
            <p className="mt-2 text-esset-muted">
                Project creation is available in the existing project flow. Use the current
                scoped route to continue.
            </p>
            <Link
                href={`/app/${orgId}/projects`}
                className="esset-btn-primary mt-4 inline-flex items-center justify-center px-4 py-2.5"
            >
                Back to projects
            </Link>
        </section>
    );
}
