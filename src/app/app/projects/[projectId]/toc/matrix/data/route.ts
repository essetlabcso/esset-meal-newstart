import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { loadPublishedMatrixRows } from "@/lib/toc/matrixReadService.mjs";

type RouteContext = {
  params: Promise<{ projectId: string }> | { projectId: string };
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { projectId } = await context.params;
  const { searchParams } = new URL(request.url);
  const tocVersionId = searchParams.get("v") || searchParams.get("versionId");

  if (!projectId || !tocVersionId) {
    return NextResponse.json(
      { error: "Missing required parameters: projectId and versionId" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("tenant_id", tenant.tenantId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await loadPublishedMatrixRows({
      supabase,
      tenantId: tenant.tenantId,
      projectId,
      tocVersionId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    if (!result.data) {
      return NextResponse.json({ error: "Matrix rows missing" }, { status: 500 });
    }

    return NextResponse.json({ rows: result.data.rows });
  } catch {
    return NextResponse.json({ error: "Matrix read failed" }, { status: 500 });
  }
}
