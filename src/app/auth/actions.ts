"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: error.message };
    }

    redirect("/app");
}

export async function signUpWithPassword(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        return { error: error.message };
    }

    // If session exists, email confirmation is disabled — go straight to app
    if (data.session) {
        redirect("/app");
    }

    // No session means email confirmation is enabled
    redirect("/auth/sign-up-success");
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/auth/sign-in");
}
