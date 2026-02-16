"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signUpWithPassword } from "../actions";

export default function SignUpPage() {
    const [state, formAction, pending] = useActionState(
        async (_prev: { error: string } | null, formData: FormData) => {
            const result = await signUpWithPassword(formData);
            return result ?? null;
        },
        null,
    );

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-950 text-white selection:bg-emerald-500/30">
            <div className="w-full max-w-md space-y-8">
                {/* Brand Logo */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <Link href="/" className="hover:opacity-80 transition-opacity" data-testid="auth-logo">
                        <Image
                            src="/brand/esset-logo-header.svg"
                            alt="ESSET MEAL Logo"
                            width={180}
                            height={40}
                            priority
                            className="h-10 w-auto"
                        />
                    </Link>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-100" data-testid="auth-signup-title">
                        Create your account
                    </h1>
                    <p className="text-sm text-gray-400">
                        Join the platform verified by impact data
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
                    <form action={formAction} className="flex flex-col gap-5">
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-gray-300 ml-1">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all outline-none"
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium text-gray-300 ml-1">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all outline-none"
                                placeholder="••••••••"
                                autoComplete="new-password"
                            />
                        </div>

                        {state?.error && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                                <p className="text-red-400 text-xs text-center font-medium">{state.error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={pending}
                            data-testid="auth-signup-submit"
                            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 active:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
                        >
                            {pending ? "Creating account…" : "Sign up"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                        <p className="text-sm text-gray-400">
                            Already have an account?{" "}
                            <Link href="/auth/sign-in" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <Link
                        href="/"
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors inline-flex items-center gap-1"
                    >
                        ← Back to home
                    </Link>

                    <footer className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">
                        Built for impact, verified by data.
                    </footer>
                </div>
            </div>
        </main>
    );
}
