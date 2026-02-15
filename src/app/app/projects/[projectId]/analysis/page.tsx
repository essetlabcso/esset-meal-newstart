import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import { createAnalysisSnapshot } from "./actions";

interface AnalysisSnapshotPageProps {
    params: Promise<{
        projectId: string;
    }>;
}

export default async function AnalysisSnapshotPage({ params }: AnalysisSnapshotPageProps) {
    const { projectId } = await params;
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) return notFound();

    // Verify project and fetch snapshots
    const { data: project } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .single();

    if (!project) return notFound();

    const { data: snapshots } = await supabase
        .from("analysis_snapshots")
        .select("*")
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .order("created_at", { ascending: false });

    async function handleSnapshotCreate(formData: FormData) {
        "use server"
        const title = formData.get("title") as string;
        const notes = formData.get("notes") as string;
        await createAnalysisSnapshot(projectId, title, notes);
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link
                    href={`/app/projects/${projectId}`}
                    className="text-sm text-gray-400 hover:text-white transition"
                >
                    ← Back to Project
                </Link>
                <h1 className="text-2xl font-bold text-white mt-4">Analysis Snapshots for {project.title}</h1>
                <p className="text-gray-400 text-sm mt-1">Immutable snapshots used to anchor ToC versions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <form action={handleSnapshotCreate} className="space-y-4 bg-white/5 border border-white/5 rounded-xl p-6 sticky top-8">
                        <h2 className="text-lg font-medium text-white mb-4">New Snapshot</h2>
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                                Snapshot Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                placeholder="e.g., Initial Assessment Feb 2026"
                                className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-300">
                                Analysis Notes
                            </label>
                            <textarea
                                name="notes"
                                id="notes"
                                rows={4}
                                placeholder="Paste analysis results or key takeaways here..."
                                className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition"
                        >
                            Create Snapshot
                        </button>
                    </form>
                </div>

                <div className="md:col-span-2 space-y-4">
                    <h2 className="text-lg font-medium text-white mb-4">Past Snapshots</h2>
                    {!snapshots || snapshots.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-gray-400">
                            No snapshots yet. Create one to start building your Theory of Change.
                        </div>
                    ) : (
                        snapshots.map((snapshot) => (
                            <div key={snapshot.id} className="bg-white/5 border border-white/5 rounded-xl p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-white">{snapshot.title}</h3>
                                    <span className="text-[10px] text-gray-500 px-2 py-1 rounded bg-white/5 uppercase tracking-wider">
                                        {new Date(snapshot.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400 line-clamp-3">
                                    {(snapshot.snapshot as { notes?: string })?.notes || "No notes provided."}
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">ID: {snapshot.id.slice(0, 8)}...</span>
                                    <Link
                                        href={`/app/projects/${projectId}/toc?snapshot=${snapshot.id}`}
                                        className="text-xs text-emerald-500 hover:underline"
                                    >
                                        Use for ToC →
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
