import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";
import { createAnalysisSnapshot, AnalysisSnapshotPayload } from "../actions";

interface AnalysisNewPageProps {
    params: Promise<{
        projectId: string;
    }>;
}

export default async function AnalysisNewPage({ params }: AnalysisNewPageProps) {
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

    async function handleSubmit(formData: FormData) {
        "use server"
        const title = formData.get("title") as string;
        const payload: AnalysisSnapshotPayload = {
            context_summary: formData.get("context_summary") as string,
            problem_statement: formData.get("problem_statement") as string,
            stakeholders: formData.get("stakeholders") as string,
            evidence_notes: formData.get("evidence_notes") as string,
            key_assumptions: formData.get("key_assumptions") as string,
            risks_and_mitigations: formData.get("risks_and_mitigations") as string,
        };

        await createAnalysisSnapshot(projectId, title, payload);
        redirect(`/app/projects/${projectId}/analysis`);
    }

    const fields = [
        { name: "context_summary", label: "Context Summary", placeholder: "Background of the mission..." },
        { name: "problem_statement", label: "Problem Statement", placeholder: "What core challenge are we addressing?" },
        { name: "stakeholders", label: "Stakeholders", placeholder: "Who is involved or impacted?" },
        { name: "evidence_notes", label: "Evidence Notes", placeholder: "Key data points and observations..." },
        { name: "key_assumptions", label: "Key Assumptions", placeholder: "What are we taking as given?" },
        { name: "risks_and_mitigations", label: "Risks & Mitigations", placeholder: "Potential pitfalls and how to avoid them..." },
    ];

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <Link href={`/app/projects/${projectId}/analysis`} className="text-sm text-gray-400 hover:text-white transition">← Back to Snapshots</Link>
                <h1 className="text-2xl font-bold text-white mt-4">New Analysis Snapshot</h1>
                <p className="text-gray-400 text-sm mt-1">Capture the current project context before evolving the strategy.</p>
            </div>

            <form action={handleSubmit} className="space-y-6">
                <div className="bg-white/5 border border-white/5 rounded-xl p-8 space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Snapshot Title</label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            required
                            placeholder="e.g., Baseline Assessment - Feb 2026"
                            className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white focus:border-emerald-500 focus:outline-none transition shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {fields.map((f) => (
                            <div key={f.name}>
                                <label htmlFor={f.name} className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{f.label}</label>
                                <textarea
                                    name={f.name}
                                    id={f.name}
                                    rows={4}
                                    placeholder={f.placeholder}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white focus:border-emerald-500 focus:outline-none transition shadow-sm resize-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-4">
                    <Link
                        href={`/app/projects/${projectId}/analysis`}
                        className="text-sm font-medium text-gray-400 hover:text-white transition"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                    >
                        Create Snapshot
                    </button>
                </div>
            </form>
        </div>
    );
}
