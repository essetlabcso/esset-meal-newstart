import Link from "next/link";

export default function SignUpSuccessPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-gray-950 text-white">
            <h1 className="text-3xl font-bold">Check your email</h1>
            <p className="text-gray-400 text-center max-w-md">
                We&apos;ve sent you a confirmation link. Please check your email to
                confirm your account, then sign in.
            </p>
            <Link
                href="/auth/sign-in"
                className="rounded-lg bg-emerald-700 px-4 py-2 hover:bg-emerald-600 transition"
            >
                Go to sign in
            </Link>
        </main>
    );
}
