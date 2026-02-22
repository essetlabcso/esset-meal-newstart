import Link from "next/link";
import { getProject, updateProject, deleteProject } from "./actions";

interface ProjectDetailPageProps {
    params: Promise<{
        projectId: string;
    }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
    const { projectId } = await params;
    const project = await getProject(projectId);

    const updateProjectWithId = updateProject.bind(null, projectId);
    const deleteProjectWithId = deleteProject.bind(null, projectId);

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link
                        href="/app/projects"
                        className="text-sm text-gray-400 hover:text-white transition"
                    >
                        ← Back to Projects
                    </Link>
                    <h1 className="text-2xl font-bold text-white mt-4">{project.title}</h1>
                </div>
                <form action={deleteProjectWithId}>
                    <button
                        type="submit"
                        className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition"
                    >
                        Delete
                    </button>
                </form>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Link
                    href={`/app/projects/${projectId}/analysis`}
                    className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition group"
                >
                    <div>
                        <div className="text-sm font-medium text-white">Analyze</div>
                        <div className="text-xs text-gray-400">Context, stakeholders, risks</div>
                    </div>
                    <span className="text-emerald-500 group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link
                    href={`/app/projects/${projectId}/toc`}
                    className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition group"
                >
                    <div>
                        <div className="text-sm font-medium text-white">Strategy (ToC)</div>
                        <div className="text-xs text-gray-400">Build and publish your living strategy</div>
                    </div>
                    <span className="text-emerald-500 group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link
                    href={`/app/projects/${projectId}/evidence`}
                    className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition group"
                >
                    <div>
                        <div className="text-sm font-medium text-white">Evidence (Foundations)</div>
                        <div className="text-xs text-gray-400">Reporting periods and evidence setup</div>
                    </div>
                    <span className="text-emerald-500 group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link
                    href={`/app/projects/${projectId}/reports`}
                    className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition group"
                >
                    <div>
                        <div className="text-sm font-medium text-white">Reports</div>
                        <div className="text-xs text-gray-400">Snapshot-bound exports and manifests</div>
                    </div>
                    <span className="text-emerald-500 group-hover:translate-x-1 transition-transform">→</span>
                </Link>

                <Link
                    href={`/app/projects/${projectId}/learning`}
                    className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition group"
                >
                    <div>
                        <div className="text-sm font-medium text-white">Learning</div>
                        <div className="text-xs text-gray-400">Decisions tied to evidence (coming soon)</div>
                    </div>
                    <span className="text-emerald-500 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
            </div>

            <form action={updateProjectWithId} className="space-y-6 bg-white/5 border border-white/5 rounded-xl p-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                        Project Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        defaultValue={project.title}
                        required
                        className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="short_code" className="block text-sm font-medium text-gray-300">
                            Short Code
                        </label>
                        <input
                            type="text"
                            name="short_code"
                            id="short_code"
                            defaultValue={project.short_code || ""}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-300">
                            Status
                        </label>
                        <select
                            name="status"
                            id="status"
                            defaultValue={project.status}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                        >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="closed">Closed</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                        Description
                    </label>
                    <textarea
                        name="description"
                        id="description"
                        rows={3}
                        defaultValue={project.description || ""}
                        className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-gray-300">
                            Start Date
                        </label>
                        <input
                            type="date"
                            name="start_date"
                            id="start_date"
                            defaultValue={project.start_date || ""}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-gray-300">
                            End Date
                        </label>
                        <input
                            type="date"
                            name="end_date"
                            id="end_date"
                            defaultValue={project.end_date || ""}
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
