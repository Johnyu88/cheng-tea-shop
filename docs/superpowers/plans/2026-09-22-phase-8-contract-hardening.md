# Phase 8 Integration-readiness Contract Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Establish local-only DTO, normalized-error, service-interface, and in-memory adapter contracts that preserve the current UI while allowing future adapter replacement.

**Architecture:** Keep domain contracts in `lib/domain`, keep UI dependency injection at `CommerceProvider`, and keep all current implementations deterministic and in memory. Catalog, Cart, Checkout, and Publishing remain the existing UI-facing services; Payment, Logistics, and ERP get explicit future-facing interfaces and fakes but are not added to the checkout flow.

**Tech Stack:** TypeScript, React context dependency injection, Vitest/Testing Library, existing deterministic Mock services.

**Spec:** `WHITEPAPER.md` section 37 and `CAPABILITY_MAP.md` section L.

## Global Constraints

- No real payment, logistics, login, database, ERP, preview, credentials, or network calls.
- No raw card data, payment tokens, customer persistence, or ERP SDK imports in the frontend.
- Existing UI behavior and routes must remain unchanged.
- All adapter failures map to the project-owned `DomainError` shape.
- Existing `next-env.d.ts` and `AGENTS.md` remain untouched and unstaged.

## Review Focus

- DTOs must not expose raw payment credentials or provider-specific objects.
- Error mapping must preserve retryability and produce stable domain codes.
- An alternate Catalog/Cart/Checkout/Publishing implementation must be injectable without component changes.
- New Payment/Logistics/ERP fakes must be callable locally but must not become hidden UI dependencies.
- Existing homepage, cart, checkout, and product-draft behavior must remain unchanged.

### Task 1: Boundary DTOs, errors, and future service interfaces

**Files:**
- Create: `lib/domain/integration-types.ts`
- Create: `lib/domain/payment-service.ts`
- Create: `lib/domain/logistics-service.ts`
- Create: `lib/domain/erp-service.ts`
- Modify: `lib/domain/errors.ts`, `lib/domain/index.ts`
- Test: `tests/integration-contracts.test.ts`

- [ ] Write failing tests for DTO key shape, absence of raw payment fields, and normalized adapter error mapping.
- [ ] Run the focused contract test and confirm it fails because the contracts are absent.
- [ ] Add the DTOs, service interfaces, `AdapterError`, and `mapAdapterError` with stable domain error codes.
- [ ] Run the focused contract test and confirm it passes.

### Task 2: In-memory adapter bundle and adapter swapping

**Files:**
- Create: `lib/domain/in-memory-adapters.ts`
- Modify: `features/commerce/components/commerce-provider.tsx`, `lib/domain/index.ts`
- Test: `tests/integration-contracts.test.ts`, `tests/commerce-provider.test.tsx`

- [ ] Write failing tests for creating a local service bundle and replacing each UI-facing service with an alternate implementation.
- [ ] Run the focused tests and confirm the bundle API is absent.
- [ ] Implement `createInMemoryCommerceServices` by composing existing deterministic Mock services and accepting typed service overrides.
- [ ] Implement local Payment, Logistics, and ERP fakes that return DTO-shaped synthetic results without entering UI flow.
- [ ] Make `CommerceProvider` use the bundle factory while preserving its existing `services` override behavior.
- [ ] Run focused contract/provider tests and confirm all pass with unchanged UI assertions.

### Task 3: Full verification and durable documentation

**Files:**
- Modify: `WHITEPAPER.md`, `HANDOFF.md`, `CAPABILITY_MAP.md`

- [ ] Run full Vitest, TypeScript, lint, Webpack build, and relevant Chromium/WebKit regression.
- [ ] Run diff and secret/privacy checks; confirm no external adapter or credential was introduced.
- [ ] Update the three documents with the exact Phase 8 slice, limitations, and next boundary.
- [ ] Commit only Phase 8 files, push the branch, and confirm `origin/...` is synchronized.
