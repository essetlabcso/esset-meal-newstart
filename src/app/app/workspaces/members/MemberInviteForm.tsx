"use client";

import { useState } from "react";
import { createInvite } from "./actions";

export default function MemberInviteForm() {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "member">("member");
    const [loading, setLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setInviteLink(null);

        try {
            const result = await createInvite(email, role);
            const origin = window.location.origin;
            const link = `${origin}/auth/invite?token=${result.raw_token}`;
            setInviteLink(link);
            setEmail("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create invite");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Invite New Member</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                    <label className="text-sm text-gray-400">Email Address</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                        placeholder="user@example.com"
                    />
                </div>

                <div className="grid gap-2">
                    <label className="text-sm text-gray-400">Role</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as "admin" | "member")}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                        <option value="member">Member (Read/Write)</option>
                        <option value="admin">Admin (Manage Workspace)</option>
                    </select>
                </div>

                {error && (
                    <p className="text-sm text-red-400">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
                >
                    {loading ? "Creating..." : "Generate Invite Link"}
                </button>
            </form>

            {inviteLink && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg space-y-2">
                    <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Invite Link Created</p>
                    <div className="flex gap-2">
                        <input
                            readOnly
                            value={inviteLink}
                            className="flex-1 bg-black/40 border border-white/5 rounded px-3 py-1.5 text-sm text-gray-300"
                        />
                        <button
                            type="button"
                            data-testid="copy-invite-link"
                            data-invite-link={inviteLink}
                            onClick={() => {
                                navigator.clipboard.writeText(inviteLink);
                                alert("Copied to clipboard!");
                            }}
                            className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm transition-colors"
                        >
                            Copy
                        </button>
                    </div>
                    <p className="text-[11px] text-gray-500">Share this link with the invitee. It will expire in 7 days.</p>
                </div>
            )}
        </div>
    );
}
