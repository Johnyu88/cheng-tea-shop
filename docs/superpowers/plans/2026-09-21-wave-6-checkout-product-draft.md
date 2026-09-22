# Wave 6 Checkout and Product Draft Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a synthetic guest checkout and an elder-friendly product draft / publish prototype while preserving the project-owned service boundary and excluding real payment, authentication, persistence, and ERP integration.

**Architecture:** Extend the existing domain contracts and `CommerceProvider` with checkout and publishing services. Build two isolated feature flows: `/checkout` consumes the cart and checkout services; `/admin/products/new` owns transient form state and consumes the publishing service. Mock services remain deterministic, injectable, and in-memory.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict mode, Tailwind CSS 4, Vitest, React Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-21-wave-6-checkout-product-draft-design.md`

## Global Constraints

- The implementation remains Website First → Mock API → ERP Reuse → API Integration.
- Guest checkout is allowed; phone is required and email is optional.
- No real credit-card fields, LINE Pay credentials, payment tokens, customer persistence, authentication, ERP integration, or order backend are added.
- Contact and address values stay in React state for the current flow only and are never written to browser storage, fixtures, logs, or committed files.
- Product publishing is one item at a time with one specification, available / sold-out status, zero to three optional photos, explicit draft save, preview, and human-confirmed publication.
- AI copy is a deterministic Mock draft derived only from entered facts and selected tags; it never publishes automatically and never invents unsupported claims.
- Exact inventory, bulk import, multi-variant products, real upload processing, admin authentication, and cross-device persistence are out of scope.
- UI code consumes project-owned services and does not import fixtures or provider SDKs directly.
- Preserve unrelated `next-env.d.ts` changes and do not commit generated dependency directories.

## Review Focus

- **Payment and privacy boundary:** a checkout failure must retain form data without storing or logging payment-shaped credentials. Test in Task 2 and Task 5.
- **Delivery/payment compatibility:** invalid combinations must be rejected by `CheckoutService`, not by presentation-only assumptions. Test in Task 2.
- **Duplicate mutation protection:** repeated submit, save, summary generation, and publish clicks must produce at most one in-flight mutation. Test in Task 5 and Task 6.
- **Grounded product copy:** missing facts must remain missing and generated text must not introduce health, origin, certification, harvest, or production claims. Test in Task 3 and Task 6.
- **Data preservation and media cleanup:** failed save, summary, publish, or photo-preview actions must preserve text and existing previews, while removed object URLs are revoked. Test in Task 6.

---

### Task 1: Extend domain contracts and shared service injection

**Files:**
- Modify: `lib/domain/types.ts`
- Modify: `lib/domain/checkout-service.ts`
- Modify: `lib/domain/publishing-service.ts`
- Modify: `lib/domain/errors.ts`
- Modify: `lib/domain/index.ts`
- Modify: `features/commerce/components/commerce-provider.tsx`
- Test: `tests/domain-types.test.ts`
- Test: `tests/commerce-provider.test.tsx`

**Interfaces:**
- Consumes: existing `Cart`, `Money`, `Product`, `ProductDraft`, `CatalogService`, and `CartService` types.
- Produces: `CheckoutReceipt`, expanded `CheckoutDraft`, `ProductDraftPhoto`, `CheckoutService.validate(draft, cart)`, `CheckoutService.submit(draft, cart)`, `PublishingService.generateSummary(draft)`, and `PublishingService.publishDraft(draft, confirmation)`.

- [ ] **Step 1: Write failing contract tests**

Add assertions that the service bundle can be injected with checkout and publishing doubles, that a `CheckoutReceipt` contains `orderReference`, `status: "confirmed"`, and a TWD `total`, and that a product draft can carry zero to three photo metadata entries without a browser `File`.

```ts
const services = {
  catalogService,
  cartService,
  checkoutService: { validate: vi.fn(), submit: vi.fn() },
  publishingService: { generateSummary: vi.fn(), saveDraft: vi.fn(), publishDraft: vi.fn() },
};

render(<CommerceProvider services={services}>...</CommerceProvider>);
expect(result.current.checkoutService).toBe(services.checkoutService);
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run: `node node_modules/vitest/vitest.mjs run tests/domain-types.test.ts tests/commerce-provider.test.tsx`

Expected: FAIL because the current provider exposes only catalog and cart services and the new checkout result types do not exist.

- [ ] **Step 3: Add the minimal shared contracts**

Add `CheckoutReceipt`, `ProductDraftPhoto`, and the optional factual draft fields. Expand `CheckoutDraft` with `name` and optional `address`. Add `"payment-failed"`, `"checkout-unavailable"`, and `"publishing-unavailable"` error codes. Update the service interfaces to the exact methods listed in the spec.

Update `CommerceContextValue` to include `checkoutService` and `publishingService`. `createDefaultServices()` must create one catalog service, use it to create the cart service, and create one checkout and one publishing service instance. Keep the `useState` stable-instance behavior.

- [ ] **Step 4: Run focused tests and typecheck**

Run: `node node_modules/vitest/vitest.mjs run tests/domain-types.test.ts tests/commerce-provider.test.tsx`

Expected: PASS. Then run `node node_modules/typescript/bin/tsc --noEmit --incremental false` and expect no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/domain/types.ts lib/domain/checkout-service.ts lib/domain/publishing-service.ts lib/domain/errors.ts lib/domain/index.ts features/commerce/components/commerce-provider.tsx tests/domain-types.test.ts tests/commerce-provider.test.tsx
git commit -m "feat: extend commerce services for Wave 6"
```

### Task 2: Implement and test the Mock checkout service

**Files:**
- Modify: `lib/domain/mock/mock-checkout-service.ts`
- Modify: `lib/domain/errors.ts` if a code was not added in Task 1
- Test: `tests/mock-checkout-and-publishing.test.ts`
- Create: `tests/mock-checkout-service.test.ts` if the existing combined contract test becomes unclear

**Interfaces:**
- Consumes: `CheckoutService`, expanded `CheckoutDraft`, `Cart`, `Money`, and `ServiceResult` from Task 1.
- Produces: deterministic validation and submit behavior used by `CheckoutPage`.

- [ ] **Step 1: Write failing service tests**

Cover required name and phone, optional valid email, invalid email, required home-delivery address, accepted payment combinations, empty cart rejection, deterministic success receipt, retryable payment failure, and input immutability.

```ts
const cart = { lines: [line], subtotal: { currency: "TWD", amount: 800 } };
const draft = { name: "陳小姐", phone: "0912000000", deliveryMethod: "home-delivery", address: "茶行路 1 號", paymentMethod: "credit-card" };
expect(await service.validate(draft, cart)).toMatchObject({ ok: true });
expect(await service.submit(draft, cart)).toMatchObject({ ok: true, value: { status: "confirmed", total: cart.subtotal } });
```

Use a factory option such as `{ scenario?: "happy" | "payment-failure" }` so tests can select the retryable failure without relying on a global or random state.

- [ ] **Step 2: Run the focused service tests**

Run: `node node_modules/vitest/vitest.mjs run tests/mock-checkout-service.test.ts tests/mock-checkout-and-publishing.test.ts`

Expected: FAIL because `submit`, the expanded validation contract, and the payment-failure scenario are not implemented.

- [ ] **Step 3: Implement minimal deterministic validation and submission**

Validate trimmed name and phone, email syntax when present, home-delivery address, non-empty cart, and payment choices. Return copies of accepted drafts. `submit` must call the same validation logic, return a stable synthetic reference such as `MOCK-ORDER-001`, calculate no new total, and return `payment-failed` with `retryable: true` for the selected failure scenario. Do not log the draft.

- [ ] **Step 4: Run tests and inspect the privacy boundary**

Run: `node node_modules/vitest/vitest.mjs run tests/mock-checkout-service.test.ts tests/mock-checkout-and-publishing.test.ts`

Expected: PASS with no console output containing the phone, email, address, or payment method. Run `rg -n "console\.(log|info|debug).*draft|localStorage|sessionStorage|cardNumber|securityCode" lib features tests` and expect no Wave 6 implementation matches.

- [ ] **Step 5: Commit**

```bash
git add lib/domain/mock/mock-checkout-service.ts tests/mock-checkout-service.test.ts tests/mock-checkout-and-publishing.test.ts
git commit -m "feat: add deterministic mock checkout"
```

### Task 3: Implement and test the Mock publishing service

**Files:**
- Modify: `lib/domain/mock/mock-publishing-service.ts`
- Modify: `lib/domain/validation.ts` if draft-specific validation belongs there
- Test: `tests/mock-checkout-and-publishing.test.ts`
- Create: `tests/mock-publishing-service.test.ts` if focused tests improve clarity

**Interfaces:**
- Consumes: `PublishingService`, `ProductDraft`, `ProductDraftPhoto`, `Product`, and `ServiceResult` from Task 1.
- Produces: grounded summary generation, validated draft save, and explicit-confirmation publication.

- [ ] **Step 1: Write failing publishing tests**

Cover blank name/specification, invalid non-integer or negative TWD price, more than three photos, grounded summary from supplied facts, missing-fact wording, save returning draft status rather than publication, publish rejection without `{ confirmed: true }`, and one-variant published output.

```ts
const draft = { name: "山霧茶", specification: "一兩", price: { currency: "TWD", amount: 800 }, category: "oolong", inventoryStatus: "available", tasteTags: ["sweet"], summary: "清甜柔順" };
expect(await service.publishDraft(draft, { confirmed: false })).toMatchObject({ ok: false, error: { code: "invalid-draft" } });
const published = await service.publishDraft(draft, { confirmed: true });
expect(published).toMatchObject({ ok: true, value: { publication: "published", variants: [{ specification: "一兩" }] } });
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node node_modules/vitest/vitest.mjs run tests/mock-publishing-service.test.ts tests/mock-checkout-and-publishing.test.ts`

Expected: FAIL because the new photo limit, summary, and explicit-confirmation behavior are absent.

- [ ] **Step 3: Implement grounded Mock behavior**

Clone arrays and objects at service boundaries. Validate the minimum fields, integer non-negative TWD amount, allowed category and inventory values, and at most three photo metadata entries. Generate a short summary using only non-empty supplied facts and a neutral missing-facts sentence; never add origin, health, certification, harvest, or production claims. Require `confirmation.confirmed === true` before incrementing the synthetic product sequence.

- [ ] **Step 4: Run tests and typecheck**

Run: `node node_modules/vitest/vitest.mjs run tests/mock-publishing-service.test.ts tests/mock-checkout-and-publishing.test.ts`

Expected: PASS. Then run `node node_modules/typescript/bin/tsc --noEmit --incremental false` and expect no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/domain/mock/mock-publishing-service.ts lib/domain/validation.ts tests/mock-publishing-service.test.ts tests/mock-checkout-and-publishing.test.ts
git commit -m "feat: add grounded mock product publishing"
```

### Task 4: Add route shells and checkout-to-cart navigation

**Files:**
- Modify: `features/cart/components/cart-page.tsx`
- Modify: `app/globals.css`
- Test: `tests/cart-page.test.tsx`

**Interfaces:**
- Consumes: `CommerceProvider` service bundle and existing cart route.
- Produces: navigable `/checkout` and `/admin/products/new` route shells for feature components.

- [ ] **Step 1: Write the failing cart-link test**

Assert that a ready cart renders an enabled `前往結帳` link to `/checkout`, while an empty cart does not offer a misleading checkout action.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node node_modules/vitest/vitest.mjs run tests/cart-page.test.tsx`

Expected: FAIL because the cart currently renders a disabled button and the new route files do not exist.

- [ ] **Step 3: Implement the cart boundary and shared styles**

Replace the disabled cart button with an accessible Next `Link` to `/checkout` when lines exist. Add only scoped checkout / draft selectors and responsive form primitives to `app/globals.css`; do not alter unrelated catalog or product styles. Route pages are created with their feature components in Tasks 5 and 6 so this task remains independently typecheckable.

- [ ] **Step 4: Run tests and lint**

Run: `node node_modules/vitest/vitest.mjs run tests/cart-page.test.tsx`; expected PASS. Then run `node node_modules/eslint/bin/eslint.js app features tests` and expect exit 0, allowing only the existing native image warning.

- [ ] **Step 5: Commit**

```bash
git add app/checkout/page.tsx app/admin/products/new/page.tsx app/globals.css features/cart/components/cart-page.tsx tests/cart-page.test.tsx
git commit -m "feat: add Wave 6 route shells"
```

### Task 5: Build the guest checkout page

**Files:**
- Create: `features/checkout/components/checkout-page.tsx`
- Create: `app/checkout/page.tsx`
- Test: `tests/checkout-page.test.tsx`
- Test: `tests/commerce-flow.integration.test.tsx`
- Modify: `e2e/product-cart.spec.ts` or create `e2e/checkout-product-draft.spec.ts`

**Interfaces:**
- Consumes: `useCommerce()`, `CartService.getCart`, `CheckoutService.validate`, and `CheckoutService.submit` from Tasks 1–4.
- Produces: three-step checkout UI with empty, invalid, processing, payment-failure, and success states.

- [ ] **Step 1: Write failing RTL tests**

Cover empty cart guidance, contact validation, step navigation, home-delivery address requirement, payment options for each delivery method, order summary, retained values after service failure, processing disabled state, one submit call for repeated clicks, payment failure retry, and success order reference.

```tsx
expect(screen.getByRole("heading", { name: "聯絡資料" })).toBeInTheDocument();
await user.type(screen.getByLabelText("手機號碼"), "0912000000");
await user.click(screen.getByRole("button", { name: "下一步" }));
expect(screen.getByRole("heading", { name: "配送方式" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the focused checkout tests**

Run: `node node_modules/vitest/vitest.mjs run tests/checkout-page.test.tsx tests/commerce-flow.integration.test.tsx`

Expected: FAIL because the page component and route flow do not exist.

- [ ] **Step 3: Implement the minimal state machine**

Use explicit `step: "contact" | "delivery" | "review"` and `submission: "idle" | "processing" | "failure" | "success"` state. Load the cart through the injected service, keep the draft in React state, validate step-local requirements, and call `submit` once from a guarded handler. Render a live status region, visible error summary, concise expandable summary, shortage follow-up notice, telephone primary action, and LINE secondary action. Never render card fields or log draft values.

- [ ] **Step 4: Add integration and browser acceptance tests**

Add a provider-injected cart-to-checkout test and Playwright checks for: cart link opens `/checkout`; happy checkout reaches confirmation; payment failure retains phone/address and offers retry; repeated final clicks do not duplicate the receipt; mobile layout keeps controls visible.

- [ ] **Step 5: Run checkout verification**

Run: `node node_modules/vitest/vitest.mjs run tests/checkout-page.test.tsx tests/commerce-flow.integration.test.tsx`; expected PASS. Then run `node node_modules/typescript/bin/tsc --noEmit --incremental false` and `node node_modules/eslint/bin/eslint.js app features tests`; expect both to pass.

- [ ] **Step 6: Commit**

```bash
git add app/checkout/page.tsx features/checkout/components/checkout-page.tsx tests/checkout-page.test.tsx tests/commerce-flow.integration.test.tsx e2e/checkout-product-draft.spec.ts
git commit -m "feat: add guest checkout prototype"
```

### Task 6: Build the elder-friendly product draft flow

**Files:**
- Create: `features/publishing/components/product-draft-page.tsx`
- Create: `app/admin/products/new/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/product-draft-page.test.tsx`
- Test: `tests/commerce-provider.test.tsx`
- Modify: `e2e/checkout-product-draft.spec.ts`

**Interfaces:**
- Consumes: `useCommerce()`, `PublishingService.generateSummary`, `saveDraft`, and `publishDraft` from Tasks 1–4.
- Produces: one-page mobile / desktop draft form with preview, grounded copy, explicit confirmation, and publication success.

- [ ] **Step 1: Write failing RTL tests**

Cover prototype notice, labels for all five minimum fields, required-field summary, integer TWD validation, zero-to-three photo metadata, summary generation from supplied facts, preservation after save failure, preview visibility, confirmation gate, duplicate publish protection, and published success state.

```tsx
expect(screen.getByLabelText("茶名")).toBeInTheDocument();
expect(screen.getByLabelText("單一規格")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "確認並上架" })).toBeDisabled();
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node node_modules/vitest/vitest.mjs run tests/product-draft-page.test.tsx`

Expected: FAIL because the page component does not exist.

- [ ] **Step 3: Implement transient form and photo preview state**

Keep form values, selected metadata, generated summary, preview mode, and operation states in React state. Use `<input type="file" accept="image/*" multiple>` only to create object URLs for the current page; cap accepted previews at three, revoke removed URLs, and preserve text when a file is rejected. Do not pass `File` objects to the domain service.

- [ ] **Step 4: Implement save, grounded summary, preview, and publish transitions**

Disable only the active operation, use a `publishConfirmation` boolean that must be checked before calling `publishDraft`, show validation errors in a summary linked to fields, preserve draft data on service errors, and show a clear published state with the returned product name and variant. The page must not claim real authentication or persistence.

- [ ] **Step 5: Add integration and browser acceptance tests**

Verify mobile and desktop minimum-field completion, save draft, generated text editing, preview toggle, explicit confirmation, success state, and double-click protection. Assert generated summary does not contain unsupported claims when optional facts are absent.

- [ ] **Step 6: Run publishing verification**

Run: `node node_modules/vitest/vitest.mjs run tests/product-draft-page.test.tsx tests/commerce-provider.test.tsx`; expected PASS. Then run `node node_modules/typescript/bin/tsc --noEmit --incremental false` and `node node_modules/eslint/bin/eslint.js app features tests`; expect both to pass.

- [ ] **Step 7: Commit**

```bash
git add app/admin/products/new/page.tsx features/publishing/components/product-draft-page.tsx app/globals.css tests/product-draft-page.test.tsx tests/commerce-provider.test.tsx e2e/checkout-product-draft.spec.ts
git commit -m "feat: add elder-friendly product draft flow"
```

### Task 7: Integrate, document, and run the Wave 6 quality gate

**Files:**
- Modify: `HANDOFF.md`
- Modify: `CAPABILITY_MAP.md`
- Modify: `WHITEPAPER.md`
- Modify: `docs/superpowers/specs/2026-09-21-wave-6-checkout-product-draft-design.md` only if verified status wording needs updating
- Create: `.superpowers/sdd/2026-09-21-wave-6-checkout-product-draft/final-verification-report.md`

**Interfaces:**
- Consumes: all implementation tasks and their committed tests.
- Produces: durable Wave 6 status, verification evidence, blockers, and next-step record.

- [ ] **Step 1: Inspect the complete diff and secret boundary**

Run: `git diff feature/wave-1-reproducible-baseline...HEAD --check`; `rg -n "(sk_live|sk_test|api[_-]?key|token|password|cardNumber|securityCode)" app features lib tests e2e`; and `git status --short`. Expected: no secrets or payment credentials, no unrelated source changes, and only the known generated `next-env.d.ts` if the build touched it.

- [ ] **Step 2: Run the complete local verification suite**

Run these commands from the Wave 6 worktree:

```powershell
node node_modules/vitest/vitest.mjs run
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/eslint/bin/eslint.js .
node node_modules/next/dist/bin/next build --webpack
$env:CI='1'; node node_modules/@playwright/test/cli.js test e2e/checkout-product-draft.spec.ts --project=chromium --workers=1 --reporter=line
```

Expected: all unit/component tests, typecheck, lint, build, and Chromium acceptance pass. Attempt WebKit and Docker only if the required executables are present; record missing environment capabilities explicitly.

- [ ] **Step 3: Update durable project documents**

Record the actual branch, commits, completed checkout and publishing behavior, tests, browser results, and any environment limits in `HANDOFF.md`. Mark the Wave 6 capabilities complete only when the corresponding verification passes in `CAPABILITY_MAP.md`. Add the architecture and privacy boundaries to `WHITEPAPER.md` without claiming real payment, authentication, persistence, or ERP integration.

- [ ] **Step 4: Request independent review**

Have the QA/Security fallback review the complete branch for payment-data leakage, duplicate submission, accessibility regressions, and spec/document consistency. Resolve findings, rerun the affected tests, and record the review evidence in the final verification report.

- [ ] **Step 5: Commit documentation and verification evidence**

```bash
git add HANDOFF.md CAPABILITY_MAP.md WHITEPAPER.md .superpowers/sdd/2026-09-21-wave-6-checkout-product-draft/final-verification-report.md
git commit -m "docs: record Wave 6 verification"
```
