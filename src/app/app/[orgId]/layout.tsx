import { requireOrgScope } from "@/components/workspaces/OrgGuard";

export const dynamic = "force-dynamic";

export default async function OrgScopedLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ orgId: string }>;
}) {
    const { orgId } = await params;
    await requireOrgScope(orgId);

    return <>{children}</>;
}
