import { createHash, randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";

export type PostgresOrderLine = { productId: string; variantId: string; quantity: number };
export type PostgresOrderRequest = {
  idempotencyKey: string; orderNumber: string; customerName: string; phoneDigest: string;
  paymentMethod: "bank_transfer" | "cash" | "phone_confirmation" | "line_voice_confirmation";
  lines: PostgresOrderLine[]; shippingAmount?: number; expiresAt?: Date;
};
export type PostgresOrderResult = { orderId: string; orderNumber: string; status: string; totalAmount: number };

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const resourceId = (scope: string, key: string) => createHash("md5").update(`${scope}:${key}`).digest("hex").replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
const requireProductionPostgres = () => {
  if (process.env.COMMERCE_BACKEND !== "postgres") throw new Error("PostgreSQL adapter is opt-in");
  if (!process.env.CLOUD02_DB_URL || !/^postgres(ql)?:\/\//.test(process.env.CLOUD02_DB_URL)) throw new Error("PostgreSQL configuration is invalid");
};

export class PostgresOrderAdapter {
  constructor(private readonly pool: Pool) {}
  static fromEnvironment(pool: Pool) { requireProductionPostgres(); return new PostgresOrderAdapter(pool); }
  private async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try { await client.query("BEGIN"); const result = await fn(client); await client.query("COMMIT"); return result; }
    catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  }
  async createOrder(request: PostgresOrderRequest): Promise<PostgresOrderResult> {
    return this.transaction(async client => {
      const orderId = resourceId("order", request.idempotencyKey);
      const requestHash = hash(request);
      const claim = await client.query("SELECT * FROM claim_cloud02_idempotency($1,$2,$3,201,NULL,'order',$4)", ["order-create", request.idempotencyKey, requestHash, orderId]);
      if (claim.rows[0]?.replayed) return claim.rows[0].response_body as PostgresOrderResult;
      let subtotal = 0;
      const lines: Array<{ input: PostgresOrderLine; name: string; specification: string; price: number }> = [];
      for (const line of request.lines) {
        const found = await client.query("SELECT p.name, v.specification, v.price_amount FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.id=$1 AND p.id=$2 AND p.publication_status='published' FOR UPDATE", [line.variantId, line.productId]);
        if (found.rowCount !== 1 || !Number.isSafeInteger(line.quantity) || line.quantity < 1) throw new Error("PRODUCT_UNAVAILABLE");
        const row = found.rows[0] as { name: string; specification: string; price_amount: number };
        subtotal += row.price_amount * line.quantity; lines.push({ input: line, name: row.name, specification: row.specification, price: row.price_amount });
      }
      const shipping = request.shippingAmount ?? 0; const total = subtotal + shipping;
      await client.query("INSERT INTO orders(id,order_number,customer_name,phone_digest,delivery_method,payment_method,subtotal_amount,shipping_amount,total_amount,lookup_digest) VALUES($1,$2,$3,$4,'store_pickup',$5,$6,$7,$8,$4)", [orderId, request.orderNumber, request.customerName, request.phoneDigest, request.paymentMethod, subtotal, shipping, total]);
      for (const line of lines) {
        await client.query("INSERT INTO order_items(id,order_id,product_id,variant_id,product_name_snapshot,specification_snapshot,unit_price_amount,quantity,line_total_amount) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)", [randomUUID(), orderId, line.input.productId, line.input.variantId, line.name, line.specification, line.price, line.input.quantity, line.price * line.input.quantity]);
        await client.query("SELECT reserve_cloud02_inventory($1,$2,$3,$4)", [line.input.variantId, orderId, line.input.quantity, randomUUID()]);
      }
      await client.query("INSERT INTO payments(id,order_id,method,amount) VALUES($1,$2,$3,$4)", [randomUUID(), orderId, request.paymentMethod, total]);
      const result = { orderId, orderNumber: request.orderNumber, status: "confirmed", totalAmount: total };
      await client.query("UPDATE cloud02_idempotency_keys SET response_body=$3,response_code=201 WHERE scope='order-create' AND key=$1 AND request_hash=$2", [request.idempotencyKey, requestHash, JSON.stringify(result)]);
      return result;
    });
  }
  async confirmPayment(orderId: string, idempotencyKey: string, actorId: string): Promise<PostgresOrderResult> {
    return this.transaction(async client => {
      const requestHash = hash({ orderId, actorId, action: "confirm-payment" }); const eventId = resourceId("payment", idempotencyKey);
      const claim = await client.query("SELECT * FROM claim_cloud02_idempotency($1,$2,$3,200,NULL,'payment_event',$4)", ["payment-confirm", idempotencyKey, requestHash, eventId]);
      if (claim.rows[0]?.replayed) return claim.rows[0].response_body as PostgresOrderResult;
      const order = await client.query("SELECT total_amount,order_number FROM orders WHERE id=$1 FOR UPDATE", [orderId]);
      if (order.rowCount !== 1) throw new Error("ORDER_NOT_FOUND");
      await client.query("UPDATE payments SET status='confirmed',confirmed_by=$2,confirmed_at=now(),updated_at=now() WHERE order_id=$1 AND amount=$3", [orderId, actorId, order.rows[0].total_amount]);
      if ((await client.query("SELECT 1 FROM payments WHERE order_id=$1 AND status='confirmed'", [orderId])).rowCount !== 1) throw new Error("PAYMENT_AMOUNT_MISMATCH");
      await client.query("SELECT transition_cloud02_order($1,'payment_confirmed',$2,'staff',$3,$4)", [orderId, actorId, idempotencyKey, requestHash]);
      const result = { orderId, orderNumber: order.rows[0].order_number, status: "payment_confirmed", totalAmount: order.rows[0].total_amount };
      await client.query("UPDATE cloud02_idempotency_keys SET response_body=$3 WHERE scope='payment-confirm' AND key=$1 AND request_hash=$2", [idempotencyKey, requestHash, JSON.stringify(result)]); return result;
    });
  }
  async attachPackingPhoto(orderId: string, idempotencyKey: string, actorId: string, objectKey = `synthetic/${orderId}.jpg`) {
    return this.transaction(async client => { const h=hash({orderId,objectKey,actorId}); await client.query("INSERT INTO packing_photos(id,order_id,object_key,mime_type,byte_length,sha256_hex,confirmed_by) VALUES($1,$2,$3,'image/jpeg',10,repeat('a',64),$4)",[resourceId("photo",idempotencyKey),orderId,objectKey,actorId]); await client.query("SELECT transition_cloud02_order($1,'packed',$2,'staff',$3,$4)",[orderId,actorId,idempotencyKey,h]); return {orderId,status:"packed",objectKey}; });
  }
  async ship(orderId: string, idempotencyKey: string, actorId: string) { return this.transaction(async client => { const h=hash({orderId,actorId,action:"ship"}); await client.query("SELECT transition_cloud02_order($1,'shipped',$2,'staff',$3,$4)",[orderId,actorId,idempotencyKey,h]); await client.query("SELECT consume_cloud02_inventory($1)",[orderId]); return {orderId,status:"shipped"}; }); }
  async cancel(orderId: string, idempotencyKey: string, actorId: string) { return this.transaction(async client => { const h=hash({orderId,actorId,action:"cancel"}); await client.query("SELECT cancel_cloud02_order($1,$2,$3,$4)",[orderId,actorId,idempotencyKey,h]); return {orderId,status:"cancelled"}; }); }
}

export { requireProductionPostgres };
