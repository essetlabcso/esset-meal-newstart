import { notFound } from "next/navigation";
import ProjectJourneySidebar from "./_components/ProjectJourneySidebar";
import { getProjectJourneyState } from "./_lib/getProjectJourneyState";

interface ProjectLayoutProps {
    children: React.ReactNode;
    params: Promise<{
        projectId: string;
    }>;
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
    const { projectId } = await params;
    const journey = await getProjectJourneyState(projectId);

    if (!journey) return notFound();

    return (
        <div className="lg:flex lg:min-h-[calc(100vh-57px)]">
            <ProjectJourneySidebar projectTitle={journey.projectTitle} stages={journey.stages} />
            <section className="min-w-0 flex-1">{children}</section>
        </div>
    );
}

