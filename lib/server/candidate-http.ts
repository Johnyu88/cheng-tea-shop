import { Pool } from "pg";
import { createHash } from "node:crypto";
import { PostgresOrderAdapter } from "./postgres-order-adapter";

const globalCandidate = globalThis as typeof globalThis & { __cloud02CandidatePool?: Pool };
export function assertCandidateHttp() {
  if (process.env.CLOUD02_HTTP_MODE !== "candidate") throw new Error("CANDIDATE_HTTP_DISABLED");
  if (process.env.COMMERCE_BACKEND !== "postgres" || !process.env.CLOUD02_DB_URL?.startsWith("postgres")) throw new Error("CANDIDATE_POSTGRES_REQUIRED");
}
export function candidateAdapter() { assertCandidateHttp(); globalCandidate.__cloud02CandidatePool ??= new Pool({ connectionString: process.env.CLOUD02_DB_URL }); return new PostgresOrderAdapter(globalCandidate.__cloud02CandidatePool); }
export function candidatePhoneDigest(phone: string) { return createHash("sha256").update(`candidate-phone-v1:${phone}`).digest("hex"); }
export function candidateError(error: unknown) {
  const message = error instanceof Error ? error.message : "Candidate request failed";
  const status = message === "CANDIDATE_HTTP_DISABLED" ? 404 : message.includes("access") || message.includes("OTP") ? 403 : 400;
  return Response.json({ ok: false, error: message }, { status });
}
export function candidateSuccess<T>(value: T, status = 200) { return Response.json({ ok: true, value }, { status, headers: { "cache-control": "no-store" } }); }
export function verifyCandidateOtp(body: Record<string, unknown>) {
  if (typeof body.challengeId !== "string" || !body.challengeId || typeof body.code !== "string" || body.code !== process.env.CLOUD02_CANDIDATE_OTP_CODE) throw new Error("OTP verification failed");
}
