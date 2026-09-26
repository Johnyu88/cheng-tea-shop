import { NextResponse } from "next/server";

export const demoFailure = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : "Demo request failed";
  return NextResponse.json({ ok: false, error: message }, { status });
};

export const demoSuccess = <T>(value: T, init?: ResponseInit) =>
  NextResponse.json({ ok: true, value }, init);
