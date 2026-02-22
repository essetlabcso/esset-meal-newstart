"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useActionState, useRef, useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { signInWithPassword } from "@/app/auth/actions";

type AuthState = {
    error?: string;
};

const initialState: AuthState = {};

type SignInClientProps = {
    nextPath: string;
};

export default function SignInClient({ nextPath }: SignInClientProps) {
    const [state, formAction, pending] = useActionState(
        async (_prev: AuthState, formData: FormData) => signInWithPassword(formData),
        initialState,
    );
    const [showPassword, setShowPassword] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        const form = event.currentTarget;
        const email = (new FormData(form).get("email") as string | null)?.trim() ?? "";
        const password = (new FormData(form).get("password") as string | null) ?? "";

        if (!email) {
            event.preventDefault();
            setValidationError("Enter your email.");
            emailRef.current?.focus();
            return;
        }

        if (!password) {
            event.preventDefault();
            setValidationError("Enter your password.");
            passwordRef.current?.focus();
            return;
        }

        setValidationError(null);
    }

    return (
        <main className="esset-page-bg flex min-h-screen items-center justify-center px-4 py-10">
            <div className="w-full space-y-6" style={{ maxWidth: "var(--esset-form-max)" }}>
                <section className="esset-shell-bg flex flex-col items-center gap-3 rounded-[28px] px-6 py-10 text-center text-white sm:px-10 sm:py-12">
                    <Link href="/" className="inline-flex items-center transition hover:opacity-90">
                        <Image
                            src="/brand/esset-meal-logo.svg"
                            alt="ESSET MEAL"
                            width={180}
                            height={48}
                            priority
                            data-testid="auth-logo"
                            className="h-12 w-auto"
                        />
                    </Link>
                    <div className="space-y-2">
                        <h1 data-testid="auth-signin-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                            Welcome back
                        </h1>
                        <p className="text-sm font-medium text-white/80">
                            Enter your details to continue.
                        </p>
                    </div>
                </section>

                <section className="esset-card p-6 sm:p-7">
                    <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
                        <input type="hidden" name="next" value={nextPath} />

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-semibold text-esset-ink">
                                Email
                            </label>
                            <input
                                ref={emailRef}
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                className="esset-input"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="password"
                                className="text-sm font-semibold text-esset-ink"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    ref={passwordRef}
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    minLength={6}
                                    className="esset-input pr-20"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-esset-teal-800 hover:bg-esset-bg"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            <p className="text-xs text-esset-muted">
                                Use at least 6 characters.
                            </p>
                        </div>

                        {validationError ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                                {validationError}
                            </div>
                        ) : null}

                        {state.error ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                                {state.error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={pending}
                            data-testid="auth-signin-submit"
                            className="esset-btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5"
                        >
                            {pending ? (
                                <>
                                    <Spinner label="Signing in" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm text-esset-muted">
                        Need an account?{" "}
                        <Link href="/auth/sign-up" className="font-semibold text-esset-teal-800">
                            Sign up
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}
