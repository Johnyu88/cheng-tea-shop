# Wave 6 — Checkout and Product Draft Prototype Design

Date: 2026-09-21  
Status: Proposed for implementation review

## 1. Goal

Extend the synthetic storefront from product detail and cart into two independently testable prototype flows:

1. a guest checkout that validates contact and delivery choices, simulates payment processing, and exposes success and failure recovery without connecting to a real payment provider; and
2. an elder-friendly one-page product draft flow that saves, previews, and explicitly publishes one synthetic tea product without authentication, persistence, or real media processing.

The implementation remains Website First → Mock API → ERP Reuse → API Integration. UI code continues to consume project-owned services and never imports fixtures or provider SDKs directly.

## 2. Confirmed constraints

- The catalog remains synthetic and local to the Mock Adapter.
- Guest checkout is allowed; phone is required and email is optional.
- Home delivery and store pickup are supported.
- Payment choices are constrained by delivery method: home delivery supports credit card and LINE Pay; store pickup supports credit card, LINE Pay, and pay at store. The Mock happy path exposes all approved choices, while tests cover an invalid combination rather than inventing a provider-specific restriction.
- No real credit-card fields, LINE Pay credentials, payment tokens, customer persistence, authentication, ERP integration, or order backend are added.
- Contact and address values stay in React state for the current flow only. They are never written to localStorage, sessionStorage, fixtures, logs, or committed files.
- Product publishing is one item at a time with one specification, available / sold-out status, zero to three optional photos, explicit draft save, preview, and human-confirmed publication.
- AI copy is a deterministic Mock draft derived only from entered facts and selected tags. It never publishes automatically and never invents origin, health, certification, harvest, or production claims.
- Exact inventory, bulk import, multi-variant products, real upload processing, admin authentication, and cross-device persistence are out of scope.

## 3. User flows

### 3.1 Checkout

The cart's checkout action navigates to `/checkout`. An empty cart redirects or presents a clear empty state with a link back to `/cart`.

The page is a three-step mobile-first flow and a two-column desktop layout:

1. **聯絡資料** — name, required phone, optional email.
2. **配送方式** — home delivery with address fields, or store pickup; show the approved payment choices for the selected delivery method.
3. **確認訂單** — cart summary, delivery, payment choice, limited-stock follow-up notice, and final action.

On submission the page enters `processing`, disables all duplicate-submit paths, and calls the Mock checkout service. The service returns either a synthetic order receipt or a retryable payment failure. A success result shows an order reference and telephone support path; a failure result retains every valid field and offers retry or return to payment selection.

The summary is concise and expandable for four or more lines, following the approved desktop / responsive state design. No payment card number, security code, redirect URL, token, or provider-shaped credential is ever rendered or stored.

### 3.2 Product draft publishing

The operator flow is available at `/admin/products/new` as a prototype route with a clear notice that real administrator authentication is not implemented.

The single page presents the minimum fields first:

- tea name;
- single specification;
- integer TWD price;
- tea category;
- available / sold-out status.

Optional details can be expanded without hiding the save and publish actions:

- taste tags;
- origin, fermentation, roast, aroma, and brewing facts;
- a factual summary used as input to the Mock copy draft.

The operator may select zero to three local image previews. A failed preview operation leaves the entered fields and previously selected previews intact. The prototype does not upload files or persist blobs; it represents selected previews with safe local object URLs only while the page is open and revokes them when removed or unmounted.

The operator can:

1. save a draft;
2. generate a deterministic description draft from supplied facts;
3. edit the generated copy;
4. preview mobile and desktop storefront presentation;
5. confirm publication explicitly.

Publication returns a synthetic published product with one variant. Double-clicking save, generate, or publish must not create duplicate service mutations while the relevant operation is processing.

## 4. Domain and service boundary

Wave 6 extends the existing project-owned contracts rather than adding provider-specific types.

### Checkout contracts

`CheckoutDraft` gains the minimum contact and delivery fields required by the approved flow:

```ts
type CheckoutDraft = {
  name: string;
  phone: string;
  email?: string;
  deliveryMethod: "home-delivery" | "store-pickup";
  address?: string;
  paymentMethod: "credit-card" | "line-pay" | "pay-at-store";
};

type CheckoutReceipt = {
  orderReference: string;
  status: "confirmed";
  total: Money;
};
```

`CheckoutService` exposes `validate(draft, cart)` and `submit(draft, cart)`. Validation checks required fields, email syntax, delivery-specific address rules, allowed payment combinations, and a non-empty cart. Submit revalidates, returns a deterministic receipt in the happy scenario, and returns a retryable `payment-failed` error in the failure scenario without logging or retaining the draft.

### Publishing contracts

`ProductDraft` gains an optional `photos` collection and factual optional fields represented as strings or selected tags; the domain contract stores only metadata needed by the prototype, not browser `File` objects or binary content.

`PublishingService` exposes:

- `generateSummary(draft)` — returns a grounded editable string;
- `saveDraft(draft)` — returns the validated draft and does not publish it;
- `publishDraft(draft, confirmation)` — requires an explicit `{ confirmed: true }` value and returns a published `Product` with exactly one variant.

The Mock implementation is in-memory and scoped to the service instance. It may retain the latest draft for the current page flow, but no browser storage or server persistence is used.

## 5. Components and data flow

- `CommerceProvider` owns one stable Catalog / Cart / Checkout / Publishing service bundle for client navigation.
- `app/checkout/page.tsx` and `features/checkout/components/checkout-page.tsx` own checkout route composition and state transitions.
- `app/admin/products/new/page.tsx` and `features/publishing/components/product-draft-page.tsx` own the operator route and form state.
- `lib/domain/types.ts`, `checkout-service.ts`, and `publishing-service.ts` define interfaces and value types.
- `lib/domain/mock/mock-checkout-service.ts` and `mock-publishing-service.ts` implement deterministic happy, validation-error, and failure behavior.
- Tests inject service doubles into both feature components, while contract tests exercise the default Mock implementations.

The checkout page reads the cart through the existing provider and never reconstructs totals from UI-only state. The publishing page owns transient form state and delegates validation, summary generation, draft save, and publication to the service.

## 6. Error and accessibility behavior

- Keep valid checkout fields after validation, network, or payment failure.
- Identify the first invalid field in a visible summary and preserve focus when practical.
- Announce loading, success, and failure messages in a polite live region.
- Use explicit labels, keyboard-reachable controls, visible focus, 48px minimum touch targets, and no placeholder-only labels.
- Disable only the operation currently processing; other valid navigation remains available unless duplicate submission would be possible.
- Keep phone help primary and LINE secondary in checkout success and shortage notices.
- Preserve product draft text and selected photo previews when summary generation or save fails.
- Require confirmation before publication and show a distinct published state.
- Do not expose private contact data in error text, console output, fixtures, snapshots, or analytics.

## 7. Acceptance criteria

### Checkout

1. A guest can progress through contact, delivery, and review with phone required and email optional.
2. Delivery and payment combinations are validated through `CheckoutService`, not hard-coded in presentation-only branches.
3. Empty cart, invalid fields, service error, processing, payment failure, and success states are covered.
4. Valid inputs remain after failure, and duplicate submission does not create more than one synthetic receipt.
5. No payment credentials or personal data are persisted outside the current React flow.

### Product draft publishing

1. An operator can enter the minimum fields on mobile and desktop using one page.
2. Zero to three photo previews are supported without losing text on failure; no binary file is persisted.
3. Save draft, generate grounded summary, edit, preview, and explicit publish are distinct states.
4. Missing facts remain visibly missing; generated text does not add unsupported claims.
5. Publish is idempotence-protected while processing and returns one synthetic single-variant published product.
6. Draft, validation error, save failure, publish failure, and published states are tested.

## 8. Verification plan

- TDD unit tests for expanded Mock checkout and publishing contracts, including invalid combinations, failure recovery, grounding, and explicit confirmation.
- RTL tests for checkout and product draft state transitions, keyboard labels, live regions, and data preservation.
- Integration tests for shared provider service injection and cart-to-checkout flow.
- Chromium acceptance for checkout happy / failure recovery and product draft save / publish.
- TypeScript, ESLint, production build, `git diff --check`, and secret scan.
- WebKit and Docker are attempted when the local environment supports them; missing executables or Docker are recorded as environment limitations rather than hidden.

## 9. Non-goals and follow-up

- Real payment or refund processing
- Authentication, authorization, admin accounts, or persistent product storage
- Real file upload, image transformation, or cross-device draft recovery
- ERP, order database, inventory quantities, shipping provider, or notification integration
- Wave 7 release-quality verification and preview deployment
