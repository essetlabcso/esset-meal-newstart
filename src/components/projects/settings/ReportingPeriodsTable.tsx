"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AccessibleModal from "@/components/ui/AccessibleModal";
import Spinner from "@/components/ui/Spinner";
import ToastNotice from "@/components/ui/ToastNotice";
import {
    createReportingPeriodAction,
    deleteReportingPeriodAction,
    updateReportingPeriodAction,
} from "@/app/app/[orgId]/projects/[projectId]/settings/actions";

type ReportingPeriodRow = {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
    createdBy: string;
};

type ReportingPeriodsTableProps = {
    orgId: string;
    projectId: string;
    currentUserId: string | null;
    role: string;
    periods: ReportingPeriodRow[];
};

type FormMode = "create" | "edit";

type ToastState = {
    tone: "success" | "warning";
    message: string;
};

type FieldErrors = Record<string, string>;

function formatDate(date: string) {
    if (!date) {
        return "-";
    }
    return new Date(date).toLocaleDateString();
}

function lifecycleLabel(period: ReportingPeriodRow): "Upcoming" | "Active" | "Past" {
    const now = Date.now();
    const start = new Date(period.startDate).getTime();
    const end = new Date(period.endDate).getTime();

    if (now < start) {
        return "Upcoming";
    }

    if (now > end) {
        return "Past";
    }

    return "Active";
}

function lifecycleClasses(status: "Upcoming" | "Active" | "Past") {
    if (status === "Active") {
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
    }
    if (status === "Upcoming") {
        return "border-blue-200 bg-blue-50 text-blue-800";
    }
    return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function ReportingPeriodsTable({
    orgId,
    projectId,
    currentUserId,
    role,
    periods,
}: ReportingPeriodsTableProps) {
    const router = useRouter();
    const [toast, setToast] = useState<ToastState | null>(null);
    const [mode, setMode] = useState<FormMode>("create");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editPeriod, setEditPeriod] = useState<ReportingPeriodRow | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ReportingPeriodRow | null>(null);
    const [isPending, startTransition] = useTransition();

    const canCreate = Boolean(currentUserId);

    const canManagePeriod = useMemo(() => {
        return (period: ReportingPeriodRow) =>
            role === "owner" || role === "admin" || period.createdBy === currentUserId;
    }, [currentUserId, role]);

    function openCreateModal() {
        setMode("create");
        setEditPeriod(null);
        setFieldErrors({});
        setFormError(null);
        setIsModalOpen(true);
    }

    function openEditModal(period: ReportingPeriodRow) {
        setMode("edit");
        setEditPeriod(period);
        setFieldErrors({});
        setFormError(null);
        setIsModalOpen(true);
    }

    function closeModal() {
        if (isPending) {
            return;
        }
        setIsModalOpen(false);
        setEditPeriod(null);
        setFieldErrors({});
        setFormError(null);
    }

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        formData.set("orgId", orgId);
        formData.set("projectId", projectId);

        if (mode === "edit" && editPeriod) {
            formData.set("periodId", editPeriod.id);
        }

        startTransition(async () => {
            const result =
                mode === "edit"
                    ? await updateReportingPeriodAction(formData)
                    : await createReportingPeriodAction(formData);

            if (result.ok) {
                setToast({
                    tone: "success",
                    message:
                        mode === "edit"
                            ? "Reporting period updated"
                            : "Reporting period created",
                });
                setIsModalOpen(false);
                setEditPeriod(null);
                setFieldErrors({});
                setFormError(null);
                router.refresh();
                return;
            }

            setFieldErrors(result.fieldErrors ?? {});
            setFormError(result.error ?? "We couldn't save your changes. Try again.");
            setToast({
                tone: "warning",
                message: result.error ?? "We couldn't save your changes. Try again.",
            });
        });
    }

    function onDeleteConfirm() {
        if (!deleteTarget) {
            return;
        }

        const formData = new FormData();
        formData.set("orgId", orgId);
        formData.set("projectId", projectId);
        formData.set("periodId", deleteTarget.id);

        startTransition(async () => {
            const result = await deleteReportingPeriodAction(formData);
            if (result.ok) {
                setToast({ tone: "success", message: "Reporting period updated" });
                setDeleteTarget(null);
                router.refresh();
                return;
            }
            setToast({
                tone: "warning",
                message: result.error ?? "We couldn't complete this action. Try again.",
            });
        });
    }

    return (
        <div className="space-y-4">
            {toast ? (
                <ToastNotice
                    message={toast.message}
                    tone={toast.tone === "success" ? "success" : "warning"}
                />
            ) : null}

            <section className="esset-card p-6 sm:p-8">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h2 className="text-xl font-extrabold text-esset-ink">Reporting periods</h2>
                        <p className="mt-1 text-sm text-esset-muted">
                            Define reporting windows for project updates.
                        </p>
                    </div>
                    {canCreate ? (
                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="esset-btn-primary inline-flex items-center justify-center px-4 py-2.5"
                        >
                            Create period
                        </button>
                    ) : null}
                </div>

                {periods.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-esset-border bg-esset-bg px-4 py-8 text-center">
                        <p className="text-sm text-esset-muted">No reporting periods yet.</p>
                        {canCreate ? (
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="esset-btn-primary mt-4 inline-flex items-center justify-center px-4 py-2.5"
                            >
                                Create period
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-separate border-spacing-y-2">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-esset-muted">
                                    <th className="px-2 py-1">Label</th>
                                    <th className="px-2 py-1">Start</th>
                                    <th className="px-2 py-1">End</th>
                                    <th className="px-2 py-1">State</th>
                                    <th className="px-2 py-1">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {periods.map((period) => {
                                    const status = lifecycleLabel(period);
                                    const canManage = canManagePeriod(period);
                                    return (
                                        <tr key={period.id} className="rounded-xl bg-esset-bg">
                                            <td className="rounded-l-xl px-2 py-3 font-semibold text-esset-ink">
                                                {period.label}
                                            </td>
                                            <td className="px-2 py-3 text-sm text-esset-muted">
                                                {formatDate(period.startDate)}
                                            </td>
                                            <td className="px-2 py-3 text-sm text-esset-muted">
                                                {formatDate(period.endDate)}
                                            </td>
                                            <td className="px-2 py-3">
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${lifecycleClasses(
                                                        status,
                                                    )}`}
                                                >
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="rounded-r-xl px-2 py-3">
                                                {canManage ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(period)}
                                                            className="rounded-lg border border-esset-border bg-white px-2 py-1 text-xs font-semibold text-esset-teal-800 hover:bg-esset-bg"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteTarget(period)}
                                                            className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-esset-muted">View only</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <AccessibleModal
                isOpen={isModalOpen}
                title={mode === "edit" ? "Edit reporting period" : "Create reporting period"}
                onClose={closeModal}
            >
                <form className="space-y-4" onSubmit={onSubmit}>
                    <div className="space-y-1">
                        <label htmlFor="period-label" className="text-sm font-semibold text-esset-ink">
                            Label
                        </label>
                        <input
                            id="period-label"
                            name="label"
                            defaultValue={editPeriod?.label ?? ""}
                            className="esset-input"
                            disabled={isPending}
                            aria-invalid={Boolean(fieldErrors.label)}
                        />
                        {fieldErrors.label ? (
                            <p className="text-sm text-red-700">{fieldErrors.label}</p>
                        ) : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label htmlFor="period-start" className="text-sm font-semibold text-esset-ink">
                                Start date
                            </label>
                            <input
                                id="period-start"
                                name="startDate"
                                type="date"
                                defaultValue={editPeriod?.startDate ?? ""}
                                className="esset-input"
                                disabled={isPending}
                                aria-invalid={Boolean(fieldErrors.startDate)}
                            />
                            {fieldErrors.startDate ? (
                                <p className="text-sm text-red-700">{fieldErrors.startDate}</p>
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="period-end" className="text-sm font-semibold text-esset-ink">
                                End date
                            </label>
                            <input
                                id="period-end"
                                name="endDate"
                                type="date"
                                defaultValue={editPeriod?.endDate ?? ""}
                                className="esset-input"
                                disabled={isPending}
                                aria-invalid={Boolean(fieldErrors.endDate)}
                            />
                            {fieldErrors.endDate ? (
                                <p className="text-sm text-red-700">{fieldErrors.endDate}</p>
                            ) : null}
                        </div>
                    </div>

                    {formError ? <p className="text-sm text-red-700">{formError}</p> : null}

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-[14px] border border-esset-border bg-white px-3 py-2 text-sm font-semibold text-esset-muted hover:bg-esset-bg"
                            disabled={isPending}
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
                                    <Spinner label="Saving period" />
                                    Saving...
                                </>
                            ) : mode === "edit" ? (
                                "Save changes"
                            ) : (
                                "Create period"
                            )}
                        </button>
                    </div>
                </form>
            </AccessibleModal>

            <AccessibleModal
                isOpen={Boolean(deleteTarget)}
                title="Delete reporting period"
                onClose={() => setDeleteTarget(null)}
            >
                <p className="text-sm text-esset-muted">
                    {deleteTarget
                        ? `Remove "${deleteTarget.label}"? This action cannot be undone.`
                        : ""}
                </p>

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setDeleteTarget(null)}
                        className="rounded-[14px] border border-esset-border bg-white px-3 py-2 text-sm font-semibold text-esset-muted hover:bg-esset-bg"
                        disabled={isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onDeleteConfirm}
                        disabled={isPending}
                        className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                        {isPending ? (
                            <>
                                <Spinner label="Deleting period" />
                                Deleting...
                            </>
                        ) : (
                            "Delete"
                        )}
                    </button>
                </div>
            </AccessibleModal>
        </div>
    );
}
