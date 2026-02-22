export function sanitizeInternalPath(path?: string | null) {
    if (!path) {
        return null;
    }

    if (!path.startsWith("/") || path.startsWith("//")) {
        return null;
    }

    return path;
}

export function extractInviteToken(nextPath: string | null) {
    if (!nextPath) {
        return null;
    }

    if (!nextPath.startsWith("/invites/accept")) {
        return null;
    }

    try {
        const url = new URL(nextPath, "https://placeholder.local");
        const token = url.searchParams.get("token");
        return token?.trim() ? token : null;
    } catch {
        return null;
    }
}
