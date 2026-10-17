import fs from "node:fs";

import { buildCandidateSpec, cleanupCandidate, isFormalDataPath, normalizeWindowsPath } from "./safe-deploy.mjs";

export const PROD_ADMIN_24_EXPECTATIONS = Object.freeze({
  sourceContainerName: "tea-private-v5-prod-admin-03-live",
  sourceContainerId: "9c17dd26d8d42e4c4168fa22893830cc7ba0e11a7ebde9278d772b9742f7ef62",
  sourceImageId: "sha256:e247f2eb70688627e7b75a7d23ca230f2d4dc59bef3fdf58a30b09deb6f402cc",
  sourceImageRef: "tea-nextjs:prod-admin-03-0b36c71-r1",
  candidateImageId: "sha256:e4be4719acae0837c10c8244f268b220b3b14b12b89b05bcd812d2bb423a7f7f",
  candidateImageRef: "tea-nextjs:prod-admin-14-2be6be0",
  candidateContainerName: "tea-private-v5-prod-admin-24-live",
  formalData: {
    "/app/data": "C:\\data\\tea-staging\\private-accounting-v1-data",
    "/app/catalog-sync": "C:\\data\\tea-staging\\public-visibility-live",
  },
});

const AUTHORIZATION = "PROD-ADMIN-24-AUTHORIZED";

function assertAuthorized(authorization, syntheticMode) {
  if (authorization !== AUTHORIZATION && !(syntheticMode && authorization === "PROD-ADMIN-24-SYNTHETIC")) throw new Error("Explicit production authorization is required");
}

function assertSourceIdentity(source, expected) {
  if (source.Id !== expected.sourceContainerId) throw new Error("Source container ID mismatch");
  if (source.Name !== `/${expected.sourceContainerName}`) throw new Error("Source container name mismatch");
  if (source.State?.Status !== "running") throw new Error("Formal source container is not running");
  if (source.Image !== expected.sourceImageId) throw new Error("Source image mismatch");
  if (source.Config?.Image !== expected.sourceImageRef) throw new Error("Source image tag mismatch");
}

function assertExpectedMounts(source, expected, syntheticMode) {
  const seen = new Map((source.Mounts ?? []).map((mount) => [mount.Destination, normalizeWindowsPath(mount.Source)]));
  for (const [destination, expectedSource] of Object.entries(expected.formalData)) {
    if (seen.get(destination) !== normalizeWindowsPath(expectedSource)) throw new Error(`Formal mount mismatch at ${destination}`);
    if (syntheticMode && isFormalDataPath(expectedSource)) throw new Error("Synthetic mode cannot use formal data paths");
  }
}

function assertBackup(backupRoot, backupExists) {
  if (!backupExists || !fs.existsSync(backupRoot) || !fs.existsSync(`${backupRoot}\\MANIFEST.json`)) {
    throw new Error("Verified PROD-ADMIN-21 backup is missing");
  }
}

export async function preflightProductionSwitch(engine, options) {
  const expected = options.expected ?? PROD_ADMIN_24_EXPECTATIONS;
  const syntheticMode = options.syntheticMode === true;
  assertAuthorized(options.authorization, syntheticMode);
  if (!syntheticMode && expected.sourceContainerId !== PROD_ADMIN_24_EXPECTATIONS.sourceContainerId) throw new Error("Unexpected formal source expectation");
  if (syntheticMode && !expected.sourceContainerName.startsWith("tea-prod-admin-24-test-")) throw new Error("Invalid synthetic switch expectation");
  assertBackup(options.backupRoot, options.backupExists);
  const source = await engine.inspectContainer(expected.sourceContainerId);
  assertSourceIdentity(source, expected);
  assertExpectedMounts(source, expected, syntheticMode);
  const image = await engine.inspectImage(expected.candidateImageRef);
  if (image.Id !== expected.candidateImageId) throw new Error("Candidate image ID mismatch");
  try {
    await engine.inspectContainer(expected.candidateContainerName);
    throw new Error("Candidate container name already exists; refusing to replace it");
  } catch (error) {
    if (error instanceof Error && (error.message.includes("already exists") || !error.message.includes("HTTP 404"))) throw error;
  }
  const writers = [];
  for (const writerName of options.writerNames ?? []) {
    const writer = await engine.inspectContainer(writerName);
    if (writer.State?.Status !== "running") throw new Error(`Known RW writer is not running: ${writerName}`);
    assertExpectedMounts(writer, expected, syntheticMode);
    writers.push({ name: writerName, id: writer.Id });
  }
  if (!writers.some((writer) => writer.id === expected.sourceContainerId)) {
    throw new Error("Formal source container is missing from the writer freeze list");
  }
  return { expected, source, writers };
}

function productionCandidateSpec(source, expected) {
  const mounts = (source.Mounts ?? []).map((mount) => ({
    Source: mount.Source,
    Destination: mount.Destination,
    RW: mount.RW,
  }));
  return buildCandidateSpec({
    name: expected.candidateContainerName,
    image: expected.candidateImageRef,
    env: Object.fromEntries((source.Config?.Env ?? []).map((entry) => {
      const index = entry.indexOf("=");
      return [entry.slice(0, index), entry.slice(index + 1)];
    })),
    mounts,
    ports: [{ container: 3000, host: expected.hostPort ?? 8130 }],
    networkMode: source.HostConfig?.NetworkMode ?? "bridge",
    restartPolicy: source.HostConfig?.RestartPolicy?.Name ?? "unless-stopped",
    command: source.Config?.Cmd,
    entrypoint: source.Config?.Entrypoint,
    allowFormalDataMounts: true,
    user: source.Config?.User,
    workingDir: source.Config?.WorkingDir,
  });
}

export async function switchProduction(engine, options) {
  const context = await preflightProductionSwitch(engine, options);
  const sourceId = context.expected.sourceContainerId;
  const stopped = [];
  let candidateId;
  try {
    for (const writer of context.writers.filter((item) => item.id !== sourceId)) {
      await engine.stopContainer(writer.id);
      stopped.push(writer);
    }
    await engine.stopContainer(sourceId);
    stopped.push({ name: context.expected.sourceContainerName, id: sourceId });
    const spec = productionCandidateSpec(context.source, context.expected);
    const created = await engine.createContainer(spec.name, spec);
    candidateId = created.Id;
    await engine.startContainer(candidateId);
    await options.healthCheck();
    for (const writer of stopped.filter((item) => item.id !== sourceId).reverse()) await engine.startContainer(writer.id);
    return { candidateId, sourceId, spec, restoredWriters: stopped.length - 1 };
  } catch (error) {
    if (candidateId) await cleanupCandidate(engine, candidateId);
    try { await engine.startContainer(sourceId); } catch { /* report original failure */ }
    for (const writer of stopped.filter((item) => item.id !== sourceId).reverse()) {
      try { await engine.startContainer(writer.id); } catch { /* preserve original failure */ }
    }
    throw error instanceof Error ? error : new Error("Production switch failed and rollback was attempted");
  }
}
