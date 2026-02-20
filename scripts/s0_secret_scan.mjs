#!/usr/bin/env node
/* SEC-TEST-03 stop-ship scan: forbid privileged secrets in client bundle outputs and repo files. */
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const requireBuildOutput = String(process.env.S0_REQUIRE_BUILD_OUTPUT || "").toLowerCase() === "1";

const buildDirs = [".next", "out", "dist"]
  .map((d) => path.join(repoRoot, d))
  .filter((d) => fs.existsSync(d) && fs.statSync(d).isDirectory());

if (requireBuildOutput && buildDirs.length === 0) {
  console.error("SEC_SCAN_FAIL: no build output directory found (.next/out/dist)");
  process.exit(1);
}

const defaultForbiddenEnvKeys = ["SUPABASE_SERVICE_ROLE_KEY"];
const extraEnvKeys = String(process.env.S0_FORBIDDEN_ENV_KEYS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const forbiddenEnvKeys = [...new Set([...defaultForbiddenEnvKeys, ...extraEnvKeys])];

const forbiddenValueMatchers = forbiddenEnvKeys
  .map((key) => ({ key, value: process.env[key] }))
  .filter((x) => typeof x.value === "string" && x.value.trim().length >= 8)
  .map((x) => ({ name: `env:${x.key}`, value: x.value }));

const forbiddenRegexMatchers = [
  { name: "supabase-service-role-pattern", regex: /sb_secret_[A-Za-z0-9_-]{12,}/g },
];

const walk = (startDir, files = []) => {
  if (!fs.existsSync(startDir)) return files;
  for (const entry of fs.readdirSync(startDir, { withFileTypes: true })) {
    const fullPath = path.join(startDir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
};

const repoScanRoots = ["src", "supabase", "scripts", "docs", ".github"]
  .map((d) => path.join(repoRoot, d))
  .filter((d) => fs.existsSync(d));

const scanTargets = [];
for (const dir of buildDirs) {
  scanTargets.push(...walk(dir));
}
for (const dir of repoScanRoots) {
  scanTargets.push(...walk(dir));
}

const findings = [];

for (const filePath of scanTargets) {
  let text = "";
  try {
    const raw = fs.readFileSync(filePath);
    text = raw.toString("utf8");
  } catch {
    continue;
  }

  for (const m of forbiddenRegexMatchers) {
    const matched = text.match(m.regex);
    if (matched && matched.length > 0) {
      findings.push({
        file: path.relative(repoRoot, filePath),
        matcher: m.name,
        sample: matched[0].slice(0, 60),
      });
      break;
    }
  }

  for (const m of forbiddenValueMatchers) {
    if (text.includes(m.value)) {
      findings.push({
        file: path.relative(repoRoot, filePath),
        matcher: m.name,
        sample: "<env-value-match>",
      });
      break;
    }
  }
}

if (findings.length > 0) {
  console.error("SEC_SCAN_FAIL: forbidden secret pattern detected");
  for (const f of findings.slice(0, 20)) {
    console.error(`- ${f.file} [${f.matcher}] ${f.sample}`);
  }
  process.exit(1);
}

const buildRoots = buildDirs.map((d) => path.basename(d)).join(", ");
console.log(`SEC_SCAN_PASS: scanned ${scanTargets.length} files` + (buildRoots ? ` (build roots: ${buildRoots})` : ""));
