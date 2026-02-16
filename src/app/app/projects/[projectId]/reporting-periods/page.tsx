import Link from "next/link";
import { getProject, listReportingPeriods, createReportingPeriod, updateReportingPeriod, deleteReportingPeriod } from "../actions";

interface ReportingPeriodsPageProps {
    params: Promise<{
        projectId: string;
    }>;
}

export default async function ReportingPeriodsPage({ params }: ReportingPeriodsPageProps) {
    const { projectId } = await params;
    const project = await getProject(projectId);
    const periods = await listReportingPeriods(projectId);

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <Link
                    href={`/app/projects/${projectId}`}
                    className="text-sm text-gray-400 hover:text-white transition"
                >
                    ← Back to Project
                </Link>
                <div className="mt-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Reporting Periods</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {project.title}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-white">Existing Periods</h2>
                    {periods.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 p-12 text-center text-gray-400">
                            No reporting periods defined yet.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {periods.map((period) => (
                                <div
                                    key={period.id}
                                    className="flex items-center justify-between rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition"
                                >
                                    <div>
                                        <div className="font-medium text-white">{period.label}</div>
                                        <div className="text-xs text-gray-400">
                                            {period.start_date} to {period.end_date}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <form action={deleteReportingPeriod.bind(null, period.id, projectId)}>
                                            <button
                                                type="submit"
                                                className="text-xs text-red-400 hover:text-red-300 transition px-2 py-1"
                                                onClick={(e) => {
                                                    if (!confirm("Delete this reporting period?")) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="rounded-xl bg-white/5 border border-white/5 p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Add Period</h2>
                        <form action={createReportingPeriod.bind(null, projectId)} className="space-y-4">
                            <div>
                                <label htmlFor="label" className="block text-sm font-medium text-gray-300">
                                    Label
                                </label>
                                <input
                                    type="text"
                                    name="label"
                                    id="label"
                                    placeholder="e.g. Q1 2024"
                                    required
                                    className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none placeholder-gray-600"
                                />
                            </div>
                            <div>
                                <label htmlFor="start_date" className="block text-sm font-medium text-gray-300">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    name="start_date"
                                    id="start_date"
                                    required
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
                                    required
                                    className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition"
                            >
                                Add Period
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
