"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProjectScope } from "@/lib/projects/scope";

type ActionResult = {
    ok: boolean;
    message?: string;
    error?: string;
    fieldErrors?: Record<string, string>;
};

const ALLOWED_PROJECT_STATUS = new Set(["draft", "active", "closed", "archived"]);

function normalizeOptionalDate(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function isDateRangeValid(startDate: string | null, endDate: string | null) {
    if (!startDate || !endDate) {
        return true;
    }

    return new Date(startDate).getTime() <= new Date(endDate).getTime();
}

function revalidateProjectSettingsPaths(orgId: string, projectId: string) {
    const basePath = `/app/${orgId}/projects/${projectId}`;
    revalidatePath(basePath);
    revalidatePath(`${basePath}/home`);
    revalidatePath(`${basePath}/settings/metadata`);
    revalidatePath(`${basePath}/settings/reporting-periods`);
}

async function getProjectRecord(orgId: string, projectId: string) {
    const supabase = await createClient();
    const { data: project } = await supabase
        .from("projects")
        .select("id, tenant_id, created_by")
        .eq("id", projectId)
        .eq("tenant_id", orgId)
        .maybeSingle();

    return { supabase, project };
}

export async function updateProjectMetadataAction(formData: FormData): Promise<ActionResult> {
    const orgId = String(formData.get("orgId") ?? "").trim();
    const projectId = String(formData.get("projectId") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const shortCode = String(formData.get("shortCode") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const startDate = normalizeOptionalDate(String(formData.get("startDate") ?? ""));
    const endDate = normalizeOptionalDate(String(formData.get("endDate") ?? ""));
    const status = String(formData.get("status") ?? "").trim();

    if (!orgId || !projectId) {
        return { ok: false, error: "Invalid request." };
    }

    const fieldErrors: Record<string, string> = {};
    if (!title) {
        fieldErrors.title = "Project name is required.";
    }
    if (status && !ALLOWED_PROJECT_STATUS.has(status)) {
        fieldErrors.status = "Select a valid status.";
    }
    if (!isDateRangeValid(startDate, endDate)) {
        fieldErrors.endDate = "End date must be after the start date.";
    }

    if (Object.keys(fieldErrors).length > 0) {
        return { ok: false, fieldErrors };
    }

    const scope = await requireProjectScope(orgId, projectId);
    const { supabase, project } = await getProjectRecord(orgId, projectId);

    if (!project) {
        notFound();
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { ok: false, error: "Not found." };
    }

    const canEdit =
        scope.role === "owner" || scope.role === "admin" || project.created_by === user.id;

    if (!canEdit) {
        return { ok: false, error: "Not found." };
    }

    const { error } = await supabase
        .from("projects")
        .update({
            title,
            short_code: shortCode || null,
            description: description || null,
            start_date: startDate,
            end_date: endDate,
            status: status || "draft",
        })
        .eq("id", projectId)
        .eq("tenant_id", orgId);

    if (error) {
        return { ok: false, error: "We couldn't save your changes. Try again." };
    }

    revalidateProjectSettingsPaths(orgId, projectId);
    return { ok: true, message: "Project updated" };
}

export async function createReportingPeriodAction(formData: FormData): Promise<ActionResult> {
    const orgId = String(formData.get("orgId") ?? "").trim();
    const projectId = String(formData.get("projectId") ?? "").trim();
    const label = String(formData.get("label") ?? "").trim();
    const startDate = String(formData.get("startDate") ?? "").trim();
    const endDate = String(formData.get("endDate") ?? "").trim();

    if (!orgId || !projectId) {
        return { ok: false, error: "Invalid request." };
    }

    const fieldErrors: Record<string, string> = {};
    if (!label) {
        fieldErrors.label = "Label is required.";
    }
    if (!startDate) {
        fieldErrors.startDate = "Start date is required.";
    }
    if (!endDate) {
        fieldErrors.endDate = "End date is required.";
    }
    if (startDate && endDate && !isDateRangeValid(startDate, endDate)) {
        fieldErrors.endDate = "End date must be after the start date.";
    }

    if (Object.keys(fieldErrors).length > 0) {
        return { ok: false, fieldErrors };
    }

    await requireProjectScope(orgId, projectId);
    const supabase = await createClient();

    const { error } = await supabase.from("reporting_periods").insert({
        tenant_id: orgId,
        project_id: projectId,
        label,
        start_date: startDate,
        end_date: endDate,
    });

    if (error) {
        return { ok: false, error: "We couldn't save your changes. Try again." };
    }

    revalidateProjectSettingsPaths(orgId, projectId);
    return { ok: true, message: "Reporting period created" };
}

export async function updateReportingPeriodAction(formData: FormData): Promise<ActionResult> {
    const orgId = String(formData.get("orgId") ?? "").trim();
    const projectId = String(formData.get("projectId") ?? "").trim();
    const periodId = String(formData.get("periodId") ?? "").trim();
    const label = String(formData.get("label") ?? "").trim();
    const startDate = String(formData.get("startDate") ?? "").trim();
    const endDate = String(formData.get("endDate") ?? "").trim();

    if (!orgId || !projectId || !periodId) {
        return { ok: false, error: "Invalid request." };
    }

    const fieldErrors: Record<string, string> = {};
    if (!label) {
        fieldErrors.label = "Label is required.";
    }
    if (!startDate) {
        fieldErrors.startDate = "Start date is required.";
    }
    if (!endDate) {
        fieldErrors.endDate = "End date is required.";
    }
    if (startDate && endDate && !isDateRangeValid(startDate, endDate)) {
        fieldErrors.endDate = "End date must be after the start date.";
    }

    if (Object.keys(fieldErrors).length > 0) {
        return { ok: false, fieldErrors };
    }

    const scope = await requireProjectScope(orgId, projectId);
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { ok: false, error: "Not found." };
    }

    const { data: period } = await supabase
        .from("reporting_periods")
        .select("id, created_by")
        .eq("id", periodId)
        .eq("project_id", projectId)
        .eq("tenant_id", orgId)
        .maybeSingle();

    if (!period) {
        return { ok: false, error: "Not found." };
    }

    const canManage =
        scope.role === "owner" || scope.role === "admin" || period.created_by === user.id;

    if (!canManage) {
        return { ok: false, error: "Not found." };
    }

    const { error } = await supabase
        .from("reporting_periods")
        .update({
            label,
            start_date: startDate,
            end_date: endDate,
        })
        .eq("id", periodId)
        .eq("project_id", projectId)
        .eq("tenant_id", orgId);

    if (error) {
        return { ok: false, error: "We couldn't save your changes. Try again." };
    }

    revalidateProjectSettingsPaths(orgId, projectId);
    return { ok: true, message: "Reporting period updated" };
}

export async function deleteReportingPeriodAction(formData: FormData): Promise<ActionResult> {
    const orgId = String(formData.get("orgId") ?? "").trim();
    const projectId = String(formData.get("projectId") ?? "").trim();
    const periodId = String(formData.get("periodId") ?? "").trim();

    if (!orgId || !projectId || !periodId) {
        return { ok: false, error: "Invalid request." };
    }

    const scope = await requireProjectScope(orgId, projectId);
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { ok: false, error: "Not found." };
    }

    const { data: period } = await supabase
        .from("reporting_periods")
        .select("id, created_by")
        .eq("id", periodId)
        .eq("project_id", projectId)
        .eq("tenant_id", orgId)
        .maybeSingle();

    if (!period) {
        return { ok: false, error: "Not found." };
    }

    const canManage =
        scope.role === "owner" || scope.role === "admin" || period.created_by === user.id;

    if (!canManage) {
        return { ok: false, error: "Not found." };
    }

    const { error } = await supabase
        .from("reporting_periods")
        .delete()
        .eq("id", periodId)
        .eq("project_id", projectId)
        .eq("tenant_id", orgId);

    if (error) {
        return { ok: false, error: "We couldn't complete this action. Try again." };
    }

    revalidateProjectSettingsPaths(orgId, projectId);
    return { ok: true, message: "Reporting period updated" };
}
