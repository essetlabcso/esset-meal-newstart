#!/usr/bin/env node
/* S0 drift guard against canonical spec and stop-ship constraints */
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const specPath = path.join(repoRoot, "docs", "enhanced_master_spec_v0_1_18012026.md");

const fail = (msg) => {
  console.error(`S0_DRIFT_FAIL: ${msg}`);
  process.exit(1);
};

const read = (p) => fs.readFileSync(p, "utf8");

if (!fs.existsSync(specPath)) {
  fail("Canonical spec file missing at docs/enhanced_master_spec_v0_1_18012026.md");
}

const spec = read(specPath);
const requiredSpecRules = [
  "GA-01", "GA-02", "GA-03", "GA-04", "GA-05", "GA-06", "GA-07", "GA-08",
  "TOC-PUB-01", "TOC-PUB-02", "TOC-PROJ-01", "TOC-PROJ-02", "TOC-PROJ-03", "TOC-PROJ-04",
  "RPT-01", "RPT-02", "AN-01", "AN-02", "AN-03", "SEC-TEST-01", "SEC-TEST-02", "SEC-TEST-03"
];

for (const id of requiredSpecRules) {
  if (!spec.includes(id)) {
    fail(`Canonical spec missing required rule id ${id}`);
  }
}

const readIfExists = (rel) => {
  const p = path.join(repoRoot, rel);
  return fs.existsSync(p) ? read(p) : "";
};

const codeSurface = [
  readIfExists("supabase/migrations/20260218020000_s0_canonical_slice.sql"),
  readIfExists("supabase/tests/s0_toc_gate_a_full.sql"),
  readIfExists("supabase/tests/s0_export_manifest_hash.sql"),
  readIfExists("supabase/tests/s0_sec_stop_ship.sql"),
  readIfExists("src/app/app/projects/[projectId]/toc/actions.ts"),
].join("\n");

for (const id of ["GA-01", "RPT-02", "AN-01", "SEC-TEST-01"]) {
  if (!codeSurface.includes(id)) {
    fail(`S0 implementation surface missing traceability reference ${id}`);
  }
}

const srcDir = path.join(repoRoot, "src");
const walk = (dir, files = []) => {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
};

const srcFiles = walk(srcDir).filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));
for (const f of srcFiles) {
  const txt = read(f);
  if (txt.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    fail(`Service role key token found in src bundle surface: ${path.relative(repoRoot, f)}`);
  }
}

const weightedPattern = /allocation_mode\s*[:=]\s*["']weighted["']/i;
const exportSurface = [readIfExists("src/app/app/projects/[projectId]/toc/actions.ts"), readIfExists("supabase/migrations/20260218020000_s0_canonical_slice.sql")].join("\n");
if (!exportSurface.includes("AN-01 violation")) {
  fail("Missing explicit AN-01 weighted allocation rejection");
}
if (weightedPattern.test(readIfExists("src/app/app/projects/[projectId]/toc/actions.ts"))) {
  fail("Client/server action hardcodes weighted allocation mode");
}

console.log("S0_DRIFT_PASS");
