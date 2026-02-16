import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MEAL that works for the field — ESSET MEAL",
  description: "Stop fighting with disconnected spreadsheets. ESSET MEAL connects your Theory of Change to real field data, giving CSOs the clarity to make decisions.",
  openGraph: {
    title: "MEAL that works for the field — ESSET MEAL",
    description: "Connect your Theory of Change to real field data for decision clarity.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MEAL that works for the field — ESSET MEAL",
    description: "Built for CSOs to manage complex programs with data that matters.",
  },
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100 selection:bg-emerald-500/30">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-600 focus:text-white focus:rounded-full focus:font-bold focus:shadow-2xl transition-all"
      >
        Skip to content
      </a>
      {/* Header/Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-neutral-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/esset-logo-header.svg"
              alt="ESSET MEAL Logo"
              width={140}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="#features" className="text-neutral-400 hover:text-white transition">Features</Link>
            <Link href="#how-it-works" className="text-neutral-400 hover:text-white transition">Process</Link>
            <Link href="/demo" className="text-neutral-400 hover:text-white transition">Demo Flow</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-in" className="text-sm font-medium text-neutral-400 hover:text-white transition">
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              Start a workspace
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="max-w-3xl">
              <h1 data-testid="hero-headline" className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
                MEAL that works for the field, <span className="text-emerald-500 font-extrabold italic">not just the donor.</span>
              </h1>
              <p className="text-lg sm:text-xl text-neutral-400 leading-relaxed mb-10 max-w-2xl">
                Stop fighting with disconnected spreadsheets. ESSET MEAL connects your Theory of Change to real field data, giving CSOs the clarity to make decisions, not just reports.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  data-testid="hero-cta-primary"
                  href="/auth/sign-up"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-emerald-600 px-8 text-base font-bold text-white shadow-lg hover:bg-emerald-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start a workspace
                </Link>
                <Link
                  data-testid="hero-cta-secondary"
                  href="/demo"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 text-base font-bold text-white hover:bg-white/10 transition-all"
                >
                  See how it works
                </Link>
              </div>
            </div>
          </div>
          {/* Subtle decoration */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/3 h-1/2 bg-emerald-500/10 blur-[120px] rounded-full -z-10" />
        </section>

        {/* Reality Check / Pain Points */}
        <section className="py-20 bg-neutral-900/50">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold mb-12 text-neutral-300 uppercase tracking-widest text-center sm:text-left">The MEAL Reality Change</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "Spreadsheet Chaos", desc: '"We have 15 versions of the same ToC, and I\'m not sure which one reflects reality."' },
                { title: "Compliance Fatigue", desc: '"We spend 80% of our time on donor reports and 0% using data to improve our programs."' },
                { title: "Field-Office Disconnect", desc: '"I can\'t see what’s happening on the ground until 30 days after the month ends."' },
                { title: "Hidden Assumptions", desc: '"Our projects fail because we didn\'t track the risks that needed to stay true."' }
              ].map((point, i) => (
                <div key={i} className="group p-6 rounded-2xl bg-neutral-950 border border-white/5 hover:border-emerald-500/50 transition-colors">
                  <div className="h-1 w-12 bg-emerald-500/20 mb-6 group-hover:w-full transition-all duration-500" />
                  <h3 className="text-xl font-bold mb-3">{point.title}</h3>
                  <p className="text-neutral-400 text-sm italic leading-relaxed">{point.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section id="features" className="py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="flex-1 max-w-xl">
                <h2 className="text-3xl font-bold mb-6">Built for product reality</h2>
                <div className="space-y-6">
                  {[
                    { label: "Unified Workspaces", text: "One home for your entire organization’s MEAL data." },
                    { label: "Visual Theory of Change", text: "Build project logic with a drag-and-drop builder." },
                    { label: "Assumption Tracking", text: "Link specific risks to every node and edge in your logic." },
                    { label: "Analysis Snapshots", text: "Document your 'Reality Checks' before you map your logic." },
                    { label: "Versioning + Publish Lock", text: "Published logic is immutable; drafts stay flexible." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 mt-1 h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 outline outline-4 outline-emerald-500/10" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white mb-1">{item.label}</h4>
                        <p className="text-neutral-400 text-sm">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full max-w-lg aspect-square bg-neutral-900 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                <Image
                  src="/brand/esset-logo-full.svg"
                  alt=""
                  width={192}
                  height={192}
                  className="w-48 h-auto opacity-20 mb-8"
                  aria-hidden="true"
                />
                <p className="text-neutral-500 text-sm max-w-xs uppercase tracking-widest font-bold">Authenticated Dashboard Preview Coming Soon</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 bg-neutral-900/50">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold mb-12 text-center">How it works in 3 steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {[
                { step: "01", title: "Set up your workspace", desc: "Invite your team and organize by project folders." },
                { step: "02", title: "Map your logic", desc: "Use the visual builder to map activities and pin assumptions." },
                { step: "03", title: "Publish and Track", desc: "Lock your logic into a versioned snapshot and start monitoring." }
              ].map((s, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-16 h-16 rounded-full bg-emerald-600/10 flex items-center justify-center text-emerald-500 text-2xl font-black mb-6 border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    {s.step}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                  <p className="text-neutral-400 text-sm max-w-[250px]">{s.desc}</p>
                </div>
              ))}
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-white/5 -z-0" />
            </div>
          </div>
        </section>

        {/* Personas */}
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-3xl font-bold mb-16 text-center">Tailored for your entire team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { role: "Executive", value: "Dashboard clarity for portfolio decisions." },
                { role: "Program Manager", value: "Plan, monitor, and report without manual overhead." },
                { role: "MEAL Lead", value: "Structured engine for quality standards and learning." },
                { role: "Field Team", value: "Simple interfaces to capture what matters in real-time." }
              ].map((p, i) => (
                <div key={i} className="p-8 rounded-3xl bg-neutral-900 border border-white/5 flex flex-col h-full">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider mb-6 w-fit">
                    {p.role}
                  </span>
                  <p className="text-lg font-medium text-neutral-200 mt-auto">{p.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust & Governance */}
        <section className="py-20 border-t border-white/5">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 sm:p-12 border border-emerald-500/10 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-6">Trust & Governance</h2>
                  <ul className="space-y-4">
                    <li className="flex gap-3 text-neutral-400">
                      <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span><strong className="text-white">Data Integrity</strong>: Immutable snapshots prevent accidental edits to published logic.</span>
                    </li>
                    <li className="flex gap-3 text-neutral-400">
                      <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span><strong className="text-white">Tenant Isolation</strong>: Your data stays yours via hardened Row Level Security (RLS).</span>
                    </li>
                    <li className="flex gap-3 text-neutral-400">
                      <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span><strong className="text-white">Role-Based Access</strong>: Control precisely who can draft, publish, or view.</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-shrink-0">
                  <Link
                    href="/auth/sign-up"
                    className="inline-flex h-14 items-center justify-center rounded-full bg-white px-10 text-lg font-bold text-black hover:bg-neutral-200 transition-colors"
                  >
                    Get Started Now
                  </Link>
                </div>
              </div>
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/30" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 mt-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Image
                src="/brand/esset-logo-header.svg"
                alt="ESSET MEAL"
                width={105}
                height={24}
                className="h-6 w-auto opacity-60"
              />
              <p className="text-xs text-neutral-500 font-medium uppercase tracking-[0.2em]">Built for impact, verified by data.</p>
            </div>
            <div className="flex gap-8 text-sm text-neutral-400 font-medium">
              <Link href="/auth/sign-in" className="hover:text-emerald-500 transition">Sign in</Link>
              <Link href="/auth/sign-up" className="hover:text-emerald-500 transition">Sign up</Link>
              <Link href="/demo" className="hover:text-emerald-500 transition">Product Demo</Link>
              <a href="https://github.com/esset-meal" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition">GitHub</a>
            </div>
          </div>
          <div className="mt-12 text-center text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
            © {new Date().getFullYear()} ESSET MEAL — All rights protected.
          </div>
        </div>
      </footer>
    </div>
  );
}
