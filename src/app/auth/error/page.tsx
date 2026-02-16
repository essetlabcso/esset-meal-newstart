import Link from "next/link";
import Image from "next/image";

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>;
}) {
    const { message } = await searchParams;

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
                        <h1 className="text-2xl font-semibold tracking-tight text-red-400" data-testid="auth-error-title">
                            Authentication Error
                        </h1>
                        <p className="text-sm text-gray-400">
                            {message || "An unknown error occurred during authentication."}
                        </p>
                    </div>

                    <Link
                        href="/auth/sign-in"
                        className="inline-block w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 font-semibold text-gray-200 hover:bg-white/10 active:bg-white/15 transition-all outline-none focus:ring-2 focus:ring-white/20"
                    >
                        Back to sign in
                    </Link>
                </div>

                <footer className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mt-4">
                    Built for impact, verified by data.
                </footer>
            </div>
        </main>
    );
}
