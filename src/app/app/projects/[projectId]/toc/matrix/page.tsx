import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/tenant";
import { loadPublishedMatrixRows } from "@/lib/toc/matrixReadService.mjs";

interface MatrixPageProps {
  params: Promise<{
    projectId: string;
  }>;
  searchParams: Promise<{
    v?: string;
    versionId?: string;
  }>;
}

export default async function TocMatrixPage({ params, searchParams }: MatrixPageProps) {
  const { projectId } = await params;
  const { v, versionId } = await searchParams;
  const requestedVersionId = v || versionId || null;

  const supabase = await createClient();
  const tenant = await getActiveTenant(supabase);
  if (!tenant) return notFound();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,title")
    .eq("id", projectId)
    .eq("tenant_id", tenant.tenantId)
    .maybeSingle();

  if (projectError || !project) return notFound();

  const { data: publishedVersions } = await supabase
    .from("toc_versions")
    .select("id,version_number,created_at")
    .eq("project_id", projectId)
    .eq("tenant_id", tenant.tenantId)
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false });

  const versionRows = Array.isArray(publishedVersions) ? publishedVersions : [];
  const activeVersionId =
    (requestedVersionId &&
      versionRows.find((version) => version.id === requestedVersionId)?.id) ||
    versionRows[0]?.id ||
    null;

  if (!activeVersionId) {
    return (
      <main>
        <h1>Matrix Read Model</h1>
        <p>Project: {project.title}</p>
        <p>No published versions available.</p>
      </main>
    );
  }

  const matrixResult = await loadPublishedMatrixRows({
    supabase,
    tenantId: tenant.tenantId,
    projectId,
    tocVersionId: activeVersionId,
  });

  if (!matrixResult.ok) return notFound();
  if (!matrixResult.data) return notFound();

  const rows = matrixResult.data.rows;

  return (
    <main>
      <h1>Matrix Read Model</h1>
      <p>
        <Link href={`/app/projects/${projectId}/toc`}>Back to ToC</Link>
      </p>
      <p>Project: {project.title}</p>
      <p>Published Version: {activeVersionId}</p>

      <table>
        <thead>
          <tr>
            <th>path_sort_key</th>
            <th>path_key</th>
            <th>row_kind</th>
            <th>is_ghost</th>
            <th>node_type</th>
            <th>node_id</th>
            <th>node_title</th>
            <th>goal_id</th>
            <th>outcome_id</th>
            <th>output_id</th>
            <th>reconciliation_key</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.path_sort_key}|${row.row_kind}|${row.node_id}|${row.projection_parent_id ?? ""}`}>
              <td>{row.path_sort_key}</td>
              <td>{Array.isArray(row.path_key) ? row.path_key.join(">") : ""}</td>
              <td>{row.row_kind}</td>
              <td>{row.is_ghost ? "true" : "false"}</td>
              <td>{row.node_type ?? ""}</td>
              <td>{row.node_id}</td>
              <td>{row.node_title ?? ""}</td>
              <td>{row.goal_id ?? ""}</td>
              <td>{row.outcome_id ?? ""}</td>
              <td>{row.output_id ?? ""}</td>
              <td>{row.reconciliation_key}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
