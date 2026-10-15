import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { DockerEngineClient, buildCandidateFromInspect, createAndHealthCheckCandidate, cleanupCandidate } from "../safe-deploy.mjs";

const engine = new DockerEngineClient();
const suffix = `${Date.now()}`;
const sourceName = "tea-prod-admin-23-test-source";
const candidateName = `tea-prod-admin-23-test-candidate-${suffix}`;
const root = `C:\\data\\tea-staging\\recovery\\prod-admin-23-isolation-e2e-${suffix}`;
const mounts = [
  { Source: `${root}\\data`, Destination: "/app/data", RW: true },
  { Source: `${root}\\catalog-sync`, Destination: "/app/catalog-sync", RW: true },
];
const image = "tea-nextjs:prod-admin-14-2be6be0";
const syntheticSecret = "synthetic-secret-prod-admin-23";
const healthServer = [
  "const http=require('http');",
  "http.createServer((req,res)=>{res.writeHead(req.url==='/api/health'?200:404,{'content-type':'application/json'});res.end(req.url==='/api/health'?JSON.stringify({ok:true}):'not found')}).listen(3000,'0.0.0.0');",
].join("");

let sourceId;
let candidateId;
try {
  for (const mount of mounts) fs.mkdirSync(mount.Source, { recursive: true });
  const source = await engine.createContainer(sourceName, {
    Image: image,
    Env: [`SYNTHETIC_SECRET=${syntheticSecret}`, "PORT=3000"],
    Cmd: ["node", "-e", healthServer],
    ExposedPorts: { "3000/tcp": {} },
    HostConfig: { NetworkMode: "bridge", RestartPolicy: { Name: "no" } },
  });
  sourceId = source.Id;
  const inspect = await engine.inspectContainer(sourceId);
  const dryRun = spawnSync(process.execPath, [
    path.join(import.meta.dirname, "..", "cli.mjs"),
    "--mode", "dry-run",
    "--source", sourceName,
  ], { encoding: "utf8" });
  if (dryRun.status !== 0 || dryRun.stdout.includes(syntheticSecret) || dryRun.stderr.includes(syntheticSecret)) {
    throw new Error("Synthetic dry-run did not complete without secret output");
  }
  const spec = buildCandidateFromInspect({
    inspect,
    sourceName,
    allowlistedSources: [sourceName],
    mode: "isolation",
    candidateName,
    image,
    isolationMounts: mounts,
    ports: [{ container: 3000, host: 33123 }],
  });
  const result = await createAndHealthCheckCandidate({
    engine,
    spec,
    healthCheck: async () => {
      const response = await fetch("http://127.0.0.1:33123/api/health");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json();
      if (body.ok !== true) throw new Error("Synthetic health response was not ok");
    },
  });
  candidateId = result.containerId;
  console.log(JSON.stringify({ status: "PASS", candidate: result.spec.name, image, secretOutput: false }));
} catch {
  console.error("Synthetic Engine API isolation test failed safely.");
  process.exitCode = 1;
} finally {
  if (candidateId) await cleanupCandidate(engine, candidateId);
  if (sourceId) await cleanupCandidate(engine, sourceId);
  fs.rmSync(path.win32.normalize(root), { recursive: true, force: true });
}
