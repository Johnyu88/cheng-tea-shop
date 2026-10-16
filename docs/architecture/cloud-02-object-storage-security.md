# CLOUD-02 私有物件儲存與照片安全規格

## Provider decision

Initial candidate: Cloudflare R2 Standard through its S3-compatible API. The bucket is private, public bucket access is disabled, and the application is the only issuer of signed upload/download URLs.

## Separation

- Production: separate bucket or account; prefix `production/`.
- Staging: separate bucket or account; prefix `staging/`.
- Demo: local ignored directories only; never points at either cloud bucket.
- Credentials are environment-specific and never reused across environments.

## Object metadata

Every accepted object has a database row containing object key, object version, MIME, byte length, SHA-256, owner record, environment, created-by actor and active/replaced state. The bucket is not the source of truth for publication or order state.

## Upload policy

The API issues a one-time, short-lived signed PUT URL only after authentication and authorization. The client sends the original file directly to object storage. The API then performs a HEAD/checksum verification and atomically creates the metadata row. Unverified objects are not displayed.

Accepted image types: JPEG, PNG, WebP. Product image limit: 5 MiB. Packing photo limit: 10 MiB. EXIF orientation is normalized during a future processing step; originals remain immutable until retention expiry.

## Replacement and deletion

Replacement creates a new object key/version and metadata row. The old active row is deactivated only after the new object passes verification. Deletion is a two-step soft delete plus garbage-collection job after backup manifest confirmation. Packing photos are never public and are retained according to the approved order-retention policy.

## Read policy

- Public catalog: only published product images can receive a short-lived read URL.
- Merchant: packing photos require an authenticated merchant session and order-level authorization.
- No permanent public object URL is placed in the database or customer response.
- Signed URLs are not logged; access logs contain object ID, actor class and result, not credentials.

## Backup and integrity

Nightly object manifest records key, version, ETag/checksum, byte size, MIME and database reference. A restore rehearsal compares database rows to the manifest and detects orphan, missing, duplicate or checksum-mismatched objects before any application read test.
