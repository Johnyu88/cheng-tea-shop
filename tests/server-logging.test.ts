import { afterEach, expect, it, vi } from "vitest";
import { createLogger, logger, newErrorCode } from "@/lib/server/logger";
import { demoFailure } from "@/lib/server/demo-route-response";
import { withErrorCode } from "@/lib/domain/error-code";
import { POST as sessionPost } from "@/app/api/demo/admin/session/route";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

const capture = () => {
  const lines: Record<string, unknown>[] = [];
  return { lines, destination: { write: (line: string) => { lines.push(JSON.parse(line) as Record<string, unknown>); } } };
};

it("writes Cloud Logging severity and message fields", () => {
  const { lines, destination } = capture();
  const log = createLogger({ level: "info", destination });
  log.warn({ scope: "test" }, "Something happened");
  log.error({ scope: "test" }, "Something broke");
  expect(lines).toEqual([
    expect.objectContaining({ severity: "WARNING", message: "Something happened", scope: "test", service: expect.any(String), time: expect.any(String) }),
    expect.objectContaining({ severity: "ERROR", message: "Something broke" }),
  ]);
});

it("redacts credentials and contact data even when they are passed by mistake", () => {
  const { lines, destination } = capture();
  createLogger({ level: "info", destination }).info({ password: "pw-secret-1", body: { phone: "0912345678", credential: "cred-2" }, headers: { cookie: "sid=abc" } }, "careless");
  const text = JSON.stringify(lines);
  for (const leaked of ["pw-secret-1", "0912345678", "cred-2", "sid=abc"]) expect(text).not.toContain(leaked);
  expect(text).toContain("[REDACTED]");
});

it("never logs request body text quoted by JSON parse errors", () => {
  const { lines, destination } = capture();
  let parseError: unknown;
  try { JSON.parse('{"password":"typed-secret-123"'); } catch (error) { parseError = error; }
  createLogger({ level: "info", destination }).warn({ err: new Error("登入失敗", { cause: parseError }) }, "rejected");
  const text = JSON.stringify(lines);
  expect(text).not.toContain("typed-secret-123");
  expect(text).toContain("Invalid JSON input (content not logged)");
  expect(text).toContain("登入失敗");
});

it("keeps request body text quoted by a JSON parse error out of the response and the log", async () => {
  const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
  let parseError: unknown;
  try { JSON.parse('{"name":王小明,"phone":"0912345678"}'); } catch (error) { parseError = error; }
  const response = demoFailure(parseError);
  const body = await response.json() as { error: string };
  expect(body.error).toBe("請求格式錯誤，請重新整理後再試");
  const [fields, message] = warn.mock.calls[0] as unknown as [Record<string, unknown>, string];
  expect(message).toBe("API failure 400: 請求格式錯誤，請重新整理後再試");
  expect(fields.err).toBe(parseError); // the err serializer scrubs it; see the test above
  expect(JSON.stringify(body) + message).not.toMatch(/王小明|0912345678/);
});

it("creates short error codes without look-alike characters", () => {
  for (let index = 0; index < 200; index++) expect(newErrorCode()).toMatch(/^[2-9A-HJKMNP-Z]{6}$/);
});

it("returns the same error code to the browser and to the log, with the original cause", async () => {
  const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
  const response = demoFailure(new Error("登入失敗", { cause: new Error("Invalid login") }), 403, { headers: { "cache-control": "no-store" } });
  const body = await response.json() as { ok: boolean; error: string; errorCode: string };
  expect(response.status).toBe(403);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(body).toEqual({ ok: false, error: "登入失敗", errorCode: expect.stringMatching(/^[2-9A-Z]{6}$/) });
  expect(response.headers.get("x-error-code")).toBe(body.errorCode);
  const [fields] = warn.mock.calls[0] as unknown as [{ errorCode: string; status: number; err: Error }];
  expect(fields).toMatchObject({ scope: "api-failure", errorCode: body.errorCode, status: 403 });
  expect((fields.err.cause as Error).message).toBe("Invalid login");
});

it("logs server-side failures at error level", () => {
  const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
  demoFailure(new Error("同步失敗"), 503);
  expect(error).toHaveBeenCalledWith(expect.objectContaining({ scope: "api-failure", status: 503 }), expect.any(String));
});

it("logs a rejected merchant login without the submitted password", async () => {
  const warn = vi.spyOn(logger, "warn").mockImplementation(() => undefined);
  const response = await sessionPost(new Request("http://127.0.0.1:3999/api/demo/admin/session", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: "typed-password-xyz" }),
  }));
  expect(response.status).toBe(403);
  const logged = JSON.stringify(warn.mock.calls);
  expect(logged).toContain("login-rejected");
  expect(logged).not.toContain("typed-password-xyz");
});

it("appends a valid error code to the message shown to the user", () => {
  expect(withErrorCode("商品更新失敗", { ok: false, errorCode: "K7F2QM" })).toBe("商品更新失敗（錯誤代碼：K7F2QM）");
  expect(withErrorCode("商品更新失敗", { ok: false })).toBe("商品更新失敗");
  expect(withErrorCode("商品更新失敗", { ok: false, errorCode: "<script>" })).toBe("商品更新失敗");
});
