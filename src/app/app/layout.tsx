import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    // Check org memberships
    const { data: memberships } = await supabase
        .from("org_memberships")
        .select("org_id, role, organizations(id, name, created_at)")
        .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
        // Allow access to onboarding even with no memberships
        return <>{children}</>;
    }

    const activeOrg = memberships[0].organizations;

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <header className="flex items-center justify-between border-b border-white/10 px-6 py-3">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-emerald-400">ESSET MEAL</span>
                    {activeOrg && (
                        <span className="text-sm text-gray-400">
                            / {activeOrg.name}
                        </span>
                    )}
                </div>
                <form action={signOut}>
                    <button
                        type="submit"
                        className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20 transition"
                    >
                        Sign out
                    </button>
                </form>
            </header>
            <main>{children}</main>
        </div>
    );
}
