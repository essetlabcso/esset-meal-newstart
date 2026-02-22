"use client";

import {
    KeyboardEvent,
    PropsWithChildren,
    useEffect,
    useMemo,
    useRef,
} from "react";

type AccessibleModalProps = PropsWithChildren<{
    isOpen: boolean;
    title: string;
    onClose: () => void;
    descriptionId?: string;
}>;

const FOCUSABLE_SELECTOR =
    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

export default function AccessibleModal({
    isOpen,
    title,
    descriptionId,
    onClose,
    children,
}: AccessibleModalProps) {
    const panelRef = useRef<HTMLDivElement>(null);

    const labelledById = useMemo(() => `modal-title-${title.replace(/\s+/g, "-")}`, [title]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [];
        focusables[0]?.focus();

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key === "Escape") {
            event.preventDefault();
            onClose();
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (!focusables || focusables.length === 0) {
            event.preventDefault();
            return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-esset-ink/65 px-4 py-10"
            onClick={onClose}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledById}
                aria-describedby={descriptionId}
                onKeyDown={onKeyDown}
                onClick={(event) => event.stopPropagation()}
                className="esset-card w-full max-w-lg p-6"
            >
                <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 id={labelledById} className="text-xl font-extrabold text-esset-ink">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md border border-esset-border px-2 py-1 text-sm font-semibold text-esset-muted hover:bg-esset-bg"
                    >
                        Close
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
