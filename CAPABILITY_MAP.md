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

## S. Phase 10 ERP reuse & integration planning — planning complete, no integration — 2026-09-23

| Area | Status | Evidence / boundary |
|---|---:|---|
| ERP capability inventory | ✅ | Product/PIM, inventory, orders, customer, payment ledger, logistics, permissions, audit, import/export mapped |
| Candidate comparison | ✅ | ERPNext, Odoo, Dolibarr compared as ERP candidates; Medusa, Saleor, Vendure as commerce baselines |
| Website ↔ ERP contract | ✅ draft | Versioned DTO, correlation/idempotency metadata, normalized errors, retry and reconciliation rules defined; no endpoint exists |
| Data mapping and sync | ✅ draft | Product/inventory ERP→Website; order/publish Website→ERP with explicit gates; payment/logistics stay provider adapters |
| Capability ownership | ✅ | Direct ERP reuse vs adapter translation vs website-owned UX/content/human validation is explicit |
| Minimal PoC | ✅ planned | 10-B synthetic fixture mapping; no ERP, database, external service, Docker, payment, logistics, or deployment |
| Final ERP selection / integration | ⬜ | Waiting for license, security, backup review and explicit implementation authorization |

Phase 10 is planning-only. No real customer or product data has been sent to an ERP, and no candidate has been adopted.

## T. Phase 10 candidate shortlist and PoC plan — 2026-09-23

| Candidate | Role | Status | Scope |
|---|---|---:|---|
| ERPNext | ERP reuse candidate | ✅ shortlisted | Catalog／Inventory／Order fixture mapping; later license and sandbox gates |
| Vendure | TypeScript commerce integration candidate | ✅ shortlisted | Catalog／Inventory／Order GraphQL fixture mapping; not a full ERP |
| Dolibarr | SMB ERP alternative | ✅ comparison candidate | REST／Docker feasibility comparison; not selected for first PoC |
| Odoo | ERP comparison candidate | 🟡 gated | API plan／edition and license constraints require review |
| Medusa | Commerce comparison baseline | 🟡 gated | Core MIT but community Docker and enterprise-material license caveats |

### PoC acceptance boundary

- Synthetic Catalog／Inventory／Order fixtures only; no real product, customer, payment, logistics, database or formal deployment.
- Both shortlisted shapes must map into project-owned DTOs, expose normalized errors, preserve idempotency semantics, support adapter swapping, and leave UI components unchanged.
- Contract tests, TypeScript, lint, build and existing regression must pass before any future sandbox review.

## U. Phase 10-B mapping PoC — completed, no live integration — 2026-09-23

| Capability | Status | Evidence |
|---|---:|---|
| ERPNext-shaped product／variant mapping | ✅ | Synthetic `item_code`／variant payload maps to project-owned Product DTO |
| Vendure-shaped product／variant mapping | ✅ | Synthetic Product／Variant payload maps to the same Product DTO |
| Inventory quantity／status mapping | ✅ | Reserved／allocated quantities normalize to available quantity and status |
| Order reference／status／total mapping | ✅ | Synthetic order payloads normalize to canonical Order DTO |
| Customer reference mapping | ✅ | Provider identifiers normalize to `externalId` |
| DTO／error translation | ✅ | Provider shapes stay in adapter; malformed payloads use `erp-mapping-invalid` |
| Adapter swapping | ✅ | Override adapter test passes without UI or consumer changes |
| UI behavior | ✅ unchanged | No UI imports the PoC adapter; existing storefront tests remain green |
| Live ERP integration | ⬜ | No ERP server, database, payment, logistics, external API, or formal deployment |

**PoC conclusion:** Vendure is the easiest current TypeScript boundary fit and needs the least mapping. ERPNext needs more custom mapping but supplies broader ERP capabilities. No formal adoption decision was made; next work requires an explicit sandbox／license／operations gate.

## V. Phase 10-C ERPNext physical environment verification — locally verified — 2026-09-23

| Gate | Status | Evidence |
|---|---:|---|
| Docker CLI／daemon | ✅ | Docker Desktop 4.92.0, Engine 29.8.0, WSL2 backend; daemon healthy |
| Hardware／memory／disk preflight | ✅ | Virtualization enabled; Ryzen 9 7945HX; ~63.2 GB RAM; C: had >3 TB free |

| Official ERPNext setup | ✅ | Official frappe/frappe_docker pwd.yml copied to local-only pwd-local.yml; ERPNext v16.35.0 running |
| Product／variant read | ✅ | Synthetic Item SYN-TEA-001 and Standard Selling price read via authenticated API |
| Inventory query | ✅ | Bin reported 10 units in Synthetic Stores - STC |
| Synthetic order/status | ✅ | Sales Order SAL-ORD-2026-00001, TWD 300, status To Deliver and Bill |
| API authentication／DTO mapping | ✅ | Session login resolved Administrator; Phase 10-C capture mapper test passes |

The previous blocked-before-installation note is historical. This local disposable verification supersedes it; it does not constitute production approval or formal ERP adoption.

## W. Phase 10-C CI safety gate and adapter design — 2026-09-23

| Capability | Status | Evidence / boundary |
|---|---:|---|
| Feature-branch CI trigger | ✅ | Quality workflow now runs on `feature/wave-1-reproducible-baseline` pushes and pull requests |
| Minimal safety CI | ✅ | Run [#21](https://github.com/Johnyu88/cheng-tea-shop/actions/runs/35813533756): install, 17/101 Vitest, focused 1/1, TypeScript, ESLint, secret scan all passed |
| ERPNext adapter layering design | ✅ design-only | `docs/erp/phase-10c-erpnext-adapter-layer-design.md`; server-only Catalog／Inventory／Order boundaries defined |
| Formal ERPNext adapter implementation | ⬜ | Requires explicit implementation approval and license／secret／backup／sandbox gates |
| Formal website／payment／logistics integration | ⬜ | Not started and intentionally excluded |

CI success is a reproducibility and safety-gate result, not production or formal ERP adoption evidence. `next-env.d.ts` remains a pre-existing uncommitted change.
