import { createClient } from "@/lib/supabase/server";
import { requireProjectScope } from "@/lib/projects/scope";
import ReportingPeriodsTable from "@/components/projects/settings/ReportingPeriodsTable";

export const dynamic = "force-dynamic";

export default async function ProjectReportingPeriodsSettingsPage({
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

    const { data: periods } = await supabase
        .from("reporting_periods")
        .select("id, label, start_date, end_date, created_by")
        .eq("tenant_id", orgId)
        .eq("project_id", projectId)
        .order("start_date", { ascending: true });

    return (
        <ReportingPeriodsTable
            orgId={orgId}
            projectId={projectId}
            currentUserId={user?.id ?? null}
            role={scope.role}
            periods={
                periods?.map((period) => ({
                    id: period.id,
                    label: period.label,
                    startDate: period.start_date,
                    endDate: period.end_date,
                    createdBy: period.created_by,
                })) ?? []
            }
        />
    );
}
