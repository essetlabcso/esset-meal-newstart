"use client";

import { FormEvent, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import ToastNotice from "@/components/ui/ToastNotice";
import { updateProjectMetadataAction } from "@/app/app/[orgId]/projects/[projectId]/settings/actions";

type MetadataFormProps = {
    orgId: string;
    projectId: string;
    canEdit: boolean;
    initialValues: {
        title: string;
        shortCode: string;
        description: string;
        startDate: string;
        endDate: string;
        status: string;
    };
};

type ToastState = {
    tone: "success" | "warning";
    message: string;
};

type MetadataFieldName = "title" | "shortCode" | "description" | "startDate" | "endDate" | "status";

const STATUS_OPTIONS = [
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "closed", label: "Closed" },
    { value: "archived", label: "Archived" },
] as const;

export default function MetadataForm({
    orgId,
    projectId,
    canEdit,
    initialValues,
}: MetadataFormProps) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [toast, setToast] = useState<ToastState | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isPending, startTransition] = useTransition();

    const disabled = useMemo(() => isPending || !canEdit, [canEdit, isPending]);

    function focusFirstInvalidField(errors: Record<string, string>) {
        const fieldOrder: MetadataFieldName[] = [
            "title",
            "shortCode",
            "description",
            "startDate",
            "endDate",
            "status",
        ];
        const firstInvalidField = fieldOrder.find((field) => errors[field]);
        if (!firstInvalidField) {
            return;
        }

        const input = formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalidField}"]`);
        input?.focus();
    }

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        formData.set("orgId", orgId);
        formData.set("projectId", projectId);

        startTransition(async () => {
            const result = await updateProjectMetadataAction(formData);
            if (result.ok) {
                setFieldErrors({});
                setToast({ tone: "success", message: "Project updated" });
                router.refresh();
                return;
            }

            if (result.fieldErrors) {
                setFieldErrors(result.fieldErrors);
                focusFirstInvalidField(result.fieldErrors);
            }

            setToast({
                tone: "warning",
                message: result.error ?? "We couldn't save your changes. Try again.",
            });
        });
    }

    function onCancel() {
        formRef.current?.reset();
        setFieldErrors({});
        setToast(null);
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
                <h2 className="text-xl font-extrabold text-esset-ink">Metadata</h2>
                <p className="mt-1 text-sm text-esset-muted">
                    Keep project details current for reporting and collaboration.
                </p>

                {!canEdit ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        You can view metadata, but only owners, admins, or project creators can edit.
                    </div>
                ) : null}

                <form ref={formRef} className="mt-5 space-y-4" onSubmit={onSubmit}>
                    <div className="space-y-1">
                        <label htmlFor="metadata-title" className="text-sm font-semibold text-esset-ink">
                            Project name
                        </label>
                        <input
                            id="metadata-title"
                            name="title"
                            defaultValue={initialValues.title}
                            className="esset-input"
                            disabled={disabled}
                            aria-invalid={Boolean(fieldErrors.title)}
                        />
                        {fieldErrors.title ? (
                            <p className="text-sm text-red-700">{fieldErrors.title}</p>
                        ) : null}
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="metadata-short-code" className="text-sm font-semibold text-esset-ink">
                            Short code
                        </label>
                        <input
                            id="metadata-short-code"
                            name="shortCode"
                            defaultValue={initialValues.shortCode}
                            className="esset-input"
                            disabled={disabled}
                            aria-invalid={Boolean(fieldErrors.shortCode)}
                        />
                        {fieldErrors.shortCode ? (
                            <p className="text-sm text-red-700">{fieldErrors.shortCode}</p>
                        ) : null}
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="metadata-description" className="text-sm font-semibold text-esset-ink">
                            Short description
                        </label>
                        <textarea
                            id="metadata-description"
                            name="description"
                            defaultValue={initialValues.description}
                            rows={3}
                            className="esset-textarea"
                            disabled={disabled}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1">
                            <label htmlFor="metadata-start-date" className="text-sm font-semibold text-esset-ink">
                                Start date
                            </label>
                            <input
                                id="metadata-start-date"
                                name="startDate"
                                type="date"
                                defaultValue={initialValues.startDate}
                                className="esset-input"
                                disabled={disabled}
                                aria-invalid={Boolean(fieldErrors.startDate)}
                            />
                            {fieldErrors.startDate ? (
                                <p className="text-sm text-red-700">{fieldErrors.startDate}</p>
                            ) : null}
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="metadata-end-date" className="text-sm font-semibold text-esset-ink">
                                End date
                            </label>
                            <input
                                id="metadata-end-date"
                                name="endDate"
                                type="date"
                                defaultValue={initialValues.endDate}
                                className="esset-input"
                                disabled={disabled}
                                aria-invalid={Boolean(fieldErrors.endDate)}
                            />
                            {fieldErrors.endDate ? (
                                <p className="text-sm text-red-700">{fieldErrors.endDate}</p>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="metadata-status" className="text-sm font-semibold text-esset-ink">
                            Status
                        </label>
                        <select
                            id="metadata-status"
                            name="status"
                            defaultValue={initialValues.status}
                            className="esset-select"
                            disabled={disabled}
                            aria-invalid={Boolean(fieldErrors.status)}
                        >
                            {STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.status ? (
                            <p className="text-sm text-red-700">{fieldErrors.status}</p>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isPending}
                            className="rounded-[14px] border border-esset-border bg-white px-4 py-2.5 text-sm font-semibold text-esset-muted hover:bg-esset-bg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={disabled}
                            className="esset-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5"
                        >
                            {isPending ? (
                                <>
                                    <Spinner label="Saving changes" />
                                    Saving...
                                </>
                            ) : (
                                "Save changes"
                            )}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}
