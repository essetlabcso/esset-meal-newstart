import { getProject } from "../actions";

interface LearningPageProps {
    params: Promise<{
        projectId: string;
    }>;
}

export default async function LearningPage({ params }: LearningPageProps) {
    const { projectId } = await params;
    const project = await getProject(projectId);

    return (
        <div className="p-8 max-w-3xl">
            <h1 className="text-2xl font-bold text-white">Learning</h1>
            <p className="mt-2 text-sm text-gray-400">
                Learning workflows for <span className="text-gray-200">{project.title}</span> are coming in the next phase.
            </p>
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-gray-300">
                This stage will capture decisions tied to evidence and strategy versions.
            </div>
        </div>
    );
}

