"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import Spinner from "@/components/ui/Spinner";
import ToastNotice from "@/components/ui/ToastNotice";
import { saveBrandingAction } from "@/app/app/[orgId]/settings/branding/actions";

type BrandingFormProps = {
    orgId: string;
    initialDisplayName: string;
};

export default function BrandingForm({
    orgId,
    initialDisplayName,
}: BrandingFormProps) {
    const [toast, setToast] = useState<{
        tone: "success" | "warning";
        message: string;
    } | null>(null);
    const [logoName, setLogoName] = useState<string>("");
    const [isPending, startTransition] = useTransition();
    const displayNameRef = useRef<HTMLInputElement>(null);

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const displayName = String(formData.get("displayName") ?? "").trim();

        if (!displayName) {
            setToast({ tone: "warning", message: "Display name is required." });
            displayNameRef.current?.focus();
            return;
        }

        formData.set("orgId", orgId);

        startTransition(async () => {
            const result = await saveBrandingAction(formData);
            if (result.ok) {
                setToast({ tone: "success", message: "Workspace updated" });
                return;
            }
            setToast({
                tone: "warning",
                message: result.error ?? "We couldn't save your changes. Try again.",
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

            <form onSubmit={onSubmit} className="esset-card p-6 space-y-4">
                <input type="hidden" name="orgId" value={orgId} />
                <div className="space-y-1">
                    <label
                        htmlFor="displayName"
                        className="text-sm font-semibold text-esset-ink"
                    >
                        Workspace display name
                    </label>
                    <input
                        ref={displayNameRef}
                        id="displayName"
                        name="displayName"
                        defaultValue={initialDisplayName}
                        className="esset-input"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="logoFile" className="text-sm font-semibold text-esset-ink">
                        Logo upload
                    </label>
                    <input
                        id="logoFile"
                        name="logoFile"
                        type="file"
                        accept="image/*"
                        className="esset-input"
                        onChange={(event) =>
                            setLogoName(event.currentTarget.files?.[0]?.name ?? "")
                        }
                    />
                    <p className="text-xs text-esset-muted">
                        {logoName ? `Selected: ${logoName}` : "No file selected."}
                    </p>
                </div>

                <div className="space-y-1">
                    <label htmlFor="accentColor" className="text-sm font-semibold text-esset-ink">
                        Accent color (optional)
                    </label>
                    <input
                        id="accentColor"
                        name="accentColor"
                        type="color"
                        defaultValue="#04665d"
                        className="h-11 w-24 cursor-pointer rounded-xl border border-esset-border bg-white p-2"
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="tagline" className="text-sm font-semibold text-esset-ink">
                        Short tagline (optional)
                    </label>
                    <input
                        id="tagline"
                        name="tagline"
                        maxLength={100}
                        placeholder="One line to describe your workspace"
                        className="esset-input"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
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
            </form>
        </div>
    );
}
