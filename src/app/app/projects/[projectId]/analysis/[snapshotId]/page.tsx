import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";
import { deleteAnalysisSnapshot, AnalysisSnapshotPayload } from "../actions";

interface AnalysisDetailPageProps {
    params: Promise<{
        projectId: string;
        snapshotId: string;
    }>;
}

export default async function AnalysisDetailPage({ params }: AnalysisDetailPageProps) {
    const { projectId, snapshotId } = await params;
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) return notFound();

    // Verify project context and fetch snapshot
    const { data: snapshot, error } = await supabase
        .from("analysis_snapshots")
        .select("*")
        .eq("id", snapshotId)
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .single();

    if (error || !snapshot) return notFound();

    const payload = snapshot.snapshot as unknown as Record<string, string>;
    const isAdmin = tenant.role !== "member";

    const fields = [
        { key: "context_summary", label: "Context Summary" },
        { key: "problem_statement", label: "Problem Statement" },
        { key: "stakeholders", label: "Stakeholders" },
        { key: "evidence_notes", label: "Evidence Notes" },
        { key: "key_assumptions", label: "Key Assumptions" },
        { key: "risks_and_mitigations", label: "Risks & Mitigations" },
    ];

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link href={`/app/projects/${projectId}/analysis`} className="text-sm text-gray-400 hover:text-white transition">← Back to Snapshots</Link>
                    <h1 className="text-2xl font-bold text-white mt-4">{snapshot.title}</h1>
                    <p className="text-gray-400 text-sm mt-1">Snapshot created on {new Date(snapshot.created_at).toLocaleString()}</p>
                </div>

                {isAdmin && (
                    <form action={async () => {
                        "use server"
                        await deleteAnalysisSnapshot(projectId, snapshotId);
                        redirect(`/app/projects/${projectId}/analysis`);
                    }}>
                        <button className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition">
                            Delete Snapshot
                        </button>
                    </form>
                )}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {fields.map((f) => (
                    <div key={f.key} className="bg-white/5 border border-white/5 rounded-xl p-6">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{f.label}</h2>
                        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {payload?.[f.key] || <span className="text-gray-600 italic">(Empty)</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-center">
                <Link
                    href={`/app/projects/${projectId}/toc?snapshot=${snapshotId}`}
                    className="inline-flex items-center space-x-2 rounded-xl bg-emerald-500 px-8 py-3 font-bold text-white hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                >
                    <span>Create ToC from this Snapshot</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
