"use client";

import { useActionState } from "react";
import Spinner from "@/components/ui/Spinner";
import { acceptInviteAndContinueAction } from "@/app/invites/accept/actions";

type InviteAcceptState = {
    error?: string;
};

const initialState: InviteAcceptState = {};

type InviteAcceptFormProps = {
    token: string;
};

export default function InviteAcceptForm({ token }: InviteAcceptFormProps) {
    const [state, formAction, pending] = useActionState(
        acceptInviteAndContinueAction,
        initialState,
    );

    return (
        <form action={formAction} className="mt-6 space-y-4">
            <input type="hidden" name="token" value={token} />
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
                        <Spinner label="Accepting invite" />
                        Accepting...
                    </>
                ) : (
                    "Accept and continue"
                )}
            </button>
        </form>
    );
}
