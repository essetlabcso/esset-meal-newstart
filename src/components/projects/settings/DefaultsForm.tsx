import Link from "next/link";

type DefaultsFormProps = {
    orgId: string;
    projectId: string;
};

export default function DefaultsForm({ orgId, projectId }: DefaultsFormProps) {
    return (
        <section className="esset-card p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-esset-ink">Defaults</h2>
            <p className="mt-2 text-sm text-esset-muted">
                Set standard aggregation and safe-mode preferences for this project.
            </p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <article className="rounded-2xl border border-esset-border bg-esset-bg p-4">
                    <h3 className="font-bold text-esset-ink">Aggregation defaults</h3>
                    <p className="mt-1 text-sm text-esset-muted">
                        Recommended defaults are shown below. Project-level storage for these
                        options is not available yet.
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-esset-ink">
                        <li className="rounded-xl border border-esset-border bg-white px-3 py-2">
                            Summary method: <span className="font-semibold">Average</span>{" "}
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                Recommended
                            </span>
                        </li>
                        <li className="rounded-xl border border-esset-border bg-white px-3 py-2">
                            Missing data handling: <span className="font-semibold">Flag missing</span>
                        </li>
                        <li className="rounded-xl border border-esset-border bg-white px-3 py-2">
                            Confidence threshold: <span className="font-semibold">Medium</span>
                        </li>
                    </ul>
                </article>

                <article className="rounded-2xl border border-esset-border bg-esset-bg p-4">
                    <h3 className="font-bold text-esset-ink">Safe-mode defaults</h3>
                    <p className="mt-1 text-sm text-esset-muted">
                        Evidence visibility defaults are planned for a future backend slice.
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-esset-ink">
                        <li className="rounded-xl border border-esset-border bg-white px-3 py-2">
                            Default audience: <span className="font-semibold">Internal</span>
                        </li>
                        <li className="rounded-xl border border-esset-border bg-white px-3 py-2">
                            Sensitive evidence mode: <span className="font-semibold">Restricted</span>{" "}
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                Recommended
                            </span>
                        </li>
                    </ul>
                </article>
            </div>

            <div className="mt-5 rounded-xl border border-dashed border-esset-border bg-esset-bg px-4 py-3 text-sm text-esset-muted">
                Project-level defaults are coming soon. No changes are saved from this tab yet.
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <Link
                    href={`/app/${orgId}/projects/${projectId}/home`}
                    className="esset-btn-primary inline-flex items-center justify-center px-4 py-2.5"
                >
                    Back to Project Home
                </Link>
                <Link
                    href={`/app/${orgId}/projects`}
                    className="inline-flex items-center justify-center rounded-[14px] border border-esset-border bg-white px-4 py-2.5 text-sm font-semibold text-esset-teal-800 hover:bg-esset-bg"
                >
                    Go to Projects
                </Link>
            </div>
        </section>
    );
}
