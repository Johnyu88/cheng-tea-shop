import { NextResponse } from "next/server";
import { logger, newErrorCode, safeLog } from "@/lib/server/logger";

// Every API failure gets a short error code that is shown to the user and written to the log,
// so a screenshot of the error is enough to find the matching log entry.
export const demoFailure = (error: unknown, status = 400, init?: ResponseInit) => {
  const message = error instanceof Error ? error.message : "Demo request failed";
  const errorCode = newErrorCode();
  safeLog(() => logger[status >= 500 ? "error" : "warn"]({ scope: "api-failure", errorCode, status, err: error }, `API failure ${status}: ${message}`));
  const headers = new Headers(init?.headers);
  headers.set("x-error-code", errorCode);
  return NextResponse.json({ ok: false, error: message, errorCode }, { ...init, status, headers });
};

export const demoSuccess = <T>(value: T, init?: ResponseInit) =>
  NextResponse.json({ ok: true, value }, init);
