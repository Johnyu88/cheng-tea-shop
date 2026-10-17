import { randomInt } from "node:crypto";
import { acerDemoRequested } from "./demo-cloud";
import { createDemoOtpService, type DemoOtpService } from "../domain/demo-otp-service";

function assertEnabled(): void {
  if (process.release?.name !== "node" || (!acerDemoRequested() && (process.env.NODE_ENV === "production"
    || process.env.DEMO_COMMERCE_LOCAL !== "enabled"))) {
    throw new Error("Local demo OTP inbox is disabled");
  }
}

/** Keep the operator inbox out of HTTP handlers and logs; pass only otp to commerce. */
export function createLocalDemoOtpInbox(): {
  otp: DemoOtpService;
  takeForOperator(phone: string, challengeId: string): string | null;
} {
  assertEnabled();
  const codes = new Map<string, { phone: string; code: string }>();
  let generated: string | null = null;
  const underlying = createDemoOtpService({
    codeFactory: () => {
      generated = randomInt(0, 1_000_000).toString().padStart(6, "0");
      return generated;
    },
  });
  const otp: DemoOtpService = {
    issue(phone) {
      assertEnabled();
      generated = null;
      const receipt = underlying.issue(phone);
      for (const [id, entry] of codes) if (entry.phone === phone) codes.delete(id);
      if (!generated) throw new Error("Demo OTP generation failed");
      codes.set(receipt.challengeId, { phone, code: generated });
      generated = null;
      return receipt;
    },
    verify(phone, challengeId, code) {
      assertEnabled();
      const valid = underlying.verify(phone, challengeId, code);
      if (valid) codes.delete(challengeId);
      return valid;
    },
  };
  return {
    otp,
    takeForOperator(phone, challengeId) {
      assertEnabled();
      const entry = codes.get(challengeId);
      if (!entry || entry.phone !== phone) return null;
      codes.delete(challengeId);
      return entry.code;
    },
  };
}
