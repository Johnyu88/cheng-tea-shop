-- CLOUD-02-DB-02 additive candidate migration, reference-only.
-- Execute only in the disposable local PostgreSQL contract test database.

CREATE TABLE IF NOT EXISTS cloud02_db02_contract_migration (
  contract_name text PRIMARY KEY,
  version integer NOT NULL,
  contract_hash text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE existing_version integer;
BEGIN
  SELECT version INTO existing_version FROM cloud02_db02_contract_migration
  WHERE contract_name = 'cloud-02-db-02' FOR UPDATE;
  IF existing_version IS NOT NULL AND existing_version <> 1 THEN
    RAISE EXCEPTION 'CLOUD-02-DB-02 migration incompatible with existing version %', existing_version;
  END IF;
  IF existing_version IS NULL THEN
    INSERT INTO cloud02_db02_contract_migration(contract_name, version, contract_hash)
    VALUES ('cloud-02-db-02', 1, 'sha256:cloud02-db-02-v1');
  END IF;
END $$;

ALTER TABLE cloud02_inventory_reservations
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS consumed_at timestamptz;

ALTER TABLE cloud02_inventory_reservations
  DROP CONSTRAINT IF EXISTS cloud02_inventory_reservations_status_check;
ALTER TABLE cloud02_inventory_reservations
  ADD CONSTRAINT cloud02_inventory_reservations_status_check
  CHECK (status IN ('active', 'released', 'consumed', 'expired'));

CREATE OR REPLACE FUNCTION release_cloud02_inventory(p_order_id uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE released_count integer;
BEGIN
  WITH candidates AS (
    SELECT r.id, r.variant_id, r.quantity
    FROM cloud02_inventory_reservations r
    WHERE r.order_id = p_order_id AND r.status = 'active'
    FOR UPDATE
  ), restored AS (
    UPDATE product_variants v SET inventory_quantity = v.inventory_quantity + c.quantity,
      inventory_status = 'available', updated_at = now()
    FROM candidates c WHERE v.id = c.variant_id RETURNING c.id
  )
  UPDATE cloud02_inventory_reservations r SET status = 'released', released_at = now()
  WHERE r.id IN (SELECT id FROM restored);
  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END $$;

CREATE OR REPLACE FUNCTION consume_cloud02_inventory(p_order_id uuid)
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE consumed_count integer;
BEGIN
  UPDATE cloud02_inventory_reservations SET status = 'consumed', consumed_at = now()
  WHERE order_id = p_order_id AND status = 'active';
  GET DIAGNOSTICS consumed_count = ROW_COUNT;
  RETURN consumed_count;
END $$;

CREATE OR REPLACE FUNCTION expire_cloud02_inventory(p_now timestamptz DEFAULT now())
RETURNS integer LANGUAGE plpgsql AS $$
DECLARE expired_count integer;
BEGIN
  WITH candidates AS (
    SELECT r.id, r.variant_id, r.quantity FROM cloud02_inventory_reservations r
    WHERE r.status = 'active' AND r.expires_at IS NOT NULL AND r.expires_at <= p_now
      AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = r.order_id AND p.status = 'confirmed')
    FOR UPDATE
  ), restored AS (
    UPDATE product_variants v SET inventory_quantity = v.inventory_quantity + c.quantity,
      inventory_status = 'available', updated_at = now()
    FROM candidates c WHERE v.id = c.variant_id RETURNING c.id
  )
  UPDATE cloud02_inventory_reservations r SET status = 'expired', released_at = now()
  WHERE r.id IN (SELECT id FROM restored);
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END $$;

CREATE OR REPLACE FUNCTION cancel_cloud02_order(p_order_id uuid, p_actor_id uuid, p_idempotency_key text, p_request_hash char(64))
RETURNS order_status LANGUAGE plpgsql AS $$
DECLARE current_status order_status; replay boolean;
BEGIN
  SELECT replayed INTO replay FROM claim_cloud02_idempotency(
    'order-cancel', p_idempotency_key, p_request_hash, 200,
    jsonb_build_object('orderId', p_order_id, 'status', 'cancelled'), 'order_cancel', p_order_id);
  SELECT status INTO current_status FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF replay THEN RETURN current_status; END IF;
  IF current_status IN ('shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'ORDER_CANCELLATION_INVALID';
  END IF;
  PERFORM release_cloud02_inventory(p_order_id);
  UPDATE orders SET status = 'cancelled', updated_at = now() WHERE id = p_order_id;
  INSERT INTO order_events(id, order_id, from_status, to_status, actor_id, actor_role, reason, idempotency_key)
  VALUES (md5(p_idempotency_key)::uuid, p_order_id, current_status, 'cancelled', p_actor_id, 'staff', 'customer cancellation', p_idempotency_key);
  RETURN 'cancelled';
END $$;
