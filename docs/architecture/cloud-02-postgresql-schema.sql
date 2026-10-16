-- CLOUD-02 reference schema only.
-- NOT a migration. Do not execute against Render or any live database.
-- All timestamps are UTC. Monetary amounts are integer TWD.

CREATE TYPE publication_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE inventory_status AS ENUM ('available', 'sold_out');
CREATE TYPE order_status AS ENUM ('confirmed', 'payment_confirmed', 'packed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending_manual_verification', 'confirmed', 'rejected', 'refunded');
CREATE TYPE shipment_status AS ENUM ('pending', 'packed', 'shipped', 'delivered', 'exception');
CREATE TYPE actor_role AS ENUM ('owner', 'staff', 'system', 'customer');

CREATE TABLE products (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  summary text NOT NULL,
  taste_tags text[] NOT NULL DEFAULT '{}',
  fermentation text,
  roast text,
  brewing text,
  tea_region text,
  aroma text,
  taste text,
  publication_status publication_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE TABLE product_variants (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id),
  specification text NOT NULL,
  currency char(3) NOT NULL DEFAULT 'TWD' CHECK (currency = 'TWD'),
  price_amount integer NOT NULL CHECK (price_amount >= 0),
  inventory_status inventory_status NOT NULL DEFAULT 'available',
  inventory_quantity integer CHECK (inventory_quantity IS NULL OR inventory_quantity >= 0),
  max_quantity integer NOT NULL DEFAULT 5 CHECK (max_quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_images (
  id uuid PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id),
  object_key text NOT NULL UNIQUE,
  object_version text,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_length bigint NOT NULL CHECK (byte_length > 0 AND byte_length <= 5242880),
  sha256_hex char(64) NOT NULL,
  alt_text text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  replaced_at timestamptz
);

CREATE TABLE customers (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  phone_digest char(64) NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id uuid PRIMARY KEY,
  order_number text NOT NULL UNIQUE,
  customer_id uuid REFERENCES customers(id),
  status order_status NOT NULL DEFAULT 'confirmed',
  customer_name text NOT NULL,
  phone_digest char(64) NOT NULL,
  email text,
  delivery_method text NOT NULL CHECK (delivery_method IN ('home_delivery', 'store_pickup')),
  address_ciphertext bytea,
  payment_method text NOT NULL CHECK (payment_method IN ('bank_transfer', 'cash', 'phone_confirmation', 'line_voice_confirmation')),
  currency char(3) NOT NULL DEFAULT 'TWD' CHECK (currency = 'TWD'),
  subtotal_amount integer NOT NULL CHECK (subtotal_amount >= 0),
  shipping_amount integer NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
  total_amount integer NOT NULL CHECK (total_amount >= 0),
  lookup_digest char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);

CREATE TABLE order_items (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id),
  product_id uuid REFERENCES products(id),
  variant_id uuid REFERENCES product_variants(id),
  product_name_snapshot text NOT NULL,
  specification_snapshot text NOT NULL,
  unit_price_amount integer NOT NULL CHECK (unit_price_amount >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total_amount integer NOT NULL CHECK (line_total_amount >= 0)
);

CREATE TABLE order_events (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id),
  from_status order_status,
  to_status order_status NOT NULL,
  actor_id uuid,
  actor_role actor_role NOT NULL,
  reason text,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id),
  method text NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending_manual_verification',
  amount integer NOT NULL CHECK (amount >= 0),
  provider_reference text,
  confirmed_by uuid,
  confirmed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE packing_photos (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id),
  object_key text NOT NULL UNIQUE,
  object_version text,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_length bigint NOT NULL CHECK (byte_length > 0 AND byte_length <= 10485760),
  sha256_hex char(64) NOT NULL,
  confirmed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE shipments (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
  status shipment_status NOT NULL DEFAULT 'pending',
  carrier text,
  tracking_reference text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  exception_reason text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification_outbox (
  id uuid PRIMARY KEY,
  order_id uuid REFERENCES orders(id),
  audience actor_role NOT NULL,
  channel text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE TABLE idempotency_keys (
  key text PRIMARY KEY,
  actor_id uuid,
  request_hash char(64) NOT NULL,
  response_code integer,
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX orders_status_created_idx ON orders(status, created_at DESC);
CREATE INDEX order_events_order_created_idx ON order_events(order_id, created_at DESC);
CREATE INDEX product_images_product_active_idx ON product_images(product_id, is_active, is_primary);
CREATE INDEX outbox_status_next_attempt_idx ON notification_outbox(status, next_attempt_at);
