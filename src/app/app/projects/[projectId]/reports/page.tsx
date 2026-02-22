import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { exportMatrixCsv } from "../toc/actions";
import { getProjectJourneyState } from "../_lib/getProjectJourneyState";

interface ReportsPageProps {
    params: Promise<{
        projectId: string;
    }>;
    searchParams: Promise<{
        export_hash?: string;
        export_manifest?: string;
        export_error?: string;
    }>;
}

export default async function ReportsPage({ params, searchParams }: ReportsPageProps) {
    const { projectId } = await params;
    const { export_hash: exportHash, export_manifest: exportManifest, export_error: exportError } = await searchParams;
    const journey = await getProjectJourneyState(projectId);
    if (!journey) return notFound();

    const latestExportable = journey.latestExportable;
    const blockedReason = !latestExportable
        ? journey.latestPublished
            ? "Reports are blocked: latest published ToC is missing snapshot binding."
            : "Reports are blocked: publish your ToC first."
        : null;

    return (
        <div className="p-8 max-w-4xl">
            <h1 className="text-2xl font-bold text-white">Reports</h1>
            <p className="mt-1 text-sm text-gray-400">
                Snapshot-bound exports for <span className="text-gray-200">{journey.projectTitle}</span>.
            </p>

            {blockedReason && (
                <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    {blockedReason}
                </div>
            )}

            {exportError && (
                <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    Export blocked: {exportError}
                </div>
            )}

            {exportHash && exportManifest && (
                <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                    <p>Export completed.</p>
                    <p className="mt-1 text-xs">Manifest: <span className="font-mono">{exportManifest}</span></p>
                    <p className="text-xs">SHA-256: <span className="font-mono">{exportHash}</span></p>
                </div>
            )}

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
                {latestExportable ? (
                    <>
                        <p className="text-sm text-gray-200">
                            Latest published version: <span className="font-semibold">v{latestExportable.version_number}</span>
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            Published on {new Date(latestExportable.created_at).toLocaleDateString()}
                        </p>
                        <form
                            action={async () => {
                                "use server";
                                const result = await exportMatrixCsv(
                                    projectId,
                                    latestExportable.id,
                                    String(latestExportable.linked_analysis_snapshot_id),
                                    "1970-01-01T00:00:00Z",
                                    "2100-12-31T23:59:59Z"
                                );

                                if (result?.error) {
                                    const params = new URLSearchParams({ export_error: result.error });
                                    redirect(`/app/projects/${projectId}/reports?${params.toString()}`);
                                }

                                const params = new URLSearchParams({
                                    export_hash: result?.data?.hash || "",
                                    export_manifest: result?.data?.manifestId || "",
                                });
                                redirect(`/app/projects/${projectId}/reports?${params.toString()}`);
                            }}
                            className="mt-4"
                        >
                            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
                                Export Matrix CSV
                            </button>
                        </form>
                    </>
                ) : (
                    <p className="text-sm text-gray-300">No exportable published version available yet.</p>
                )}

                <p className="mt-4 text-xs text-gray-500">
                    You can also use the existing export entrypoint in ToC while Reports is being finalized.
                </p>
                <Link
                    href={`/app/projects/${projectId}/toc`}
                    className="mt-1 inline-block text-xs text-emerald-400 hover:text-emerald-300 transition"
                >
                    Open ToC Builder
                </Link>
            </div>
        </div>
    );
}

