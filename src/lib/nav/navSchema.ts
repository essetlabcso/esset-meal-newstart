export type ProjectNavItem = {
    id:
    | "define"
    | "toc"
    | "plan"
    | "capture"
    | "evidence"
    | "learning"
    | "accountability"
    | "analytics";
    label: string;
    segment: string;
};

const PROJECT_NAV_SCHEMA: ProjectNavItem[] = [
    { id: "define", label: "Define Context", segment: "analyze" },
    { id: "toc", label: "Build ToC", segment: "strategy" },
    { id: "plan", label: "Plan Indicators", segment: "plan" },
    { id: "capture", label: "Capture Data", segment: "collect" },
    { id: "evidence", label: "Evidence Library", segment: "evidence" },
    { id: "learning", label: "Learning", segment: "learn" },
    { id: "accountability", label: "Accountability", segment: "accountability" },
    { id: "analytics", label: "Analytics & Reports", segment: "analytics" },
];

export function getProjectNavItems(): ProjectNavItem[] {
    return PROJECT_NAV_SCHEMA;
}

export function buildProjectRoute(orgId: string, projectId: string, segment: string) {
    return `/app/${orgId}/projects/${projectId}/${segment}`;
}
