# Wave 3 Domain Interfaces and Mock Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add project-owned catalog, cart, checkout, and product-draft contracts with a deterministic synthetic Mock Adapter, without coupling UI code to fixtures or real services.

**Architecture:** Keep domain contracts in focused modules under `lib/domain/`. A deterministic Mock Adapter implements the service interfaces and owns synthetic catalog/cart state. Tests consume the interfaces and adapter factory, proving that future HTTP or ERP adapters can replace the implementation without changing consumers.

**Tech Stack:** TypeScript 6, Vitest 5, Next.js 16 App Router, pnpm 11, strict TypeScript with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

**Spec:** `docs/superpowers/specs/2026-09-20-domain-interfaces-and-mock-adapter-design.md`

## Global Constraints

- Use only synthetic product data; do not add real customer, payment, address, authentication, ERP, or private business data.
- Keep `Money.amount` as a finite non-negative integer in TWD; never calculate totals with floating-point values.
- Service methods return `ServiceResult<T>` for expected domain conditions instead of throwing.
- The Mock Adapter must support `happy`, `empty`, `catalog-error`, `sold-out`, and `purchase-limit` scenarios deterministically.
- A published Mock product has exactly one specification; no image processing, AI generation, persistence, or authentication is implemented.
- UI components must not import fixtures or Mock Adapter internals; this Wave does not integrate the contracts into homepage rendering.
- Preserve existing Wave 2 shell behavior and all existing tests.

## Review Focus

- Fractional, negative, or non-finite TWD values must be rejected at the domain boundary; test this in Task 1.
- Pagination must return at least 41 stable synthetic products without duplicate IDs or slugs; test this in Task 2.
- Empty and catalog-error scenarios must be distinguishable without exceptions; test this in Task 2.
- Sold-out and purchase-limit failures must preserve the previous valid cart; test this in Task 3.
- Publishing must not invent unsupported claims or create more than one specification; test this in Task 4.

---

### Task 1: Shared domain contracts and validation

**Files:**
- Create: `lib/domain/types.ts`
- Create: `lib/domain/errors.ts`
- Create: `lib/domain/result.ts`
- Create: `lib/domain/validation.ts`
- Test: `tests/domain-types.test.ts`

**Interfaces:**
- Produces `Money`, `ProductId`, `ProductSlug`, `VariantId`, `InventoryStatus`, `TeaCategory`, `TasteTag`, `ProductImage`, `ProductVariant`, `Product`, `ProductDraft`, `CartLine`, `Cart`, `CheckoutDraft`, `CatalogQuery`, `DomainError`, `DomainErrorCode`, `ServiceResult<T>`, and `Page<T>`.
- Produces `assertValidMoney(money: Money): ServiceResult<Money>` and `isValidQuantity(quantity: number): boolean`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, test } from "vitest";
import { assertValidMoney, isValidQuantity } from "@/lib/domain/validation";

describe("domain value validation", () => {
  test("accepts integer non-negative TWD", () => {
    expect(assertValidMoney({ currency: "TWD", amount: 800 })).toEqual({
      ok: true,
      value: { currency: "TWD", amount: 800 },
    });
  });

  test("rejects fractional, negative, and non-finite TWD", () => {
    expect(assertValidMoney({ currency: "TWD", amount: 800.5 }).ok).toBe(false);
    expect(assertValidMoney({ currency: "TWD", amount: -1 }).ok).toBe(false);
    expect(assertValidMoney({ currency: "TWD", amount: Number.NaN }).ok).toBe(false);
  });

  test("accepts only positive integer quantities", () => {
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(1.5)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm test:run tests/domain-types.test.ts`

Expected: FAIL because `lib/domain/validation.ts` and the domain types do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Define the exact unions and object types from the specification. Implement `assertValidMoney` to return `invalid-draft` for a non-TWD currency, a negative amount, a fractional amount, or a non-finite amount. Implement `isValidQuantity` with `Number.isInteger(quantity) && quantity > 0`.

- [ ] **Step 4: Run focused and full tests**

Run: `pnpm test:run tests/domain-types.test.ts`

Expected: PASS with 3 tests.

Run: `pnpm test:run`

Expected: all existing and new tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/domain tests/domain-types.test.ts
git commit -m "feat: add Wave 3 domain contracts"
```

### Task 2: Deterministic catalog fixture and catalog service

**Files:**
- Create: `lib/domain/catalog-service.ts`
- Create: `lib/domain/mock/catalog-fixture.ts`
- Create: `lib/domain/mock/mock-catalog-service.ts`
- Test: `tests/mock-catalog-service.test.ts`

**Interfaces:**
- Consumes: `TeaCategory`, `TasteTag`, `Product`, `ProductSlug`, `CatalogQuery`, `Page<T>`, `ServiceResult<T>`, `DomainError` from Task 1.
- Produces `CatalogService`, `MockCatalogScenario`, `createMockCatalogService(options?: { scenario?: MockCatalogScenario; pageSize?: number }): CatalogService`, and a deterministic fixture containing at least 41 products.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, test } from "vitest";
import { createMockCatalogService } from "@/lib/domain/mock/mock-catalog-service";

test("paginates 41 or more deterministic synthetic products without duplicates", async () => {
  const service = createMockCatalogService({ pageSize: 12 });
  const seen = new Set<string>();
  let cursor: string | undefined;
  let total = 0;

  do {
    const result = await service.listProducts({ cursor, limit: 12 });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    result.value.items.forEach((product) => seen.add(product.id));
    total += result.value.items.length;
    cursor = result.value.nextCursor ?? undefined;
  } while (cursor);

  expect(total).toBeGreaterThanOrEqual(41);
  expect(seen.size).toBe(total);
});

test("returns explicit empty and catalog-error results", async () => {
  const empty = await createMockCatalogService({ scenario: "empty" }).listProducts();
  const failed = await createMockCatalogService({ scenario: "catalog-error" }).listProducts();
  expect(empty).toMatchObject({ ok: true, value: { items: [], nextCursor: null } });
  expect(failed).toMatchObject({ ok: false, error: { code: "catalog-unavailable" } });
});

test("filters by category and taste without changing stable product identity", async () => {
  const service = createMockCatalogService({ pageSize: 50 });
  const result = await service.listProducts({ category: "oolong", taste: "sweet" });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  expect(result.value.items.length).toBeGreaterThan(0);
  expect(result.value.items.every((product) =>
    product.category === "oolong" && product.tasteTags.includes("sweet"),
  )).toBe(true);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm test:run tests/mock-catalog-service.test.ts`

Expected: FAIL because the catalog service and fixture have not been implemented.

- [ ] **Step 3: Write the minimal implementation**

Create stable synthetic records using IDs `mock-tea-001` through at least `mock-tea-041`, deterministic names, one placeholder image shape, category/taste rotations, and one variant per product. Use opaque numeric cursors based on the start index. Apply category and taste filters before slicing the requested page. Return `product-not-found` for an unknown slug and `catalog-unavailable` for the error scenario.

- [ ] **Step 4: Run focused and full tests**

Run: `pnpm test:run tests/mock-catalog-service.test.ts`

Expected: PASS with 3 tests.

Run: `pnpm test:run`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/domain/catalog-service.ts lib/domain/mock/catalog-fixture.ts lib/domain/mock/mock-catalog-service.ts tests/mock-catalog-service.test.ts
git commit -m "feat: add deterministic mock catalog service"
```

### Task 3: Cart service and state-preserving error paths

**Files:**
- Create: `lib/domain/cart-service.ts`
- Create: `lib/domain/mock/mock-cart-service.ts`
- Test: `tests/mock-cart-service.test.ts`

**Interfaces:**
- Consumes: `Cart`, `CartLine`, `CatalogService`, `ProductId`, `VariantId`, `Money`, `ServiceResult<T>`, and `DomainError` from Tasks 1–2.
- Produces `CartService`, `MockCartScenario` (`"happy" | "sold-out" | "purchase-limit"`), and `createMockCartService(options?: { scenario?: MockCartScenario; catalog?: CatalogService }): CartService`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, test } from "vitest";
import { createMockCartService } from "@/lib/domain/mock/mock-cart-service";

test("adds an available item and calculates an integer TWD subtotal", async () => {
  const service = createMockCartService();
  const result = await service.addItem("mock-tea-001", "mock-tea-001-variant", 2);
  expect(result).toMatchObject({ ok: true, value: { subtotal: { currency: "TWD" } } });
  if (!result.ok) throw new Error(result.error.message);
  expect(result.value.subtotal.amount % 1).toBe(0);
  expect(result.value.lines[0]?.quantity).toBe(2);
});

test("rejects sold-out items and preserves the existing cart", async () => {
  const service = createMockCartService({ scenario: "sold-out" });
  const before = await service.getCart();
  const result = await service.addItem("mock-tea-001", "mock-tea-001-variant", 1);
  expect(result).toMatchObject({ ok: false, error: { code: "product-sold-out" } });
  expect(await service.getCart()).toEqual(before);
});

test("rejects a quantity above the purchase limit without discarding valid lines", async () => {
  const service = createMockCartService({ scenario: "purchase-limit" });
  const added = await service.addItem("mock-tea-001", "mock-tea-001-variant", 1);
  expect(added.ok).toBe(true);
  const rejected = await service.updateQuantity("mock-tea-001", "mock-tea-001-variant", 99);
  expect(rejected).toMatchObject({ ok: false, error: { code: "purchase-limit-exceeded" } });
  const current = await service.getCart();
  expect(current).toMatchObject({ ok: true, value: { lines: [{ quantity: 1 }] } });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm test:run tests/mock-cart-service.test.ts`

Expected: FAIL because no cart service exists.

- [ ] **Step 3: Write the minimal implementation**

Keep cart state private to the adapter instance. Resolve product and variant through `CatalogService`, reject sold-out variants, enforce `maxQuantity`, clone returned cart values, and calculate the subtotal by integer multiplication and addition. Implement remove and zero-line behavior without writing browser storage.

- [ ] **Step 4: Run focused and full tests**

Run: `pnpm test:run tests/mock-cart-service.test.ts`

Expected: PASS with 3 tests.

Run: `pnpm test:run`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/domain/cart-service.ts lib/domain/mock/mock-cart-service.ts tests/mock-cart-service.test.ts
git commit -m "feat: add stateful mock cart service"
```

### Task 4: Checkout validation, product draft publishing, and adapter exports

**Files:**
- Create: `lib/domain/checkout-service.ts`
- Create: `lib/domain/publishing-service.ts`
- Create: `lib/domain/mock/mock-checkout-service.ts`
- Create: `lib/domain/mock/mock-publishing-service.ts`
- Create: `lib/domain/index.ts`
- Test: `tests/mock-checkout-and-publishing.test.ts`

**Interfaces:**
- Consumes: `CheckoutDraft`, `ProductDraft`, `Product`, `ServiceResult<T>`, `DomainError`, and `Money` from Task 1.
- Produces `CheckoutService`, `PublishingService`, `createMockCheckoutService()`, `createMockPublishingService()`, and a single public domain export path `@/lib/domain`.

- [ ] **Step 1: Write the failing tests**

```ts
import { expect, test } from "vitest";
import { createMockCheckoutService } from "@/lib/domain/mock/mock-checkout-service";
import { createMockPublishingService } from "@/lib/domain/mock/mock-publishing-service";

test("requires a phone and rejects an incompatible pickup payment", async () => {
  const service = createMockCheckoutService();
  const missingPhone = await service.validate({
    phone: "",
    deliveryMethod: "home-delivery",
    paymentMethod: "credit-card",
  });
  const incompatible = await service.validate({
    phone: "0912000000",
    deliveryMethod: "home-delivery",
    paymentMethod: "pay-at-store",
  });
  expect(missingPhone).toMatchObject({ ok: false, error: { code: "invalid-draft" } });
  expect(incompatible).toMatchObject({ ok: false, error: { code: "invalid-draft" } });
});

test("publishes one specification from provided facts without inventing claims", async () => {
  const service = createMockPublishingService();
  const result = await service.publishDraft({
    name: "Synthetic Mountain Tea",
    specification: "一兩",
    price: { currency: "TWD", amount: 800 },
    category: "oolong",
    inventoryStatus: "available",
    tasteTags: ["sweet"],
    summary: "清甜柔順",
  });
  expect(result).toMatchObject({ ok: true, value: { publication: "published" } });
  if (!result.ok) throw new Error(result.error.message);
  expect(result.value.variants).toHaveLength(1);
  expect(result.value.summary).toBe("清甜柔順");
  expect(result.value.summary).not.toContain("療效");
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm test:run tests/mock-checkout-and-publishing.test.ts`

Expected: FAIL because checkout and publishing services do not exist.

- [ ] **Step 3: Write the minimal implementation**

Validate non-empty phone, optional email shape when supplied, and allow `pay-at-store` only with `store-pickup`. Return a copy of the valid draft. For publishing, validate the required fields and money, create a deterministic synthetic product ID and slug from the draft name, create exactly one variant, use a labeled placeholder image, preserve only the supplied summary, and return a published product. `saveDraft` returns a validated draft without publishing it.

- [ ] **Step 4: Export only project-owned contracts and factories**

Export the shared types, service interfaces, and factory functions from `lib/domain/index.ts`. Do not export fixture arrays or adapter-private state.

- [ ] **Step 5: Run all verification commands**

Run:

```bash
pnpm test:run
pnpm lint
pnpm typecheck
pnpm build
git diff --check
```

Expected: all commands pass; no generated `work/` browser files or `.next/` files appear in `git status`.

- [ ] **Step 6: Commit**

```bash
git add lib/domain tests/mock-checkout-and-publishing.test.ts
git commit -m "feat: add mock checkout and publishing contracts"
```

### Task 5: Documentation and final branch verification

**Files:**
- Modify: `WHITEPAPER.md`
- Modify: `CAPABILITY_MAP.md`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: the completed Wave 3 tests and commit history from Tasks 1–4.
- Produces: synchronized project status stating that Wave 3 contracts and Mock Adapter are implemented, while UI integration, persistence, real catalog, payment, ERP, authentication, and Docker/e2e gates remain outstanding.

- [ ] **Step 1: Write the documentation assertions as a checklist**

Confirm the documents state all of the following exactly: synthetic Mock Adapter only; 41-plus deterministic products; integer TWD; typed empty/error/sold-out/purchase-limit paths; no real customer/payment data; Wave 4 is the next UI integration stage; CI/e2e/Docker status is reported from actual evidence.

- [ ] **Step 2: Update the three documents**

Add a dated Wave 3 status entry without rewriting prior decisions or claiming that product, cart, checkout, payment, ERP, or real customer flows are complete.

- [ ] **Step 3: Run final verification**

Run:

```bash
pnpm test:run
pnpm lint
pnpm typecheck
pnpm build
git diff --check
git status --short --branch
```

Expected: all quality commands pass, the working tree is clean after the documentation commit, and no secret-like files or values are added.

- [ ] **Step 4: Commit**

```bash
git add WHITEPAPER.md CAPABILITY_MAP.md HANDOFF.md
git commit -m "docs: record Wave 3 mock adapter completion"
```

- [ ] **Step 5: Push the feature branch**

```bash
git push origin feature/wave-1-reproducible-baseline
```

Expected: the remote feature branch advances without force push; do not merge `main` without explicit human approval.
