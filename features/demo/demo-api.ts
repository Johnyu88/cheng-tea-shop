import type { Cart, CheckoutDraft } from "@/lib/domain";
import type { DemoOrderSnapshot } from "@/lib/domain/demo-order-service";
import type { DemoOutboxEntry } from "@/lib/server/demo-notification-outbox";
import type { DemoMobilePushPreview } from "@/lib/domain/demo-notification-preview";

type Envelope<T> = { ok: true; value: T } | { ok: false; error: string };
async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", ...init });
  const payload = await response.json() as Envelope<T>;
  if (!response.ok || !payload.ok) throw new Error(payload.ok ? "示範操作失敗" : payload.error);
  return payload.value;
}
const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export type DemoChallenge = { challengeId: string; expiresAt: string; demoCode: string };
export type DemoPlacedOrder = { orderId: string; accessSecret: string; total: Cart["subtotal"]; notificationStatus: string };
export type DemoLookup = { order: DemoOrderSnapshot; notifications: DemoOutboxEntry[]; mobilePushPreview: DemoMobilePushPreview };
export type DemoAdminOrder = { order: DemoOrderSnapshot; notifications: DemoOutboxEntry[] };

export const demoApi = {
  issueOtp: (phone: string, purpose: "checkout" | "lookup") => request<DemoChallenge>("/api/demo/otp", json({ phone, purpose })),
  placeOrder: (input: { phone: string; challengeId: string; code: string; draft: CheckoutDraft; lines: { productId: string; variantId: string; quantity: number }[] }) => request<DemoPlacedOrder>("/api/demo/orders", json(input)),
  lookup: (input: { orderId: string; accessSecret: string; phone: string; phoneLastThree: string; challengeId: string; code: string }) => request<DemoLookup>("/api/demo/orders/lookup", json(input)),
  merchantLogin: (credential: string) => request<{ authenticated: true }>("/api/demo/admin/session", json({ credential })),
  adminOrders: () => request<DemoAdminOrder[]>("/api/demo/admin/orders", { method: "GET" }),
  adminAction: (orderId: string, action: string, detail: Record<string, unknown> = {}) => request<unknown>(`/api/demo/admin/orders/${encodeURIComponent(orderId)}`, json({ action, ...detail })),
  packingPhoto: (orderId: string, photo: File) => {
    const body = new FormData(); body.append("photo", photo);
    return request<unknown>(`/api/demo/admin/orders/${encodeURIComponent(orderId)}/packing-photo`, { method: "POST", body });
  },
};
