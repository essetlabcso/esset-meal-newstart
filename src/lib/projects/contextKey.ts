const ACTIVE_PROJECT_COOKIE_PREFIX = "esset_active_project_";

export function getActiveProjectCookieName(orgId: string) {
    return `${ACTIVE_PROJECT_COOKIE_PREFIX}${orgId}`;
}
