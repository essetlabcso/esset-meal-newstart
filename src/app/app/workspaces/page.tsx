import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listUserTenants, setActiveTenant } from "@/lib/tenant";

export default async function WorkspacesPage() {
    const supabase = await createClient();
    const tenants = await listUserTenants(supabase);

    async function handleSelectWorkspace(formData: FormData) {
        "use server";
        const tenantId = formData.get("tenantId") as string;
        if (!tenantId) return;

        const supabaseAction = await createClient();
        await setActiveTenant(supabaseAction, tenantId);
        redirect("/app");
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Select Workspace
                    </h1>
                    <p className="mt-2 text-sm text-gray-400">
                        Choose the organization you want to work with.
                    </p>
                </div>

                <div className="grid gap-4">
                    {tenants.map((tenant) => (
                        <form key={tenant.tenantId} action={handleSelectWorkspace}>
                            <input type="hidden" name="tenantId" value={tenant.tenantId} />
                            <button
                                type="submit"
                                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-emerald-500/50 transition-all group text-left"
                            >
                                <div>
                                    <div className="font-semibold text-gray-100 group-hover:text-emerald-400 transition-colors">
                                        {tenant.tenantName}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">
                                        {tenant.role}
                                    </div>
                                </div>
                                <div className="text-gray-600 group-hover:text-emerald-400 transition-colors">
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5l7 7-7 7"
                                        />
                                    </svg>
                                </div>
                            </button>
                        </form>
                    ))}

                    {tenants.length === 0 && (
                        <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-xl">
                            <p className="text-gray-500">No workspaces found.</p>
                            <a
                                href="/app/onboarding"
                                className="mt-4 inline-block text-emerald-400 text-sm font-medium hover:underline"
                            >
                                Create your first workspace
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
