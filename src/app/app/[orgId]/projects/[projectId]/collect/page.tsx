import ModuleStub from "@/app/app/[orgId]/projects/[projectId]/_components/ModuleStub";
import { requireProjectScope } from "@/lib/projects/scope";

export default async function CollectStubPage({
    params,
}: {
    params: Promise<{ orgId: string; projectId: string }>;
}) {
    const { orgId, projectId } = await params;
    await requireProjectScope(orgId, projectId);
    return <ModuleStub orgId={orgId} projectId={projectId} moduleLabel="Capture Data" />;
}
