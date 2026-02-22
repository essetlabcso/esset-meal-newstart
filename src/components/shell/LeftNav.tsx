"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { buildProjectRoute, getProjectNavItems } from "@/lib/nav/navSchema";

type LeftNavProps = {
    orgId: string;
    projectId: string;
};

export default function LeftNav({ orgId, projectId }: LeftNavProps) {
    const pathname = usePathname();
    const navItems = getProjectNavItems();
    const [open, setOpen] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLButtonElement>(null);
    const lastFocusRef = useRef<HTMLElement | null>(null);
    const prevOverflowRef = useRef<string>("");

    function openDrawer() {
        lastFocusRef.current = document.activeElement as HTMLElement | null;
        setOpen(true);
    }

    function closeDrawer(opts?: { returnFocus?: boolean }) {
        setOpen(false);
        if (opts?.returnFocus) {
            (lastFocusRef.current ?? hamburgerRef.current)?.focus();
        }
    }

    /* Close on ESC + lightweight tab trap */
    useEffect(() => {
        if (!open) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                closeDrawer({ returnFocus: true });
                return;
            }
            if (e.key === "Tab" && drawerRef.current) {
                const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    /* Prevent body scroll while open (restore previous) */
    useEffect(() => {
        if (open) {
            prevOverflowRef.current = document.body.style.overflow;
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = prevOverflowRef.current;
        }
        return () => {
            document.body.style.overflow = prevOverflowRef.current;
        };
    }, [open]);

    /* Focus first link on open */
    useEffect(() => {
        if (open && drawerRef.current) {
            const firstLink = drawerRef.current.querySelector("a");
            firstLink?.focus();
        }
    }, [open]);

    const navContent = (
        <>
            <p className="px-2 pb-2 text-xs font-bold uppercase tracking-widest text-esset-muted">
                Workflow
            </p>
            <nav aria-label="Project modules" className="space-y-1.5">
                {navItems.map((item, index) => {
                    const href = buildProjectRoute(orgId, projectId, item.segment);
                    const active = pathname === href || pathname.startsWith(`${href}/`);

                    return (
                        <Link
                            key={item.id}
                            href={href}
                            onClick={() => closeDrawer()}
                            aria-current={active ? "page" : undefined}
                            className={`block rounded-xl border px-3 py-2 text-sm font-semibold transition ${active
                                    ? "border-esset-teal-800 bg-esset-bg text-esset-teal-800"
                                    : "border-transparent text-esset-ink hover:border-esset-border hover:bg-esset-bg"
                                }`}
                        >
                            <span className="mr-2 text-xs font-bold text-esset-muted">
                                {index + 1}.
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-5 border-t border-esset-border pt-4">
                <p className="px-2 pb-2 text-xs font-bold uppercase tracking-widest text-esset-muted">
                    Utilities
                </p>
                <div className="space-y-1.5">
                    <Link
                        href={buildProjectRoute(orgId, projectId, "home")}
                        onClick={() => closeDrawer()}
                        className="block rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-esset-ink transition hover:border-esset-border hover:bg-esset-bg"
                    >
                        Project Home
                    </Link>
                    <Link
                        href={`/app/${orgId}/projects/${projectId}/settings/metadata`}
                        onClick={() => closeDrawer()}
                        className="block rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-esset-ink transition hover:border-esset-border hover:bg-esset-bg"
                    >
                        Project settings
                    </Link>
                    <Link
                        href={`/app/${orgId}/projects`}
                        onClick={() => closeDrawer()}
                        className="block rounded-xl border border-transparent px-3 py-2 text-sm font-semibold text-esset-ink transition hover:border-esset-border hover:bg-esset-bg"
                    >
                        All projects
                    </Link>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger */}
            <button
                ref={hamburgerRef}
                type="button"
                onClick={openDrawer}
                aria-label="Toggle navigation"
                className="fixed bottom-4 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-esset-teal-900 text-white shadow-lg md:hidden"
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>

            {/* Mobile drawer overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 md:hidden"
                    onClick={() => closeDrawer({ returnFocus: true })}
                    aria-hidden="true"
                />
            )}

            {/* Mobile drawer */}
            <div
                ref={drawerRef}
                // @ts-expect-error inert is supported by modern browsers
                inert={open ? undefined : ""}
                aria-hidden={!open}
                className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-esset-surface p-4 shadow-xl transition-transform duration-200 md:hidden ${open ? "translate-x-0" : "-translate-x-full"
                    }`}
                role="dialog"
                aria-modal={open}
                aria-label="Navigation menu"
            >
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-esset-ink">Navigation</span>
                    <button
                        type="button"
                        onClick={() => closeDrawer({ returnFocus: true })}
                        aria-label="Close navigation"
                        className="rounded-lg p-1.5 text-esset-muted hover:bg-esset-bg"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
                {navContent}
            </div>

            {/* Desktop sidebar */}
            <aside className="hidden w-72 self-start rounded-3xl border border-esset-border bg-esset-surface p-4 shadow-[var(--esset-shadow-soft)] md:block md:sticky md:top-4">
                {navContent}
            </aside>
        </>
    );
}
