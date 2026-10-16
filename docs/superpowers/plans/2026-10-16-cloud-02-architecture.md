# CLOUD-02 Formal Cloud Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved isolated staging/production data boundary and replace Demo persistence with production-safe Postgres and private object storage adapters after separate resource approval.

**Architecture:** Keep the existing Next.js domain interfaces and introduce Postgres-backed repositories, Better Auth Postgres storage and an S3-compatible object adapter behind those interfaces. Staging and production use separate Render services, databases, buckets and secrets; Demo SQLite/JSON remains a local synthetic adapter.

**Tech Stack:** Next.js 16 standalone Docker, TypeScript, PostgreSQL, Better Auth, S3-compatible SDK, Render Web Service/Postgres, Cloudflare R2 candidate, Playwright plus physical iPhone Safari evidence.

**Spec:** `docs/superpowers/specs/2026-10-16-cloud-02-formal-cloud-architecture-design.md`

## Global Constraints

- Do not create paid resources, deploy, migrate data, change DNS, modify Acer/4090, or merge `main` without separate approval.
- Demo SQLite/JSON and seed data are never production data.
- Do not store card data, CVV, passwords, tokens or signed URLs in Git, logs, issue comments or client bundles.
- All production mutations require authorization, audit identity, idempotency and server-side validation.
- All customer-visible and merchant-visible objects are environment-scoped.

## Review Focus

- A stale or cross-environment `DATABASE_URL` must fail startup rather than connect to the other environment. Test in Task 1.
- A signed object URL must not expose private packing photos. Test in Task 2.
- A repeated payment/ship request must not duplicate state transitions or outbox messages. Test in Task 3.
- A failed migration or image deploy must leave the previous compatible revision usable. Test in Task 4.
- The Safari matrix must distinguish BLOCKED from PASS and never substitute Tailscale/Chromium evidence. Test in Task 5.

### Task 1: Database contract and migrations

**Files:**
- Create: `docs/architecture/cloud-02-postgresql-schema.sql` (reference already supplied)
- Create later: `lib/server/postgres/*`, `migrations/*`
- Test later: `tests/cloud-02/postgres-contract.test.ts`

- [ ] Define migration versioning, constraints, order snapshots, status transition function and idempotency table.
- [ ] Add contract tests for money, status gates, duplicate idempotency keys, foreign keys and cross-environment startup guard.
- [ ] Run migration tests against an isolated Postgres instance only after resource approval.

### Task 2: Object storage adapter

**Files:**
- Create later: `lib/server/object-storage/*`
- Test later: `tests/cloud-02/object-storage-contract.test.ts`

- [ ] Implement signed PUT/GET intents with MIME/size/checksum validation.
- [ ] Persist metadata only after object verification.
- [ ] Add tests for private packing-photo denial, replacement versioning, orphan cleanup and checksum mismatch.

### Task 3: Formal auth and merchant authorization

**Files:**
- Modify later: `lib/server/merchant-auth-provider.ts`, `lib/server/merchant-passkey.ts`
- Create later: `lib/server/authorization/*`, Better Auth Postgres configuration
- Test later: `tests/cloud-02/authz-contract.test.ts`

- [ ] Add Postgres-backed Better Auth sessions, role checks, origin/CSRF protections, logout revocation and rotation.
- [ ] Keep Demo provider behind explicit flags and fail closed in production.
- [ ] Test owner/staff boundaries, 401/403 behavior, session expiry and no-secret logging.

### Task 4: Backup, restore and release gates

**Files:**
- Create later: `scripts/cloud-02/backup-manifest.mjs`, `scripts/cloud-02/restore-verify.mjs`
- Create later: `docs/runbooks/cloud-02-release.md`
- Test later: `tests/cloud-02/restore-contract.test.ts`

- [ ] Generate encrypted database/object manifests without exposing values.
- [ ] Verify restore in a disposable target and compare counts, checksums, references and event history.
- [ ] Gate candidate release on backup marker, migration compatibility, health, auth, object and synthetic order-loop checks.

### Task 5: No-Tailscale acceptance

**Files:**
- Create: `docs/testing/cloud-02-iphone-safari-acceptance.md` (prepared)
- Create later: `e2e/cloud-02-mobile-acceptance.spec.ts`

- [ ] Run automated staging smoke with synthetic data.
- [ ] Run physical iPhone Safari checklist over cellular network with Tailscale disconnected.
- [ ] Record PASS/FAIL/BLOCKED evidence and redact personal data/secrets.

### Verification gate

- [ ] `git diff --check`
- [ ] Static markdown/schema checks
- [ ] Secret scan over changed files
- [ ] No Render create/update/deploy tool calls
- [ ] No DNS, migration or data-write operation
