"use client";

import { useEffect, useState } from "react";

type ToastNoticeProps = {
    message: string;
    tone?: "success" | "neutral" | "warning";
};

export default function ToastNotice({
    message,
    tone = "success",
}: ToastNoticeProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const id = window.setTimeout(() => setVisible(false), 4500);
        return () => window.clearTimeout(id);
    }, []);

    if (!visible) {
        return null;
    }

    const toneClasses =
        tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-slate-200 bg-white text-slate-700";

    return (
        <div
            role="status"
            aria-live="polite"
            className={`rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm ${toneClasses}`}
        >
            {message}
        </div>
    );
}
