import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { deleteAnalysisSnapshot, AnalysisSnapshotPayload } from "./actions";

interface AnalysisListPageProps {
    params: Promise<{
        projectId: string;
    }>;
}

export default async function AnalysisListPage({ params }: AnalysisListPageProps) {
    const { projectId } = await params;
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) return notFound();

    // Verify project belongs to tenant
    const { data: project } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .single();

    if (!project) return notFound();

    const { data: snapshots } = await supabase
        .from("analysis_snapshots")
        .select("id, title, created_at, created_by, snapshot")
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .order("created_at", { ascending: false })
        .limit(50);

    const isAdmin = tenant.role !== "member";

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link href={`/app/projects/${projectId}`} className="text-sm text-gray-400 hover:text-white transition">← Back to Project</Link>
                    <h1 className="text-2xl font-bold text-white mt-4">Analysis Snapshots</h1>
                    <p className="text-gray-400 text-sm mt-1">Contextual foundations for {project.title}</p>
                </div>
                <Link
                    href={`/app/projects/${projectId}/analysis/new`}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition"
                >
                    + New Snapshot
                </Link>
            </div>

            <div className="space-y-4">
                {snapshots && snapshots.length > 0 ? (
                    snapshots.map((s) => (
                        <div key={s.id} className="group relative bg-white/5 border border-white/5 rounded-xl p-6 hover:border-emerald-500/30 transition">
                            <div className="flex items-center justify-between">
                                <Link href={`/app/projects/${projectId}/analysis/${s.id}`} className="flex-1">
                                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition">{s.title}</h3>
                                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                        <span>{new Date(s.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="font-mono text-[10px] uppercase tracking-tighter">{s.id.slice(0, 8)}</span>
                                    </div>
                                    {s.snapshot && (
                                        <p className="mt-3 text-sm text-gray-400 line-clamp-2">
                                            {(s.snapshot as unknown as AnalysisSnapshotPayload).context_summary || (s.snapshot as { notes?: string }).notes || "No summary provided."}
                                        </p>
                                    )}
                                </Link>

                                {isAdmin && (
                                    <form action={async () => {
                                        "use server"
                                        await deleteAnalysisSnapshot(projectId, s.id);
                                    }}>
                                        <button className="text-xs text-gray-500 hover:text-red-400 transition px-2 py-1">
                                            Delete
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white/5 border border-white/5 rounded-xl p-12 text-center">
                        <p className="text-gray-400 mb-6">No snapshots yet. Start by defining the project context.</p>
                        <Link
                            href={`/app/projects/${projectId}/analysis/new`}
                            className="inline-flex items-center space-x-2 text-emerald-400 font-medium hover:text-emerald-300 transition"
                        >
                            <span>Create your first snapshot</span>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
