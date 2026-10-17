import { NextResponse } from "next/server";

export const demoFailure = (error: unknown, status = 400, init?: ResponseInit) => {
  const message = error instanceof Error ? error.message : "Demo request failed";
  return NextResponse.json({ ok: false, error: message }, { ...init, status });
};

export const demoSuccess = <T>(value: T, init?: ResponseInit) =>
  NextResponse.json({ ok: true, value }, init);
