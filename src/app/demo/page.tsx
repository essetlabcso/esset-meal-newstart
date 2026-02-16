import Link from "next/link";

export default function DemoPage() {
    const steps = [
        {
            id: "1",
            title: "Authentication",
            desc: "Create an account and sign in to access your organization's workspace.",
            path: "/auth/sign-up"
        },
        {
            id: "2",
            title: "Workspace & Project Creation",
            desc: "Set up your first organization and create a project like 'Food Security Analysis 2026'.",
            path: "/app/onboarding"
        },
        {
            id: "3",
            title: "Analysis Snapshots",
            desc: "Document the situational reality—stakeholders, problems, and evidence—before planning.",
            path: "/app/projects"
        },
        {
            id: "4",
            title: "Visual ToC Builder",
            desc: "Build your Theory of Change logic using a drag-and-drop editor with nodes and edges.",
            path: "/app/projects"
        },
        {
            id: "5",
            title: "Assumption Tracking",
            desc: "Pin specific risks and preconditions to nodes and edges to track what must hold true.",
            path: "/app/projects"
        },
        {
            id: "6",
            title: "Team Invitations",
            desc: "Invite colleagues to your workspace via secure links with defined roles (Admin/Member).",
            path: "/app"
        },
        {
            id: "7",
            title: "Publishing",
            desc: "Lock your logic into an immutable, versioned snapshot for monitoring and reporting.",
            path: "/app/projects"
        }
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            <header className="border-b border-white/5 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
                        <span className="text-xl font-black text-emerald-500 tracking-tighter">ESSET MEAL</span>
                    </Link>
                    <Link href="/auth/sign-up" className="text-sm font-bold bg-emerald-600 px-4 py-2 rounded-full hover:bg-emerald-500 transition">
                        Try it now
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="mb-16 text-center">
                    <h1 className="text-4xl font-bold mb-4">Product Demo Flow</h1>
                    <p className="text-neutral-400 text-lg">A step-by-step walkthrough of the ESSET MEAL capabilities.</p>
                </div>

                <div className="space-y-12 relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-white/5 md:left-1/2 -ml-px" />

                    {steps.map((step, i) => (
                        <div key={step.id} className={`relative flex flex-col md:flex-row gap-8 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                            {/* Dot */}
                            <div className="absolute left-4 top-0 -ml-2 w-4 h-4 rounded-full bg-emerald-500 border-4 border-neutral-950 z-10 md:left-1/2 md:ml-[-8px]" />

                            <div className="md:w-1/2 pl-12 md:pl-0">
                                <div className={`p-8 rounded-3xl bg-neutral-900 border border-white/5 hover:border-emerald-500/30 transition-all ${i % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                                    <span className="text-emerald-500 font-bold text-sm mb-2 block uppercase tracking-widest">Step {step.id}</span>
                                    <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                                    <p className="text-neutral-400 mb-6 leading-relaxed">{step.desc}</p>
                                    <Link
                                        href={step.path}
                                        className="inline-flex items-center gap-2 text-sm font-bold text-emerald-500 hover:text-emerald-400 group"
                                    >
                                        View in app
                                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                            <div className="hidden md:block md:w-1/2" />
                        </div>
                    ))}
                </div>

                <section className="mt-24 p-12 rounded-3xl bg-emerald-900/10 border border-emerald-500/20 text-center">
                    <h2 className="text-2xl font-bold mb-4">Ready to start?</h2>
                    <p className="text-neutral-400 mb-8 max-w-md mx-auto">Skip the demo and begin building your Theory of Change in minutes.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/auth/sign-up" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full transition">
                            Create Free Workspace
                        </Link>
                        <Link href="/" className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-8 rounded-full transition border border-white/10">
                            Back to Home
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="py-12 border-t border-white/5 text-center">
                <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                    © {new Date().getFullYear()} ESSET MEAL — Built for impact, verified by data.
                </p>
            </footer>
        </div>
    );
}
