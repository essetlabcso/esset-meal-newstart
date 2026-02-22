import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InviteAcceptForm from "@/app/invites/accept/InviteAcceptForm";

type InviteAcceptParams = {
    token?: string;
};

export default async function InviteAcceptPage({
    searchParams,
}: {
    searchParams: Promise<InviteAcceptParams>;
}) {
    const params = await searchParams;
    const token = params.token?.trim() ?? "";

    if (!token) {
        return (
            <main className="esset-page-bg flex min-h-screen items-center justify-center px-4">
                <section className="esset-card w-full max-w-lg p-8 text-center">
                    <h1 className="esset-h2 font-black text-esset-ink">Not found</h1>
                    <p className="mt-3 text-base text-esset-muted">
                        This invite link isn&apos;t valid. Ask your admin for a new one.
                    </p>
                    <Link
                        href="/initialize"
                        className="esset-btn-primary mt-6 inline-flex items-center justify-center px-4 py-2.5"
                    >
                        Back to initialize
                    </Link>
                </section>
            </main>
        );
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/auth/sign-in?next=${encodeURIComponent(`/invites/accept?token=${token}`)}`);
    }

    return (
        <main className="esset-page-bg flex min-h-screen items-center justify-center px-4 py-10">
            <section className="esset-card w-full max-w-lg p-8">
                <h1 className="esset-h2 font-black text-esset-ink">Accept invite</h1>
                <p className="mt-2 text-sm text-esset-muted">
                    Continue to join your workspace.
                </p>
                <InviteAcceptForm token={token} />
                <Link
                    href="/initialize"
                    className="mt-4 inline-flex text-sm font-semibold text-esset-teal-800"
                >
                    Back to initialize
                </Link>
            </section>
        </main>
    );
}
