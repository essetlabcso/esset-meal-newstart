"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { LANDING_NAV_ITEMS } from "@/components/landing/content";

export function LandingNav() {
    const items = LANDING_NAV_ITEMS;
    const [activeId, setActiveId] = useState(items[0]?.id ?? "about");
    const [mobileOpen, setMobileOpen] = useState(false);
    const sectionIds = useMemo(() => items.map((item) => item.id), [items]);

    useEffect(() => {
        const sections = sectionIds
            .map((id) => document.getElementById(id))
            .filter((section): section is HTMLElement => Boolean(section));

        if (sections.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (visible[0]?.target?.id) {
                    setActiveId(visible[0].target.id);
                }
            },
            { rootMargin: "-40% 0px -45% 0px", threshold: [0.1, 0.4, 0.7] },
        );

        for (const section of sections) {
            observer.observe(section);
        }

        return () => observer.disconnect();
    }, [sectionIds]);

    /* Close mobile menu on resize to desktop */
    useEffect(() => {
        function onResize() {
            if (window.innerWidth >= 768) setMobileOpen(false);
        }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    function handleAnchorClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
        event.preventDefault();
        const section = document.getElementById(id);
        if (!section) return;

        section.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState({}, "", `#${id}`);
        setActiveId(id);
        setMobileOpen(false);
    }

    return (
        <header className="sticky top-0 z-40 border-b border-esset-border/80 bg-white/95 backdrop-blur">
            <div
                className="mx-auto flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6"
                style={{ maxWidth: "var(--esset-container-max)" }}
            >
                <Link href="/" className="inline-flex items-center gap-2">
                    <Image
                        src="/brand/esset-meal-logo.svg"
                        alt="ESSET MEAL"
                        width={200}
                        height={40}
                        className="h-10 w-auto"
                        priority
                    />
                    <span className="hidden text-base font-extrabold tracking-tight sm:inline" style={{ color: 'var(--landing-navy, #0F2A4A)' }}>
                        ESSET MEAL
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav
                    aria-label="Landing sections"
                    className="hidden md:block"
                >
                    <ul className="flex items-center gap-1">
                        {items.map((item) => {
                            const isActive = item.id === activeId;
                            return (
                                <li key={item.id}>
                                    <a
                                        href={`#${item.id}`}
                                        onClick={(event) => handleAnchorClick(event, item.id)}
                                        aria-current={isActive ? "location" : undefined}
                                        className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-esset-focus ${isActive
                                            ? "nav-link-active"
                                            : "nav-link-subtle"
                                            }`}
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="flex items-center gap-2">
                    <Link
                        href="/auth/sign-in"
                        className="hidden sm:inline-flex rounded-full px-3 py-1.5 text-sm font-semibold text-esset-muted hover:text-esset-ink hover:bg-esset-bg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-esset-focus"
                    >
                        Sign In / Sign Up
                    </Link>
                    <Link
                        href="/auth/sign-up"
                        className="hidden sm:inline-flex esset-btn-primary rounded-full px-4 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-esset-focus"
                    >
                        Start 7-Day Pilot
                    </Link>

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileOpen}
                        onClick={() => setMobileOpen((v) => !v)}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-esset-ink hover:bg-esset-bg md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-esset-focus"
                    >
                        {mobileOpen ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            {mobileOpen && (
                <div className="border-t border-esset-border bg-white px-4 py-3 md:hidden">
                    <nav aria-label="Mobile navigation">
                        <ul className="space-y-1">
                            {items.map((item) => {
                                const isActive = item.id === activeId;
                                return (
                                    <li key={item.id}>
                                        <a
                                            href={`#${item.id}`}
                                            onClick={(event) => handleAnchorClick(event, item.id)}
                                            aria-current={isActive ? "location" : undefined}
                                            className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition ${isActive
                                                ? "bg-esset-bg text-esset-teal-800"
                                                : "text-esset-muted hover:bg-esset-bg hover:text-esset-ink"
                                                }`}
                                        >
                                            {item.label}
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                    <div className="mt-3 flex flex-col gap-2 border-t border-esset-border pt-3">
                        <Link
                            href="/auth/sign-in"
                            className="rounded-full border border-esset-border px-4 py-2.5 text-center text-sm font-semibold text-esset-ink hover:bg-esset-bg"
                            onClick={() => setMobileOpen(false)}
                        >
                            Sign In / Sign Up
                        </Link>
                        <Link
                            href="/auth/sign-up"
                            className="esset-btn-primary rounded-full px-4 py-2.5 text-center text-sm"
                            onClick={() => setMobileOpen(false)}
                        >
                            Start 7-Day Pilot
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}

/* Backward-compatible default export */
export default LandingNav;
