"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import Spinner from "@/components/ui/Spinner";
import { createWorkspaceAction } from "@/lib/actions/workspaceActions";

type WorkspaceCreateState = {
    error?: string;
    fieldErrors?: {
        workspaceName?: string;
    };
};

const initialState: WorkspaceCreateState = {};
const inviteOnlyModeEnabled = process.env.NEXT_PUBLIC_INVITE_ONLY_MODE === "true";

export default function NewWorkspacePage() {
    const [state, formAction, pending] = useActionState(
        createWorkspaceAction,
        initialState,
    );
    const nameRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (state.fieldErrors?.workspaceName) {
            nameRef.current?.focus();
        }
    }, [state.fieldErrors]);

    if (inviteOnlyModeEnabled) {
        return (
            <main className="esset-page-bg min-h-screen px-4 py-8 sm:px-6 sm:py-10">
                <div
                    className="mx-auto flex w-full flex-col gap-6"
                    style={{ maxWidth: "var(--esset-form-max)" }}
                >
                    <Link href="/initialize" className="text-sm font-semibold text-esset-teal-800">
                        Back to workspace setup
                    </Link>
                    <section className="esset-card p-6">
                        <h1 className="esset-h2 font-black text-esset-ink">Create workspace</h1>
                        <p className="mt-3 text-sm text-esset-muted">
                            Workspace creation is managed by your admin. Use an invite link.
                        </p>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="esset-page-bg min-h-screen px-4 py-8 sm:px-6 sm:py-10">
            <div
                className="mx-auto flex w-full flex-col gap-6"
                style={{ maxWidth: "var(--esset-form-max)" }}
            >
                <Link href="/initialize" className="text-sm font-semibold text-esset-teal-800">
                    Back to workspace setup
                </Link>

                <section className="esset-shell-bg rounded-[28px] px-6 py-8 text-white">
                    <h1 className="esset-h2 font-black">Create workspace</h1>
                    <p className="mt-2 text-sm text-white/90">
                        Set up your workspace. You can update details later.
                    </p>
                </section>

                <section className="esset-card p-6">
                    <form action={formAction} className="space-y-5">
                        <div className="space-y-2">
                            <label
                                htmlFor="workspaceName"
                                className="text-sm font-semibold text-esset-ink"
                            >
                                Workspace name
                            </label>
                            <input
                                ref={nameRef}
                                id="workspaceName"
                                name="workspaceName"
                                required
                                placeholder="Organization / network name"
                                autoComplete="organization"
                                className="esset-input"
                                aria-invalid={Boolean(state.fieldErrors?.workspaceName)}
                                aria-describedby={
                                    state.fieldErrors?.workspaceName
                                        ? "workspace-name-error"
                                        : undefined
                                }
                            />
                            {state.fieldErrors?.workspaceName ? (
                                <p id="workspace-name-error" className="text-sm text-red-700">
                                    {state.fieldErrors.workspaceName}
                                </p>
                            ) : null}
                        </div>

                        <label className="flex items-start gap-2 rounded-xl border border-esset-border bg-esset-bg px-3 py-2">
                            <input
                                type="checkbox"
                                name="createDemoProject"
                                className="mt-1 h-4 w-4 accent-esset-teal-800"
                            />
                            <span className="text-sm text-esset-muted">
                                Create a demo project
                            </span>
                        </label>

                        {state.error ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                                {state.error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={pending}
                            className="esset-btn-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5"
                        >
                            {pending ? (
                                <>
                                    <Spinner label="Creating workspace" />
                                    Creating workspace...
                                </>
                            ) : (
                                "Create workspace"
                            )}
                        </button>
                    </form>
                </section>
            </div>
        </main>
    );
}
