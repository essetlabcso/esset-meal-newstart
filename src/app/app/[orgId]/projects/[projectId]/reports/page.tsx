import { redirect } from "next/navigation";
import { requireProjectScope } from "@/lib/projects/scope";

export default async function ReportsRedirectPage({
    params,
}: {
    params: Promise<{ orgId: string; projectId: string }>;
}) {
    const { orgId, projectId } = await params;
    await requireProjectScope(orgId, projectId);
    redirect(`/app/${orgId}/projects/${projectId}/analytics`);
}
