"use client";

import { useActionState } from "react";
import Image from "next/image";
import { createOrganization } from "../actions";

export default function OnboardingPage() {
    const [state, formAction, pending] = useActionState(
        async (_prev: { error: string } | null, formData: FormData) => {
            const result = await createOrganization(formData);
            return result ?? null;
        },
        null,
    );

    return (
        <div className="flex min-h-[85vh] flex-col items-center justify-center p-6 bg-gray-950 text-white selection:bg-emerald-500/30">
            <div className="w-full max-w-md space-y-8 flex flex-col items-center">

                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="rounded-full bg-emerald-500/10 p-4 mb-2">
                        <Image
                            src="/brand/esset-logo-mark.svg"
                            alt="ESSET Logo Mark"
                            width={48}
                            height={48}
                            className="h-12 w-auto"
                        />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-100" data-testid="onboarding-title">
                        Create your workspace
                    </h1>
                    <p className="text-sm text-gray-400 max-w-sm">
                        You don&apos;t belong to any workspace yet. Create your first workspace to start documenting impact.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm w-full">
                    <form action={formAction} className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-gray-300 ml-1">
                                Workspace name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                data-testid="onboarding-orgname"
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all outline-none"
                                placeholder="e.g. Hivos East Africa"
                                autoComplete="organization"
                            />
                        </div>

                        {state?.error && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3" data-testid="onboarding-error">
                                <p className="text-red-400 text-xs text-center font-medium">{state.error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={pending}
                            data-testid="onboarding-submit"
                            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 active:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                        >
                            {pending ? "Creating workspace…" : "Create workspace"}
                        </button>
                    </form>
                </div>

                <footer className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mt-4">
                    Built for impact, verified by data.
                </footer>
            </div>
        </div>
    );
}
