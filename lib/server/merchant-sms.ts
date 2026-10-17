/** Twilio Messages API: https://www.twilio.com/docs/messaging/api/message-resource */
const failure = "簡訊傳送失敗，請稍後重試。";
function configuration(): { accountSid: string; authToken: string; serviceSid: string } | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";
  const serviceSid = process.env.TWILIO_MESSAGING_SERVICE_SID ?? "";
  if (!/^AC[0-9a-fA-F]{32}$/.test(accountSid) || !/^[0-9a-fA-F]{32}$/.test(authToken)
    || !/^MG[0-9a-fA-F]{32}$/.test(serviceSid)) return null;
  return { accountSid, authToken, serviceSid };
}
export function merchantSmsConfigured(): boolean { return configuration() !== null; }
/** No configurable URL, redirects, automatic retries, response-body logging, or browser-visible OTP. */
export async function sendMerchantSms(phone: string, code: string): Promise<void> {
  const config = configuration();
  if (!config || !/^09\d{8}$/.test(phone) || !/^\d{6}$/.test(code)) throw new Error(failure);
  const form = new URLSearchParams({
    To: "+886" + phone.slice(1),
    MessagingServiceSid: config.serviceSid,
    Body: "陳老師茶行登入驗證碼：" + code + "。五分鐘內有效，請勿提供他人。",
  });
  try {
    const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + config.accountSid + "/Messages.json", {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(10000),
      headers: { "content-type": "application/x-www-form-urlencoded",
        authorization: "Basic " + Buffer.from(config.accountSid + ":" + config.authToken).toString("base64") },
      body: form.toString(),
    });
    // API acceptance is not proof of carrier delivery. Never retain/log Twilio's echoed message body.
    if (response.body) await response.body.cancel();
    if (response.status !== 201) throw new Error(failure);
  } catch { throw new Error(failure); }
}
