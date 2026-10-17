import fs from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PROD_ADMIN_24_EXPECTATIONS,
  preflightProductionSwitch,
  switchProduction,
} from "../production-switch.mjs";

const sourceId = PROD_ADMIN_24_EXPECTATIONS.sourceContainerId;
const candidateImageId = PROD_ADMIN_24_EXPECTATIONS.candidateImageId;

function inspection(name: string, status = "running") {
  return {
    Id: name === "live" ? sourceId : `${name}-id`,
    Name: name === "live" ? "/tea-private-v5-prod-admin-03-live" : `/${name}`,
    State: { Status: status },
    Image: PROD_ADMIN_24_EXPECTATIONS.sourceImageId,
    Config: { Image: "tea-nextjs:prod-admin-03-0b36c71-r1", Env: ["SYNTHETIC_SECRET=memory-only"], Cmd: ["node", "server.js"] },
    HostConfig: { NetworkMode: "bridge", RestartPolicy: { Name: "unless-stopped" } },
    Mounts: [
      { Source: "C:\\data\\tea-staging\\private-accounting-v1-data", Destination: "/app/data", RW: true },
      { Source: "C:\\data\\tea-staging\\public-visibility-live", Destination: "/app/catalog-sync", RW: true },
    ],
  };
}

function fakeEngine() {
  const calls: string[] = [];
  let candidateRunning = false;
  let candidateRemoved = false;
  return {
    calls,
    async inspectContainer(id: string) {
      calls.push(`inspect:${id}`);
      if (id === sourceId || id === "tea-private-v5-prod-admin-03-live") return inspection("live");
      if (id === PROD_ADMIN_24_EXPECTATIONS.candidateContainerName) throw new Error("Docker Engine API returned HTTP 404");
      if (id === "new-id") {
        if (candidateRemoved) throw new Error("Docker Engine API returned HTTP 404");
        if (!candidateRunning) return inspection("new-id", "exited");
        return inspection("new-id", "running");
      }
      return inspection(id, "running");
    },
    async inspectImage(id: string) {
      calls.push(`image:${id}`);
      return { Id: id === PROD_ADMIN_24_EXPECTATIONS.candidateImageRef ? candidateImageId : PROD_ADMIN_24_EXPECTATIONS.sourceImageId };
    },
    async createContainer() { calls.push("create"); return { Id: "new-id" }; },
    async startContainer(id: string) { calls.push(`start:${id}`); if (id === "new-id") candidateRunning = true; },
    async stopContainer(id: string) { calls.push(`stop:${id}`); if (id === "new-id") candidateRunning = false; },
    async removeContainer(id: string) { calls.push(`remove:${id}`); if (id === "new-id") candidateRemoved = true; },
  };
}

const options = {
  authorization: "PROD-ADMIN-24-AUTHORIZED",
  expected: PROD_ADMIN_24_EXPECTATIONS,
  backupRoot: "C:\\data\\tea-staging\\recovery\\pro15-a1524in-21-20261015-232445",
  backupExists: true,
  writerNames: ["tea-private-v5-prod-admin-03-live"],
};

describe("PROD-ADMIN-24 production switch guardrails", () => {
  // The verified backup lives on the Acer host; simulate only that path so these guardrail tests run anywhere.
  beforeEach(() => {
    const existsSync = fs.existsSync.bind(fs);
    vi.spyOn(fs, "existsSync").mockImplementation((path) => String(path).startsWith(options.backupRoot) || existsSync(path));
  });
  afterEach(() => vi.restoreAllMocks());

  it("rejects a candidate image mismatch before any mutation", async () => {
    const engine = fakeEngine();
    await expect(preflightProductionSwitch(engine, { ...options, expected: { ...options.expected, candidateImageId: "sha256:wrong" } })).rejects.toThrow(/candidate image/i);
    expect(engine.calls).not.toContain("create");
    expect(engine.calls.every((call) => !call.startsWith("stop:"))).toBe(true);
  });

  it("requires explicit production authorization", async () => {
    const engine = fakeEngine();
    await expect(preflightProductionSwitch(engine, { ...options, authorization: "" })).rejects.toThrow(/authorization/i);
    expect(engine.calls).toEqual([]);
  });

  it("restores the original container and writers when the candidate fails health", async () => {
    const engine = fakeEngine();
    await expect(switchProduction(engine, {
      ...options,
      healthCheck: async () => { throw new Error("synthetic health failure"); },
    })).rejects.toThrow("synthetic health failure");
    expect(engine.calls).toContain(`start:${sourceId}`);
    expect(engine.calls).toContain("remove:new-id");
  });
});
