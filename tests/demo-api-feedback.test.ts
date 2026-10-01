import { afterEach, expect, it, vi } from "vitest";
import { demoApi, DemoApiError } from "@/features/demo/demo-api";
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const identity = { orderId: "261002-001", customerName: "手機查單", phoneLastThree: "000" };
it("reports Retry-After for a non-JSON rate-limit response", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("busy", { status: 429, headers: { "Retry-After": "87" } })));
  await expect(demoApi.issueLookupOtp(identity)).rejects.toMatchObject({ status: 429, retryAfterSeconds: 87, message: "嘗試次數過多，請稍後再試。" });
});
it("reports malformed envelopes with a meaningful service error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
  await expect(demoApi.issueLookupOtp(identity)).rejects.toThrow("服務暫時無法回應");
});
it("reports network failure", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  await expect(demoApi.issueLookupOtp(identity)).rejects.toThrow("暫時無法連線");
});
it("bounds lookup waiting without aborting unrelated merchant writes", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn((_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  })));
  const outcome = demoApi.issueLookupOtp(identity).catch(error => error);
  await vi.advanceTimersByTimeAsync(20000);
  expect(await outcome).toBeInstanceOf(DemoApiError);
  expect((await outcome).message).toContain("連線逾時");
  void demoApi.adminAction("test", "confirm-payment");
  expect(vi.getTimerCount()).toBe(0);
});
