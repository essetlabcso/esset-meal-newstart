import { cookies } from "next/headers";
import { getActiveProjectCookieName } from "@/lib/projects/contextKey";

/**
 * Active project cookie helpers.
 * setActiveProjectId / clearActiveProjectId write cookies and MUST be called
 * only from a Server Action or Route Handler  — never from a Server Component
 * render path (Next.js 16 restriction).
 */
const ACTIVE_PROJECT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function readActiveProjectId(orgId: string): Promise<string | null> {
    const cookieStore = await cookies();
    const cookieName = getActiveProjectCookieName(orgId);
    const value = cookieStore.get(cookieName)?.value?.trim();
    return value || null;
}

export async function setActiveProjectId(orgId: string, projectId: string): Promise<void> {
    const cookieStore = await cookies();
    const cookieName = getActiveProjectCookieName(orgId);
    cookieStore.set(cookieName, projectId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: ACTIVE_PROJECT_COOKIE_MAX_AGE,
    });
}

export async function clearActiveProjectId(orgId: string): Promise<void> {
    const cookieStore = await cookies();
    const cookieName = getActiveProjectCookieName(orgId);
    cookieStore.delete(cookieName);
}
