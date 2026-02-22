import Link from "next/link";

export default function AuthErrorPage() {
    return (
        <main className="esset-page-bg flex min-h-screen items-center justify-center px-4 py-10">
            <section className="esset-card w-full max-w-lg p-8 text-center">
                <h1 className="esset-h2 font-black text-esset-ink">Not found</h1>
                <p className="mt-3 text-sm text-esset-muted">
                    We couldn&apos;t complete that sign-in request. Please try again.
                </p>
                <Link
                    href="/auth/sign-in"
                    className="esset-btn-primary mt-6 inline-flex items-center justify-center px-4 py-2.5"
                >
                    Back to sign in
                </Link>
            </section>
        </main>
    );
}
