import Link from "next/link";
import { getProject } from "../actions";

interface EvidencePageProps {
    params: Promise<{
        projectId: string;
    }>;
}

export default async function EvidencePage({ params }: EvidencePageProps) {
    const { projectId } = await params;
    const project = await getProject(projectId);

    return (
        <div className="p-8 max-w-5xl">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Evidence (Foundations)</h1>
                <p className="mt-1 text-sm text-gray-400">
                    Build reporting foundations for <span className="text-gray-200">{project.title}</span>.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Link
                    href={`/app/projects/${projectId}/reporting-periods`}
                    className="group rounded-xl border border-white/10 bg-white/5 p-5 hover:border-emerald-500/30 hover:bg-white/10 transition"
                >
                    <p className="text-sm font-semibold text-white">Reporting Periods</p>
                    <p className="mt-1 text-xs text-gray-400">Available now</p>
                    <p className="mt-3 text-xs text-gray-500">Define time windows used by evidence and reporting.</p>
                </Link>

                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm font-semibold text-white">Indicators</p>
                    <p className="mt-1 text-xs text-gray-400">Coming soon</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm font-semibold text-white">Measurements</p>
                    <p className="mt-1 text-xs text-gray-400">Coming soon</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                    <p className="text-sm font-semibold text-white">Qualitative Evidence</p>
                    <p className="mt-1 text-xs text-gray-400">Coming soon</p>
                </div>
            </div>
        </div>
    );
}

