import Link from "next/link";
import Image from "next/image";

export default function SignUpSuccessPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-950 text-white selection:bg-emerald-500/30">
            <div className="w-full max-w-md space-y-8 flex flex-col items-center text-center">
                {/* Brand Logo */}
                <Link href="/" className="hover:opacity-80 transition-opacity" data-testid="auth-logo">
                    <Image
                        src="/brand/esset-logo-header.svg"
                        alt="ESSET MEAL Logo"
                        width={180}
                        height={40}
                        priority
                        className="h-10 w-auto"
                    />
                </Link>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm w-full space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-100" data-testid="auth-check-email-title">
                            Check your email
                        </h1>
                        <p className="text-sm text-gray-400">
                            We&apos;ve sent you a confirmation link. Please check your email to
                            confirm your account.
                        </p>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <p className="text-xs text-emerald-400 font-medium">
                            Once confirmed, you can return here to sign in and access your workspace.
                        </p>
                    </div>

                    <Link
                        href="/auth/sign-in"
                        data-testid="auth-check-email-cta"
                        className="inline-block w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-500 active:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
                    >
                        Go to sign in
                    </Link>
                </div>

                <footer className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mt-4">
                    Built for impact, verified by data.
                </footer>
            </div>
        </main>
    );
}
