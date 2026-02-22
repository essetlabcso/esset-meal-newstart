"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JourneyStage } from "../_lib/getProjectJourneyState";

interface ProjectJourneySidebarProps {
    projectTitle: string;
    stages: JourneyStage[];
}

function statusBadgeClass(status: JourneyStage["status"]) {
    if (status === "ready") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
    if (status === "blocked") return "bg-amber-500/15 text-amber-300 border-amber-500/25";
    return "bg-white/10 text-gray-300 border-white/15";
}

function statusLabel(status: JourneyStage["status"]) {
    if (status === "ready") return "Ready";
    if (status === "blocked") return "Blocked";
    return "Coming soon";
}

export default function ProjectJourneySidebar({ projectTitle, stages }: ProjectJourneySidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-full border-b border-white/10 bg-white/[0.02] p-4 lg:w-72 lg:border-b-0 lg:border-r">
            <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Project Journey</p>
                <h2 className="mt-1 text-sm font-semibold text-white">{projectTitle}</h2>
            </div>

            <nav className="space-y-2">
                {stages.map((stage, idx) => {
                    const isActive = pathname === stage.href || pathname.startsWith(`${stage.href}/`);
                    const clickable = stage.status === "ready";
                    const baseClass =
                        `rounded-lg border px-3 py-2 transition ${isActive
                            ? "border-emerald-500/40 bg-emerald-500/10"
                            : "border-white/10 bg-white/5"}`;

                    return (
                        <div key={stage.id} className={baseClass}>
                            {clickable ? (
                                <Link href={stage.href} className="block">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-medium text-white">
                                            <span className="mr-2 text-xs text-gray-500">{idx + 1}.</span>
                                            {stage.label}
                                        </div>
                                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${statusBadgeClass(stage.status)}`}>
                                            {statusLabel(stage.status)}
                                        </span>
                                    </div>
                                    {stage.reason && (
                                        <p className="mt-1 text-xs text-gray-400">{stage.reason}</p>
                                    )}
                                </Link>
                            ) : (
                                <div aria-disabled="true">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-medium text-gray-300">
                                            <span className="mr-2 text-xs text-gray-500">{idx + 1}.</span>
                                            {stage.label}
                                        </div>
                                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${statusBadgeClass(stage.status)}`}>
                                            {statusLabel(stage.status)}
                                        </span>
                                    </div>
                                    {stage.reason && (
                                        <p className="mt-1 text-xs text-gray-400">{stage.reason}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}

