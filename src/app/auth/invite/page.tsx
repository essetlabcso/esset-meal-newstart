import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "../../app/workspaces/members/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function InvitePage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const { token } = await searchParams;
    const supabase = await createClient();

    // Check if user is signed in
    const { data: { user } } = await supabase.auth.getUser();

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold text-red-400">Invalid Invite</h1>
                <p className="mt-2 text-gray-400">The invitation link is missing a token.</p>
                <Link href="/" className="mt-6 text-emerald-400 hover:underline">Go Home</Link>
            </div>
        );
    }

    if (!user) {
        // Redirect to sign in with redirect back to this page
        const encodedToken = encodeURIComponent(token);
        redirect(`/auth/sign-in?next=/auth/invite?token=${encodedToken}`);
    }

    // Attempt to accept invite
    const result = await acceptInvite(token);

    if (!result.success) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
                    <h1 className="text-2xl font-bold text-red-400">Invitation Failed</h1>
                    <p className="text-gray-300">{result.error || "The invitation might be expired or already accepted."}</p>
                    <div className="pt-4">
                        <Link
                            href="/app"
                            className="inline-block bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white">Invitation Accepted!</h1>
                <p className="text-gray-300">You have successfully joined the workspace. You are being redirected...</p>

                {/* Meta redirect for better UX if server redirect is slow, though we redirect in server too */}
                <meta httpEquiv="refresh" content="3;url=/app" />

                <div className="pt-4">
                    <Link
                        href="/app"
                        className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                        Go to Workspace Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
