import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { notFound } from "next/navigation";
import {
    createTocDraft,
    publishToc,
    addNode,
    addEdge,
    addNodeAssumption
} from "./actions";

interface TocBuilderPageProps {
    params: Promise<{
        projectId: string;
    }>;
    searchParams: Promise<{
        snapshot?: string;
    }>;
}

export default async function TocBuilderPage({ params, searchParams }: TocBuilderPageProps) {
    const { projectId } = await params;
    const { snapshot: snapshotIdParam } = await searchParams;
    const supabase = await createClient();
    const tenant = await getActiveTenant(supabase);

    if (!tenant) return notFound();

    // 1. Fetch project info
    const { data: project } = await supabase
        .from("projects")
        .select("title")
        .eq("id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .single();

    if (!project) return notFound();

    // 2. Fetch all versions to allow switching (or just latest)
    const { data: versions } = await supabase
        .from("toc_versions")
        .select("*")
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .order("version_number", { ascending: false });

    const draftVersion = versions?.find(v => v.status === 'DRAFT');
    const publishedVersions = versions?.filter(v => v.status === 'PUBLISHED');
    const latestPublished = publishedVersions?.[0];

    // --- CASE A: NO DRAFT EXISTS ---
    if (!draftVersion) {
        // Fetch snapshots for the "Start ToC" dropdown
        const { data: snapshots } = await supabase
            .from("analysis_snapshots")
            .select("id, title")
            .eq("project_id", projectId)
            .eq("tenant_id", tenant.tenantId);

        return (
            <div className="p-8 max-w-2xl mx-auto">
                <div className="mb-8">
                    <Link href={`/app/projects/${projectId}`} className="text-sm text-gray-400 hover:text-white transition">← Back to Project</Link>
                    <h1 className="text-2xl font-bold text-white mt-4">Theory of Change Builder</h1>
                    <p className="text-gray-400 text-sm mt-1">Initialize your strategy graph from an analysis snapshot.</p>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-xl p-8 text-center">
                    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-white">Ready to begin?</h2>
                    <p className="mt-2 text-gray-400 mb-8">You need an active draft to start building nodes and edges.</p>

                    <form action={async (formData: FormData) => {
                        "use server"
                        const sid = formData.get("snapshot_id") as string;
                        const fromVid = formData.get("from_version_id") as string;
                        await createTocDraft(projectId, sid, fromVid || undefined);
                    }} className="space-y-4 text-left max-w-sm mx-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Select Analysis Snapshot</label>
                            <select
                                name="snapshot_id"
                                required
                                defaultValue={snapshotIdParam || ""}
                                className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="" disabled>Choose a snapshot...</option>
                                {snapshots?.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                            </select>
                            {(!snapshots || snapshots.length === 0) && (
                                <p className="text-xs text-amber-400 mt-2">No snapshots found. <Link href={`/app/projects/${projectId}/analysis`} className="underline">Create one first.</Link></p>
                            )}
                        </div>

                        {latestPublished && (
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="clone" name="from_version_id" value={latestPublished.id} className="rounded border-white/10 bg-white/5 text-emerald-500" />
                                <label htmlFor="clone" className="text-sm text-gray-300">Clone from latest published (v{latestPublished.version_number})</label>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!snapshots || snapshots.length === 0}
                            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition disabled:opacity-50"
                        >
                            Create ToC Draft
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- CASE B: DRAFT/PUBLISHED EDITOR ---
    // (For this implementation, we focus on the ACTIVE DRAFT)
    const activeVersion = draftVersion;

    // Fetch Nodes, Edges, and Assumptions for the active version
    const { data: nodes } = await supabase
        .from("toc_nodes")
        .select("*, toc_assumptions(*)")
        .eq("toc_version_id", activeVersion.id)
        .eq("tenant_id", tenant.tenantId);

    const { data: edges } = await supabase
        .from("toc_edges")
        .select("*, toc_edge_assumptions(*)")
        .eq("toc_version_id", activeVersion.id)
        .eq("tenant_id", tenant.tenantId);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link href={`/app/projects/${projectId}`} className="text-sm text-gray-400 hover:text-white transition">← Back to Project</Link>
                    <div className="flex items-center space-x-3 mt-4">
                        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">{project.title} - ToC v{activeVersion.version_number}</h1>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase">Draft</span>
                    </div>
                </div>
                <div className="flex space-x-3">
                    {tenant.role !== 'member' && (
                        <form action={async () => {
                            "use server"
                            await publishToc(projectId, activeVersion.id);
                        }}>
                            <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition">
                                Publish Version
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar: Controls */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Add Node Form */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase">Add Node</h3>
                        <form action={async (formData: FormData) => {
                            "use server"
                            const type = formData.get("type") as string;
                            const title = formData.get("title") as string;
                            const desc = formData.get("description") as string;
                            await addNode(projectId, activeVersion.id, type, title, desc);
                        }} className="space-y-3">
                            <select name="type" required className="w-full rounded-lg border border-white/10 bg-white/5 text-sm p-2 text-white outline-none">
                                <option value="GOAL">GOAL</option>
                                <option value="OUTCOME">OUTCOME</option>
                                <option value="OUTPUT">OUTPUT</option>
                                <option value="ACTIVITY">ACTIVITY</option>
                            </select>
                            <input name="title" required placeholder="Node Title" className="w-full rounded-lg border border-white/10 bg-white/5 text-sm p-2 text-white outline-none" />
                            <textarea name="description" placeholder="Optional description..." className="w-full rounded-lg border border-white/10 bg-white/5 text-sm p-2 text-white outline-none" rows={2} />
                            <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg transition">+ Create Node</button>
                        </form>
                    </div>

                    {/* Add Edge Form */}
                    <div className="bg-white/5 border border-white/5 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase">Add Connection</h3>
                        <form action={async (formData: FormData) => {
                            "use server"
                            const s = formData.get("source") as string;
                            const t = formData.get("target") as string;
                            await addEdge(projectId, activeVersion.id, s, t);
                        }} className="space-y-3">
                            <select name="source" required className="w-full rounded-lg border border-white/10 bg-white/5 text-sm p-2 text-white outline-none">
                                <option value="" disabled selected>Source Node</option>
                                {nodes?.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                            </select>
                            <select name="target" required className="w-full rounded-lg border border-white/10 bg-white/5 text-sm p-2 text-white outline-none">
                                <option value="" disabled selected>Target Node</option>
                                {nodes?.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                            </select>
                            <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg transition">+ Connect</button>
                        </form>
                    </div>
                </div>

                {/* Main Graph View (Logical Grouping List) */}
                <div className="lg:col-span-3 space-y-12">
                    {['GOAL', 'OUTCOME', 'OUTPUT', 'ACTIVITY'].map(type => (
                        <div key={type} className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <h2 className="text-xs font-black tracking-widest text-gray-500 uppercase">{type}S</h2>
                                <div className="h-px flex-1 bg-white/5"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {nodes?.filter(n => n.node_type === type).map(node => (
                                    <div key={node.id} className="bg-white/5 border border-white/5 rounded-xl p-5 hover:border-emerald-500/30 transition group">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white text-sm">{node.title}</h4>
                                            <span className="text-[10px] text-gray-500">#{node.id.slice(0, 4)}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-4">{node.description || "No description."}</p>

                                        {/* Assumptions */}
                                        <div className="space-y-2">
                                            {node.toc_assumptions?.map((ass) => (
                                                <div key={ass.id} className="text-[10px] bg-emerald-500/5 text-emerald-400/80 p-2 rounded-lg border border-emerald-500/10 flex items-start space-x-2">
                                                    <span className="font-black">A:</span>
                                                    <span>{ass.assumption_text}</span>
                                                </div>
                                            ))}
                                            <form action={async (formData: FormData) => {
                                                "use server"
                                                const txt = formData.get("text") as string;
                                                await addNodeAssumption(projectId, activeVersion.id, node.id, txt, "MEDIUM");
                                            }} className="opacity-0 group-hover:opacity-100 transition focus-within:opacity-100">
                                                <input name="text" placeholder="Add assumption..." className="w-full bg-transparent border-b border-white/10 text-[10px] text-gray-400 py-1 outline-none focus:border-emerald-500" />
                                            </form>
                                        </div>

                                        {/* Outgoing Edges */}
                                        <div className="mt-4 flex flex-wrap gap-1">
                                            {edges?.filter(e => e.source_node_id === node.id).map(edge => {
                                                const target = nodes?.find(n => n.id === edge.target_node_id);
                                                return (
                                                    <div key={edge.id} className="text-[9px] bg-white/5 text-gray-500 px-2 py-0.5 rounded border border-white/5">
                                                        → {target?.title || edge.target_node_id.slice(0, 4)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                {nodes?.filter(n => n.node_type === type).length === 0 && (
                                    <div className="text-[10px] text-gray-600 italic">No {type.toLowerCase()} nodes yet.</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

