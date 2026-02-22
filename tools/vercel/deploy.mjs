/**
 * Vercel deploy helper that avoids leaking local secrets and avoids Vercel's
 * "git author must have access" enforcement by deploying from a temp copy
 * without a `.git/` directory.
 *
 * Usage:
 * - `node tools/vercel/deploy.mjs`        (preview)
 * - `node tools/vercel/deploy.mjs --prod` (production)
 *
 * Notes:
 * - Requires `.vercel/project.json` in the repo root (created by `vercel link`).
 * - Intentionally does NOT copy `.vercel/.env.*` files.
 * - Set `KEEP_VERCEL_TMP=1` to keep the temp directory for debugging.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const EXCLUDE_TOP_LEVEL = new Set([
  ".git",
  ".next",
  ".vercel",
  "node_modules",
  "test-results",
  ".ruff_cache",
]);

function parseArgs(argv) {
  return {
    prod: argv.includes("--prod"),
  };
}

function repoRoot() {
  return process.cwd();
}

function ensureVercelProjectJson(root) {
  const projectJsonPath = path.join(root, ".vercel", "project.json");
  if (!fs.existsSync(projectJsonPath)) {
    throw new Error(
      "missing .vercel/project.json; run `npm run vercel:link` first to link the project",
    );
  }
  return projectJsonPath;
}

function shouldCopy(root, srcPath) {
  const rel = path.relative(root, srcPath);
  if (!rel || rel === ".") return true;

  const top = rel.split(path.sep)[0];
  if (EXCLUDE_TOP_LEVEL.has(top)) return false;

  // Never copy pulled env files.
  if (rel.startsWith(`.vercel${path.sep}.env.`)) return false;

  // Avoid macOS Finder artifacts.
  if (rel.endsWith(".DS_Store")) return false;

  return true;
}

function copyRepoToTemp(root) {
  const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "vercel-deploy-"));

  fs.cpSync(root, tmpBase, {
    recursive: true,
    force: true,
    // Vercel packaging/build can be sensitive to symlinks; dereference to ensure
    // root-level symlinks (e.g. `codecov.yml`) become real files in the upload.
    dereference: true,
    filter: (src) => shouldCopy(root, src),
  });

  // Re-add only the project link file so Vercel deploy targets the linked project.
  const vercelDir = path.join(tmpBase, ".vercel");
  fs.mkdirSync(vercelDir, { recursive: true });
  fs.copyFileSync(
    path.join(root, ".vercel", "project.json"),
    path.join(vercelDir, "project.json"),
  );

  return tmpBase;
}

function runVercelDeploy(tmpDir, { prod }) {
  const args = ["deploy", tmpDir, "--yes"];
  if (prod) args.push("--prod");

  const res = spawnSync("vercel", args, {
    stdio: "inherit",
    env: process.env,
  });

  if (res.error) throw res.error;
  if (typeof res.status === "number" && res.status !== 0) {
    throw new Error(`vercel deploy failed with exit code ${res.status}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = repoRoot();

  ensureVercelProjectJson(root);

  let tmpDir;
  try {
    tmpDir = copyRepoToTemp(root);
    runVercelDeploy(tmpDir, args);
  } finally {
    if (tmpDir && !process.env.KEEP_VERCEL_TMP?.trim()) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } else if (tmpDir) {
      // eslint-disable-next-line no-console
      console.log(`KEEP_VERCEL_TMP=1 set; temp deploy dir kept at: ${tmpDir}`);
    }
  }
}

main();
