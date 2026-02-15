import Link from "next/link";

export default async function AuthErrorPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>;
}) {
    const { message } = await searchParams;

    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 bg-gray-950 text-white">
            <h1 className="text-3xl font-bold text-red-400">
                Authentication Error
            </h1>
            <p className="text-gray-400 text-center max-w-md">
                {message || "An unknown error occurred during authentication."}
            </p>
            <Link
                href="/auth/sign-in"
                className="rounded-lg bg-emerald-700 px-4 py-2 hover:bg-emerald-600 transition"
            >
                Back to sign in
            </Link>
        </main>
    );
}
