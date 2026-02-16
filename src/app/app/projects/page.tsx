import Link from "next/link";
import { listProjects } from "./actions";

export default async function ProjectsPage() {
    const projects = await listProjects();

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-white">Projects</h1>
                <Link
                    href="/app/projects/new"
                    data-testid="new-project-link"
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition"
                >
                    New Project
                </Link>
            </div>

            <div className="grid gap-4">
                {projects.length === 0 ? (
                    <div className="rounded-xl border border-white/5 bg-white/5 p-12 text-center">
                        <p className="text-gray-400">No projects found. Create your first project to get started.</p>
                    </div>
                ) : (
                    projects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/app/projects/${project.id}`}
                            className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-6 hover:bg-white/10 transition"
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400">
                                    {project.title}
                                </h3>
                                <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                                    {project.short_code && (
                                        <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs">
                                            {project.short_code}
                                        </span>
                                    )}
                                    <span>{project.status}</span>
                                    {project.start_date && (
                                        <span>• {new Date(project.start_date).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                            <span className="text-gray-500 group-hover:translate-x-1 transition-transform">
                                →
                            </span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
