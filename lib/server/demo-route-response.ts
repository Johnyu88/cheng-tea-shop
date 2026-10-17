import { NextResponse } from "next/server";
import { logger, newErrorCode, safeLog } from "@/lib/server/logger";

// Every API failure gets a short error code that is shown to the user and written to the log,
// so a screenshot of the error is enough to find the matching log entry.
// JSON parse errors quote the request body, so their text is replaced in both the response and the log.
export const demoFailure = (error: unknown, status = 400, init?: ResponseInit) => {
  const message = error instanceof SyntaxError ? "請求格式錯誤，請重新整理後再試" : error instanceof Error ? error.message : "Demo request failed";
  const errorCode = newErrorCode();
  safeLog(() => logger[status >= 500 ? "error" : "warn"]({ scope: "api-failure", errorCode, status, err: error }, `API failure ${status}: ${message}`));
  const headers = new Headers(init?.headers);
  headers.set("x-error-code", errorCode);
  return NextResponse.json({ ok: false, error: message, errorCode }, { ...init, status, headers });
};

export const demoSuccess = <T>(value: T, init?: ResponseInit) =>
  NextResponse.json({ ok: true, value }, init);
