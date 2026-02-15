"use client";

import { useActionState } from "react";
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
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-8">
            <h1 className="text-3xl font-bold">Create your organization</h1>
            <p className="text-gray-400 text-center max-w-md">
                You don&apos;t belong to any organization yet. Create one to get
                started.
            </p>

            <form action={formAction} className="flex flex-col gap-4 w-full max-w-sm">
                <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-400">Organization name</span>
                    <input
                        name="name"
                        type="text"
                        required
                        className="rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="My Organization"
                    />
                </label>

                {state?.error && (
                    <p className="text-red-400 text-sm">{state.error}</p>
                )}

                <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-emerald-700 px-4 py-2 hover:bg-emerald-600 transition disabled:opacity-50"
                >
                    {pending ? "Creating…" : "Create organization"}
                </button>
            </form>
        </div>
    );
}
