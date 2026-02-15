import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import Link from "next/link";

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

    // 2. Fetch active tenant and memberships
    const { getActiveTenant, listUserTenants } = await import("@/lib/tenant");
    const [tenants, tenant] = await Promise.all([
        listUserTenants(supabase),
        getActiveTenant(supabase),
    ]);

    // 3. Redirection logic
    // If no memberships, allow onboarding
    if (tenants.length === 0) {
        return <>{children}</>;
    }

    // If tenant resolution is ambiguous (2+ memberships, no active set), redirect to workspaces
    if (!tenant && tenants.length > 1) {
        redirect("/app/workspaces");
    }

    // fallback for other cases where tenant might be null but we have memberships (should stay on selector)
    if (!tenant) {
        redirect("/app/workspaces");
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <header className="flex items-center justify-between border-b border-white/10 px-6 py-3">
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-emerald-400 uppercase tracking-wider">
                        ESSET MEAL
                    </span>
                    <span className="text-gray-600">/</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-200">
                            {tenant.tenantName}
                        </span>
                        <Link
                            href="/app/workspaces"
                            className="text-[10px] uppercase font-bold text-gray-500 hover:text-emerald-400 transition ml-2 border border-gray-800 px-1.5 py-0.5 rounded hover:border-emerald-500/30"
                        >
                            Switch
                        </Link>
                    </div>
                </div>
                <form action={signOut}>
                    <button
                        type="submit"
                        className="rounded-lg bg-white/5 border border-white/10 px-3 py-1 text-sm hover:bg-white/10 transition text-gray-300"
                    >
                        Sign out
                    </button>
                </form>
            </header>
            <main>{children}</main>
        </div>
    );
}
