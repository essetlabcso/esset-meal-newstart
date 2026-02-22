import Link from "next/link";

type ModuleStubProps = {
    orgId: string;
    projectId: string;
    moduleLabel: string;
};

export default function ModuleStub({ orgId, projectId, moduleLabel }: ModuleStubProps) {
    return (
        <section className="esset-card space-y-4 p-6 sm:p-8">
            <div>
                <h1 className="text-2xl font-black text-esset-ink">Coming soon</h1>
                <p className="mt-1 text-lg font-semibold text-esset-teal-800">{moduleLabel}</p>
            </div>
            <p className="text-sm text-esset-muted">
                This module is being prepared. You can continue from Project Home.
            </p>
            <div className="flex flex-wrap gap-2">
                <Link
                    href={`/app/${orgId}/projects/${projectId}/home`}
                    className="esset-btn-primary inline-flex items-center justify-center px-4 py-2.5"
                >
                    Back to Project Home
                </Link>
                <Link
                    href={`/app/${orgId}/projects`}
                    className="rounded-[14px] border border-esset-border bg-white px-4 py-2.5 text-sm font-semibold text-esset-teal-800 hover:bg-esset-bg"
                >
                    Go to Projects
                </Link>
            </div>
        </section>
    );
}
