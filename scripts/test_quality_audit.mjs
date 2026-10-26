/**
 * Smart Study AI — Test Suite Runner
 * Executes the comprehensive TypeScript acceptance suite using tsx.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testTsPath = path.join(__dirname, "test_quality_audit.ts");

const isWindows = process.platform === "win32";
const npxCmd = isWindows ? "npx.cmd" : "npx";

const result = spawnSync(npxCmd, ["tsx", testTsPath], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});

process.exit(result.status ?? 0);
