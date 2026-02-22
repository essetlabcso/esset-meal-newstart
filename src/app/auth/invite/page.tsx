import { redirect } from "next/navigation";

export default async function LegacyInvitePage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const params = await searchParams;
    const token = params.token?.trim();

    if (!token) {
        redirect("/invites/accept");
    }

    redirect(`/invites/accept?token=${encodeURIComponent(token)}`);
}
