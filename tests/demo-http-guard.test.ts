import { afterEach, beforeEach, expect, test } from "vitest";
import { assertLocalDemoHttpRequest } from "@/lib/server/demo-http-guard";

beforeEach(() => { process.env.DEMO_COMMERCE_LOCAL = "enabled"; });
afterEach(() => { delete process.env.DEMO_COMMERCE_LOCAL; });

test("accepts a same-origin loopback JSON request only while local demo is enabled", () => {
  const request = new Request("http://127.0.0.1:3013/api/demo/otp", {
    method: "POST",
    headers: {
      host: "127.0.0.1:3013",
      origin: "http://127.0.0.1:3013",
      "content-type": "application/json",
      "sec-fetch-site": "same-origin",
    },
  });
  expect(() => assertLocalDemoHttpRequest(request, "POST", "json")).not.toThrow();

  const normalizedByFramework = new Request("http://localhost:3013/api/demo/otp", {
    method: "POST",
    headers: { host: "127.0.0.1:3013", origin: "http://127.0.0.1:3013", "content-type": "application/json" },
  });
  expect(() => assertLocalDemoHttpRequest(normalizedByFramework, "POST", "json")).not.toThrow();
  const withFrameworkHeaders = new Request("http://localhost:3013/api/demo/otp", {
    method: "POST",
    headers: { host: "127.0.0.1:3013", origin: "http://127.0.0.1:3013", "content-type": "application/json", "x-forwarded-host": "127.0.0.1:3013", "x-forwarded-proto": "http" },
  });
  expect(() => assertLocalDemoHttpRequest(withFrameworkHeaders, "POST", "json")).not.toThrow();
});

test("accepts a private LAN request only with the explicit LAN opt-in", () => {
  const request = new Request("http://172.20.10.4:3013/api/demo/otp", {
    method: "POST",
    headers: {
      host: "172.20.10.4:3013",
      origin: "http://172.20.10.4:3013",
      "content-type": "application/json",
    },
  });
  expect(() => assertLocalDemoHttpRequest(request, "POST", "json")).toThrow();
  process.env.DEMO_COMMERCE_LAN = "enabled";
  expect(() => assertLocalDemoHttpRequest(request, "POST", "json")).not.toThrow();
  const forwardedLan = new Request("http://172.20.10.4:3013/api/demo/otp", {
    method: "POST",
    headers: {
      host: "172.20.10.4:3013",
      origin: "http://172.20.10.4:3013",
      "content-type": "application/json",
      "x-forwarded-for": "172.20.10.4",
    },
  });
  expect(() => assertLocalDemoHttpRequest(forwardedLan, "POST", "json")).not.toThrow();
  delete process.env.DEMO_COMMERCE_LAN;
  expect(() => assertLocalDemoHttpRequest(request, "POST", "json")).toThrow();
});

test("rejects disabled, cross-origin, forwarded, non-loopback and wrong content type requests", () => {
  const make = (url: string, headers: Record<string, string> = {}) => new Request(url, {
    method: "POST",
    headers: {
      host: new URL(url).host,
      origin: new URL(url).origin,
      "content-type": "application/json",
      ...headers,
    },
  });
  expect(() => assertLocalDemoHttpRequest(make("http://example.test/api/demo/otp"), "POST", "json")).toThrow();
  expect(() => assertLocalDemoHttpRequest(make("http://127.0.0.1:3013/api/demo/otp", { origin: "http://evil.test" }), "POST", "json")).toThrow();
  expect(() => assertLocalDemoHttpRequest(make("http://127.0.0.1:3013/api/demo/otp", { origin: "http://localhost:3014" }), "POST", "json")).toThrow();
  expect(() => assertLocalDemoHttpRequest(make("http://127.0.0.1:3013/api/demo/otp", { "x-forwarded-for": "127.0.0.1" }), "POST", "json")).not.toThrow();
  expect(() => assertLocalDemoHttpRequest(make("http://127.0.0.1:3013/api/demo/otp", { "x-forwarded-for": "203.0.113.1" }), "POST", "json")).toThrow();
  expect(() => assertLocalDemoHttpRequest(make("http://127.0.0.1:3013/api/demo/otp", { "x-forwarded-host": "evil.test" }), "POST", "json")).toThrow();
  expect(() => assertLocalDemoHttpRequest(make("http://127.0.0.1:3013/api/demo/otp", { "content-type": "text/plain" }), "POST", "json")).toThrow();
  delete process.env.DEMO_COMMERCE_LOCAL;
  expect(() => assertLocalDemoHttpRequest(make("http://127.0.0.1:3013/api/demo/otp"), "POST", "json")).toThrow();
});
