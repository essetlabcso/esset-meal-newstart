import { redirect } from "next/navigation";

export default async function ProjectSettingsIndexPage({
    params,
}: {
    params: Promise<{ orgId: string; projectId: string }>;
}) {
    const { orgId, projectId } = await params;
    redirect(`/app/${orgId}/projects/${projectId}/settings/metadata`);
}
