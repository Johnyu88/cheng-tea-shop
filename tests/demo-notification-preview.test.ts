import { expect, test } from "vitest";
import { createDemoMobilePushPreview } from "@/lib/domain/demo-notification-preview";

test("builds an explicit preview-only mobile notification contract", () => {
  expect(createDemoMobilePushPreview("DEMO-123", "shipped")).toEqual({
    channel: "simulated-mobile-push",
    state: "preview-only",
    title: "茶品訂單已出貨",
    body: "示範訂單 DEMO-123 已由店家人工確認出貨。",
  });
});
