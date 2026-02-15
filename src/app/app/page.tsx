import Link from "next/link";

export default function AppPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-gray-950 text-white">
            <h1 className="text-3xl font-bold">Protected app area (placeholder)</h1>
            <p className="text-gray-400">
                Auth + org context enforced in later gates
            </p>
            <Link
                href="/"
                className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 transition"
            >
                ← Back to home
            </Link>
        </main>
    );
}
