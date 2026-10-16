-- CLOUD-02-DB-01 additive contract migration, reference-only.
-- Execute only against a disposable local PostgreSQL database during contract tests.
-- Never execute this file against Render, GCP, the formal site, or real data.

CREATE TABLE IF NOT EXISTS cloud02_contract_migration (
  contract_name text PRIMARY KEY,
  version integer NOT NULL,
  contract_hash text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE
  existing_version integer;
BEGIN
  SELECT version INTO existing_version
  FROM cloud02_contract_migration
  WHERE contract_name = 'cloud-02-db-01'
  FOR UPDATE;

  IF existing_version IS NOT NULL AND existing_version <> 1 THEN
    RAISE EXCEPTION 'CLOUD-02-DB-01 migration incompatible with existing version %', existing_version;
  END IF;

  IF existing_version IS NULL THEN
    INSERT INTO cloud02_contract_migration (contract_name, version, contract_hash)
    VALUES ('cloud-02-db-01', 1, 'sha256:cloud02-db-01-v1');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS cloud02_idempotency_keys (
  scope text NOT NULL,
  key text NOT NULL,
  request_hash char(64) NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
  response_code integer,
  response_body jsonb,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (scope, key)
);

CREATE OR REPLACE FUNCTION claim_cloud02_idempotency(
  p_scope text,
  p_key text,
  p_request_hash char(64),
  p_response_code integer,
  p_response_body jsonb,
  p_resource_type text,
  p_resource_id uuid
)
RETURNS TABLE (
  replayed boolean,
  response_code integer,
  response_body jsonb,
  resource_type text,
  resource_id uuid
)
LANGUAGE plpgsql
AS $$
DECLARE
  inserted_count integer;
  existing cloud02_idempotency_keys%ROWTYPE;
BEGIN
  IF p_scope IS NULL OR btrim(p_scope) = '' OR p_key IS NULL OR btrim(p_key) = '' THEN
    RAISE EXCEPTION 'IDEMPOTENCY_SCOPE_AND_KEY_REQUIRED';
  END IF;

  INSERT INTO cloud02_idempotency_keys (
    scope, key, request_hash, response_code, response_body, resource_type, resource_id
  ) VALUES (
    p_scope, p_key, p_request_hash, p_response_code, p_response_body, p_resource_type, p_resource_id
  ) ON CONFLICT (scope, key) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 1 THEN
    RETURN QUERY SELECT false, p_response_code, p_response_body, p_resource_type, p_resource_id;
    RETURN;
  END IF;

  SELECT * INTO existing
  FROM cloud02_idempotency_keys
  WHERE scope = p_scope AND key = p_key
  FOR UPDATE;

  IF existing.request_hash <> p_request_hash
     OR existing.resource_type <> p_resource_type
     OR existing.resource_id <> p_resource_id THEN
    RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED: request or resource differs';
  END IF;

  RETURN QUERY SELECT true, existing.response_code, existing.response_body,
    existing.resource_type, existing.resource_id;
END
$$;

CREATE TABLE IF NOT EXISTS cloud02_inventory_reservations (
  id uuid PRIMARY KEY,
  variant_id uuid NOT NULL REFERENCES product_variants(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'consumed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz,
  UNIQUE (variant_id, order_id)
);

CREATE OR REPLACE FUNCTION reserve_cloud02_inventory(
  p_variant_id uuid,
  p_order_id uuid,
  p_quantity integer,
  p_reservation_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  existing cloud02_inventory_reservations%ROWTYPE;
  available_quantity integer;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'INVENTORY_QUANTITY_INVALID';
  END IF;

  SELECT * INTO existing
  FROM cloud02_inventory_reservations
  WHERE variant_id = p_variant_id AND order_id = p_order_id
  FOR UPDATE;

  IF FOUND THEN
    IF existing.status = 'active' AND existing.quantity = p_quantity THEN
      RETURN existing.id;
    END IF;
    RAISE EXCEPTION 'INVENTORY_RESERVATION_CONFLICT';
  END IF;

  SELECT inventory_quantity INTO available_quantity
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND OR available_quantity IS NULL THEN
    RAISE EXCEPTION 'INVENTORY_VARIANT_NOT_FOUND_OR_UNMANAGED';
  END IF;
  IF available_quantity < p_quantity THEN
    RAISE EXCEPTION 'INVENTORY_INSUFFICIENT: requested %, available %', p_quantity, available_quantity;
  END IF;

  UPDATE product_variants
  SET inventory_quantity = available_quantity - p_quantity,
      inventory_status = CASE WHEN available_quantity - p_quantity = 0
        THEN 'sold_out'::inventory_status ELSE inventory_status END,
      updated_at = now()
  WHERE id = p_variant_id;

  INSERT INTO cloud02_inventory_reservations (id, variant_id, order_id, quantity)
  VALUES (p_reservation_id, p_variant_id, p_order_id, p_quantity);
  RETURN p_reservation_id;
END
$$;

CREATE OR REPLACE FUNCTION cloud02_validate_order_amounts(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  order_row orders%ROWTYPE;
  calculated_subtotal bigint;
  stored_line_total bigint;
  invalid_line_count integer;
  invalid_payment_count integer;
BEGIN
  SELECT * INTO order_row FROM orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND_FOR_AMOUNT_VALIDATION';
  END IF;

  SELECT
    COALESCE(sum(unit_price_amount::bigint * quantity::bigint), 0),
    COALESCE(sum(line_total_amount::bigint), 0),
    count(*) FILTER (WHERE line_total_amount::bigint <> unit_price_amount::bigint * quantity::bigint)
  INTO calculated_subtotal, stored_line_total, invalid_line_count
  FROM order_items WHERE order_id = p_order_id;

  IF invalid_line_count <> 0 THEN
    RAISE EXCEPTION 'ORDER_LINE_TOTAL_MISMATCH';
  END IF;
  IF calculated_subtotal <> stored_line_total OR order_row.subtotal_amount::bigint <> calculated_subtotal THEN
    RAISE EXCEPTION 'ORDER_SUBTOTAL_MISMATCH';
  END IF;
  IF order_row.total_amount::bigint <> order_row.subtotal_amount::bigint + order_row.shipping_amount::bigint THEN
    RAISE EXCEPTION 'ORDER_TOTAL_MISMATCH';
  END IF;

  SELECT count(*) INTO invalid_payment_count
  FROM payments
  WHERE order_id = p_order_id AND amount::bigint <> order_row.total_amount::bigint;
  IF invalid_payment_count <> 0 THEN
    RAISE EXCEPTION 'PAYMENT_AMOUNT_MISMATCH';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION cloud02_validate_order_amounts_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  affected_order_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'orders' THEN
    affected_order_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
  ELSE
    affected_order_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.order_id ELSE NEW.order_id END;
  END IF;
  PERFORM cloud02_validate_order_amounts(affected_order_id);
  RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS cloud02_orders_amounts ON orders;
CREATE CONSTRAINT TRIGGER cloud02_orders_amounts
AFTER INSERT OR UPDATE OF subtotal_amount, shipping_amount, total_amount ON orders
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION cloud02_validate_order_amounts_trigger();

DROP TRIGGER IF EXISTS cloud02_order_items_amounts ON order_items;
CREATE CONSTRAINT TRIGGER cloud02_order_items_amounts
AFTER INSERT OR UPDATE OR DELETE ON order_items
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION cloud02_validate_order_amounts_trigger();

DROP TRIGGER IF EXISTS cloud02_payments_amounts ON payments;
CREATE CONSTRAINT TRIGGER cloud02_payments_amounts
AFTER INSERT OR UPDATE OR DELETE ON payments
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION cloud02_validate_order_amounts_trigger();

CREATE OR REPLACE FUNCTION transition_cloud02_order(
  p_order_id uuid,
  p_to_status order_status,
  p_actor_id uuid,
  p_actor_role actor_role,
  p_idempotency_key text,
  p_request_hash char(64)
)
RETURNS order_status
LANGUAGE plpgsql
AS $$
DECLARE
  current_status order_status;
  replay boolean;
BEGIN
  SELECT replayed INTO replay
  FROM claim_cloud02_idempotency(
    'order-transition', p_idempotency_key, p_request_hash, 200,
    jsonb_build_object('orderId', p_order_id, 'toStatus', p_to_status),
    'order_transition', p_order_id
  );
  IF replay THEN
    SELECT status INTO current_status FROM orders WHERE id = p_order_id;
    RETURN current_status;
  END IF;

  SELECT status INTO current_status FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND';
  END IF;

  IF NOT (
    (current_status = 'confirmed' AND p_to_status = 'payment_confirmed') OR
    (current_status = 'payment_confirmed' AND p_to_status = 'packed') OR
    (current_status = 'packed' AND p_to_status = 'shipped') OR
    (current_status = 'shipped' AND p_to_status = 'delivered')
  ) THEN
    RAISE EXCEPTION 'ORDER_STATUS_TRANSITION_INVALID: % -> %', current_status, p_to_status;
  END IF;

  IF p_to_status IN ('payment_confirmed', 'packed', 'shipped') AND NOT EXISTS (
    SELECT 1 FROM payments p
    WHERE p.order_id = p_order_id AND p.status = 'confirmed'
      AND p.amount = (SELECT total_amount FROM orders WHERE id = p_order_id)
  ) THEN
    RAISE EXCEPTION 'ORDER_PAYMENT_GATE_REQUIRED';
  END IF;

  IF p_to_status IN ('packed', 'shipped') AND NOT EXISTS (
    SELECT 1 FROM packing_photos photo
    WHERE photo.order_id = p_order_id AND photo.confirmed_by IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'ORDER_PACKING_PHOTO_GATE_REQUIRED';
  END IF;

  INSERT INTO order_events (id, order_id, from_status, to_status, actor_id, actor_role, idempotency_key)
  VALUES (md5(p_idempotency_key)::uuid, p_order_id, current_status, p_to_status, p_actor_id, p_actor_role, p_idempotency_key);
  UPDATE orders SET status = p_to_status, updated_at = now() WHERE id = p_order_id;
  RETURN p_to_status;
END
$$;
