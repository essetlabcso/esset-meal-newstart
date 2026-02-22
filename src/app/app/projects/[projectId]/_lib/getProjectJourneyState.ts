import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";

export type JourneyStageStatus = "ready" | "blocked" | "coming_soon";

export interface JourneyStage {
    id: "analyze" | "strategy" | "evidence" | "learning" | "reports";
    label: string;
    href: string;
    status: JourneyStageStatus;
    reason?: string;
}

interface PublishedVersionSummary {
    id: string;
    version_number: number;
    created_at: string;
    linked_analysis_snapshot_id: string | null;
}

export interface ProjectJourneyState {
    projectId: string;
    projectTitle: string;
    hasSnapshots: boolean;
    latestPublished: PublishedVersionSummary | null;
    latestExportable: PublishedVersionSummary | null;
    stages: JourneyStage[];
}

export async function getProjectJourneyState(projectId: string): Promise<ProjectJourneyState | null> {
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);
    if (!tenant) return null;

    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id,title")
        .eq("id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .maybeSingle();

    if (projectError || !project) return null;

    const { count: snapshotCount } = await supabase
        .from("analysis_snapshots")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId);

    const latestPublishedResult = await supabase
        .from("toc_versions")
        .select("id,version_number,created_at,linked_analysis_snapshot_id")
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .eq("status", "PUBLISHED")
        .order("created_at", { ascending: false })
        .limit(1);

    const latestExportableResult = await supabase
        .from("toc_versions")
        .select("id,version_number,created_at,linked_analysis_snapshot_id")
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .eq("status", "PUBLISHED")
        .not("linked_analysis_snapshot_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1);

    const latestPublishedRows = (latestPublishedResult as unknown as { data: PublishedVersionSummary[] | null }).data;
    const latestExportableRows = (latestExportableResult as unknown as { data: PublishedVersionSummary[] | null }).data;

    const latestPublished = Array.isArray(latestPublishedRows) ? latestPublishedRows[0] || null : null;
    const latestExportable = Array.isArray(latestExportableRows) ? latestExportableRows[0] || null : null;

    const hasSnapshots = (snapshotCount || 0) > 0;

    const reportsStatus: JourneyStageStatus = latestExportable ? "ready" : "blocked";
    const reportsReason = latestExportable
        ? undefined
        : latestPublished
            ? "Publish with snapshot binding to unlock reports."
            : "Publish your strategy first to unlock reports.";

    const stages: JourneyStage[] = [
        {
            id: "analyze",
            label: "Analyze",
            href: `/app/projects/${projectId}/analysis`,
            status: "ready",
        },
        {
            id: "strategy",
            label: "Strategy (ToC)",
            href: `/app/projects/${projectId}/toc`,
            status: "ready",
            reason: hasSnapshots ? undefined : "Create an Analysis Snapshot to initialize your ToC.",
        },
        {
            id: "evidence",
            label: "Evidence (Foundations)",
            href: `/app/projects/${projectId}/evidence`,
            status: "ready",
        },
        {
            id: "learning",
            label: "Learning",
            href: `/app/projects/${projectId}/learning`,
            status: "coming_soon",
            reason: "Coming soon in the next phase.",
        },
        {
            id: "reports",
            label: "Reports",
            href: `/app/projects/${projectId}/reports`,
            status: reportsStatus,
            reason: reportsReason,
        },
    ];

    return {
        projectId,
        projectTitle: String(project.title),
        hasSnapshots,
        latestPublished,
        latestExportable,
        stages,
    };
}
