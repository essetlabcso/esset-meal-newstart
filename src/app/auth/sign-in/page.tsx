import SignInClient from "@/app/auth/sign-in/SignInClient";
import { sanitizeInternalPath } from "@/lib/routing";

export default async function SignInPage({
    searchParams,
}: {
    searchParams: Promise<{ next?: string }>;
}) {
    const params = await searchParams;
    const nextPath = sanitizeInternalPath(params.next ?? null) ?? "";

    return <SignInClient nextPath={nextPath} />;
}
