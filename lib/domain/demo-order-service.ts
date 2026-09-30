import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { Cart } from "./types";

/** Demo-only state machine. Default store is process-local; optional SQLite persists across restarts. */
export type DemoOrderStatus = "confirmed" | "packed" | "shipped" | "delivered";
export type DemoOrderLine = Pick<Cart["lines"][number], "productId" | "variantId" | "productName" | "specification" | "unitPrice" | "quantity">;
export type DemoOrderSnapshot = {
  orderId: string;
  orderNumber?: string;
  status: DemoOrderStatus;
  paymentMethod: "bank-transfer" | "cash" | "phone-confirmation" | "line-voice-confirmation";
  paymentStatus: "pending-manual-verification" | "manual-confirmed";
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
  allocateOrderNumber?(date: Date): string;
};
type StoredOrder = {
  snapshot: DemoOrderSnapshot;
  secretDigest: Buffer;
  notifications: Map<string, DemoNotification>;
};
export interface DemoOrderService {
  create(cart: Cart, paymentMethod?: DemoOrderSnapshot["paymentMethod"]): { orderId: string; orderNumber: string; accessSecret: string };
  lookup(orderId: string, accessSecret: string): DemoOrderSnapshot | null;
  rotateLookupSecret(orderId: string): { order: DemoOrderSnapshot; accessSecret: string };
  /** Internal merchant view; callers must enforce merchant authentication before invoking. */
  listInternalForMerchant(): DemoOrderSnapshot[];
  /** Synthetic only: no payment gateway, charge, or financial confirmation. */
  confirmManualPayment(orderId: string): void;
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

export const taiwanOrderDate = (date: Date): string => new Date(date.getTime() + 8 * 60 * 60_000).toISOString().slice(2, 10).replaceAll("-", "");

export const createDemoOrderService = (persistence?: DemoOrderPersistence): DemoOrderService => {
  const orders = new Map<string, StoredOrder>();
  const sequences = new Map<string, number>();
  const allocateNumber = (date: Date): string => {
    if (persistence?.allocateOrderNumber) return persistence.allocateOrderNumber(date);
    const day = taiwanOrderDate(date);
    const next = (sequences.get(day) ?? 0) + 1;
    sequences.set(day, next);
    return `${day}-${String(next).padStart(3, "0")}`;
  };
  const loaded = persistence?.load() ?? [];
  for (const record of loaded) {
    const number = record.snapshot?.orderNumber?.match(/^([0-9]{6})-([0-9]+)$/);
    if (number) sequences.set(number[1]!, Math.max(sequences.get(number[1]!) ?? 0, Number(number[2])));
  }
  for (const record of loaded) {
    if (!/^DEMO-[0-9a-f-]{36}$/.test(record.snapshot?.orderId ?? "")) continue;
    if (!record.snapshot.orderNumber) {
      const date = new Date(record.snapshot.events[0]?.at ?? Date.now());
      record.snapshot.orderNumber = allocateNumber(Number.isNaN(date.getTime()) ? new Date() : date);
      persistence?.save(record);
    }
    const number = record.snapshot.orderNumber.match(/^([0-9]{6})-([0-9]+)$/);
    if (number) sequences.set(number[1]!, Math.max(sequences.get(number[1]!) ?? 0, Number(number[2])));
    const legacyStatus = (record.snapshot as unknown as { paymentStatus?: string }).paymentStatus;
    const paymentStatus = legacyStatus === "simulated-confirmed" ? "manual-confirmed" : legacyStatus === "pending" ? "pending-manual-verification" : legacyStatus;
    orders.set(record.snapshot.orderId, {
      snapshot: { ...clone(record.snapshot), paymentMethod: record.snapshot.paymentMethod ?? "cash", paymentStatus: paymentStatus === "manual-confirmed" ? "manual-confirmed" : "pending-manual-verification" },
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
    const secretDigest = Buffer.from(order.secretDigest);
    const notifications = new Map(order.notifications);
    try {
      change();
      save(order);
    } catch (error) {
      order.snapshot = before;
      order.secretDigest = secretDigest;
      order.notifications = notifications;
      throw error;
    }
  };
  return {
    create(cart, paymentMethod = "cash") {
      if (cart.lines.length === 0 || !Number.isSafeInteger(cart.subtotal.amount) || cart.subtotal.amount < 0) {
        throw new Error("Invalid demo cart");
      }
      if (!["bank-transfer", "cash", "phone-confirmation", "line-voice-confirmation"].includes(paymentMethod)) {
        throw new Error("Invalid traditional payment method");
      }
      const orderId = `DEMO-${randomUUID()}`;
      const accessSecret = randomBytes(32).toString("hex");
      const orderNumber = allocateNumber(new Date());
      const snapshot: DemoOrderSnapshot = {
        orderId, orderNumber, status: "confirmed", paymentMethod, paymentStatus: "pending-manual-verification",
        lines: cart.lines.map(({ productId, variantId, productName, specification, unitPrice, quantity }) =>
          ({ productId, variantId, productName, specification, unitPrice: { ...unitPrice }, quantity })),
        total: { ...cart.subtotal }, packingPhotoId: null,
        events: [{ status: "confirmed", at: new Date().toISOString() }],
      };
      const order = { snapshot, secretDigest: digest(accessSecret), notifications: new Map<string, DemoNotification>() };
      save(order);
      orders.set(orderId, order);
      return { orderId, orderNumber, accessSecret };
    },
    lookup(orderId, accessSecret) {
      if ((!/^DEMO-[0-9a-f-]{36}$/.test(orderId) && !/^[0-9]{6}-[0-9]{3,}$/.test(orderId)) || !/^[0-9a-f]{64}$/.test(accessSecret)) return null;
      const order = orders.get(orderId) ?? [...orders.values()].find(item => item.snapshot.orderNumber === orderId);
      if (!order || order.secretDigest.length !== 32 || !timingSafeEqual(order.secretDigest, digest(accessSecret))) return null;
      return clone(order.snapshot);
    },
    rotateLookupSecret(orderId) {
      const order = checked(orders, orderId);
      const accessSecret = randomBytes(32).toString("hex");
      mutate(order, () => { order.secretDigest = digest(accessSecret); });
      return { order: clone(order.snapshot), accessSecret };
    },
    listInternalForMerchant() {
      return [...orders.values()].map(order => clone(order.snapshot)).sort((a, b) =>
        b.events[0]!.at.localeCompare(a.events[0]!.at));
    },
    confirmManualPayment(orderId) {
      const order = checked(orders, orderId);
      if (order.snapshot.paymentStatus !== "pending-manual-verification" || order.snapshot.status === "shipped" || order.snapshot.status === "delivered") {
        throw new Error("Invalid manual payment transition");
      }
      mutate(order, () => { order.snapshot.paymentStatus = "manual-confirmed"; });
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
      if (order.snapshot.paymentStatus !== "manual-confirmed") throw new Error("Unpaid demo order cannot ship");
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
