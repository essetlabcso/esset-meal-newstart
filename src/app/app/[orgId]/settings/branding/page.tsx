import BrandingForm from "@/app/app/[orgId]/settings/branding/BrandingForm";
import { createClient } from "@/lib/supabase/server";
import { requireOrgScope } from "@/components/workspaces/OrgGuard";

export const dynamic = "force-dynamic";

export default async function BrandingSettingsPage({
    params,
}: {
    params: Promise<{ orgId: string }>;
}) {
    const { orgId } = await params;
    await requireOrgScope(orgId, { requireOwner: true });

    const supabase = await createClient();
    const { data: organization } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .maybeSingle();

    return (
        <section className="space-y-4">
            <div className="esset-card p-6">
                <h1 className="text-2xl font-black text-esset-ink">Branding settings</h1>
                <p className="mt-1 text-sm text-esset-muted">
                    Update how this workspace appears to your team.
                </p>
            </div>
            <BrandingForm orgId={orgId} initialDisplayName={organization?.name ?? ""} />
        </section>
    );
}
