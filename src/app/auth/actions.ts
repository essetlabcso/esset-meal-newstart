"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizeInternalPath } from "@/lib/routing";

type AuthActionState = {
    error?: string;
};

export async function signInWithPassword(formData: FormData) {
    const supabase = await createClient();

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextPath = sanitizeInternalPath(String(formData.get("next") ?? "").trim());

    if (!email || !password) {
        return { error: "Enter your email and password." } satisfies AuthActionState;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return {
            error: "We couldn't sign you in with those details.",
        } satisfies AuthActionState;
    }

    if (nextPath) {
        redirect(`/initialize?next=${encodeURIComponent(nextPath)}`);
    }

    redirect("/initialize");
}

export async function signUpWithPassword(formData: FormData) {
    const supabase = await createClient();

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
        return { error: "Enter an email and password." } satisfies AuthActionState;
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        return {
            error: "We couldn't complete sign up. Please try again.",
        } satisfies AuthActionState;
    }

    // If session exists, email confirmation is disabled.
    if (data.session) {
        redirect("/initialize");
    }

    // No session means email confirmation is enabled
    redirect("/auth/sign-up-success");
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth/sign-in");
}
