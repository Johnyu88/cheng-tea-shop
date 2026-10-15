import type { Cart, CheckoutDraft } from "@/lib/domain";
import type { DemoOrderSnapshot } from "@/lib/domain/demo-order-service";
import type { DemoOutboxEntry } from "@/lib/server/demo-notification-outbox";
import type { DemoMobilePushPreview } from "@/lib/domain/demo-notification-preview";
import { reportAdminProductsApi, reportAdminProductsApiError } from "@/features/publishing/diagnostics/admin-products-diagnostic";

type Envelope<T> = { ok: true; value: T } | { ok: false; error: string };
export class DemoApiError extends Error {
  constructor(message: string, readonly status = 0, readonly retryAfterSeconds = 0) { super(message); this.name = "DemoApiError"; }
}
async function request<T>(url: string, init: RequestInit, bounded = false): Promise<T> {
  const diagnosticName = url === "/api/demo/admin/session" ? "session" : url.startsWith("/api/demo/catalog") ? "catalog" : undefined;
  const diagnosticStarted = diagnosticName ? performance.now() : 0;
  const controller = new AbortController();
  const timer = bounded ? setTimeout(() => controller.abort(), 20000) : undefined;
  try {
    const response = await fetch(url, { credentials: "same-origin", ...init, signal: controller.signal });
    if (diagnosticName) reportAdminProductsApi(diagnosticName, { status: response.status, contentType: response.headers.get("content-type") ?? "", durationMs: Math.round(performance.now() - diagnosticStarted) });
    const rawRetry = response.headers?.get("Retry-After") ?? "";
    const retry = Math.max(0, Math.ceil(Number(rawRetry) || (Date.parse(rawRetry) - Date.now()) / 1000 || 0));
    const payload = await response.json().catch(() => null) as Envelope<T> | null;
    if (!response.ok || !payload || payload.ok !== true) {
      const message = response.status === 429 ? "嘗試次數過多，請稍後再試。"
        : response.status === 401 ? "測試站登入已失效，請重新整理頁面後再試。"
        : payload && payload.ok === false && typeof payload.error === "string" && payload.error.trim() ? payload.error : "服務暫時無法回應，請稍後再試。";
      throw new DemoApiError(message, response.status, retry);
    }
    return payload.value;
  } catch (error) {
    if (diagnosticName) reportAdminProductsApiError(diagnosticName, { errorType: error instanceof Error ? error.name : "UnknownError", durationMs: Math.round(performance.now() - diagnosticStarted) });
    if (error instanceof DemoApiError) throw error;
    throw new DemoApiError(controller.signal.aborted ? "連線逾時，取得或查詢未完成，請稍後重試。" : "暫時無法連線，請確認網路後重試。");
  } finally { clearTimeout(timer); }
}
const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export type DemoChallenge = { challengeId: string; expiresAt: string | number; demoCode: string; resendAvailableAt?: number; usable?: boolean };
export type DemoPlacedOrder = { orderId: string; orderNumber?: string; accessSecret: string; total: Cart["subtotal"]; notificationStatus: string };
export type DemoLookup = { order: DemoOrderSnapshot; notifications: DemoOutboxEntry[]; mobilePushPreview: DemoMobilePushPreview };
export type DemoAdminOrder = { order: DemoOrderSnapshot; notifications: DemoOutboxEntry[] };
export type DemoLookupSecretRotation = { order: DemoOrderSnapshot; accessSecret: string };

export type DemoMerchantStatus = { provider?: "password" | "sms"; state: "ready" | "binding-pending" | "sms-pending" | "password-pending"; simulated: boolean; authenticated?: boolean; passkey?: { enabled: boolean; registered: boolean } };
export type DemoMerchantChallenge = { challengeId: string; expiresInSeconds: number; resendAfterSeconds: number; simulated: boolean };

export const demoApi = {
  merchantPasskeyEnroll: (password: string) => request<{ authenticated: true }>("/api/demo/admin/passkey/enroll", json({ password })),
  merchantLogout: () => request<{ authenticated: false }>("/api/demo/admin/session", { method: "DELETE" }),
  merchantPasswordLogin: (password: string) => request<{ authenticated: true }>("/api/demo/admin/session", json({ password })),
  merchantStatus: () => request<DemoMerchantStatus>("/api/demo/admin/session", { method: "GET" }),
  merchantIssueOtp: (phone: string) => request<DemoMerchantChallenge>("/api/demo/admin/otp", json({ phone })),
  merchantPhoneLogin: (input: { phone: string; challengeId: string; code: string }) => request<{ authenticated: true }>("/api/demo/admin/session", json(input)),
  issueOtp: (phone: string, purpose: "checkout" | "lookup") => request<DemoChallenge>("/api/demo/otp", json({ phone, purpose })),
  placeOrder: (input: { phone: string; challengeId: string; code: string; draft: CheckoutDraft; lines: { productId: string; variantId: string; quantity: number }[] }) => request<DemoPlacedOrder>("/api/demo/orders", json(input)),
  issueLookupOtp: (input: { orderId: string; customerName: string; phoneLastThree: string }) => request<DemoChallenge>("/api/demo/otp", json({ purpose: "lookup", ...input }), true),
  lookup: (input: { orderId: string; accessSecret?: string; phone?: string; phoneLastThree: string; customerName?: string; challengeId: string; code: string }) => request<DemoLookup>("/api/demo/orders/lookup", json(input), true),
  merchantLogin: (credential: string) => request<{ authenticated: true }>("/api/demo/admin/session", json({ credential })),
  adminOrders: () => request<DemoAdminOrder[]>("/api/demo/admin/orders", { method: "GET" }),
  adminAction: <T = unknown>(orderId: string, action: string, detail: Record<string, unknown> = {}) => request<T>(`/api/demo/admin/orders/${encodeURIComponent(orderId)}`, json({ action, ...detail })),
  packingPhoto: (orderId: string, photo: File) => {
    const body = new FormData(); body.append("photo", photo);
    return request<unknown>(`/api/demo/admin/orders/${encodeURIComponent(orderId)}/packing-photo`, { method: "POST", body });
  },
};
