/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

export default function Home() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "(missing)";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 bg-gray-950 text-white">
      <img
        src="/brand/esset-logo-full.svg"
        alt="ESSET MEAL Logo"
        className="h-16"
      />

      <h1 className="text-4xl font-bold tracking-tight">
        ESSET MEAL — New Start
      </h1>

      <p className="text-gray-400 text-lg">
        Gate 1 scaffold (no features yet)
      </p>

      <p className="text-sm text-gray-500">
        App name from env: <code className="text-emerald-400">{appName}</code>
      </p>

      <nav className="flex gap-4 mt-4">
        <Link
          href="/auth/sign-in"
          className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 transition"
        >
          Sign in
        </Link>
        <Link
          href="/auth/sign-up"
          className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 transition"
        >
          Sign up
        </Link>
        <Link
          href="/app"
          className="rounded-lg bg-emerald-700 px-4 py-2 hover:bg-emerald-600 transition"
        >
          App
        </Link>
      </nav>
    </main>
  );
}
