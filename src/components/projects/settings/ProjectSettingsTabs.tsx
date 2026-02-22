"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ProjectSettingsTabsProps = {
    orgId: string;
    projectId: string;
};

const SETTINGS_TABS = [
    { id: "metadata", label: "Metadata", segment: "metadata" },
    { id: "reporting-periods", label: "Reporting periods", segment: "reporting-periods" },
    { id: "roles", label: "Roles", segment: "roles" },
    { id: "defaults", label: "Defaults", segment: "defaults" },
] as const;

export default function ProjectSettingsTabs({
    orgId,
    projectId,
}: ProjectSettingsTabsProps) {
    const pathname = usePathname();

    return (
        <nav
            aria-label="Project settings tabs"
            className="flex flex-wrap items-center gap-2 border-b border-esset-border px-4 py-3 sm:px-6"
        >
            {SETTINGS_TABS.map((tab) => {
                const href = `/app/${orgId}/projects/${projectId}/settings/${tab.segment}`;
                const active = pathname === href;

                return (
                    <Link
                        key={tab.id}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
                            active
                                ? "border-esset-teal-800 bg-esset-bg text-esset-teal-800"
                                : "border-transparent text-esset-muted hover:border-esset-border hover:bg-esset-bg hover:text-esset-ink"
                        }`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
