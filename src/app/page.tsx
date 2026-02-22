import Image from "next/image";
import Link from "next/link";

import { LandingNav } from "@/components/landing/LandingNav";
import RealityCheckTool from "@/components/landing/RealityCheckTool";
import FaqAccordion from "@/components/landing/FaqAccordion";
import {
    BEFORE_ESSET,
    WITH_ESSET,
    WHAT_WHY_HOW,
    HOW_IT_WORKS_STEPS,
    ACCESS_CONTROL_ROWS,
    MANIFESTO_LINES,
    TAILORED_SOLUTIONS,
    FAQ_ITEMS,
} from "@/components/landing/content";

export const metadata = {
    title: "ESSET MEAL — MEAL that works in the field, not just in the template",
    description:
        "Connect your Theory of Change to real field data. Built for CSO MEAL leads who need clarity to make decisions, not just spreadsheet reports.",
};

export default function LandingPage() {
    return (
        <div className="landing-page">
            {/* Skip link – first focusable element */}
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            <LandingNav />

            <main id="main-content">
                {/* ══════ 1. HERO ══════ */}
                <section
                    id="about"
                    className="landing-hero landing-section px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32"
                >
                    <div
                        className="mx-auto w-full text-center"
                        style={{ maxWidth: "var(--esset-container-max)" }}
                    >
                        <p className="landing-badge mb-5 bg-white/15 text-white/90">
                            Strategy · Evidence · Adaptation
                        </p>

                        <h1
                            data-testid="hero-headline"
                            className="landing-hero-headline mx-auto max-w-3xl text-white"
                        >
                            MEAL that works in the field — not just in the
                            template
                        </h1>

                        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
                            ESSET helps CSOs map strategy to evidence, track
                            what changes, and report without the spreadsheet
                            scramble. Replace reactive reporting with calm,
                            decision-ready intelligence.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <Link
                                href="/auth/sign-up"
                                data-testid="hero-cta-primary"
                                className="landing-cta-primary min-w-[170px]"
                            >
                                Start 7-Day Pilot
                            </Link>
                            <Link
                                href="/demo"
                                data-testid="hero-cta-secondary"
                                className="landing-cta-outline min-w-[150px]"
                            >
                                Watch demo
                            </Link>
                            <a
                                href="#reality-check"
                                className="landing-cta-outline"
                            >
                                Take the Reality Check
                            </a>
                        </div>

                        {/* Trust Cue Row */}
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                            <div className="landing-trust-chip">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                Role-based access
                            </div>
                            <div className="landing-trust-chip">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>
                                Low-bandwidth friendly
                            </div>
                            <div className="landing-trust-chip">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7A8.38 8.38 0 0 1 16.3 4.5" /><path d="M3 21l1.9-1.9" /><path d="M22 22l-2-2" /><circle cx="11" cy="11" r="8" /></svg>
                                Evidence linked to ToC
                            </div>
                        </div>

                        <p className="mt-10 text-sm font-medium text-white/70 leading-relaxed">
                            Not another reporting tool. ESSET links strategy,
                            evidence, and learning — <br className="hidden sm:block" /> so adaptation becomes
                            routine.
                        </p>
                    </div>
                </section>

                {/* ══════ 2. REALITY HOOK ══════ */}
                <section className="landing-section bg-white px-4 py-14 sm:px-6 sm:py-20">
                    <div
                        className="mx-auto w-full text-center"
                        style={{ maxWidth: "var(--esset-container-max)" }}
                    >
                        <h2 className="landing-section-heading">
                            Is your MEAL helping you decide what to do next —
                            before report week?
                        </h2>
                        <p className="landing-section-subheading mx-auto mt-4">
                            Most CSOs only discover evidence gaps when the
                            deadline arrives. ESSET makes readiness visible from
                            day one.
                        </p>
                    </div>
                </section>

                {/* ══════ 3. COMPARISON: Before / With ESSET ══════ */}
                <section className="landing-section landing-section-alt px-4 py-14 sm:px-6 sm:py-20">
                    <div
                        className="mx-auto w-full"
                        style={{ maxWidth: "var(--esset-container-max)" }}
                    >
                        <h2 className="landing-section-heading text-center">
                            From compliance scramble to decision-ready
                            intelligence
                        </h2>
                        <p className="landing-section-subheading mx-auto mt-3 text-center">
                            See what changes when your MEAL system is linked to
                            your strategy — not just your reporting deadlines.
                        </p>

                        <div className="landing-comparison-grid mt-10">
                            {/* Before */}
                            <div className="landing-card border-red-100 bg-red-50/40">
                                <h3 className="mb-4 text-lg font-bold text-red-900">
                                    ❌ Before ESSET
                                </h3>
                                <ul className="space-y-2.5">
                                    {BEFORE_ESSET.map((item, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2 text-sm leading-relaxed text-red-800"
                                        >
                                            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-red-400" />
                                            <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            {/* With ESSET */}
                            <div className="landing-card border-emerald-100 bg-emerald-50/40">
                                <h3 className="mb-4 text-lg font-bold text-emerald-900">
                                    ✅ With ESSET
                                </h3>
                                <ul className="space-y-2.5">
                                    {WITH_ESSET.map((item, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2 text-sm leading-relaxed text-emerald-800"
                                        >
                                            <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400" />
                                            <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════ 4. WHAT / WHY / HOW ══════ */}
                <section
                    id="how-it-works"
                    className="landing-section bg-white px-4 py-14 sm:px-6 sm:py-20"
                >
                    <div
                        className="mx-auto w-full"
                        style={{ maxWidth: "var(--esset-container-max)" }}
                    >
                        <h2 className="landing-section-heading text-center">
                            Connect strategy to evidence — and evidence to
                            action
                        </h2>

                        <div className="mt-10 grid gap-6 sm:grid-cols-3">
                            {WHAT_WHY_HOW.map((card) => (
                                <div key={card.title} className="landing-card">
                                    <span className="landing-badge bg-esset-bg text-esset-teal-800">
                                        {card.title}
                                    </span>
                                    <h3 className="mt-3 text-base font-bold text-esset-ink">
                                        {card.subtitle}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-esset-muted">
                                        {card.body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════ 5. HOW IT WORKS: Map → Track → Learn & Adapt ══════ */}
                <section className="landing-section landing-section-alt px-4 py-12 sm:px-6 sm:py-16">
                    <div
                        className="mx-auto w-full"
                        style={{ maxWidth: "var(--esset-container-max)" }}
                    >
                        <h2 className="landing-section-heading text-center">
                            Three steps to evidence-ready reporting
                        </h2>

                        {/* Pipeline diagram */}
                        <div className="mt-8 flex flex-col items-center">
                            <div className="landing-pipeline-container">
                                <span className="landing-pipeline-node">Projects</span>
                                <span className="landing-pipeline-arrow rotate-90 md:rotate-0" aria-hidden="true">→</span>
                                <span className="landing-pipeline-node">Analyze</span>
                                <span className="landing-pipeline-arrow rotate-90 md:rotate-0" aria-hidden="true">→</span>
                                <span className="landing-pipeline-node">Theory of Change</span>
                                <span className="landing-pipeline-arrow rotate-90 md:rotate-0" aria-hidden="true">→</span>
                                <span className="landing-pipeline-node">Evidence</span>
                                <span className="landing-pipeline-arrow rotate-90 md:rotate-0" aria-hidden="true">→</span>
                                <span className="landing-pipeline-node">Learning</span>
                                <span className="landing-pipeline-arrow rotate-90 md:rotate-0" aria-hidden="true">→</span>
                                <span className="landing-pipeline-node">Reports</span>
                            </div>
                            <p className="mt-4 text-[11px] font-medium text-esset-muted uppercase tracking-wider">
                                💡 Analyze helps teams spot gaps early
                            </p>
                        </div>

                        <div className="mt-8 grid gap-6 sm:grid-cols-3">
                            {HOW_IT_WORKS_STEPS.map((step, i) => {
                                const icons = [
                                    /* Map icon */
                                    <svg key="map" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z" /><path d="M9 4v13" /><path d="M15 7v13" /></svg>,
                                    /* Capture icon */
                                    <svg key="track" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
                                    /* Learn & Adapt icon (Loop metaphor) */
                                    <svg key="learn" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" /></svg>,
                                ];
                                return (
                                    <div key={step.title} className="landing-card text-center">
                                        <div className="landing-step-icon mx-auto">
                                            {icons[i]}
                                        </div>
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="landing-step-number" style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.8125rem' }}>
                                                {i + 1}
                                            </span>
                                            <h3 className="text-lg font-bold text-esset-ink">
                                                {step.title}
                                            </h3>
                                        </div>
                                        <p className="mt-3 text-sm leading-relaxed text-esset-muted">
                                            {step.body}
                                        </p>
                                        <p className="mt-2 rounded-lg bg-esset-bg px-3 py-2 text-xs font-medium text-esset-teal-800">
                                            💡 {step.hint}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ══════ 6. WHO CONTROLS WHAT (RBAC) ══════ */}
                <section className="landing-section bg-white px-4 py-14 sm:px-6 sm:py-20">
                    <div
                        className="mx-auto w-full"
                        style={{ maxWidth: "var(--esset-container-max)" }}
                    >
                        <h2 className="landing-section-heading text-center">
                            Who controls what — safe collaboration by design
                        </h2>
                        <p className="landing-section-subheading mx-auto mt-3 text-center">
                            Role-based access means teams only see what they
                            need. De-identified data practices are built in.
                        </p>

                        <div className="mt-8">
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full min-w-[480px] text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-esset-border">
                                            <th className="pb-3 pr-4 font-bold text-esset-ink">
                                                Role
                                            </th>
                                            <th className="pb-3 pr-4 font-bold text-esset-ink">
                                                Access
                                            </th>
                                            <th className="pb-3 font-bold text-esset-ink">
                                                Capability
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ACCESS_CONTROL_ROWS.map((row) => (
                                            <tr
                                                key={row.role}
                                                className="border-b border-esset-border/50"
                                            >
                                                <td className="py-3 pr-4 font-semibold text-esset-ink">
                                                    {row.role}
                                                </td>
                                                <td className="py-3 pr-4 text-esset-muted">
                                                    {row.access}
                                                </td>
                                                <td className="py-3">
                                                    <span className="inline-flex rounded-full bg-esset-bg px-2.5 py-0.5 text-xs font-bold text-esset-teal-800">
                                                        {row.capability}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden">
                                {ACCESS_CONTROL_ROWS.map((row) => (
                                    <div key={row.role} className="rbac-mobile-card">
                                        <div className="rbac-mobile-card-row">
                                            <span className="rbac-label">Role</span>
                                            <span className="rbac-value font-bold">{row.role}</span>
                                        </div>
                                        <div className="rbac-mobile-card-row">
                                            <span className="rbac-label">What they can do</span>
                                            <span className="rbac-value">{row.access}</span>
                                        </div>
                                        <div className="rbac-mobile-card-row">
                                            <span className="rbac-label">Visibility</span>
                                            <span className="rbac-value">
                                                <span className="inline-flex rounded-full bg-esset-bg px-2.5 py-0.5 text-xs font-bold text-esset-teal-800">
                                                    {row.capability}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-6 text-center text-sm font-medium text-esset-teal-800 bg-esset-bg/40 p-3 rounded-lg border border-esset-teal-800/10">
                                🛡️ <strong>Safe Collaboration:</strong> Donors see final outputs — not internal drafts or raw evidence.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ══════ 7. REALITY CHECK TOOL ══════ */}
                <section
                    id="reality-check"
                    className="landing-section landing-section-alt px-4 py-14 sm:px-6 sm:py-20"
                >
                    <div
                        className="mx-auto w-full"
                        style={{ maxWidth: "var(--esset-container-max)" }}
                    >
                        <h2 className="landing-section-heading text-center">
                            Reality Check: How ready is your MEAL system?
                        </h2>
                        <p className="landing-section-subheading mx-auto mt-3 text-center">
                            Answer 12 quick questions. Your responses stay in
                            your browser — nothing is uploaded.
                        </p>

                        <div className="mt-8">
                            <RealityCheckTool />
                        </div>
                    </div>
                </section>

                {/* ══════ 8. USE CASES ══════ */}
                <section
                    id="use-cases"
                    className="landing-section bg-white px-4 py-14 sm:px-6 sm:py-20"
                >
                    <div
                        className="mx-auto w-full"
                        style={{ maxWidth: "var(--esset-container-max)" }}
                    >
                        <h2 className="landing-section-heading text-center">
                            Built for how CSOs actually work
                        </h2>

                        <div className="mt-10 grid gap-5 sm:grid-cols-2">
                            {TAILORED_SOLUTIONS.map((sol) => (
                                <div key={sol.title} className="landing-card border-esset-border/60">
                                    <h3 className="text-base font-bold text-esset-ink">
                                        {sol.title}
                                    </h3>
                                    <p className="mt-2 text-sm leading-relaxed text-esset-muted">
                                        {sol.body}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between border-t border-esset-border/40 pt-3">
                                        <span className="text-xs font-medium text-esset-teal-800">
                                            {sol.fit}
                                        </span>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-esset-teal-800/30"><polyline points="9 18 15 12 9 6" /></svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════ 9. PRINCIPLES / MANIFESTO ══════ */}
                <section className="landing-section landing-section-alt px-4 py-14 sm:px-6 sm:py-20">
                    <div
                        className="mx-auto w-full"
                        style={{ maxWidth: "var(--esset-container-max)" }}
                    >
                        <h2 className="landing-section-heading text-center">
                            What we believe
                        </h2>

                        <ul className="mx-auto mt-8 max-w-2xl space-y-3">
                            {MANIFESTO_LINES.map((line, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-3 text-sm leading-relaxed text-esset-ink"
                                >
                                    <span className="mt-0.5 flex-shrink-0 text-esset-teal-800">
                                        ▸
                                    </span>
                                    {line}
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* ══════ 10. FAQ ══════ */}
                <section
                    id="faq"
                    className="landing-section bg-white px-4 py-14 sm:px-6 sm:py-20"
                >
                    <div
                        className="mx-auto w-full"
                        style={{ maxWidth: "var(--esset-container-max)" }}
                    >
                        <h2 className="landing-section-heading text-center">
                            Questions teams ask before getting started
                        </h2>

                        <div className="mx-auto mt-8 max-w-2xl">
                            <FaqAccordion items={FAQ_ITEMS} />
                        </div>
                    </div>
                </section>

                {/* ══════ 11. FINAL CTA BAND ══════ */}
                <section className="landing-hero px-4 py-14 sm:px-6 sm:py-20">
                    <div
                        className="mx-auto w-full text-center"
                        style={{ maxWidth: "var(--esset-container-max)" }}
                    >
                        <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                            Ready to see how it works?
                        </h2>
                        <p className="mx-auto mt-3 max-w-xl text-base text-white/80">
                            Start a 7-day pilot. Map one project, run the
                            Reality Check, and test your reporting readiness.
                        </p>
                        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                            <Link
                                href="/auth/sign-up"
                                className="landing-cta-primary"
                            >
                                Start 7-Day Pilot
                            </Link>
                            <Link
                                href="/auth/sign-in"
                                className="landing-cta-outline"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* ══════ FOOTER ══════ */}
            <footer className="border-t border-esset-border bg-white px-4 py-10 sm:px-6">
                <div
                    className="mx-auto w-full"
                    style={{ maxWidth: "var(--esset-container-max)" }}
                >
                    <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
                        {/* Brand */}
                        <div>
                            <Image
                                src="/brand/esset-meal-logo.svg"
                                alt="ESSET MEAL"
                                width={150}
                                height={30}
                                className="h-8 w-auto"
                            />
                            <p className="mt-2 text-sm font-medium text-esset-muted">
                                From Compliance to Intelligence.
                            </p>
                            <p className="mt-1 text-xs text-esset-muted/70">
                                Built for impact, verified by data.
                            </p>
                        </div>

                        {/* Contact */}
                        <div className="text-sm leading-relaxed text-esset-muted">
                            <p className="font-semibold text-esset-ink">Contact</p>
                            <p className="mt-1">Nifas Silk Lafto Sub-city</p>
                            <p>Addis Ababa, Ethiopia</p>
                            <p className="mt-2">
                                <a href="mailto:info@essetlab.org" className="underline hover:text-esset-ink">info@essetlab.org</a>
                            </p>
                            <p>
                                <a href="mailto:gbeyene@essetlab.org" className="underline hover:text-esset-ink">gbeyene@essetlab.org</a>
                            </p>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-wrap gap-2 sm:flex-col">
                            <Link
                                href="/auth/sign-in"
                                className="inline-flex rounded-full border border-esset-border bg-white px-4 py-2 text-sm font-semibold text-esset-ink hover:bg-esset-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-esset-focus"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/auth/sign-up"
                                className="esset-btn-primary inline-flex rounded-full px-4 py-2 text-sm"
                            >
                                Start 7-Day Pilot
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
