import { describe, expect, it } from "vitest";

import {
  buildCandidateSpec,
  buildCandidateFromInspect,
  createAndHealthCheckCandidate,
  createRedactedDiff,
  normalizeWindowsPath,
  validateIsolationMounts,
  validateSourceAllowlist,
} from "../safe-deploy.mjs";

const isolationMounts = [
  {
    Source: "C:\\data\\tea-staging\\recovery\\prod-admin-23-isolation\\data",
    Destination: "/app/data",
    RW: true,
  },
];

describe("PROD-ADMIN-23 safe deployment tool", () => {
  it("normalizes Windows and Docker Desktop path spellings", () => {
    expect(normalizeWindowsPath("c:/data/tea-staging\\recovery\\x\\..\\data"))
      .toBe("c:\\data\\tea-staging\\recovery\\data");
    expect(normalizeWindowsPath("/run/desktop/mnt/host/c/data/tea-staging/x"))
      .toBe("c:\\data\\tea-staging\\x");
  });

  it("rejects mounts that point at either formal data directory", () => {
    expect(() => validateIsolationMounts([
      { Source: "C:\\data\\tea-staging\\private-accounting-v1-data", Destination: "/app/data", RW: true },
    ])).toThrow(/formal data/i);
    expect(() => validateIsolationMounts([
      { Source: "/run/desktop/mnt/host/c/data/tea-staging/public-visibility-live", Destination: "/app/catalog-sync", RW: false },
    ])).toThrow(/formal data/i);
    expect(() => validateIsolationMounts(isolationMounts)).not.toThrow();
  });

  it("requires an explicit allowlist and rejects production sources in isolation mode", () => {
    expect(() => validateSourceAllowlist("tea-private-v5-prod-admin-03-live", {
      mode: "isolation",
      allowlistedSources: ["tea-private-v5-prod-admin-03-live"],
    })).toThrow(/isolation/i);
    expect(() => validateSourceAllowlist("tea-prod-admin-23-test-source", {
      mode: "isolation",
      allowlistedSources: ["tea-prod-admin-23-test-source"],
    })).not.toThrow();
  });

  it("builds an isolated candidate spec without exposing environment values", () => {
    const secret = "synthetic-secret-never-print";
    const spec = buildCandidateSpec({
      name: "tea-prod-admin-23-test-candidate",
      image: "tea-nextjs:prod-admin-23-test",
      env: { SYNTHETIC_SECRET: secret, PORT: "3000" },
      mounts: isolationMounts,
      ports: [{ container: 3000, host: 33123 }],
      networkMode: "bridge",
      restartPolicy: "no",
    });
    const redacted = createRedactedDiff(spec);
    expect(JSON.stringify(redacted)).not.toContain(secret);
    expect(redacted.envNames).toEqual(["PORT", "SYNTHETIC_SECRET"]);
    expect(redacted.mounts).toEqual([
      { sourceClass: "data", destination: "/app/data", access: "rw" },
    ]);
    expect(spec.HostConfig.Binds).toEqual([
      "C:\\data\\tea-staging\\recovery\\prod-admin-23-isolation\\data:/app/data:rw",
    ]);
  });

  it("never copies formal mounts into an isolation candidate", () => {
    expect(() => buildCandidateFromInspect({
      sourceName: "tea-prod-admin-23-test-source",
      allowlistedSources: ["tea-prod-admin-23-test-source"],
      mode: "isolation",
      candidateName: "tea-prod-admin-23-test-candidate",
      image: "tea-nextjs:prod-admin-23-test",
      inspect: {
        Config: { Env: ["SYNTHETIC_SECRET=synthetic-value"], Cmd: ["node", "server.js"] },
        Mounts: [{ Source: "C:\\data\\tea-staging\\private-accounting-v1-data", Destination: "/app/data", RW: true }],
        HostConfig: { NetworkMode: "bridge" },
      },
      isolationMounts,
      ports: [{ container: 3000, host: 33123 }],
    })).not.toThrow();
  });

  it("stops and removes a candidate when health check fails", async () => {
    const calls: string[] = [];
    const engine = {
      async createContainer() { calls.push("create"); return { Id: "synthetic-id" }; },
      async startContainer() { calls.push("start"); },
      async stopContainer() { calls.push("stop"); },
      async removeContainer() { calls.push("remove"); },
    };
    await expect(createAndHealthCheckCandidate({
      engine,
      spec: buildCandidateSpec({
        name: "tea-prod-admin-23-test-candidate",
        image: "node:24-alpine",
        env: { SYNTHETIC_SECRET: "synthetic-value" },
        mounts: isolationMounts,
        ports: [{ container: 3000, host: 33123 }],
      }),
      healthCheck: async () => { throw new Error("synthetic health failure"); },
    })).rejects.toThrow("synthetic health failure");
    expect(calls).toEqual(["create", "start", "stop", "remove"]);
  });
});
