import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { notFound, redirect } from "next/navigation";
import {
    createTocDraft,
    publishToc,
    exportMatrixCsv,
    readDraftPayloadAction,
    addNode,
    addNodeAssumption,
    addEdgeAssumption,
    deleteEdgeAssumption
} from "./actions";
import TocGraphClient from "./TocGraphClient";

interface TocBuilderPageProps {
    params: Promise<{
        projectId: string;
    }>;
    searchParams: Promise<{
        snapshot?: string;
        v?: string;
        error?: string;
        gate_codes?: string;
        export_hash?: string;
        export_manifest?: string;
        export_error?: string;
    }>;
}

type TocNodeView = {
    id: string;
    node_type: string;
    title: string;
    description: string | null;
    pos_x: number;
    pos_y: number;
    toc_assumptions?: Array<{
        id: string;
        assumption_text: string;
        risk_level: string | null;
    }>;
    [key: string]: unknown;
};

type TocEdgeView = {
    id: string;
    source_node_id: string;
    target_node_id: string;
    edge_type: string;
    toc_edge_assumptions?: Array<{
        id: string;
        assumption_text: string;
        risk_level: string | null;
    }>;
    [key: string]: unknown;
};

export default async function TocBuilderPage({ params, searchParams }: TocBuilderPageProps) {
    const { projectId } = await params;
    const {
        snapshot: snapshotIdParam,
        v: selectedVersionId,
        error: publishError,
        gate_codes: gateCodesParam,
        export_hash: exportHash,
        export_manifest: exportManifest,
        export_error: exportError
    } = await searchParams;
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

    // 2. Fetch all versions for the project
    const { data: versions } = await supabase
        .from("toc_versions")
        .select("id, version_number, status, created_at, analysis_snapshot_id")
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .order("created_at", { ascending: false });

    // 3. Determine active version
    let activeVersion = null;
    if (selectedVersionId) {
        activeVersion = versions?.find(v => v.id === selectedVersionId) || null;
    }

    // If no selected version or selected version not found, pick default
    if (!activeVersion && versions && versions.length > 0) {
        activeVersion = versions.find(v => v.status === 'DRAFT') || versions[0];
    }

    // --- CASE A: NO VERSIONS EXIST OR EXPLICIT CTA ---
    if (!activeVersion) {
        // Fetch snapshots for the "Start ToC" dropdown
        const { data: snapshots } = await supabase
            .from("analysis_snapshots")
            .select("id, title, created_at")
            .eq("project_id", projectId)
            .eq("tenant_id", tenant.tenantId)
            .order("created_at", { ascending: false })
            .limit(20);

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
                        await createTocDraft(projectId, sid);
                    }} className="space-y-4 text-left max-w-sm mx-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Select Analysis Snapshot</label>
                            <select
                                name="snapshot_id"
                                required
                                defaultValue={snapshotIdParam || snapshots?.[0]?.id || ""}
                                className="w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="" disabled>Choose a snapshot...</option>
                                {snapshots?.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                            </select>
                            {(!snapshots || snapshots.length === 0) && (
                                <p className="text-xs text-amber-400 mt-2">No snapshots found. <Link href={`/app/projects/${projectId}/analysis`} className="underline">Create one first.</Link></p>
                            )}
                        </div>

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
    const isEditable = activeVersion.status === "DRAFT" && tenant.role !== "member";

    // Draft read is exposed as a single structured payload for Wizard/Graph/Matrix.
    let nodes: TocNodeView[] = [];
    let edges: TocEdgeView[] = [];

    if (activeVersion.status === "DRAFT") {
        const draftPayload = await readDraftPayloadAction(projectId, activeVersion.id);
        if (draftPayload.ok) {
            nodes = draftPayload.data.graph.nodes as TocNodeView[];
            edges = draftPayload.data.graph.edges as TocEdgeView[];
        }
    }

    if (nodes.length === 0 || edges.length === 0) {
        const { data: fallbackNodes } = await supabase
            .from("toc_nodes")
            .select("*, toc_assumptions(*)")
            .eq("toc_version_id", activeVersion.id)
            .eq("tenant_id", tenant.tenantId);

        const { data: fallbackEdges } = await supabase
            .from("toc_edges")
            .select("*, toc_edge_assumptions(*)")
            .eq("toc_version_id", activeVersion.id)
            .eq("tenant_id", tenant.tenantId);

        nodes = fallbackNodes || [];
        edges = fallbackEdges || [];
    }

    // Get latest published for cloning purposes
    const latestPublished = versions?.find(v => v.status === 'PUBLISHED');

    // Get latest snapshots for the "New Draft" dropdown
    const { data: snapshots } = await supabase
        .from("analysis_snapshots")
        .select("id, title, created_at")
        .eq("project_id", projectId)
        .eq("tenant_id", tenant.tenantId)
        .order("created_at", { ascending: false })
        .limit(20);

    const activeSnapshot = snapshots?.find(s => s.id === activeVersion.analysis_snapshot_id);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link href={`/app/projects/${projectId}`} className="text-sm text-gray-400 hover:text-white transition">← Back to Project</Link>
                    <div className="flex items-center space-x-3 mt-4">
                        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">{project.title}</h1>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${activeVersion.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {activeVersion.status}
                        </span>
                    </div>
                    {activeSnapshot && (
                        <div className="mt-2 flex items-center space-x-2 text-xs">
                            <span className="text-gray-500 font-medium">Anchored to:</span>
                            <Link
                                href={`/app/projects/${projectId}/analysis/${activeSnapshot.id}`}
                                className="text-emerald-400 hover:text-emerald-300 transition underline underline-offset-4"
                            >
                                {activeSnapshot.title}
                            </Link>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Version Selector */}
                    <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-lg p-1">
                        <span className="text-[10px] font-bold text-gray-500 px-2 uppercase">Version:</span>
                        <select
                            className="bg-transparent text-xs text-white outline-none pr-4"
                            defaultValue={activeVersion.id}
                            onChange={(e) => {
                                // Simple client routing for selector
                                window.location.href = `/app/projects/${projectId}/toc?v=${e.target.value}`;
                            }}
                        >
                            {versions?.map(v => (
                                <option key={v.id} value={v.id} className="bg-gray-900">
                                    v{v.version_number} ({v.status}) - {new Date(v.created_at).toLocaleDateString()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Admin Actions */}
                    {tenant.role !== 'member' && (
                        <div className="flex items-center gap-2">
                            {activeVersion.status === 'DRAFT' && (
                                <form action={async () => {
                                    "use server"
                                    const result = await publishToc(projectId, activeVersion.id);
                                    if (result?.error) {
                                        const params = new URLSearchParams({
                                            v: activeVersion.id,
                                            error: result.error,
                                            gate_codes: (result.gateCodes || []).join(","),
                                        });
                                        redirect(`/app/projects/${projectId}/toc?${params.toString()}`);
                                    }
                                    redirect(`/app/projects/${projectId}/toc`);
                                }}>
                                    <button
                                        data-testid="publish-button"
                                        className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition"
                                    >
                                        Publish
                                    </button>
                                </form>
                            )}

                            {activeVersion.status === 'PUBLISHED' && (
                                <form action={async () => {
                                    "use server"
                                    const result = await exportMatrixCsv(projectId, activeVersion.id);
                                    if (result?.error) {
                                        const params = new URLSearchParams({
                                            v: activeVersion.id,
                                            export_error: result.error,
                                        });
                                        redirect(`/app/projects/${projectId}/toc?${params.toString()}`);
                                    }
                                    if (result?.data) {
                                        const params = new URLSearchParams({
                                            v: activeVersion.id,
                                            export_hash: result.data.hash,
                                            export_manifest: result.data.manifestId,
                                        });
                                        redirect(`/app/projects/${projectId}/toc?${params.toString()}`);
                                    }
                                    redirect(`/app/projects/${projectId}/toc?v=${activeVersion.id}`);
                                }}>
                                    <button
                                        data-testid="export-matrix-csv-button"
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
                                    >
                                        Export Matrix CSV
                                    </button>
                                </form>
                            )}

                            <form action={async (formData: FormData) => {
                                "use server"
                                const sid = formData.get("snapshot_id") as string;
                                if (!sid) throw new Error("Please select an analysis snapshot.");
                                await createTocDraft(projectId, sid, latestPublished?.id);
                            }} className="flex items-center gap-2">
                                <select
                                    name="snapshot_id"
                                    required
                                    defaultValue={snapshots?.[0]?.id || ""}
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition max-w-[180px]"
                                >
                                    <option value="" disabled>Analyze first...</option>
                                    {snapshots?.map(s => (
                                        <option key={s.id} value={s.id} className="bg-gray-900">
                                            {s.title} ({new Date(s.created_at).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    disabled={!snapshots || snapshots.length === 0}
                                    title={!snapshots || snapshots.length === 0 ? "Create an analysis snapshot first" : "Create new draft"}
                                    className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition disabled:opacity-50 whitespace-nowrap"
                                >
                                    New Draft
                                </button>
                                {(!snapshots || snapshots.length === 0) && (
                                    <Link href={`/app/projects/${projectId}/analysis/new`} className="text-[10px] text-amber-400 hover:underline">
                                        Create Snapshot
                                    </Link>
                                )}
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {publishError && (
                <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    Publish blocked: {publishError}
                    {gateCodesParam && (
                        <div className="mt-2 text-xs text-red-200">
                            Gate codes: {gateCodesParam}
                        </div>
                    )}
                </div>
            )}

            {exportError && (
                <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    Export blocked: {exportError}
                </div>
            )}

            {exportHash && exportManifest && (
                <div className="mb-6 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
                    Matrix CSV exported.
                    <div className="mt-1 text-xs">Manifest: <span className="font-mono">{exportManifest}</span></div>
                    <div className="text-xs">SHA-256: <span className="font-mono">{exportHash}</span></div>
                </div>
            )}

            {/* Visual Graph Section */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-black tracking-widest text-gray-500 uppercase">Strategy Graph Builder</h2>
                    {isEditable && <div className="text-[10px] text-gray-500 italic">Drag to move • Connect handles to link • Press Delete to remove</div>}
                </div>
                <TocGraphClient
                    projectId={projectId}
                    versionId={activeVersion.id}
                    initialNodes={nodes || []}
                    initialEdges={edges || []}
                    isEditable={isEditable}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar: Controls */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Add Node Form - Only for DRAFT + Admin */}
                    {isEditable && (
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
                    )}

                    {!isEditable && (
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-5">
                            <p className="text-[10px] text-amber-500/80 font-medium">
                                Editing is disabled for {activeVersion.status === 'PUBLISHED' ? 'published versions' : 'member accounts'}.
                                {activeVersion.status === 'PUBLISHED' && tenant.role !== 'member' && ' Create a new draft to make changes.'}
                            </p>
                        </div>
                    )}
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
                                            {isEditable && (
                                                <form action={async (formData: FormData) => {
                                                    "use server"
                                                    const txt = formData.get("text") as string;
                                                    await addNodeAssumption(projectId, activeVersion.id, node.id, txt, "MEDIUM");
                                                }} className="opacity-0 group-hover:opacity-100 transition focus-within:opacity-100">
                                                    <input name="text" placeholder="Add assumption..." className="w-full bg-transparent border-b border-white/10 text-[10px] text-gray-400 py-1 outline-none focus:border-emerald-500" />
                                                </form>
                                            )}
                                        </div>

                                        {/* Outgoing Edges */}
                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Outgoing Connectors</h5>
                                            </div>

                                            {edges?.filter(e => e.source_node_id === node.id).map(edge => {
                                                const target = nodes?.find(n => n.id === edge.target_node_id);
                                                return (
                                                    <div key={edge.id} className="bg-white/5 border border-white/5 rounded-lg p-3 space-y-3 relative group/edge">
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-[10px] text-gray-400 flex items-center space-x-2">
                                                                <span className="font-bold text-emerald-500/50">→</span>
                                                                <span className="font-bold text-gray-300">{target?.title || "Unknown Node"}</span>
                                                                <span className="text-[8px] opacity-30 tracking-tighter">({edge.edge_type})</span>
                                                            </div>
                                                        </div>

                                                        {/* Edge Assumptions */}
                                                        <div className="space-y-1.5 pl-2 border-l border-white/10">
                                                            {edge.toc_edge_assumptions?.map((ass) => (
                                                                <div key={ass.id} className="text-[9px] bg-amber-500/5 text-amber-500/80 p-2 rounded border border-amber-500/10 flex items-start justify-between group/ass">
                                                                    <div className="flex items-start space-x-2 pr-2">
                                                                        <span className="font-black text-[8px] opacity-40">ASS:</span>
                                                                        <span className="leading-tight">{ass.assumption_text}</span>
                                                                        <span className={`px-1 rounded-[2px] text-[7px] font-black ${ass.risk_level === 'HIGH' ? 'bg-red-500/20 text-red-500' :
                                                                                ass.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-500' :
                                                                                    'bg-emerald-500/20 text-emerald-500'
                                                                            }`}>
                                                                            {ass.risk_level}
                                                                        </span>
                                                                    </div>
                                                                    {isEditable && (
                                                                        <form action={async () => {
                                                                            "use server"
                                                                            await deleteEdgeAssumption(projectId, activeVersion.id, ass.id);
                                                                        }} className="opacity-0 group-hover/ass:opacity-100 transition shrink-0">
                                                                            <button className="text-red-500/50 hover:text-red-500 transition-colors">
                                                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            </button>
                                                                        </form>
                                                                    )}
                                                                </div>
                                                            ))}

                                                            {isEditable && (
                                                                <form action={async (formData: FormData) => {
                                                                    "use server"
                                                                    const txt = formData.get("text") as string;
                                                                    const risk = formData.get("risk") as "LOW" | "MEDIUM" | "HIGH";
                                                                    if (!txt) return;
                                                                    await addEdgeAssumption(projectId, activeVersion.id, edge.id, txt, risk);
                                                                }} className="flex items-center gap-2 pt-1">
                                                                    <input
                                                                        name="text"
                                                                        required
                                                                        placeholder="New edge assumption..."
                                                                        className="flex-1 bg-transparent border-b border-white/5 text-[9px] text-gray-500 py-1 outline-none focus:border-amber-500/50 transition-colors"
                                                                    />
                                                                    <select
                                                                        name="risk"
                                                                        defaultValue="MEDIUM"
                                                                        className="bg-transparent text-[8px] text-gray-500 outline-none cursor-pointer"
                                                                    >
                                                                        <option value="LOW" className="bg-gray-900">LOW</option>
                                                                        <option value="MEDIUM" className="bg-gray-900">MED</option>
                                                                        <option value="HIGH" className="bg-gray-900">HIGH</option>
                                                                    </select>
                                                                    <button className="text-amber-500/50 hover:text-amber-500 transition-colors">
                                                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                                                                        </svg>
                                                                    </button>
                                                                </form>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {edges?.filter(e => e.source_node_id === node.id).length === 0 && (
                                                <div className="text-[9px] text-gray-600 italic">No outgoing connectors established.</div>
                                            )}
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

