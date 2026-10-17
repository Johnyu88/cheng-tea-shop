import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { merchantSmsConfigured, sendMerchantSms } from "@/lib/server/merchant-sms";
const names = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_MESSAGING_SERVICE_SID"];
beforeEach(() => {
  process.env.TWILIO_ACCOUNT_SID = "AC" + "a".repeat(32);
  process.env.TWILIO_AUTH_TOKEN = "b".repeat(32);
  process.env.TWILIO_MESSAGING_SERVICE_SID = "MG" + "c".repeat(32);
});
afterEach(() => { for (const name of names) delete process.env[name]; vi.restoreAllMocks(); });
test("configured Twilio adapter sends E164 phone to fixed HTTPS API with form encoding", async () => {
  let capturedUrl = ""; let capturedInit: RequestInit = {};
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
    capturedUrl = String(url); capturedInit = init!;
    return new Response(null, { status: 201 });
  });
  expect(merchantSmsConfigured()).toBe(true);
  await sendMerchantSms("0912000000", "001234");
  expect(capturedUrl).toBe("https://api.twilio.com/2010-04-01/Accounts/AC" + "a".repeat(32) + "/Messages.json");
  expect(capturedInit.method).toBe("POST");
  expect(capturedInit.redirect).toBe("error");
  const form = new URLSearchParams(String(capturedInit.body));
  expect(form.get("To")).toBe("+886912000000");
  expect(form.get("Body")).toContain("001234");
  expect(form.get("MessagingServiceSid")).toBe(process.env.TWILIO_MESSAGING_SERVICE_SID);
  expect(capturedInit.headers).toEqual(expect.objectContaining({ "content-type": "application/x-www-form-urlencoded" }));
  expect(capturedInit.signal).toBeInstanceOf(AbortSignal);
});
test("malformed config and destination fail closed before any HTTP request", async () => {
  const http = vi.spyOn(globalThis, "fetch");
  process.env.TWILIO_ACCOUNT_SID = "../evil";
  expect(merchantSmsConfigured()).toBe(false);
  await expect(sendMerchantSms("0912000000", "001234")).rejects.toThrow("簡訊傳送失敗");
  process.env.TWILIO_ACCOUNT_SID = "AC" + "a".repeat(32);
  await expect(sendMerchantSms("+15551234567", "001234")).rejects.toThrow("簡訊傳送失敗");
  await expect(sendMerchantSms("0912000000", "0000000")).rejects.toThrow("簡訊傳送失敗");
  expect(http).not.toHaveBeenCalled();
});
test("provider and network failures never expose provider response, phone or code", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("0912000000 001234 credentials", { status: 401 }));
  await expect(sendMerchantSms("0912000000", "001234")).rejects.toThrow(/^簡訊傳送失敗，請稍後重試。$/);
  vi.mocked(fetch).mockRejectedValue(new Error("001234 0912000000 connection detail"));
  await expect(sendMerchantSms("0912000000", "001234")).rejects.toThrow(/^簡訊傳送失敗，請稍後重試。$/);
});
