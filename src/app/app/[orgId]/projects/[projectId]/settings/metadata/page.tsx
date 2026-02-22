import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProjectScope } from "@/lib/projects/scope";
import MetadataForm from "@/components/projects/settings/MetadataForm";

export const dynamic = "force-dynamic";

export default async function ProjectMetadataSettingsPage({
    params,
}: {
    params: Promise<{ orgId: string; projectId: string }>;
}) {
    const { orgId, projectId } = await params;
    const scope = await requireProjectScope(orgId, projectId);
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: project } = await supabase
        .from("projects")
        .select("id, title, short_code, description, start_date, end_date, status, created_by")
        .eq("id", projectId)
        .eq("tenant_id", orgId)
        .maybeSingle();

    if (!project) {
        notFound();
    }

    const canEdit =
        scope.role === "owner" || scope.role === "admin" || project.created_by === user?.id;

    return (
        <MetadataForm
            orgId={orgId}
            projectId={projectId}
            canEdit={canEdit}
            initialValues={{
                title: project.title ?? "",
                shortCode: project.short_code ?? "",
                description: project.description ?? "",
                startDate: project.start_date ?? "",
                endDate: project.end_date ?? "",
                status: project.status ?? "draft",
            }}
        />
    );
}
