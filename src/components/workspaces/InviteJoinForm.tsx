"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

type InviteJoinFormProps = {
    presetToken?: string;
};

export default function InviteJoinForm({ presetToken = "" }: InviteJoinFormProps) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [token, setToken] = useState(presetToken);
    const [error, setError] = useState<string | null>(null);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmedToken = token.trim();

        if (!trimmedToken) {
            setError("Enter your invite token.");
            inputRef.current?.focus();
            return;
        }

        setError(null);
        router.push(`/invites/accept?token=${encodeURIComponent(trimmedToken)}`);
    }

    return (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <label htmlFor="invite-token" className="text-sm font-semibold text-esset-ink">
                Invite token
            </label>
            <input
                ref={inputRef}
                id="invite-token"
                value={token}
                onChange={(event) => setToken(event.currentTarget.value)}
                placeholder="Paste your invite token"
                className="esset-input"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "invite-token-error" : undefined}
            />
            {error ? (
                <p id="invite-token-error" className="text-sm font-semibold text-red-700">
                    {error}
                </p>
            ) : null}
            <button type="submit" className="esset-btn-primary w-full px-4 py-2.5">
                Continue with invite
            </button>
        </form>
    );
}
