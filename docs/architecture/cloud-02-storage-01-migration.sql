-- CLOUD-02-STORAGE-01 reference-only local candidate migration.
CREATE TABLE IF NOT EXISTS cloud02_photo_backup_manifests (
  id uuid PRIMARY KEY,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cloud02_photo_backup_manifest_items (
  manifest_id uuid NOT NULL REFERENCES cloud02_photo_backup_manifests(id) ON DELETE CASCADE,
  object_key text NOT NULL,
  object_version text,
  sha256_hex char(64) NOT NULL,
  byte_length bigint NOT NULL,
  mime_type text NOT NULL,
  source_table text NOT NULL,
  source_id uuid NOT NULL,
  PRIMARY KEY (manifest_id, object_key)
);
