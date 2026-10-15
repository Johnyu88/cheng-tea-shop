#!/usr/bin/env node

import { DockerEngineClient, buildCandidateFromInspect, cleanupCandidate, createAndHealthCheckCandidate, createRedactedDiff } from "./safe-deploy.mjs";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const value = process.argv[index];
  if (!value?.startsWith("--")) continue;
  const key = value.slice(2);
  const next = process.argv[index + 1];
  args.set(key, next && !next.startsWith("--") ? next : true);
  if (next && !next.startsWith("--")) index += 1;
}

const mode = args.get("mode") === "isolation" ? "isolation" : "dry-run";
const sourceName = String(args.get("source") ?? "tea-prod-admin-23-test-source");
const candidateName = String(args.get("candidate") ?? "tea-prod-admin-23-test-candidate");
const image = String(args.get("image") ?? "tea-nextjs:prod-admin-23-test");
const hostPort = Number(args.get("host-port") ?? 33123);
const isolationRoot = String(args.get("isolation-root") ?? "C:\\data\\tea-staging\\recovery\\prod-admin-23-isolation");
const allowlistedSources = ["tea-prod-admin-23-test-source"];
const isolationMounts = [
  { Source: `${isolationRoot}\\data`, Destination: "/app/data", RW: true },
  { Source: `${isolationRoot}\\catalog-sync`, Destination: "/app/catalog-sync", RW: true },
];

async function main() {
  if (mode === "dry-run" && args.get("start")) throw new Error("Dry-run refuses --start");
  const engine = new DockerEngineClient();
  const inspect = await engine.inspectContainer(sourceName);
  const spec = buildCandidateFromInspect({
    inspect,
    sourceName,
    allowlistedSources,
    mode,
    candidateName,
    image,
    isolationMounts,
    ports: [{ container: 3000, host: hostPort }],
  });
  if (mode === "dry-run") {
    process.stdout.write(`${JSON.stringify(createRedactedDiff(spec), null, 2)}\n`);
    return;
  }
  const result = await createAndHealthCheckCandidate({
    engine,
    spec,
    healthCheck: async () => {
      const response = await fetch(`http://127.0.0.1:${hostPort}/api/health`);
      if (!response.ok) throw new Error(`Candidate health check returned HTTP ${response.status}`);
    },
  });
  process.stdout.write(`${JSON.stringify(result.spec, null, 2)}\n`);
  if (args.get("cleanup")) await cleanupCandidate(engine, result.containerId);
}

main().catch(() => {
  process.stderr.write("Safe deployment tool stopped without exposing configuration values.\n");
  process.exitCode = 1;
});
