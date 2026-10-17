import type { DemoOrderService, DemoOrderSnapshot, DemoOrderStatus } from "../domain/demo-order-service";
import { verifyDemoMerchantCookie } from "./demo-access";
import { createDemoPackingPhotoStore } from "./demo-packing-photo";
import type { DemoOutboxEntry } from "./demo-notification-outbox";

type Outbox = {
  enqueue(orderId: string, status: DemoOrderStatus, audience: "customer" | "merchant"): DemoOutboxEntry;
};
type Options = { orders: DemoOrderService; outbox: Outbox; privatePhotoDirectory: string };
type ActionResult = { order: DemoOrderSnapshot; notifications: DemoOutboxEntry[] };
type LookupSecretRotation = { order: DemoOrderSnapshot; accessSecret: string };

export class DemoMerchantNotificationError extends Error {
  constructor(readonly orderId: string, readonly status: DemoOrderStatus) {
    super("Demo order changed, but notification enqueue failed; retry reconciliation");
    this.name = "DemoMerchantNotificationError";
  }
}

/** Server-only local demo operations. The caller must keep this off public routes. */
export function createDemoMerchantWorkflow({ orders, outbox, privatePhotoDirectory }: Options) {
  const authorize = (cookieHeader: string | null) => {
    if (!verifyDemoMerchantCookie(cookieHeader)) throw new Error("Demo merchant access denied");
  };
  const find = (cookieHeader: string | null, orderId: string): DemoOrderSnapshot => {
    authorize(cookieHeader);
    const order = orders.listInternalForMerchant().find(item => item.orderId === orderId);
    if (!order) throw new Error("Demo order access denied");
    return order;
  };
  const photos = createDemoPackingPhotoStore<string | null>({
    privateDirectory: privatePhotoDirectory,
    authorize: (cookie, orderId) => {
      try { find(cookie, orderId); return true; } catch { return false; }
    },
    orderExists: orderId => orders.listInternalForMerchant().some(item => item.orderId === orderId),
    recordPhoto: (orderId, photoId) => orders.recordPackingPhoto(orderId, photoId),
    isAttachedPhoto: (orderId, photoId) =>
      orders.listInternalForMerchant().some(item => item.orderId === orderId && item.packingPhotoId === photoId),
  });
  const notify = (orderId: string, status: DemoOrderStatus): ActionResult => {
    const order = orders.listInternalForMerchant().find(item => item.orderId === orderId);
    if (!order) throw new Error("Demo order access denied");
    try {
      return { order, notifications: [
        outbox.enqueue(orderId, status, "customer"),
        outbox.enqueue(orderId, status, "merchant"),
      ] };
    } catch {
      throw new DemoMerchantNotificationError(orderId, status);
    }
  };
  return {
    listOrders(cookieHeader: string | null): DemoOrderSnapshot[] {
      authorize(cookieHeader);
      return orders.listInternalForMerchant();
    },
    rotateLookupSecret(cookieHeader: string | null, orderId: string, confirmed: boolean): LookupSecretRotation {
      find(cookieHeader, orderId);
      if (confirmed !== true) throw new Error("Merchant identity confirmation required");
      return orders.rotateLookupSecret(orderId);
    },
    confirmManualPayment(cookieHeader: string | null, orderId: string, reason = "Manual payment confirmed"): DemoOrderSnapshot {
      find(cookieHeader, orderId);
      orders.confirmManualPayment(orderId, { actor: "authenticated-merchant", reason });
      return find(cookieHeader, orderId);
    },
    revokeManualPayment(cookieHeader: string | null, orderId: string, reason: string): DemoOrderSnapshot {
      find(cookieHeader, orderId);
      orders.revokeManualPayment(orderId, { actor: "authenticated-merchant", reason });
      return find(cookieHeader, orderId);
    },
    reopenPacking(cookieHeader: string | null, orderId: string, reason: string): DemoOrderSnapshot {
      find(cookieHeader, orderId);
      orders.reopenPacking(orderId, { actor: "authenticated-merchant", reason });
      return find(cookieHeader, orderId);
    },
    recordShippingIssue(cookieHeader: string | null, orderId: string, action: "shipping-exception" | "intercept-requested" | "shipping-correction", reason: string): DemoOrderSnapshot {
      find(cookieHeader, orderId);
      orders.recordShippingIssue(orderId, action, { actor: "authenticated-merchant", reason });
      return find(cookieHeader, orderId);
    },
    async uploadPackingPhoto(cookieHeader: string | null, orderId: string,
      mimeType: string, bytes: Buffer): Promise<ActionResult> {
      find(cookieHeader, orderId);
      const photoId = await photos.save({ merchant: cookieHeader, orderId, mimeType, bytes });
      const result = notify(orderId, "packed");
      if (result.order.packingPhotoId !== photoId) throw new Error("Demo photo attachment mismatch");
      return result;
    },
    async readPackingPhoto(cookieHeader: string | null, orderId: string, photoId: string) {
      const order = find(cookieHeader, orderId);
      if (order.packingPhotoId !== photoId) throw new Error("Packing photo access denied");
      return photos.read({ merchant: cookieHeader, orderId, photoId });
    },
    markShipped(cookieHeader: string | null, orderId: string): ActionResult {
      find(cookieHeader, orderId);
      orders.markShipped(orderId);
      return notify(orderId, "shipped");
    },
    markDelivered(cookieHeader: string | null, orderId: string): ActionResult {
      find(cookieHeader, orderId);
      orders.markDelivered(orderId);
      return notify(orderId, "delivered");
    },
    reconcileNotifications(cookieHeader: string | null, orderId: string,
      status: DemoOrderStatus): ActionResult {
      const order = find(cookieHeader, orderId);
      if (!order.events.some(event => event.status === status)) {
        throw new Error("Order status has not happened");
      }
      return notify(orderId, status);
    },
  };
}
