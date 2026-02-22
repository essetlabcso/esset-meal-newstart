import Link from "next/link";

export default function SignUpSuccessPage() {
    return (
        <main className="esset-page-bg flex min-h-screen items-center justify-center px-4 py-10">
            <section className="esset-card w-full max-w-lg p-8 text-center">
                <h1 data-testid="auth-check-email-title" className="esset-h2 font-black text-esset-ink">Check your email</h1>
                <p className="mt-3 text-sm text-esset-muted">
                    We sent you a confirmation link. After confirming, sign in to continue.
                </p>
                <Link
                    href="/auth/sign-in"
                    data-testid="auth-check-email-cta"
                    className="esset-btn-primary mt-6 inline-flex items-center justify-center px-4 py-2.5"
                >
                    Go to sign in
                </Link>
            </section>
        </main>
    );
}
