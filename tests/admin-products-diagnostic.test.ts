import { afterEach, describe, expect, test, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  reportAdminProductsApi,
  reportAdminProductsReactMounted,
} from "@/features/publishing/diagnostics/admin-products-diagnostic";

afterEach(() => {
  delete (globalThis as { __teaAdminDiagnostics?: unknown }).__teaAdminDiagnostics;
  vi.restoreAllMocks();
});

describe("admin products diagnostic bridge", () => {
  test("reports only safe API metadata when the diagnostic bridge is installed", () => {
    const record = vi.fn();
    (globalThis as { __teaAdminDiagnostics?: unknown }).__teaAdminDiagnostics = { recordApi: record };

    reportAdminProductsApi("catalog", { status: 200, contentType: "application/json", durationMs: 12 });

    expect(record).toHaveBeenCalledWith("catalog", { status: 200, contentType: "application/json", durationMs: 12 });
    expect(JSON.stringify(record.mock.calls)).not.toContain("product");
  });

  test("does nothing when diagnostics are not enabled", () => {
    expect(() => reportAdminProductsReactMounted()).not.toThrow();
  });

  test("starts from static HTML and records safe client diagnostics without response bodies", () => {
    history.pushState({}, "", "/admin/products?diagnostics=1");
    document.body.innerHTML = '<section id="tea-admin-diagnostics"><ol id="tea-admin-diagnostics-events"></ol></section>';
    const source = readFileSync(resolve("public/diagnostics/admin-products.js"), "utf8");
    new Function("window", "document", source)(window, document);

    const bridge = (globalThis as { __teaAdminDiagnostics?: { recordApi: Function } }).__teaAdminDiagnostics;
    expect(document.body.textContent).toContain("JS-STARTED");
    expect(bridge).toBeDefined();
    bridge?.recordApi("catalog", { status: 200, contentType: "application/json", durationMs: 9 });
    expect(document.body.textContent).toContain("CATALOG-200");
    expect(document.body.textContent).not.toContain("items");
  });
});
