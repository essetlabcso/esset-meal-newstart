import { requireProjectScope } from "@/lib/projects/scope";
import DefaultsForm from "@/components/projects/settings/DefaultsForm";

export const dynamic = "force-dynamic";

export default async function ProjectDefaultsSettingsPage({
    params,
}: {
    params: Promise<{ orgId: string; projectId: string }>;
}) {
    const { orgId, projectId } = await params;
    await requireProjectScope(orgId, projectId);

    return <DefaultsForm orgId={orgId} projectId={projectId} />;
}
