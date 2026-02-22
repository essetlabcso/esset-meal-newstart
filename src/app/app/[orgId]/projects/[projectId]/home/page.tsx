import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProjectScope } from "@/lib/projects/scope";
import { getProjectJourneyState } from "@/app/app/projects/[projectId]/_lib/getProjectJourneyState";

export const dynamic = "force-dynamic";

type ProgressStatus = "Ready" | "In progress" | "Blocked" | "Coming soon";
type ProgressItem = {
    id: string;
    label: string;
    status: ProgressStatus;
    reason: string;
    href: string;
};

function statusClasses(status: ProgressStatus) {
    if (status === "Ready") {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }
    if (status === "Blocked") {
        return "border-amber-200 bg-amber-50 text-amber-800";
    }
    if (status === "In progress") {
        return "border-blue-200 bg-blue-50 text-blue-800";
    }
    return "border-slate-200 bg-slate-50 text-slate-700";
}

export default async function ProjectHomePage({
    params,
}: {
    params: Promise<{ orgId: string; projectId: string }>;
}) {
    const { orgId, projectId } = await params;
    const scope = await requireProjectScope(orgId, projectId);

    const journey = await getProjectJourneyState(projectId);

    const supabase = await createClient();
    const { data: periods, error: periodError } = await supabase
        .from("reporting_periods")
        .select("id, label, start_date, end_date")
        .eq("tenant_id", orgId)
        .eq("project_id", projectId)
        .order("start_date", { ascending: false });

    /* Map journey stages by id for lookup */
    const stageMap = new Map(
        (journey?.stages ?? []).map((s) => [s.id, s])
    );

    const analyzeStage = stageMap.get("analyze");
    const strategyStage = stageMap.get("strategy");
    const evidenceStage = stageMap.get("evidence");
    const learningStage = stageMap.get("learning");
    const reportsStage = stageMap.get("reports");

    function toStatus(stage: typeof analyzeStage, fallback: ProgressStatus): ProgressStatus {
        if (!stage) return fallback;
        if (stage.status === "ready") return "Ready";
        if (stage.status === "blocked") return "Blocked";
        return "Coming soon";
    }

    const progressItems: ProgressItem[] = [
        {
            id: "define",
            label: "Define Context",
            status: toStatus(analyzeStage, "In progress"),
            reason: analyzeStage?.reason ?? "Capture context and analysis snapshots.",
            href: `/app/${orgId}/projects/${projectId}/analyze`,
        },
        {
            id: "toc",
            label: "Build ToC",
            status: toStatus(strategyStage, "Blocked"),
            reason: strategyStage?.reason ?? "Map and publish your theory of change.",
            href: `/app/${orgId}/projects/${projectId}/strategy`,
        },
        {
            id: "plan",
            label: "Plan Indicators",
            status: (periods?.length ?? 0) > 0 ? "Ready" : "Blocked",
            reason:
                (periods?.length ?? 0) > 0
                    ? "Reporting periods are configured."
                    : "Set up at least one reporting period.",
            href: `/app/${orgId}/projects/${projectId}/plan`,
        },
        {
            id: "capture",
            label: "Capture Data",
            status: toStatus(evidenceStage, "Coming soon"),
            reason: evidenceStage?.reason ?? "Record evidence updates against indicators.",
            href: `/app/${orgId}/projects/${projectId}/collect`,
        },
        {
            id: "evidence",
            label: "Evidence Library",
            status: "Coming soon" as ProgressStatus,
            reason: "Store and organise supporting documents.",
            href: `/app/${orgId}/projects/${projectId}/evidence`,
        },
        {
            id: "learning",
            label: "Learning",
            status: toStatus(learningStage, "Coming soon"),
            reason: learningStage?.reason ?? "Log decisions and adaptations.",
            href: `/app/${orgId}/projects/${projectId}/learn`,
        },
        {
            id: "accountability",
            label: "Accountability",
            status: "Coming soon" as ProgressStatus,
            reason: "Track commitments and responsibilities.",
            href: `/app/${orgId}/projects/${projectId}/accountability`,
        },
        {
            id: "analytics",
            label: "Analytics & Reports",
            status: toStatus(reportsStage, "Blocked"),
            reason: reportsStage?.reason ?? "Publish strategy to unlock reporting.",
            href: `/app/${orgId}/projects/${projectId}/analytics`,
        },
    ];

    return (
        <div className="space-y-4">
            <section className="esset-card p-6 sm:p-8">
                <h1 className="esset-h2 font-black text-esset-ink">{scope.project.title}</h1>
                <p className="mt-2 text-sm text-esset-muted">
                    Project Home helps your team do the work, prove it, learn, and report.
                </p>
            </section>

            <section className="esset-card p-6">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <h2 className="text-xl font-extrabold text-esset-ink">Workflow progress</h2>
                    <Link
                        href={`/app/${orgId}/projects`}
                        className="text-sm font-semibold text-esset-teal-800"
                    >
                        All projects
                    </Link>
                </div>

                {!journey ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        We could not load progress right now.
                    </div>
                ) : (
                    <ol className="space-y-2">
                        {progressItems.map((item, i) => (
                            <li
                                key={item.id}
                                className="rounded-xl border border-esset-border bg-esset-bg px-3 py-3"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-esset-ink">
                                            <span className="mr-1.5 text-xs font-bold text-esset-muted">{i + 1}.</span>
                                            {item.label}
                                        </p>
                                        <p className="text-sm text-esset-muted">{item.reason}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(item.status)}`}
                                        >
                                            {item.status}
                                        </span>
                                        <Link
                                            href={item.href}
                                            className="rounded-lg border border-esset-border bg-white px-3 py-1.5 text-xs font-semibold text-esset-teal-800 hover:bg-esset-bg"
                                        >
                                            Go
                                        </Link>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
                <section className="esset-card p-6">
                    <h2 className="text-xl font-extrabold text-esset-ink">Reporting period</h2>
                    {periodError ? (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            We could not load reporting periods.
                        </div>
                    ) : (periods?.length ?? 0) === 0 ? (
                        <div className="mt-3 space-y-3 rounded-xl border border-dashed border-esset-border bg-esset-bg p-4">
                            <p className="text-sm text-esset-muted">
                                No reporting period is set yet.
                            </p>
                            <Link
                                href={`/app/${orgId}/projects/${projectId}/settings/reporting-periods`}
                                className="esset-btn-primary inline-flex items-center justify-center px-3 py-2 text-sm"
                            >
                                Set up reporting period
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-3 space-y-2">
                            <p className="text-sm font-semibold text-esset-ink">
                                Active period: {periods?.[0]?.label}
                            </p>
                            <p className="text-sm text-esset-muted">
                                {new Date(periods?.[0]?.start_date ?? "").toLocaleDateString()} –{" "}
                                {new Date(periods?.[0]?.end_date ?? "").toLocaleDateString()}
                            </p>
                            <Link
                                href={`/app/${orgId}/projects/${projectId}/settings/reporting-periods`}
                                className="text-sm font-semibold text-esset-teal-800"
                            >
                                Manage periods
                            </Link>
                        </div>
                    )}
                </section>

                <section className="esset-card p-6">
                    <h2 className="text-xl font-extrabold text-esset-ink">Recent activity</h2>
                    <div className="mt-3 space-y-3 rounded-xl border border-dashed border-esset-border bg-esset-bg p-4">
                        <p className="text-sm text-esset-muted">
                            No activity feed is available yet.
                        </p>
                        <Link
                            href={`/app/${orgId}/projects/${projectId}/home`}
                            className="text-sm font-semibold text-esset-teal-800"
                        >
                            Refresh this view
                        </Link>
                    </div>
                </section>

                <section className="esset-card p-6">
                    <h2 className="text-xl font-extrabold text-esset-ink">Data health</h2>
                    <div className="mt-3 space-y-3 rounded-xl border border-dashed border-esset-border bg-esset-bg p-4">
                        <p className="text-sm text-esset-muted">
                            Data health metrics are coming soon.
                        </p>
                        <Link
                            href={`/app/${orgId}/projects/${projectId}/collect`}
                            className="text-sm font-semibold text-esset-teal-800"
                        >
                            Open Capture Data
                        </Link>
                    </div>
                </section>

                <section className="esset-card p-6">
                    <h2 className="text-xl font-extrabold text-esset-ink">Quick actions</h2>
                    <ul className="mt-3 space-y-2">
                        <li>
                            <Link
                                href={`/app/${orgId}/projects/${projectId}/analyze`}
                                className="text-sm font-semibold text-esset-teal-800"
                            >
                                Update context snapshot
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`/app/${orgId}/projects/${projectId}/strategy`}
                                className="text-sm font-semibold text-esset-teal-800"
                            >
                                Check theory of change
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`/app/${orgId}/projects/${projectId}/plan`}
                                className="text-sm font-semibold text-esset-teal-800"
                            >
                                Review indicators plan
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`/app/${orgId}/projects/${projectId}/analytics`}
                                className="text-sm font-semibold text-esset-teal-800"
                            >
                                Prepare analytics report
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`/app/${orgId}/projects/${projectId}/settings/metadata`}
                                className="text-sm font-semibold text-esset-teal-800"
                            >
                                Update project settings
                            </Link>
                        </li>
                        <li>
                            <Link
                                href={`/app/${orgId}/projects`}
                                className="text-sm font-semibold text-esset-teal-800"
                            >
                                Switch project
                            </Link>
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
