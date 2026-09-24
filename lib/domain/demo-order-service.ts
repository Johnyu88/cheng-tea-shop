import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { Cart } from "./types";

/** Demo-only state machine. Default store is process-local; optional SQLite persists across restarts. */
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

export type DemoOrderRecord = {
  snapshot: DemoOrderSnapshot;
  secretDigest: string;
  notifications: DemoNotification[];
};
export type DemoOrderPersistence = {
  load(): DemoOrderRecord[];
  save(record: DemoOrderRecord): void;
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

export const createDemoOrderService = (persistence?: DemoOrderPersistence): DemoOrderService => {
  const orders = new Map<string, StoredOrder>();
  for (const record of persistence?.load() ?? []) {
    if (!/^DEMO-[0-9a-f-]{36}$/.test(record.snapshot?.orderId ?? "")) continue;
    orders.set(record.snapshot.orderId, {
      snapshot: clone(record.snapshot),
      secretDigest: /^[0-9a-f]{64}$/.test(record.secretDigest) ? Buffer.from(record.secretDigest, "hex") : Buffer.alloc(0),
      notifications: new Map(record.notifications.map(item => [`${item.status}:${item.audience}`, { ...item }])),
    });
  }
  const save = (order: StoredOrder) => persistence?.save({
    snapshot: clone(order.snapshot), secretDigest: order.secretDigest.toString("hex"),
    notifications: [...order.notifications.values()].map(item => ({ ...item })),
  });
  const mutate = (order: StoredOrder, change: () => void) => {
    const before = clone(order.snapshot);
    const notifications = new Map(order.notifications);
    try {
      change();
      save(order);
    } catch (error) {
      order.snapshot = before;
      order.notifications = notifications;
      throw error;
    }
  };
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
      const order = { snapshot, secretDigest: digest(accessSecret), notifications: new Map<string, DemoNotification>() };
      save(order);
      orders.set(orderId, order);
      return { orderId, accessSecret };
    },
    lookup(orderId, accessSecret) {
      if (!/^DEMO-[0-9a-f-]{36}$/.test(orderId) || !/^[0-9a-f]{64}$/.test(accessSecret)) return null;
      const order = orders.get(orderId);
      if (!order || order.secretDigest.length !== 32 || !timingSafeEqual(order.secretDigest, digest(accessSecret))) return null;
      return clone(order.snapshot);
    },
    confirmSimulatedPayment(orderId) {
      const order = checked(orders, orderId);
      if (order.snapshot.paymentStatus !== "pending" || order.snapshot.status === "shipped" || order.snapshot.status === "delivered") {
        throw new Error("Invalid simulated payment transition");
      }
      mutate(order, () => { order.snapshot.paymentStatus = "simulated-confirmed"; });
    },
    recordPackingPhoto(orderId, photoId) {
      // Only an opaque metadata reference; this fake accepts no image bytes or remote URLs.
      if (!/^photo-[a-zA-Z0-9_-]{1,64}$/.test(photoId)) throw new Error("Invalid demo photo reference");
      const order = checked(orders, orderId);
      if (order.snapshot.status !== "confirmed") throw new Error("Invalid demo order transition");
      mutate(order, () => {
        transition(order, "confirmed", "packed");
        order.snapshot.packingPhotoId = photoId;
      });
    },
    markShipped(orderId) {
      const order = checked(orders, orderId);
      if (order.snapshot.paymentStatus !== "simulated-confirmed") throw new Error("Unpaid demo order cannot ship");
      mutate(order, () => { transition(order, "packed", "shipped"); });
    },
    markDelivered(orderId) {
      const order = checked(orders, orderId);
      mutate(order, () => { transition(order, "shipped", "delivered"); });
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
      mutate(order, () => { order.notifications.set(key, notification); });
      return { ...notification };
    },
    listNotifications(orderId) {
      return [...checked(orders, orderId).notifications.values()].map(item => ({ ...item }));
    },
  };
};
