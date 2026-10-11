import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

describe("untrusted glob pattern nesting limit", () => {
  it("rejects excessive nesting before recursive pattern walkers can exhaust the stack", () => {
    const rootRequire = createRequire(import.meta.url);
    const configRequire = createRequire(rootRequire.resolve("eslint-config-next"));
    const pluginRequire = createRequire(configRequire.resolve("@next/eslint-plugin-next"));
    const fastGlobRequire = createRequire(pluginRequire.resolve("fast-glob"));
    const micromatchRequire = createRequire(fastGlobRequire.resolve("micromatch"));
    const bracesRequire = createRequire(micromatchRequire.resolve("braces"));
    const braces = bracesRequire("./");
    const pattern = "{".repeat(120) + "x" + "}".repeat(120);
    expect(() => braces(pattern)).toThrow(/nesting depth/i);
  });
});
