import Link from "next/link";
import { createProject } from "../actions";

export default function NewProjectPage() {
    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <Link
                    href="/app/projects"
                    className="text-sm text-gray-400 hover:text-white transition"
                >
                    ← Back to Projects
                </Link>
                <h1 className="text-2xl font-bold text-white mt-4">Create New Project</h1>
            </div>

            <form action={createProject} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                        Project Title *
                    </label>
                    <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g., Annual Impact Assessment 2026"
                    />
                </div>

                <div>
                    <label htmlFor="short_code" className="block text-sm font-medium text-gray-300">
                        Short Code
                    </label>
                    <input
                        type="text"
                        name="short_code"
                        id="short_code"
                        className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="e.g., AIA-26"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                        Description
                    </label>
                    <textarea
                        name="description"
                        id="description"
                        rows={3}
                        className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="Briefly describe the project goals..."
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
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                            className="mt-1 block w-full rounded-lg border border-white/10 bg-white/5 p-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition"
                    >
                        Create Project
                    </button>
                </div>
            </form>
        </div>
    );
}
