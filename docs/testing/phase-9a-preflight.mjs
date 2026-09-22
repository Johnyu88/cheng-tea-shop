import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const required = [
  "docs/testing/phase-9a-older-user-and-content-validation-pack.md",
  "docs/testing/phase-9a-observation-template.md",
  "docs/testing/phase-9a-real-content-replacement-checklist.md",
  "docs/testing/older-user-walkthrough-dry-run-2026-09-22.md",
];

let failed = false;
for (const relativePath of required) {
  const path = resolve(root, relativePath);
  const present = existsSync(path);
  console.log(`${present ? "PASS" : "FAIL"} ${relativePath}`);
  if (!present) failed = true;
}

const pack = readFileSync(resolve(root, required[0]), "utf8");
for (const marker of ["尚未執行真人走查", "P0", "P1", "P2", "P3", "WHITEPAPER.md", "HANDOFF.md", "CAPABILITY_MAP.md"]) {
  const present = pack.includes(marker);
  console.log(`${present ? "PASS" : "FAIL"} marker: ${marker}`);
  if (!present) failed = true;
}

console.log("Phase 9-A preflight is documentation-only; it does not start a server, contact a participant, or access external services.");
process.exitCode = failed ? 1 : 0;
