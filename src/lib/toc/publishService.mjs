import { validateGateA } from "./gateAValidator.mjs";

/**
 * Pure orchestration service:
 * - Uses already-fetched draft payload
 * - Runs Gate A validator
 * - If pass, delegates to atomic publish executor
 */
export async function publishDraftWithGateA({
  loadDraftPayload,
  executeAtomicPublish,
}) {
  const payload = await loadDraftPayload();
  if (!payload || !payload.found) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Draft not found",
      violations: [],
    };
  }

  const gate = validateGateA({
    nodes: payload.nodes || [],
    edges: payload.edges || [],
    rlsBaselineOk: payload.rlsBaselineOk ?? false,
  });

  if (!gate.pass) {
    return {
      ok: false,
      code: "GA_VALIDATION_FAILED",
      message: "Gate A failed",
      violations: gate.violations,
    };
  }

  const atomic = await executeAtomicPublish();
  if (!atomic || !atomic.ok) {
    return {
      ok: false,
      code: atomic?.code || "NOT_FOUND",
      message: atomic?.message || "Draft not found",
      violations: [],
    };
  }

  return {
    ok: true,
    data: atomic.data,
    violations: [],
  };
}

