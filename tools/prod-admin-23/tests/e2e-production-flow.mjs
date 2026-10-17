import fs from "node:fs";
import { DockerEngineClient, cleanupCandidate } from "../safe-deploy.mjs";
import { PROD_ADMIN_24_EXPECTATIONS, switchProduction } from "../production-switch.mjs";

const engine = new DockerEngineClient();
const suffix = `${Date.now()}`;
const sourceName = `tea-prod-admin-24-test-source-${suffix}`;
const candidateName = `tea-prod-admin-24-test-candidate-${suffix}`;
const root = `C:\\data\\tea-staging\\recovery\\prod-admin-24-isolation-${suffix}`;
const mounts = [
  { Source: `${root}\\data`, Destination: "/app/data", RW: true },
  { Source: `${root}\\catalog-sync`, Destination: "/app/catalog-sync", RW: true },
];
const image = PROD_ADMIN_24_EXPECTATIONS.candidateImageRef;
const syntheticSecret = "synthetic-secret-prod-admin-24";
const healthServer = "const http=require('http');http.createServer((req,res)=>{res.writeHead(req.url==='/api/health'?200:404,{'content-type':'application/json'});res.end(req.url==='/api/health'?JSON.stringify({ok:true}):'not found')}).listen(3000,'0.0.0.0');";
let sourceId;
let candidateId;

try {
  for (const mount of mounts) fs.mkdirSync(mount.Source, { recursive: true });
  const manifest = `${root}\\MANIFEST.json`;
  fs.writeFileSync(manifest, JSON.stringify({ synthetic: true }));
  const source = await engine.createContainer(sourceName, {
    Image: image,
    Env: [`SYNTHETIC_SECRET=${syntheticSecret}`, "PORT=3000"],
    Cmd: ["node", "-e", healthServer],
    ExposedPorts: { "3000/tcp": {} },
    HostConfig: {
      Binds: mounts.map((mount) => `${mount.Source}:${mount.Destination}:rw`),
      NetworkMode: "bridge",
      RestartPolicy: { Name: "no" },
    },
  });
  sourceId = source.Id;
  await engine.startContainer(sourceId);
  const inspect = await engine.inspectContainer(sourceId);
  const result = await switchProduction(engine, {
    syntheticMode: true,
    authorization: "PROD-ADMIN-24-SYNTHETIC",
    expected: {
      sourceContainerName: sourceName,
      sourceContainerId: sourceId,
      sourceImageId: inspect.Image,
      sourceImageRef: image,
      candidateImageId: inspect.Image,
      candidateImageRef: image,
      candidateContainerName: candidateName,
      formalData: { "/app/data": mounts[0].Source, "/app/catalog-sync": mounts[1].Source },
      hostPort: 33124,
    },
    backupRoot: root,
    backupExists: true,
    writerNames: [sourceName],
    healthCheck: async () => {
      const response = await fetch("http://127.0.0.1:33124/api/health");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    },
  });
  candidateId = result.candidateId;
  console.log(JSON.stringify({ status: "PASS", formalModeSimulation: true, secretOutput: false, candidateId }));
} catch {
  console.error("Synthetic production-flow rehearsal failed safely.");
  process.exitCode = 1;
} finally {
  if (candidateId) await cleanupCandidate(engine, candidateId, { stopTimeoutSeconds: 2, waitMs: 5000, forceAfterWait: true });
  if (sourceId) {
    try { await engine.startContainer(sourceId); } catch { /* cleanup still runs */ }
    await cleanupCandidate(engine, sourceId, { stopTimeoutSeconds: 2, waitMs: 5000, forceAfterWait: true });
  }
  fs.rmSync(root, { recursive: true, force: true });
}
