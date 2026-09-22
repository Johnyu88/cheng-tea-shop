import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const required = [
  "docs/testing/phase-9a-older-user-and-content-validation-pack.md",
  "docs/testing/phase-9a-observation-template.md",
  "docs/testing/phase-9a-real-content-replacement-checklist.md",
  "docs/testing/phase-9a-real-product-material-import-spec.md",
  "docs/testing/phase-9a-product-import-template.csv",
  "docs/testing/phase-9a-product-import-template.json",
  "docs/testing/phase-9a-product-import-template.md",
  "docs/testing/phase-9a-placeholder-synthetic-map.md",
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
const importSpec = readFileSync(resolve(root, required[3]), "utf8");
const importTool = resolve(root, "scripts/phase-9a-product-import.mjs");
const toolPresent = existsSync(importTool);
console.log(`${toolPresent ? "PASS" : "FAIL"} scripts/phase-9a-product-import.mjs`);
if (!toolPresent) failed = true;
for (const marker of ["尚未執行真人走查", "P0", "P1", "P2", "P3", "WHITEPAPER.md", "HANDOFF.md", "CAPABILITY_MAP.md"]) {
  const present = pack.includes(marker);
  console.log(`${present ? "PASS" : "FAIL"} marker: ${marker}`);
  if (!present) failed = true;
}
for (const marker of ["product_name", "harvest_year", "aftertaste", "publication_status", "placeholder"]) {
  const present = importSpec.includes(marker);
  console.log(`${present ? "PASS" : "FAIL"} import marker: ${marker}`);
  if (!present) failed = true;
}
for (const marker of ["wouldWrite", "--apply", "invalid-price", "image-content-id-mismatch"]) {
  const present = toolPresent && readFileSync(importTool, "utf8").includes(marker);
  console.log(`${present ? "PASS" : "FAIL"} import tool marker: ${marker}`);
  if (!present) failed = true;
}

console.log("Phase 9-A preflight is documentation-only; it does not start a server, contact a participant, or access external services.");
process.exitCode = failed ? 1 : 0;
