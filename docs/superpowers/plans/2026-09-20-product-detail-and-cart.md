# Product Detail and Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the synthetic tea catalog into a coherent mock purchase flow with a deep-linkable product detail page and a cart page that can add, edit, and remove one product variant while preserving state across client navigation.

**Architecture:** Keep the existing domain interfaces and mock services as the only commerce boundary. Add a client-side `CommerceProvider` at the App Router root that owns one catalog/cart service pair for the detail and cart routes. Render `/tea/[slug]` and `/cart` through client components that consume those services, while keeping payment, customer identity, persistence, ERP, and real data outside this wave.

**Tech Stack:** Next.js App Router, React, TypeScript, existing domain services and synthetic fixtures, Vitest + Testing Library, Playwright Chromium/WebKit smoke coverage, existing CSS design tokens.

**Spec:** `docs/superpowers/specs/2026-09-20-product-detail-and-cart-design.md`

## Global Constraints

- Use only the existing synthetic catalog fixtures and brand language for 龍映茗茶; do not introduce real customer, payment, ERP, or credential data.
- Product detail and cart UI must consume `CatalogService` and `CartService`; components must not import fixture arrays or mutate service internals.
- Read `ProductVariant` fields for specification, price, inventory status, and `maxQuantity`; do not hardcode a variant or a quantity ceiling in UI code.
- Sold-out variants remain visible and clearly labeled, but the add action is disabled.
- Quantity controls accept positive integers from `1` through the selected variant's `maxQuantity`; invalid input does not issue a service mutation.
- Preserve the user's selected quantity and cart state when a service operation fails; show a concise retryable error.
- Keep the checkout control visibly disabled or explicitly placeholder-only; do not implement payment, authentication, persistence, or ERP integration.
- Preserve existing homepage injection points and tests unless a focused route-link update requires their adjustment.
- Do not overwrite unrelated worktree changes.

## Review Focus

- Unknown product slugs render a stable not-found state without a runtime crash.
- Catalog/detail/cart service errors render retryable states and do not silently reset selection or cart contents.
- Sold-out products are discoverable but cannot be added.
- Quantity bounds and cart subtotal are service/domain-driven rather than duplicated in presentation logic.
- A single provider-owned cart service survives navigation from `/tea/[slug]` to `/cart` and back without browser storage.
- Product links, buttons, headings, labels, focus states, and error messages remain keyboard- and screen-reader-usable at mobile and desktop widths.

---

## Task 1: Establish the shared commerce provider and route-level test harness

**Files:**

- Create `features/commerce/components/commerce-provider.tsx`.
- Create `tests/commerce-provider.test.tsx`.
- Modify `lib/domain/index.ts` only if an existing public type/factory export is missing after inspection.

**Interfaces consumed/produced:**

- Consume `CatalogService`, `CartService`, `createMockCatalogService`, and `createMockCartService` from `lib/domain`.
- Produce `CommerceContextValue` with `{ catalogService: CatalogService; cartService: CartService }`.
- Produce `CommerceProvider` and `useCommerce()`; `useCommerce()` throws a clear developer-facing error when called outside the provider.
- Accept an optional `services` prop in `CommerceProvider` so tests can inject deterministic service doubles without changing production behavior.

**Implementation steps:**

- [ ] Write a failing test that renders a probe inside `CommerceProvider`, verifies both services exist, and verifies two probe renders receive the same service object identities.
- [ ] Write a failing test that injects a fake service pair and verifies the provider returns the injected objects unchanged.
- [ ] Write a failing test that renders `useCommerce()` outside the provider and expects a clear thrown error.
- [ ] Run `pnpm test:run tests/commerce-provider.test.tsx` and record the expected failure before implementation.
- [ ] Implement the client provider with a lazy `useState` initializer so the default service pair is created once per mounted app tree; create the cart service with the provider's catalog service as its dependency.
- [ ] Implement the context hook with a null guard and an actionable error message.
- [ ] Run the focused provider test and confirm all new assertions pass.
- [ ] Run `pnpm exec eslint features/commerce/components/commerce-provider.tsx tests/commerce-provider.test.tsx` and `pnpm exec tsc --noEmit`.
- [ ] Commit the focused change as `feat: add shared commerce provider`.

## Task 2: Build the product detail route and purchase interaction

**Files:**

- Create `app/tea/[slug]/page.tsx`.
- Create `features/product/components/product-detail-page.tsx`.
- Create `tests/product-detail-page.test.tsx`.
- Modify `features/catalog/components/catalog-browser.tsx` only for the route-link contract if needed in Task 3; do not mix that integration into this task.

**Interfaces consumed/produced:**

- Consume `useCommerce().catalogService` and `useCommerce().cartService`.
- Consume `Product`, `ProductVariant`, `ServiceError`, and `ServiceResult` shapes through the existing service APIs.
- Produce a client detail component receiving a `slug` prop and a server route page passing `params.slug` to it.
- The component must expose accessible controls for quantity decrement/increment, numeric quantity entry, and add-to-cart.

**Implementation steps:**

- [ ] Write failing tests for the successful state: product name, taste summary, image/placeholder alt text, selected variant specification, formatted price, availability, quantity controls, and primary add action are rendered from a fake catalog result.
- [ ] Write a failing test that a sold-out variant remains visible and its add action is disabled with an explicit availability label.
- [ ] Write a failing test that decrement/increment and direct entry clamp or reject values outside `1..maxQuantity`, and that invalid input does not call `addItem`.
- [ ] Write a failing test that a successful `addItem` call renders a success acknowledgement while retaining the selected product/quantity.
- [ ] Write failing tests for loading, unknown slug/not-found, catalog service error with retry, and cart add error with retry; verify error states do not crash the route.
- [ ] Run `pnpm test:run tests/product-detail-page.test.tsx` and record the expected failures.
- [ ] Implement `app/tea/[slug]/page.tsx` as the dynamic route entry and keep data loading in the client detail component so loading/error/retry states are representable.
- [ ] Implement the detail component with an explicit loading skeleton, not-found state, retryable error state, a single selected variant derived from `product.variants[0]`, controlled positive-integer quantity, and a disabled sold-out action.
- [ ] Call `cartService.addItem(product.id, selectedVariant.id, quantity)` only after validating the current quantity and inventory state; render a non-destructive success message on success and preserve state on failure.
- [ ] Add links to return to the catalog/cart boundary without introducing checkout behavior.
- [ ] Run the focused product-detail tests and confirm all assertions pass.
- [ ] Run `pnpm exec eslint app/tea/[slug]/page.tsx features/product/components/product-detail-page.tsx tests/product-detail-page.test.tsx` and `pnpm exec tsc --noEmit`.
- [ ] Commit the focused change as `feat: add product detail purchase flow`.

## Task 3: Link catalog cards to product detail without regressing the catalog

**Files:**

- Modify `features/catalog/components/catalog-browser.tsx`.
- Modify `features/home/components/home-page.tsx`.
- Modify `tests/catalog-browser.test.tsx`.
- Modify `tests/home-page.test.tsx`.

**Interfaces consumed/produced:**

- Consume each rendered product's `slug`.
- Produce accessible links targeting `/tea/<slug>` from both the catalog browser card and the homepage catalog preview.
- Preserve existing pagination, filter, sold-out display, and card semantics.

**Implementation steps:**

- [ ] Add failing assertions that a catalog card and homepage preview expose a link with the expected slug-based href and accessible name.
- [ ] Add a regression assertion that the existing filter/load-more behavior and sold-out labeling remain unchanged.
- [ ] Run the two focused test files and record the expected failures.
- [ ] Replace the non-interactive “查看茶品” spans with Next `Link` elements using the product slug; keep the rest of each card's information hierarchy unchanged.
- [ ] Run `pnpm test:run tests/catalog-browser.test.tsx tests/home-page.test.tsx` and confirm the focused suite passes.
- [ ] Run `pnpm exec eslint features/catalog/components/catalog-browser.tsx features/home/components/home-page.tsx tests/catalog-browser.test.tsx tests/home-page.test.tsx` and `pnpm exec tsc --noEmit`.
- [ ] Commit the focused change as `feat: link catalog cards to product detail`.

## Task 4: Implement the cart page and service-driven line operations

**Files:**

- Create `app/cart/page.tsx`.
- Create `features/cart/components/cart-page.tsx`.
- Create `tests/cart-page.test.tsx`.

**Interfaces consumed/produced:**

- Consume `useCommerce().cartService` and `Cart`/`CartLine` results through `getCart`, `updateQuantity`, and `removeItem`.
- Produce a client cart component with empty, loading, success, and retryable error states.
- Render each line's product name, specification, unit price, quantity control, line subtotal, inventory/limit context where relevant, and remove action.
- Produce a subtotal from the returned cart, not from a second calculation in the component; keep checkout as a disabled boundary control.

**Implementation steps:**

- [ ] Write failing tests for loading and empty states, including a continue-shopping link to `/` and a disabled/placeholder checkout control.
- [ ] Write a failing test for a populated cart that renders all line fields and the service-provided subtotal.
- [ ] Write failing tests that valid quantity updates call `updateQuantity`, removal calls `removeItem`, and successful responses replace the rendered cart.
- [ ] Write failing tests that update/remove errors show retryable feedback while preserving the current rendered line and quantity.
- [ ] Run `pnpm test:run tests/cart-page.test.tsx` and record the expected failures.
- [ ] Implement `app/cart/page.tsx` as the route entry and `CartPage` as a client component that loads through the shared cart service.
- [ ] Implement controlled line quantity updates using each line's `maxQuantity`, with positive-integer validation before service calls.
- [ ] Implement removal and retryable operation errors without clearing unrelated lines; refresh from the successful service result after each mutation.
- [ ] Render the subtotal returned by `CartService`, an empty-cart state, a continue-shopping link, and a visibly disabled checkout boundary.
- [ ] Run the focused cart tests and confirm all assertions pass.
- [ ] Run `pnpm exec eslint app/cart/page.tsx features/cart/components/cart-page.tsx tests/cart-page.test.tsx` and `pnpm exec tsc --noEmit`.
- [ ] Commit the focused change as `feat: add cart page operations`.

## Task 5: Integrate the provider at the App Router root and verify cross-route state

**Files:**

- Modify `app/layout.tsx`.
- Create or modify `tests/commerce-flow.integration.test.tsx`.

**Interfaces consumed/produced:**

- Consume `CommerceProvider` from `features/commerce/components/commerce-provider.tsx`.
- Produce one provider-owned service pair wrapping all route content beneath the root layout.
- Preserve the server-compatible metadata and `<html lang="zh-Hant">` structure.

**Implementation steps:**

- [ ] Write a failing integration test that renders the provider with injected services, adds a product through the detail flow, renders the cart flow using the same provider, and verifies the line is present with the selected quantity.
- [ ] Write a failing integration test that unmounts/remounts route content under one provider instance and verifies the cart service instance/state remains available; do not use localStorage or sessionStorage.
- [ ] Run `pnpm test:run tests/commerce-flow.integration.test.tsx` and record the expected failures.
- [ ] Wrap the root layout body content with `CommerceProvider` while retaining existing metadata and document language.
- [ ] Keep homepage-specific service injection behavior intact; use the shared provider for detail/cart consumers only.
- [ ] Run the focused integration tests and confirm the route-state assertions pass.
- [ ] Run `pnpm exec eslint app/layout.tsx tests/commerce-flow.integration.test.tsx` and `pnpm exec tsc --noEmit`.
- [ ] Commit the focused change as `feat: share commerce state across routes`.

## Task 6: Add responsive/accessibility styling and browser-level acceptance coverage

**Files:**

- Modify `app/globals.css`.
- Create or modify `tests/e2e/product-cart.spec.ts` according to the repository's existing browser-test conventions.
- Modify component tests only when browser findings identify a missing semantic assertion.

**Interfaces consumed/produced:**

- Consume the existing design tokens, typography, buttons, cards, and responsive layout conventions.
- Produce a mobile/desktop-stable detail and cart experience with visible focus states and no horizontal overflow at the tested viewport sizes.

**Implementation steps:**

- [ ] Add browser acceptance cases for catalog card → detail route, add a quantity greater than one, navigate to cart, verify line/subtotal, update quantity, remove line, and return to empty state.
- [ ] Add browser acceptance cases for sold-out detail behavior and unknown slug/not-found behavior.
- [ ] Add accessibility assertions for page heading, form labels, button names, link names, disabled checkout, and visible error/success announcements.
- [ ] Run the focused Chromium/WebKit e2e command and record any baseline fixture or browser availability issue before changing implementation.
- [ ] Add only the CSS required for detail/cart grids, quantity controls, status messages, mobile stacking, focus-visible treatment, and disabled/placeholder checkout styling; reuse existing tokens and avoid unrelated restyling.
- [ ] Run the focused browser suite again at the repository's supported desktop and mobile viewports and confirm no horizontal overflow or interaction failure.
- [ ] Run the repository lint command and production build to validate the CSS changes; do not invoke ESLint directly on a stylesheet unless the configured toolchain supports it.
- [ ] Commit the focused change as `feat: polish product and cart accessibility`.

## Task 7: Synchronize durable project records and run the complete verification gate

**Files:**

- Modify `HANDOFF.md`.
- Modify `CAPABILITY_MAP.md`.
- Modify `WHITEPAPER.md` only for verified product-flow/architecture decisions introduced by this wave.
- Modify `docs/superpowers/specs/2026-09-20-product-detail-and-cart-design.md` only if implementation verification reveals a concrete, approved wording correction.

**Interfaces consumed/produced:**

- Consume the final implementation diff and command outputs.
- Produce durable records of the Wave 5 scope, decisions, completed files, verification evidence, and any remaining Wave 6 boundary.

**Implementation steps:**

- [ ] Inspect `git diff --check`, `git status`, and the full diff for unrelated changes or secrets.
- [ ] Update `CAPABILITY_MAP.md` to mark product detail, cart line operations, provider state sharing, and explicit non-goals with evidence links to implementation/tests.
- [ ] Update `HANDOFF.md` with current branch, completed commits, exact verification commands/results, known limitations, and the next recommended milestone.
- [ ] Update `WHITEPAPER.md` only if the provider/service-boundary decision is a durable architecture decision not already captured; keep the website-first/mock-only strategy explicit.
- [ ] Run the complete verification gate: `pnpm test:run`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, and the supported Chromium/WebKit e2e suite.
- [ ] If Docker smoke is available, run it and record the result; if the environment cannot run it, record that limitation honestly without claiming Docker verification.
- [ ] Re-run `git diff --check`, inspect the final diff and status, and verify no credentials or personal data were introduced.
- [ ] Commit the documentation and verification record as `docs: record product detail and cart verification`.

## Completion Evidence

The implementation is ready for branch handoff only when all of the following are true:

- [ ] `/tea/[slug]` supports successful, loading, not-found, service-error, sold-out, quantity-limit, and add-success states.
- [ ] `/cart` supports empty, populated, update, remove, subtotal, and service-error states.
- [ ] Catalog and homepage cards link to the product detail route.
- [ ] The provider-owned mock cart state survives client route transitions without browser storage.
- [ ] Focused unit/integration tests and the complete project quality gate pass.
- [ ] Browser acceptance and accessibility checks pass, or any environment-only limitation is explicitly recorded.
- [ ] Durable project documents match the verified implementation.
- [ ] No merge to `main`, push, payment integration, authentication, ERP integration, or production change is performed as part of this plan.
