"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(formData: FormData) {
    const name = (formData.get("name") as string)?.trim();

    if (!name) {
        return { error: "Organization name is required." };
    }

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/sign-in");
    }

    const { error } = await supabase
        .from("organizations")
        .insert({ name, created_by: user.id })
        .select("id")
        .single();

    if (error) {
        return { error: error.message };
    }

    // DB trigger (on_org_created_add_owner) creates the owner membership
    redirect("/app");
}
