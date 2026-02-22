import OrgTopBar from "@/components/shell/OrgTopBar";

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ orgId: string }>;
}) {
    const { orgId } = await params;

    return (
        <>
            <OrgTopBar orgId={orgId} />
            <main className="esset-page-bg min-h-[calc(100vh-56px)] px-4 py-6 sm:px-6 sm:py-8">
                <div
                    className="mx-auto w-full"
                    style={{ maxWidth: "var(--esset-container-max)" }}
                >
                    {children}
                </div>
            </main>
        </>
    );
}
