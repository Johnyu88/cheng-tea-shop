import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { Cart } from "./types";

/** Demo-only process-local fake. It does not survive restarts or span server instances. */
export type DemoOrderStatus = "confirmed" | "packed" | "shipped" | "delivered";
export type DemoOrderLine = Pick<Cart["lines"][number], "productId" | "variantId" | "productName" | "specification" | "unitPrice" | "quantity">;
export type DemoOrderSnapshot = {
  orderId: string;
  status: DemoOrderStatus;
  paymentStatus: "pending" | "simulated-confirmed";
  lines: DemoOrderLine[];
  total: { currency: "TWD"; amount: number };
  packingPhotoId: string | null;
  events: { status: DemoOrderStatus; at: string }[];
};
export type DemoNotification = {
  id: string;
  orderId: string;
  status: DemoOrderStatus;
  audience: "customer" | "merchant";
  delivery: "simulated";
};

type StoredOrder = {
  snapshot: DemoOrderSnapshot;
  secretDigest: Buffer;
  notifications: Map<string, DemoNotification>;
};
export interface DemoOrderService {
  create(cart: Cart): { orderId: string; accessSecret: string };
  lookup(orderId: string, accessSecret: string): DemoOrderSnapshot | null;
  /** Synthetic only: no payment gateway, charge, or financial confirmation. */
  confirmSimulatedPayment(orderId: string): void;
  recordPackingPhoto(orderId: string, photoId: string): void;
  markShipped(orderId: string): void;
  markDelivered(orderId: string): void;
  queueNotification(orderId: string, status: DemoOrderStatus, audience: "customer" | "merchant"): DemoNotification;
  listNotifications(orderId: string): DemoNotification[];
}
const digest = (secret: string) => createHash("sha256").update(secret).digest();
const clone = (snapshot: DemoOrderSnapshot): DemoOrderSnapshot => ({
  ...snapshot, total: { ...snapshot.total },
  lines: snapshot.lines.map(line => ({ ...line, unitPrice: { ...line.unitPrice } })),
  events: snapshot.events.map(event => ({ ...event })),
});
const checked = (orders: Map<string, StoredOrder>, id: string): StoredOrder => {
  const order = orders.get(id);
  if (!order) throw new Error("Unknown demo order");
  return order;
};
const transition = (order: StoredOrder, from: DemoOrderStatus, to: DemoOrderStatus): void => {
  if (order.snapshot.status !== from) throw new Error("Invalid demo order transition");
  order.snapshot.status = to;
  order.snapshot.events.push({ status: to, at: new Date().toISOString() });
};

export const createDemoOrderService = (): DemoOrderService => {
  // Deliberately instance-scoped; never mount as production order storage.
  const orders = new Map<string, StoredOrder>();
  return {
    create(cart) {
      if (cart.lines.length === 0 || !Number.isSafeInteger(cart.subtotal.amount) || cart.subtotal.amount < 0) {
        throw new Error("Invalid demo cart");
      }
      const orderId = `DEMO-${randomUUID()}`;
      const accessSecret = randomBytes(32).toString("hex");
      const snapshot: DemoOrderSnapshot = {
        orderId, status: "confirmed", paymentStatus: "pending",
        lines: cart.lines.map(({ productId, variantId, productName, specification, unitPrice, quantity }) =>
          ({ productId, variantId, productName, specification, unitPrice: { ...unitPrice }, quantity })),
        total: { ...cart.subtotal }, packingPhotoId: null,
        events: [{ status: "confirmed", at: new Date().toISOString() }],
      };
      orders.set(orderId, { snapshot, secretDigest: digest(accessSecret), notifications: new Map() });
      return { orderId, accessSecret };
    },
    lookup(orderId, accessSecret) {
      if (!/^DEMO-[0-9a-f-]{36}$/.test(orderId) || !/^[0-9a-f]{64}$/.test(accessSecret)) return null;
      const order = orders.get(orderId);
      if (!order || !timingSafeEqual(order.secretDigest, digest(accessSecret))) return null;
      return clone(order.snapshot);
    },
    confirmSimulatedPayment(orderId) {
      const order = checked(orders, orderId);
      if (order.snapshot.paymentStatus !== "pending" || order.snapshot.status === "shipped" || order.snapshot.status === "delivered") {
        throw new Error("Invalid simulated payment transition");
      }
      order.snapshot.paymentStatus = "simulated-confirmed";
    },
    recordPackingPhoto(orderId, photoId) {
      // Only an opaque metadata reference; this fake accepts no image bytes or remote URLs.
      if (!/^photo-[a-zA-Z0-9_-]{1,64}$/.test(photoId)) throw new Error("Invalid demo photo reference");
      const order = checked(orders, orderId);
      if (order.snapshot.status !== "confirmed") throw new Error("Invalid demo order transition");
      transition(order, "confirmed", "packed");
      order.snapshot.packingPhotoId = photoId;
    },
    markShipped(orderId) {
      const order = checked(orders, orderId);
      if (order.snapshot.paymentStatus !== "simulated-confirmed") throw new Error("Unpaid demo order cannot ship");
      transition(order, "packed", "shipped");
    },
    markDelivered(orderId) {
      transition(checked(orders, orderId), "shipped", "delivered");
    },
    queueNotification(orderId, status, audience) {
      if (!["customer", "merchant"].includes(audience)) throw new Error("Invalid audience");
      const order = checked(orders, orderId);
      if (!order.snapshot.events.some(event => event.status === status)) {
        throw new Error("Order status has not happened");
      }
      const key = `${status}:${audience}`;
      const existing = order.notifications.get(key);
      if (existing) return { ...existing };
      const notification: DemoNotification = {
        id: randomUUID(), orderId, status, audience, delivery: "simulated",
      };
      order.notifications.set(key, notification);
      return { ...notification };
    },
    listNotifications(orderId) {
      return [...checked(orders, orderId).notifications.values()].map(item => ({ ...item }));
    },
  };
};
