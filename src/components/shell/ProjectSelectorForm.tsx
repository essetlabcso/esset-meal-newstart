"use client";

import Link from "next/link";
import { useRef } from "react";

type ProjectSummary = {
    id: string;
    title: string;
};

type ProjectSelectorFormProps = {
    orgId: string;
    currentProjectId?: string | null;
    projects: ProjectSummary[];
    action: (formData: FormData) => void | Promise<void>;
};

export default function ProjectSelectorForm({
    orgId,
    currentProjectId,
    projects,
    action,
}: ProjectSelectorFormProps) {
    const formRef = useRef<HTMLFormElement>(null);

    if (projects.length === 0) {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-white/90">
                    No projects found in this workspace.
                </span>
                <Link
                    href={`/app/${orgId}/projects`}
                    className="esset-btn-secondary esset-focus-dark inline-flex items-center justify-center px-3 py-2 text-sm"
                >
                    Projects
                </Link>
            </div>
        );
    }

    return (
        <form ref={formRef} action={action} className="flex items-center gap-2">
            <label htmlFor="project-select" className="text-xs uppercase tracking-wider text-white/80">
                Project
            </label>
            <select
                id="project-select"
                name="projectId"
                defaultValue={currentProjectId ?? ""}
                className="esset-shell-select"
                onChange={() => formRef.current?.requestSubmit()}
            >
                {!currentProjectId ? (
                    <option value="" disabled>
                        Select a project
                    </option>
                ) : null}
                {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                        {project.title}
                    </option>
                ))}
            </select>
            <button
                type="submit"
                className="esset-btn-secondary esset-focus-dark px-3 py-2 text-sm"
            >
                Open
            </button>
        </form>
    );
}
