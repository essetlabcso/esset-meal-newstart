"use client";

import { ChangeEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AccessibleModal from "@/components/ui/AccessibleModal";
import Spinner from "@/components/ui/Spinner";
import ToastNotice from "@/components/ui/ToastNotice";
import {
    changeMemberRoleAction,
    removeMemberAction,
    revokeInviteAction,
    sendInviteAction,
} from "@/app/app/[orgId]/settings/members/actions";
import {
    ROLE_OPTIONS,
    getRoleLabel,
} from "@/app/app/[orgId]/settings/members/roleOptions";

type RoleMemberRow = {
    userId: string;
    email: string;
    name: string;
    role: string;
    status: "Active" | "Inactive";
};

type PendingInviteRow = {
    id: string;
    email: string;
    role: string;
    expiresAt: string;
};

type RolesTableProps = {
    orgId: string;
    canManage: boolean;
    members: RoleMemberRow[];
    invites: PendingInviteRow[];
};

type ToastState = {
    tone: "success" | "warning";
    message: string;
};

export default function RolesTable({
    orgId,
    canManage,
    members,
    invites,
}: RolesTableProps) {
    const router = useRouter();
    const [toast, setToast] = useState<ToastState | null>(null);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [pendingInviteLink, setPendingInviteLink] = useState<string | null>(null);
    const [draftRoles, setDraftRoles] = useState<Record<string, string>>({});
    const [roleModalState, setRoleModalState] = useState<{
        userId: string;
        email: string;
        role: string;
    } | null>(null);
    const [isPending, startTransition] = useTransition();

    const membersWithRoleDraft = useMemo(
        () =>
            members.map((member) => ({
                ...member,
                nextRole: draftRoles[member.userId] ?? member.role,
            })),
        [draftRoles, members],
    );

    function runAction(action: () => Promise<void>) {
        startTransition(async () => {
            await action();
            router.refresh();
        });
    }

    function onInviteSubmit(formData: FormData) {
        if (!canManage) {
            return;
        }

        formData.set("orgId", orgId);
        runAction(async () => {
            const result = await sendInviteAction(formData);
            if (result.ok) {
                setToast({ message: "Invite sent", tone: "success" });
                setPendingInviteLink(result.inviteLink ?? null);
                setIsInviteOpen(false);
                return;
            }
            setToast({ message: result.error ?? "We couldn't send this invite.", tone: "warning" });
        });
    }

    function onRoleChangeConfirm() {
        if (!roleModalState || !canManage) {
            return;
        }

        const formData = new FormData();
        formData.set("orgId", orgId);
        formData.set("memberUserId", roleModalState.userId);
        formData.set("role", roleModalState.role);

        runAction(async () => {
            const result = await changeMemberRoleAction(formData);
            if (result.ok) {
                setToast({ message: "Member updated", tone: "success" });
                setRoleModalState(null);
                return;
            }
            setToast({ message: result.error ?? "We couldn't update this member.", tone: "warning" });
        });
    }

    function onRemove(userId: string) {
        if (!canManage) {
            return;
        }

        const formData = new FormData();
        formData.set("orgId", orgId);
        formData.set("memberUserId", userId);

        runAction(async () => {
            const result = await removeMemberAction(formData);
            if (result.ok) {
                setToast({ message: "Member removed", tone: "success" });
                return;
            }
            setToast({ message: result.error ?? "We couldn't remove this member.", tone: "warning" });
        });
    }

    function onRevokeInvite(inviteId: string) {
        if (!canManage) {
            return;
        }

        const formData = new FormData();
        formData.set("orgId", orgId);
        formData.set("inviteId", inviteId);

        runAction(async () => {
            const result = await revokeInviteAction(formData);
            if (result.ok) {
                setToast({ message: "Member updated", tone: "success" });
                return;
            }
            setToast({ message: result.error ?? "We couldn't revoke this invite.", tone: "warning" });
        });
    }

    async function onCopyInviteLink() {
        if (!pendingInviteLink) {
            return;
        }

        try {
            await navigator.clipboard.writeText(window.location.origin + pendingInviteLink);
            setToast({ message: "Copied", tone: "success" });
        } catch {
            setToast({ message: "Couldn't copy", tone: "warning" });
        }
    }

    return (
        <div className="space-y-4">
            {toast ? <ToastNotice message={toast.message} tone={toast.tone} /> : null}

            {pendingInviteLink ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
                    <p className="font-semibold text-emerald-800">Invite sent</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <code className="rounded bg-white px-2 py-1 text-xs text-emerald-800">
                            {pendingInviteLink}
                        </code>
                        <button
                            type="button"
                            onClick={onCopyInviteLink}
                            className="rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                        >
                            Copy link
                        </button>
                    </div>
                </div>
            ) : null}

            <section className="esset-card p-6 sm:p-8">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-extrabold text-esset-ink">Roles & access</h2>
                        <p className="mt-1 text-sm text-esset-muted">
                            Project-level roles are not configured yet. Workspace roles are shown for
                            current collaborators.
                        </p>
                    </div>
                    {canManage ? (
                        <button
                            type="button"
                            onClick={() => setIsInviteOpen(true)}
                            className="esset-btn-primary inline-flex items-center justify-center px-4 py-2.5"
                        >
                            Invite collaborator
                        </button>
                    ) : null}
                </div>

                {!canManage ? (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        You have view-only access to workspace roles in this project.
                    </div>
                ) : null}

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-left text-xs uppercase tracking-wide text-esset-muted">
                                <th className="px-2 py-1">Name / Email</th>
                                <th className="px-2 py-1">Workspace role</th>
                                <th className="px-2 py-1">Status</th>
                                <th className="px-2 py-1">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {membersWithRoleDraft.map((member) => (
                                <tr key={member.userId} className="rounded-xl bg-esset-bg">
                                    <td className="rounded-l-xl px-2 py-3">
                                        <div className="font-semibold text-esset-ink">{member.name}</div>
                                        <div className="text-sm text-esset-muted">{member.email}</div>
                                    </td>
                                    <td className="px-2 py-3">
                                        <select
                                            className="esset-select max-w-[180px]"
                                            value={member.nextRole ?? member.role ?? "member"}
                                            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                                                const nextRole = event.target.value;
                                                setDraftRoles((current) => ({
                                                    ...current,
                                                    [member.userId]: nextRole,
                                                }));
                                            }}
                                            disabled={!canManage || isPending}
                                        >
                                            {ROLE_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-2 py-3 text-sm font-semibold text-esset-muted">
                                        {member.status}
                                    </td>
                                    <td className="rounded-r-xl px-2 py-3">
                                        {canManage ? (
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setRoleModalState({
                                                            userId: member.userId,
                                                            email: member.email,
                                                            role: member.nextRole,
                                                        })
                                                    }
                                                    className="rounded-lg border border-esset-border bg-white px-2 py-1 text-xs font-semibold text-esset-teal-800 hover:bg-esset-bg"
                                                >
                                                    Change role
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onRemove(member.userId)}
                                                    className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-esset-muted">View only</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="esset-card p-6 sm:p-8">
                <h3 className="text-lg font-extrabold text-esset-ink">Pending workspace invites</h3>
                {invites.length === 0 ? (
                    <p className="mt-3 text-sm text-esset-muted">No pending invites yet.</p>
                ) : (
                    <ul className="mt-3 space-y-2">
                        {invites.map((invite) => (
                            <li
                                key={invite.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-esset-border bg-esset-bg px-3 py-2"
                            >
                                <div>
                                    <p className="font-semibold text-esset-ink">{invite.email}</p>
                                    <p className="text-xs text-esset-muted">
                                        {getRoleLabel(invite.role)} - expires{" "}
                                        {new Date(invite.expiresAt).toLocaleDateString()}
                                    </p>
                                </div>
                                {canManage ? (
                                    <button
                                        type="button"
                                        onClick={() => onRevokeInvite(invite.id)}
                                        className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                    >
                                        Revoke
                                    </button>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <AccessibleModal
                isOpen={Boolean(roleModalState)}
                title="Confirm role change"
                onClose={() => setRoleModalState(null)}
            >
                <p className="text-sm text-esset-muted">
                    {roleModalState
                        ? `Change role for ${roleModalState.email} to ${roleModalState.role}?`
                        : ""}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setRoleModalState(null)}
                        className="rounded-lg border border-esset-border bg-white px-3 py-2 text-sm font-semibold text-esset-muted hover:bg-esset-bg"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onRoleChangeConfirm}
                        disabled={isPending}
                        className="esset-btn-primary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"
                    >
                        {isPending ? (
                            <>
                                <Spinner label="Updating role" />
                                Updating...
                            </>
                        ) : (
                            "Confirm"
                        )}
                    </button>
                </div>
            </AccessibleModal>

            <AccessibleModal
                isOpen={isInviteOpen}
                title="Send workspace invite"
                onClose={() => setIsInviteOpen(false)}
            >
                <form action={onInviteSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label htmlFor="invite-email" className="text-sm font-semibold text-esset-ink">
                            Email
                        </label>
                        <input
                            id="invite-email"
                            name="email"
                            type="email"
                            required
                            className="esset-input"
                            placeholder="person@example.com"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="invite-role" className="text-sm font-semibold text-esset-ink">
                            Role
                        </label>
                        <select
                            id="invite-role"
                            name="role"
                            defaultValue="member"
                            className="esset-select"
                        >
                            {ROLE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor="invite-expiry"
                            className="text-sm font-semibold text-esset-ink"
                        >
                            Expiry
                        </label>
                        <select
                            id="invite-expiry"
                            name="expiryDays"
                            defaultValue="7"
                            className="esset-select"
                        >
                            <option value="3">3 days</option>
                            <option value="7">7 days</option>
                            <option value="14">14 days</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsInviteOpen(false)}
                            className="rounded-lg border border-esset-border bg-white px-3 py-2 text-sm font-semibold text-esset-muted hover:bg-esset-bg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="esset-btn-primary inline-flex items-center justify-center gap-2 px-3 py-2 text-sm"
                        >
                            {isPending ? (
                                <>
                                    <Spinner label="Sending invite" />
                                    Sending...
                                </>
                            ) : (
                                "Send invite"
                            )}
                        </button>
                    </div>
                </form>
            </AccessibleModal>
        </div>
    );
}
