# CAPABILITY MAP

Last updated: 2026-09-20

Status legend: ✅ complete · 🟡 in progress · ⬜ not started · ⛔ blocked

## A. Project governance

| Capability | Status | Evidence / next action |
|---|---:|---|
| Website-first architecture | ✅ | Approved in `WHITEPAPER.md` and the 2026-09-12 architecture spec |
| Goal-first template reuse policy | ✅ | Reuse mature, licensed, maintainable solutions when they fit; record selection evidence |
| Concise resume prompt | ✅ | `RESUME_PROMPT.md` merged to `main` |
| Agent roles and authority | ✅ | Approved design recorded in `AGENTS.md` |
| Branch, review, and merge workflow | ✅ | Approved design recorded in `WORKFLOW.md` |
| Dynamic 2–4 specialist dispatch | ✅ | Codex orchestrates; full team is not activated by default |
| 35B second-review policy | 🟡 | Role approved; invocation method must be inspected on the connected computer |
| Morning progress report | ✅ | Enabled daily at 08:00 Asia/Taipei; sends only on meaningful change or access failure |

## B. Product delivery

| Phase | Status | Current capability / exit condition |
|---|---:|---|
| Phase 0 — Direction and specification | ✅ | Brand, audience, storefront functions, information architecture, and core acceptance criteria approved |
| Phase 1 — UX/UI | 🟡 | Core responsive wireframes, required states, and frontend implementation plan approved; real-content validation and prototype-based older-user testing remain |
| Phase 2 — Frontend prototype | 🟡 | Wave 0 audit complete: wholesale template import rejected; Wave 1 clean baseline is next after merge |
| Phase 3 — Backend capability map | ⬜ | Validated domain models and Unified API contract |
| Phase 4 — ERP selection | ⬜ | Licensed, maintained, secure candidate selected from evidence |
| Phase 5 — Integration | ⬜ | ERP, payment, and logistics adapters pass integration tests |
| Phase 6 — Production hardening | ⬜ | Security, backup, monitoring, performance, and release gates pass |

## C. Elder-friendly product publishing

| Capability | Status | Evidence / next action |
|---|---:|---|
| Mobile and desktop single-item publishing UX | ✅ | Design approved; implementation not started |
| Optional one-to-three photo upload with assisted processing | ✅ | Missing photos use a labeled brand placeholder; retain preview and recovery requirements |
| AI-assisted product description draft | ✅ | Design approved; human confirmation and no-fabrication guardrails required |
| Draft, preview, and explicit publish flow | ✅ | Design approved; implementation not started |
| Simple available / sold-out inventory | ✅ | Design approved; no exact quantity in first version |
| Oversell exception handling | ✅ | Contact customer within 24 hours for exchange or refund |
| 40-plus product catalog capacity | ✅ | Design requires at least 40 products without a fixed 40-item ceiling |
| Incremental draft-to-publish workflow | ✅ | Publish each completed item independently; unfinished items remain private drafts |
| Elder-friendly one-page minimum form | ✅ | Name, single specification, price, tea category, and availability are the minimum fields |
| Branded missing-photo fallback | ✅ | Use one labeled “商品照片準備中” image; never substitute another product photo |
| Product publishing implementation | ⬜ | Plan approved; begins in Phase 2 after explicit user authorization |

## D. Approved storefront experience

| Capability | Status | Evidence / next action |
|---|---:|---|
| Mountain-mist brand direction | ✅ | Mist green, warm ivory, tea brown, serif headings, sans-serif body |
| Authentic tea-mountain photography policy | ✅ | Real Taiwanese tea-mountain imagery; no false origin implications |
| Homepage information order | ✅ | Hero → taste cards → three featured teas → story → visit → assurance → contact |
| Taste-first product discovery | ✅ | Four large cards: light/fragrant, sweet, rich, roasted |
| Concise product cards | ✅ | Photo, name, price, one taste sentence, sold-out state |
| Product detail hierarchy | ✅ | Buying essentials before story, production, and brewing details |
| In-person tea contact | ✅ | Secondary telephone and LINE entry; no automated booking in first version |
| Guest checkout | ✅ | No mandatory account; three mobile steps |
| Customer contact fields | ✅ | Phone required; email optional |
| First-version delivery | ✅ | Home delivery and in-store pickup |
| First-version payment choices | ✅ | Credit card / LINE Pay online; in-store payment allowed for pickup |
| Configurable shipping rules | ✅ | Fixed fee and free-shipping threshold remain configurable |
| Non-aggressive content policy | ✅ | No autoplay, countdowns, intrusive pop-ups, or unsupported claims |
| Mobile homepage wireframe | ✅ | Design approved; implementation not started |
| Mobile product-detail wireframe | ✅ | Design approved; buying essentials appear before story and brewing details |
| Mobile cart and checkout wireframes | ✅ | Design approved; cart plus three checkout steps |
| Small design system | ✅ | Approved color, typography, form, focus, and touch-target rules |
| Optional ambient nature experience | ✅ | Design rules approved; sound defaults off and requires explicit user action |
| Desktop and responsive wireframes | ✅ | Desktop home, product, checkout, and tablet checkout behavior approved |
| Complete state mockups | ✅ | Loading, empty, network, sold-out, form, payment, and success states approved |
| Multi-item checkout summary | ✅ | Show all 1–3 items; show first three and expandable remainder for 4+ items |
| Elder-friendly checkout safeguards | ✅ | Phone help first; session-only PII; cart persists; errors preserve valid input |
| Homepage real-length copy and responsive composition | ✅ | Approved hero copy, story direction, three featured products, and 360/768/1024/1440 layout behavior |
| Real content and asset validation | 🟡 | Store-owned photo permission confirmed; labeled placeholders are allowed; origin and product claims still need evidence |
| Prototype-based older-user testing | ⬜ | Run with real older users after an operable prototype exists |

## E. Wave 1 baseline status

| Capability | Status | Evidence / next action |
|---|---:|---|
| Reproducible Next.js baseline | 🟡 | PR #12 uses Next.js 16.3.5, strict TypeScript, Tailwind 4, shadcn conventions, and pinned Node/pnpm; await a fresh full Quality run |
| Health and standalone container boundary | 🟡 | `/api/health` contract and non-root standalone Dockerfile are committed; Docker smoke is CI-only because local Docker is unavailable |
| Browser and accessibility gates | 🟡 | Chromium/WebKit and axe tests plus CI workflow are committed; await clean-runner result |
| Dependency and secret hygiene | 🟡 | Lockfile generated on a clean runner, direct versions pinned, notices and env example added; final audit remains pending |

No candidate-template application code or assets, ERP, real authentication, real payment, real product data, or secrets were added. Reuse remains limited to individually reviewed MIT primitives.

## F. Current next capability

## C. Elder-friendly product publishing

| Capability | Status | Evidence / next action |
|---|---:|---|
| Mobile and desktop single-item publishing UX | ✅ | Design approved; implementation not started |
| Optional one-to-three photo upload with assisted processing | ✅ | Missing photos use a labeled brand placeholder; retain preview and recovery requirements |
| AI-assisted product description draft | ✅ | Design approved; human confirmation and no-fabrication guardrails required |
| Draft, preview, and explicit publish flow | ✅ | Design approved; implementation not started |
| Simple available / sold-out inventory | ✅ | Design approved; no exact quantity in first version |
| Oversell exception handling | ✅ | Contact customer within 24 hours for exchange or refund |
| 40-plus product catalog capacity | ✅ | Design requires at least 40 products without a fixed 40-item ceiling |
| Incremental draft-to-publish workflow | ✅ | Publish each completed item independently; unfinished items remain private drafts |
| Elder-friendly one-page minimum form | ✅ | Name, single specification, price, tea category, and availability are the minimum fields |
| Branded missing-photo fallback | ✅ | Use one labeled “商品照片準備中” image; never substitute another product photo |
| Product publishing implementation | ⬜ | Plan approved; begins in Phase 2 after explicit user authorization |

## D. Approved storefront experience

| Capability | Status | Evidence / next action |
|---|---:|---|
| Mountain-mist brand direction | ✅ | Mist green, warm ivory, tea brown, serif headings, sans-serif body |
| Authentic tea-mountain photography policy | ✅ | Real Taiwanese tea-mountain imagery; no false origin implications |
| Homepage information order | ✅ | Hero → taste cards → three featured teas → story → visit → assurance → contact |
| Taste-first product discovery | ✅ | Four large cards: light/fragrant, sweet, rich, roasted |
| Concise product cards | ✅ | Photo, name, price, one taste sentence, sold-out state |
| Product detail hierarchy | ✅ | Buying essentials before story, production, and brewing details |
| In-person tea contact | ✅ | Secondary telephone and LINE entry; no automated booking in first version |
| Guest checkout | ✅ | No mandatory account; three mobile steps |
| Customer contact fields | ✅ | Phone required; email optional |
| First-version delivery | ✅ | Home delivery and in-store pickup |
| First-version payment choices | ✅ | Credit card / LINE Pay online; in-store payment allowed for pickup |
| Configurable shipping rules | ✅ | Fixed fee and free-shipping threshold remain configurable |
| Non-aggressive content policy | ✅ | No autoplay, countdowns, intrusive pop-ups, or unsupported claims |
| Mobile homepage wireframe | ✅ | Design approved; implementation not started |
| Mobile product-detail wireframe | ✅ | Design approved; buying essentials appear before story and brewing details |
| Mobile cart and checkout wireframes | ✅ | Design approved; cart plus three checkout steps |
| Small design system | ✅ | Approved color, typography, form, focus, and touch-target rules |
| Optional ambient nature experience | ✅ | Design rules approved; sound defaults off and requires explicit user action |
| Desktop and responsive wireframes | ✅ | Desktop home, product, checkout, and tablet checkout behavior approved |
| Complete state mockups | ✅ | Loading, empty, network, sold-out, form, payment, and success states approved |
| Multi-item checkout summary | ✅ | Show all 1–3 items; show first three and expandable remainder for 4+ items |
| Elder-friendly checkout safeguards | ✅ | Phone help first; session-only PII; cart persists; errors preserve valid input |
| Homepage real-length copy and responsive composition | ✅ | Approved hero copy, story direction, three featured products, and 360/768/1024/1440 layout behavior |
| Real content and asset validation | 🟡 | Store-owned photo permission confirmed; labeled placeholders are allowed; origin and product claims still need evidence |
| Prototype-based older-user testing | ⬜ | Run with real older users after an operable prototype exists |

## E. Wave 1 baseline status

| Capability | Status | Evidence / next action |
|---|---:|---|
| Reproducible Next.js baseline | 🟡 | PR #12 uses Next.js 16.3.5, strict TypeScript, Tailwind 4, shadcn conventions, and pinned Node/pnpm; await a fresh full Quality run |
| Health and standalone container boundary | 🟡 | `/api/health` contract and non-root standalone Dockerfile are committed; Docker smoke is CI-only because local Docker is unavailable |
| Browser and accessibility gates | 🟡 | Chromium/WebKit and axe tests plus CI workflow are committed; await clean-runner result |
| Dependency and secret hygiene | 🟡 | Lockfile generated on a clean runner, direct versions pinned, notices and env example added; pnpm build policy moved to workspace config; local audits are clean, final CI review remains pending |

No candidate-template application code or assets, ERP, real authentication, real payment, real product data, or secrets were added. Reuse remains limited to individually reviewed MIT primitives.

## F. Wave 3 domain and Mock Adapter status

| Capability | Status | Evidence / next action |
|---|---:|---|
| Shared domain contracts | ✅ | Money, catalog, cart, checkout, and product-draft types are exported from `lib/domain` |
| Deterministic synthetic catalog | ✅ | 48 stable products, cursor paging, category/taste filters, empty and error scenarios |
| Mock cart service | ✅ | Integer TWD totals, sold-out rejection, purchase-limit rejection, and state preservation |
| Mock checkout validation | ✅ | Phone required; delivery/payment compatibility is validated without payment credentials |
| Mock product publishing | ✅ | One-specification draft save/publish with labeled placeholder and supplied facts only |
| UI integration | 🟡 | Wave 4 homepage preview connects `CatalogService` and renders three products plus loading/empty/error states; teacher story media is included; browser review remains |
| Persistent catalog and real data | ⬜ | Wait for persistence, authentication, authorization, backup, and restore |

Wave 3 local verification: Vitest 6 files / 14 tests, ESLint, TypeScript, and production build passed. Wave 4 local verification: Vitest 6 files / 17 tests, ESLint, TypeScript, and production build passed. Browser e2e, responsive browser review, and Docker smoke remain unverified locally. PR #12 still requires its fresh clean-runner Quality result and final QA/Security review; do not merge `main` automatically.

## G. Wave 4.1 catalog browsing status

| Capability | Status | Evidence / next action |
|---|---:|---|
| Complete catalog browsing | ✅ | `CatalogBrowser` consumes `CatalogService`, supports cursor-based loading, four approved taste filters, accessible pressed states, and loading/empty/error/retry paths |
| 40-plus synthetic catalog navigation | ✅ | Load-more behavior preserves prior products and follows adapter cursors; no fixed 40-item ceiling or real catalog data added |
| Responsive elder-friendly controls | 🟡 | Large keyboard-focusable filter/load-more controls and mobile two-column filter layout are implemented; headless Chromium interaction review passed, visual browser surface remains unavailable |
| Product detail and cart | ⬜ | Reserved for Wave 5 |

Wave 4.1 local verification: Vitest 7 files / 22 tests, ESLint, TypeScript, Webpack production build, Chromium smoke/axe e2e (3/3), and headless Chromium catalog interaction review passed. Turbopack was not used in the isolated worktree because its filesystem-root check rejects the temporary external dependency junction; CI should run the standard build with a clean install. Visual browser surface review and Docker smoke remain unverified locally.

No real product data, customer data, payment credentials, ERP integration, authentication, persistence, or secrets were added.

Next action: review the homepage and complete catalog in a browser, then plan Wave 5 product detail and cart through the existing domain interfaces.

## H. Wave 5 product detail and cart status — 2026-09-21

| Capability | Status | Evidence / next action |
|---|---:|---|
| Product detail route and purchase essentials | ✅ | `/tea/[slug]` loads through `CatalogService`, preserves not-found/service-error states, and exposes single-variant quantity controls with accessible focus |
| Cart line operations | ✅ | `/cart` supports empty state, add/merge, quantity updates, removal, subtotal, service errors, and a disabled/placeholder checkout boundary |
| Shared commerce provider state | ✅ | App Router client navigation shares one Mock Catalog/Cart service instance without localStorage/sessionStorage |
| Synthetic sold-out and purchase-limit coverage | ✅ | Wave 5 tests cover sold-out rejection and max-quantity preservation using synthetic fixtures |
| Wave 5 browser gate | 🟡 | Direct Vitest passed 11 files / 40 tests and lint exited 0 with one warning; typecheck/build/e2e remain limited by recorded environment errors |
| Wave 5 non-goals | ✅ | No real products, customer data, payment credentials, checkout flow, ERP, login, persistence, or precise inventory were added |

Wave 5 verification was recorded in `.superpowers/sdd/2026-09-20-product-detail-and-cart/task-7-report.md`. The next milestone is Wave 6 checkout, payment-state, and product-draft work after the typecheck/build/browser gate is repaired or run on a clean dependency environment.

## I. Wave 6 checkout and product-draft status — 2026-09-21

| Capability | Status | Evidence / next action |
|---|---:|---|
| Guest checkout prototype | ✅ | `/checkout` uses the project-owned `CheckoutService` for three-step contact, delivery, review, synthetic success, retryable failure, and duplicate-submit protection; full Vitest passed 15 files / 96 tests |
| Elder-friendly product-draft prototype | ✅ | `/admin/products/new` supports minimum fields, zero-to-three transient preview metadata, grounded editable Mock copy, save, preview, explicit confirmation, and synthetic publish; no real admin account or persistent media is involved |
| Session-only privacy boundary | ✅ | Requested scans found no storage, console, card-number, security-code, or secret-term matches in Wave 6 source/test scopes; contact and draft flow data remains transient |
| Wave 6 type and lint gates | ✅ | TypeScript exited 0; full ESLint exited 0 with one existing `no-img-element` warning outside the Wave 6 diff |
| Wave 6 build and Chromium acceptance | 🟡 | Sandboxed webpack build hit `EPERM` on `.next/trace`; approved retry hit `EBUSY` on locked `.next/standalone`; Chromium was deliberately not started without a fresh standalone build |
| WebKit and Docker capability | 🟡 | No WebKit executable or Docker CLI is available; WebKit listing also hit `EPERM` creating `playwright-report` |
| Final diff hygiene | ✅ | Secret scans had no matches, complete diff check passes after correcting the Wave 6 spec header whitespace, and `next-env.d.ts` stays unstaged |
| Wave 6 non-goals | ✅ | No real authentication, payment, persistence, ERP integration, file upload, customer/order data, or provider credentials were added |

Wave 6's implementation and unit/component/integration coverage are verified locally, but its final build/browser/container gate remains incomplete. See `.superpowers/sdd/2026-09-21-wave-6-checkout-product-draft/final-verification-report.md` for exact commands and errors.

## J. Wave 7-A frontend shopping quality gate — 2026-09-22

| Capability | Status | Evidence / next action |
|---|---:|---|
| Frontend shopping journey Chromium gate | ✅ | 14/14 storefront, cart, checkout, product-draft, responsive, and accessibility journeys passed |
| Primary storefront axe coverage | ✅ | Homepage plus product detail, cart, checkout, and product draft have no detectable axe violations |
| Production build and static output | ✅ | Next.js Webpack build passed; standalone static/public assets synchronized for acceptance server |
| WebKit gate | ✅ | Official Playwright WebKit install completed with Node `--use-system-ca`; full acceptance passed 14/14 |
| Docker smoke gate | 🟡 | Docker CLI unavailable locally; rerun in CI/clean runner |
| Accessibility contrast repair | ✅ | Catalog count now uses an accessible foreground color; no new axe violations |
| Real preview deployment | ⬜ | Requires explicit environment/credential authorization and cost review |
| Older-user task-based validation | ⬜ | Requires real participants after the operable prototype is available |

## K. Wave 7-A human-validation boundary and offline next work — 2026-09-22

| Human comprehension of elder-friendly copy and layout | 🟡 | Must be verified with real older participants; automation must not be used as a substitute |
| Human intuition of buttons and navigation | 🟡 | Must be verified with real participants observing first-attempt discovery and recovery |
| Human understanding of product facts and placeholders | 🟡 | Must be verified with real participants; synthetic product and placeholder comprehension is not inferred from e2e |
| Mock storefront boundary | 🟡 | Catalog, cart, checkout, and publishing use project-owned deterministic Mock services; no persistence or real customer/order data |
| Product publishing page | 🟡 | Operable draft/preview/publish prototype only; no admin authentication, upload, persistence, or real publication |
| Checkout payment boundary | 🟡 | Payment choices are synthetic UI state only; real payment integration and credentials remain out of scope |
| Checkout prototype boundary copy | ✅ | Initial and synthetic-success states explicitly say this is a synthetic prototype, sends no real payment, and stores no payment data; unit/e2e coverage added |
| Next offline candidate | ⬜ | No new product behavior selected yet; keep human validation, preview, Docker, persistence, login, payment, and ERP out of scope |

## L. Next-phase construction map — 2026-09-22

| Area | Status | Construction boundary |
|---|---:|---|
| Verified storefront, catalog, detail, cart, checkout, prototype boundary, and draft publishing | ✅ | Wave 7-A browser/axe gate and 98 unit tests pass |
| Mock/stub/draft services and synthetic data | 🟡 | Catalog, cart, checkout, publishing, products, receipts, payment choices, and publication remain local synthetic boundaries |
| Pure-local continuation | 🟡 | Regression maintenance and local DTO/error/fake-adapter contract tests only; no speculative product scope |
| Human validation required | 🟡 | Elder-user comprehension, button/navigation intuitiveness, product fact and placeholder understanding |
| Preview/Docker/external work | 🟡 | Docker, preview, real content, persistence, auth, payment, logistics, ERP, backup, monitoring |
| Future API boundary map | ⬜ | Catalog, Cart, Checkout, tokenized Payment, Logistics, Publishing, and isolated ERP adapters are documented in WHITEPAPER |
| Recommended next Phase | ⬜ | Phase 8 Integration-readiness contract hardening; local in-memory fake adapters and DTO/error contract tests |

## M. Phase 8 integration-readiness contract hardening — 2026-09-22

| Capability | Status | Evidence / boundary |
|---|---:|---|
| Catalog/Cart/Checkout/Publishing DTO aliases | ✅ | Explicit DTO exports preserve the existing domain shapes for adapter boundaries without changing UI payloads |
| Payment/Logistics/ERP DTOs | ✅ | `lib/domain/integration-types.ts` defines narrow request/result DTOs; payment DTOs contain no raw card number, security code, or credential field |
| Payment/Logistics DTO validation | ✅ | Runtime validators reject malformed payment and delivery/fulfillment requests before adapter calls with stable non-retryable errors |
| Replaceable service interfaces | ✅ | `PaymentService`, `LogisticsService`, and `ErpService` are independent interfaces returning `ServiceResult` |
| Normalized adapter error mapping | ✅ | `mapAdapterError` maps payment/logistics/ERP adapter failures to stable domain error codes and preserves message/retryability |
| Local in-memory fake adapters | ✅ | Synthetic Payment, Logistics, and ERP adapters return `simulated` results only; no network, credential, persistence, or external provider |
| Grouped integration adapter boundary | ✅ | `createInMemoryIntegrationAdapters` exposes Payment/Logistics/ERP as one replaceable local bundle |
| Payment/Logistics adapter swapping | ✅ | Bundle accepts independent Payment and Logistics implementations through typed overrides; contract tests verify identity preservation |
| Frontend service injection | ✅ | `CommerceProvider` now obtains its default Catalog/Cart/Checkout/Publishing bundle from `createInMemoryCommerceServices`; existing injection remains supported |
| Contract/regression verification | ✅ | 16 Vitest files / 103 tests, TypeScript, lint, Webpack build, Chromium 14/14, WebKit 14/14 |
| Catalog/Cart/Checkout boundary validation | ✅ | Runtime validators reject malformed query, cart, and checkout DTOs with stable non-retryable domain errors |
| Catalog-to-Cart adapter swapping | ✅ | Default in-memory Cart is constructed with the injected Catalog adapter; contract test adds an item through an alternate Catalog implementation |
| Independent Checkout swapping | ✅ | Commerce bundle accepts an alternate Checkout implementation without changing the provider contract |
| Real integrations | ⬜ | Payment, logistics, ERP, authentication, persistence, preview, and Docker remain outside this slice |

Phase 8 first and second local slices are complete. The next safe work is contract maintenance or a separately approved boundary slice; do not infer real-provider readiness from these local fakes. Full browser regression is stable when each browser project runs with one worker; a parallel run exposed a shared standalone mock-state race and was not treated as a product failure.

## N. Phase 8 contract coverage matrix — 2026-09-22

| Service | DTO / interface | Runtime validation | Error model | In-memory fake | Override / swap test | UI regression |
|---|---|---|---|---|---|---|
| Catalog | ✅ | ✅ query | ✅ domain errors | ✅ | ✅ | ✅ |
| Cart | ✅ | ✅ cart shape | ✅ domain errors | ✅ | ✅ via injected Catalog | ✅ |
| Checkout | ✅ | ✅ request shape | ✅ domain errors | ✅ | ✅ independent swap | ✅ |
| Payment | ✅ | ✅ request | ✅ adapter mapping | ✅ simulated | ✅ | ✅ unchanged |
| Logistics | ✅ | ✅ quote／fulfillment | ✅ adapter mapping | ✅ simulated | ✅ | ✅ unchanged |
| Publishing | ✅ | ✅ draft | ✅ adapter mapping + domain errors | ✅ simulated | ✅ | ✅ unchanged |
| ERP | ✅ | ✅ product／order | ✅ adapter mapping | ✅ simulated | ✅ | ✅ unchanged |

All seven service boundaries have local contract hardening. This matrix does not mean any real provider, persistence, authentication, payment authorization, fulfillment, CMS publication, or ERP synchronization is implemented.

## O. Phase 8 closure — completed / integration-ready prototype — 2026-09-22

| Closure check | Status | Evidence |
|---|---:|---|
| Unified default service/adaptor factory | ✅ | `createInMemoryCommerceServices` plus `createInMemoryIntegrationAdapters` run the local storefront contracts |
| Minimal integration smoke | ✅ | `tests/phase-8-integration-smoke.test.tsx`, 2/2: default flow, adapter replacement, error mapping, and UI boundary leakage check |
| Existing frontend behavior | ✅ | Existing Chromium/WebKit storefront regression each 14/14 |
| Phase 8 scope boundary | ✅ | No new service type; no real API, database, payment, logistics, ERP, preview, or paid service |
| Phase 8 status | ✅ | Completed as an integration-ready prototype, not production integration |

### Phase 9 candidates — not started

1. 真人年長使用者走查與可理解性驗證。
2. 真實商品／素材證據與內容治理。
3. Preview／Docker／release pipeline readiness。
4. Authentication、persistence、observability and backup design。
5. Future tokenized payment、logistics、CMS and ERP integration planning.

Phase 9 requires a separate scope decision and is intentionally not implemented in this closure.

## P. Phase 9-A validation preparation — ready, no human result yet — 2026-09-22

| Capability | Status | Evidence / boundary |
|---|---:|---|
| Final older-user facilitator script | ✅ | `docs/testing/phase-9a-older-user-and-content-validation-pack.md`, T1–T8, consent, neutral prompts, stop rules |
| Observation form and P0–P3 rubric | ✅ | De-identified session template and severity rules are ready; no participant result recorded |
| Real content replacement checklist | ✅ | Photo, copy, evidence, license, alt text, owner, and approval gates documented |
| Placeholder / synthetic inventory | ✅ | Current synthetic catalog, payment boundary, draft publish, fulfillment, ERP references are listed in the execution pack |
| Phase 9-A preflight tool | ✅ | `phase-9a-preflight.mjs` performs local documentation-only checks and does not start services |
| Real older-user validation | ⬜ | Waiting for participant, consent, and controlled session; automation/dry run is not evidence |
| Real content validation | ⬜ | Waiting for store-approved photos, copy, source evidence, and permission |

Phase 9-A is **preparation-ready only**. Do not move human-validation or real-content capabilities to complete until direct evidence is recorded and the three project documents are updated from that evidence.

## Q. Phase 9-A real product material import specification — defined, awaiting store data — 2026-09-22

| Area | Status | Boundary |
|---|---:|---|
| Product import field contract | ✅ | JSON canonical shape and CSV header define name, tea type, origin, year, weight, price, aroma, taste, aftertaste, brewing, inventory, image, sort, and publication status |
| Image requirements and naming | ✅ | Format, dimensions, size, alt text, permission, SHA-256, stable `content_id`, versioned filename rules documented |
| Validation and evidence gates | ✅ | Type/range, source, permission, hash, safety, publication approval, and regression rules documented |
| Placeholder replacement flow | ✅ | Staging-first, failure-preserves-placeholder, rollback/version, test and human-validation gates documented |
| Real content imported | ⬜ | No real name, price, origin, year, image, or copy has been supplied or changed |

The specification deliberately reserves fields not currently supported by the prototype runtime (`harvest_year`, `weight_g`, `aftertaste`, full brewing, evidence, and sort) without implementing them. Wait for store-provided data and evidence before any replacement.

## R. Phase 9-A product import toolchain — ready, no real data loaded — 2026-09-22

| Toolchain capability | Status | Evidence / boundary |
|---|---:|---|
| CSV／JSON empty templates | ✅ | Canonical CSV header and empty JSON array; no product content included |
| Field/type validator | ✅ | `scripts/phase-9a-product-import.mjs` checks required fields, enum, integer TWD price, positive weight, sort, and publication evidence |
| Duplicate／format checks | ✅ | Reports missing fields, duplicate IDs／sort orders, invalid price／weight, JSON／CSV shape errors |
| Image ID/name validation | ✅ | Checks `<content-id>__<view>__vNN` naming, allowed extension, metadata, hash, and optional image directory existence |
| Placeholder／synthetic map | ✅ | `phase-9a-placeholder-synthetic-map.md` records current values without treating them as import data |
| Dry-run and error report | ✅ | CLI outputs JSON with `wouldWrite: false`; `--apply` is explicitly rejected; optional report output is separate |
| Real data loaded | ⬜ | Waiting for store-provided package; current fixtures and placeholder remain unchanged |

This is an offline validation toolchain only. It does not overwrite catalog data, upload images, call external services, or add business behavior.

## S. Phase 10 ERP reuse & integration planning — planning complete, no integration — 2026-09-22

| Area | Status | Boundary / evidence |
|---|---:|---|
| ERP capability inventory | ✅ | Product/PIM, inventory, orders, customer, payment ledger, logistics, permissions, audit, import/export mapped to current service boundaries |
| Candidate comparison | ✅ | ERPNext, Odoo, Dolibarr compared as ERP candidates; Medusa, Saleor, Vendure recorded as commerce baselines in `docs/erp/phase-10-erp-reuse-integration-planning.md` |
| Website ↔ ERP contract | ✅ draft | Versioned DTO, correlation/idempotency metadata, normalized error envelope, retry and reconciliation rules defined; no real endpoint exists |
| Data mapping and sync direction | ✅ draft | Product/inventory ERP→Website, order/publish Website→ERP with explicit gates; payment/logistics remain provider adapters |
| Capability ownership | ✅ | Direct ERP reuse vs adapter-owned translation vs website-owned UX/content/human validation is explicit |
| Minimal PoC | ✅ planned | 10-B synthetic fixture mapping contract PoC; no ERP, database, external service, Docker, payment, logistics, or deployment |
| Final ERP selection / integration | ⬜ | Waiting for license/security/backup review and explicit implementation authorization |

Phase 10 is planning-only. No real customer/product data has been sent to an ERP, and no candidate has been adopted.

## T. Mobile demo local closure — 2026-09-26

| Capability | Status | Evidence / boundary |
|---|---:|---|
| Add to cart → `/cart` | ✅ | Existing product flow retained and Chromium-verified; not reimplemented |
| Continue shopping / checkout | ✅ | Existing `/cart` links plus mobile loop smoke |
| Synthetic OTP checkout | ✅ local demo | Two allowlisted synthetic phones, visible local code, expiry/rate/attempt contract; no SMS |
| Address validation | ✅ local gate | Unverifiable home address remains manual-intervention; no false success |
| Persistent synthetic order | ✅ local demo | SQLite under ignored `.demo-data/`; authoritative fixture pricing; no customer production data |
| Secure order lookup | ✅ local demo | Order token + bound phone + last three + one-time OTP; generic failure response |
| Simulated Email / merchant notifications | ✅ local demo | SQLite outbox with queued, simulated-delivered, failed, retry states; no provider |
| Mobile push | ✅ contract preview only | Typed `simulated-mobile-push` payload with `preview-only`; no registration or delivery |
| Merchant work queue | ✅ local demo | Independent merchant credential, short-lived cookie, `/admin/orders` |
| Packing photo / shipment | ✅ local demo | Private local image store; packing means `packed`; explicit payment and manual ship gates |
| Mobile Chromium closure | ✅ | Pixel 7 viewport customer → merchant → customer state loop |
| Membership list | ⬜ deferred | Intentionally not allowed to delay the primary shopping/order loop |
| Real payment / logistics / messaging / production | ⬜ prohibited | No provider, public binding, deployment, real credential, or customer data |

## U. Same-LAN phone demo readiness — 2026-09-26

| Check | Status | Evidence / limitation |
|---|---:|---|
| Explicit LAN opt-in | ✅ | `DEMO_COMMERCE_LAN=enabled`; RFC1918 private IPv4 only; loopback default unchanged |
| Local server binding | ✅ prepared | `172.20.10.4:3013` started for this session; no `0.0.0.0`, no firewall change |
| Required demo URLs | ✅ | `/`, `/cart`, `/checkout`, `/orders`, `/admin/orders` |
| Synthetic-data boundary | ✅ | OTP `123456`, mock catalog, simulated payment／notifications, ignored `.demo-data` |
| Real phone run | ⬜ pending | LAN URL synthetic Chromium 1/1 passed; Chen Tea Shop operator must still run the flow on a real phone; automation is not participant evidence |
| Public／production access | ⬜ prohibited | No public binding, deployment, payment, logistics, ERP, or formal notification |

## V. Real-phone acceptance repair — 2026-09-27

## W. Fourth-round UI and product-flow repair — 2026-09-27

| Capability | Status | Boundary |
|---|---:|---|
| Desktop/mobile homepage hero | ✅ candidate only | Uses generated desktop/mobile candidate files derived from the existing portrait; final store-approved composite remains pending |
| Video replacement | ✅ | Homepage no longer renders the original video player; source file is preserved |
| Order lookup navigation | ✅ | `/orders` is present in the primary responsive navigation |
| Independent checkout success page | ✅ local Demo | `/checkout/success`; order id/status/navigation shown; token stays in same-browser storage and is absent from links |
| Admin eight-product list | ✅ local Demo | Reads the same guarded file-backed catalog used by storefront; includes image, facts, price, inventory, publication and actions |
| Product edit boundary | ✅ local Demo | Same Catalog API updates bounded editable facts without changing identity or history |
| Ninth-product material workflow | ⚠️ Mock | Raw/check/Mock-identify/Mock-compose/human-confirm/save/publish states visible; actual AI service and raw/derived archival manifest are not present |
| Publication synchronization | ✅ automated | Publish/reload/frontend display and unpublish/frontend hide are covered by Chromium evidence |
| Real phone / human verification | ⬜ pending | Chromium and screenshots cannot replace physical phone or participant evidence |

## P0 Catalog recovery evidence — 2026-09-27

| Check | Status | Evidence / limitation |
|---|---:|---|
| Active 3013 process and worktree | ✅ verified | PID 36808 `node.exe` listens on `172.20.10.4:3013`; launch session is from this worktree; Windows command-line inspection is permission-limited |
| `/api/demo/catalog` availability | ✅ verified | HTTP 200, 8 published products, same LAN origin used by browser evidence |
| Storefront/admin data source | ✅ verified | Both use `/api/demo/catalog`; admin adds `includeUnpublished=true` over the same file-backed store |
| Original eight products retained | ✅ verified | Eight published records remain in `.demo-data/lan-demo-third-round-final-2/catalog.json`; one existing ninth synthetic draft also remains |
| Browser console/network/hydration | ✅ verified | 360×800 LAN inspection: no pageerror, requestfailed, catalog API failure, or hydration error |
| Physical phone acceptance | ⬜ pending | Must reload the verified LAN URL after the P0 preflight; browser evidence is not real-phone evidence |

| Capability | Status | Evidence / limitation |
|---|---:|---|
| Eight sample products and photos | ✅ local Demo | Confirmed sample fixture and preserved media; real-content approval remains separate |
| Composite image / bird audio | ✅ resource check | HTTP 200 from active LAN server; audio requires explicit user click |
| Admin publish persistence | ✅ local Demo | Guarded API writes/reloads ignored `.demo-data`; no external persistence |
| Ninth product visibility and purchase | ✅ automated LAN | Publish → reload → detail → cart passed in clean isolated data |
| Customer / merchant / shipment loop | ✅ automated LAN | Pixel 7 Chromium 2/2; not physical-phone evidence |
| Real phone acceptance | ⬜ pending | Operator must execute at `http://172.20.10.4:3013` using synthetic data |
| Production integrations | ⬜ prohibited | No real payment, messaging, logistics, ERP, deployment, or customer data |

## W. 第三輪真人驗收修正 — 2026-09-27

| Capability | Status | Evidence / limitation |
|---|---:|---|
| Formal homepage composite | ⬜ awaiting store asset | Synthetic composite is no longer presented as official; missing-material notice is explicit |
| Cart / checkout exit paths | ✅ local Demo | Back and cancel links preserve cart and do not create an order |
| OTP retry / wrong-code feedback | ✅ local Demo | Active challenge reuse during cooldown; server verification retained; wrong code is visible |
| `/admin/products` and publication toggle | ✅ local Demo | File-backed ignored catalog; draft hidden from public catalog and rejected by order boundary |
| Ninth-product material workflow | ⚠️ Mock boundary | Raw/check/identify/compose/confirm/save/publish states are visible; no AI claim or external service; separate raw archive/derived manifest remains pending |
| Existing-product edit form | ⬜ pending | `/admin/products` has view and publication operations; no independent edit form yet |
| LAN mobile regression | ✅ automated | Pixel 7 Chromium `catalog-persistence` + `mobile-order-loop` 2/2 on isolated data; not human-phone evidence |
| Real phone acceptance | ⬜ pending | Re-run `http://172.20.10.4:3013` on a physical phone; no completion claimed |

## 第五輪閉環狀態 — 2026-09-27

| Capability | Status | Evidence / limitation |
|---|---:|---|
| Shared catalog price/publication mutation | ✅ local Demo | PATCH→GET verified for price and draft/published state; same file-backed store, no static duplicate |
| Ninth product persistence | ✅ local Demo | `台灣野生紅茶` remains after server restart; public/admin totals are 9/10 |
| Optional email checkout boundary | ✅ local Demo | Blank optional email is omitted before order API; non-empty email remains validated; focused tests cover both |
| Checkout success navigation | ✅ LAN browser | OTP → order API 200 → `/checkout/success`; thanks, order id/status, home and lookup links visible |
| P1 image recognition/composition | ⛔ blocked | No raw-data source or OCR/vision/composition provider in worktree; workflow remains explicitly Mock |
| Real phone acceptance | ⬜ pending | Automated LAN browser evidence is not physical-phone evidence |

## 第五輪補充驗收 — 2026-09-27

| Capability | Status | Evidence / limitation |
|---|---:|---|
| Ninth test tea price 888→999 | ✅ local Demo | Same file-backed catalog; PATCH/GET and restart verified |
| Ninth test tea unpublish / republish | ✅ local Demo | Public catalog hides draft, then exposes published record; historical record retained |
| Mobile brand navigation order lookup | ✅ browser regression | 360×800 link visibility and viewport bounds pass; physical phone still requires operator evidence |
| 3013 latest Wave 7 process | ✅ local evidence | Restarted from current worktree with explicit Demo flags; listener/API verified; full Windows command line unavailable |
| Actual image recognition and composition | ⛔ blocked | No raw-data source, OCR/vision provider, or verifiable derived artifact; current UI remains explicit Mock |
| Physical phone acceptance | ⬜ pending | Browser screenshots and automation do not replace real-device operation |

## 2026-09-27 收尾修復

| Capability | Status | Evidence / limitation |
|---|---:|---|
| Public brand consistency | ✅ | Metadata、首頁品牌導覽、aria-label 與 brand regression tests 使用「陳老師茶行」；歷史文件不改寫 |
| Checkout success redirect | ✅ local Demo | API 200 後 server route 傳入 order id；LAN browser 顯示感謝、編號、狀態與導覽 |
| Shared Catalog mutations | ✅ local Demo | 唯一 file-backed store；888→999、下架／上架、重啟持續已驗證 |
| Admin product facts | ✅ local Demo | 中文茶類、價格、庫存、香氣、口感、產地、商品介紹可讀取／編輯 |
| Mobile order lookup entry | ✅ browser / ⬜ physical phone | 360×800 與 1280×800 browser PASS；真人手機仍待重跑 |
| Actual image recognition and composition | ⛔ blocked | No raw source/provider/derived manifest; Mock pipeline remains explicitly labelled |
| Real payment / messaging / logistics / ERP | ⬜ prohibited | No production service or customer data enabled |

## 2026-09-27 後台商品管理簡化決策

| Capability | Status | Evidence / limitation |
|---|---:|---|
| Shared add/edit product form | ✅ local Demo | `/admin/products/new` and `/admin/products` use the same `ProductFields` and validation; edit loads the current Catalog record |
| Admin catalog list and mutations | ✅ local Demo | Existing products are listed from `/api/demo/catalog`; add, edit, publish and unpublish use the same file-backed store |
| Product fact fields | ✅ local Demo | Photo metadata, tea name, category, specification, price, inventory, aroma, taste, origin and summary remain editable |
| Built-in image recognition / extraction / composition | ❌ cancelled / out of scope | External preparation is required before upload; no Mock flow or fake progress is part of the website contract |
| Existing eight products and history | ✅ preserved | No fixture reset, catalog duplication or historical-order deletion in this change |
| Physical phone acceptance | ⬜ pending | Browser tests do not replace tomorrow's real-device walkthrough |
