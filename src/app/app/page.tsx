import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    const { data: memberships } = await supabase
        .from("org_memberships")
        .select("org_id, role, organizations(id, name)")
        .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
        redirect("/app/onboarding");
    }

    return (
        <div className="flex flex-col gap-6 p-8">
            <h1 className="text-3xl font-bold">Protected app area</h1>

            <div className="rounded-lg bg-white/5 p-4">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="text-emerald-400 font-mono">{user.email}</p>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-3">Your organizations</h2>
                <ul className="space-y-2">
                    {memberships.map((m) => (
                        <li
                            key={m.org_id}
                            className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
                        >
                            <span>{m.organizations?.name ?? m.org_id}</span>
                            <span className="rounded bg-emerald-700/30 px-2 py-0.5 text-xs text-emerald-300">
                                {m.role}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
