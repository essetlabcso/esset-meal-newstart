"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInWithPassword } from "../actions";

export default function SignInPage() {
    const [state, formAction, pending] = useActionState(
        async (_prev: { error: string } | null, formData: FormData) => {
            const result = await signInWithPassword(formData);
            return result ?? null;
        },
        null,
    );

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-gray-950 text-white">
            <h1 className="text-3xl font-bold">Sign in</h1>

            <form action={formAction} className="flex flex-col gap-4 w-full max-w-sm">
                <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-400">Email</span>
                    <input
                        name="email"
                        type="email"
                        required
                        className="rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="you@example.com"
                    />
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-400">Password</span>
                    <input
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className="rounded-lg bg-white/10 px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="••••••••"
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
                    {pending ? "Signing in…" : "Sign in"}
                </button>
            </form>

            <p className="text-sm text-gray-400">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="text-emerald-400 hover:underline">
                    Sign up
                </Link>
            </p>

            <Link
                href="/"
                className="text-sm text-gray-500 hover:text-gray-300 transition"
            >
                ← Back to home
            </Link>
        </main>
    );
}
