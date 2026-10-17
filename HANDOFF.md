# HANDOFF

Last updated: 2026-09-21

## Wave 1 status

- Branch: `feature/wave-1-reproducible-baseline`
- Pull request: #12 (draft) — https://github.com/Johnyu88/cheng-tea-shop/pull/12
- Implemented: Next.js 16.3.5 App Router baseline, strict TypeScript, Tailwind 4, shadcn project configuration, Vitest/RTL contracts, health endpoint, standalone non-root Dockerfile, and Chromium/WebKit + axe CI definitions.
- Toolchain pins: Node 24.19.0 and pnpm 11.19.0.
- `BLOCKED_EXTERNAL`: local npm/GitHub TCP access prevents reproducing the frozen install and Docker smoke locally; the required quality workflow is the authoritative clean-runner verification.
- `NEEDS_ADVANCED_REVIEW`: final QA/security review and PR readiness still require review of the complete CI result before marking ready.
- CI follow-up: the first Quality run stopped at frozen install because pnpm 11 rejected the required `unrs-resolver` build script; the package manifest now explicitly allows only that dependency's build step, pending a fresh clean-runner result.
- The clean-runner-generated Playwright lockfile is synchronized in the feature worktree; the temporary bootstrap workflow has been removed.
- A fresh Quality workflow is requested after the pnpm build-policy fix; until it completes, CI verification remains pending.
- Local verification on 2026-09-20: frozen install, Vitest (2 files / 3 tests), ESLint, TypeScript, and production build passed after the pnpm workspace and test-boundary fixes. Playwright Chromium/WebKit browsers downloaded, but the six-test e2e run hung locally after browser launch and was stopped; e2e and Docker smoke remain unverified locally.

## Current state

- Repository: `Johnyu88/cheng-tea-shop`
- Default branch: `main`
- Product stage: Phase 2 — Frontend prototype; Wave 6 checkout and product-draft implementation is committed, with local quality-gate limitations recorded below.
- Application code: Wave 6 adds synthetic guest checkout at `/checkout` and the synthetic operator product-draft prototype at `/admin/products/new`. No candidate template code was imported.
- Highest principle: **Website First → Mock API → ERP Reuse → API Integration**
- GitHub state: `LOCAL_COMMITS_PENDING` on `codex/wave-6-checkout-product-draft`; no push or pull request was requested for this worktree.

## Last completed milestone

Wave 0 template audit was completed:

- Candidate pinned at commit 2df689427f1c22c6ed558ba59e13ac34965e6cec.
- Reject wholesale import; permit only individually reviewed MIT UI primitives and layout concepts.
- Reviewed all 78 text source/configuration files in the pinned tree.
- Candidate maturity: four commits, four stars, one fork, no release, tests, CI, Docker, or Cloud Run baseline.
- Next.js 16.1.7 is below the 2026-09-14 official security baseline; Wave 1 uses current patched stable, with 16.3.3 the known minimum on this date.
- Keep: selected App Router ideas, strict TypeScript aliases, ESLint foundation, Tailwind variables, lib/utils, and individually reviewed shadcn primitives.
- Rewrite: brand, metadata, design tokens, domain, services, Mock Adapter, storefront flows, accessibility, tests, CI, and deployment.
- Remove: Nova/sample content, unverified assets, remote dependencies, fake payment/authentication, and unapproved optional modules.
- Dynamic build was not run because security preflight rejected the candidate and the execution environment was unavailable. No template code was executed or imported.
- Evidence: docs/audits/2026-09-14-wave-0-template-audit.md.

The frontend technical selection and implementation plan was previously approved:

- Stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and pnpm.
- Reuse: audit and pin the MIT shadcn ecommerce candidate before selective import; Vercel Commerce is architecture reference only.
- Boundary: Page/Component → project-owned Frontend Service/API Interface → Mock Adapter → future ERP Adapter.
- Prototype data remains synthetic. Real 40-plus product entry waits for persistent storage, authentication, authorization, and backup/restore.
- Deployment target is Dockerized Next.js standalone on Google Cloud Run asia-east1.
- Verification includes lint, typecheck, Vitest, React Testing Library, Playwright Chromium/WebKit, accessibility, build, and Docker smoke checks.
- Eight implementation Waves are defined in docs/superpowers/plans/2026-09-14-frontend-implementation-plan.md.
- Phase 1 remains in progress; this milestone authorizes documentation only, not website code.

The public brand and progressive catalog design was previously approved:

- The public-facing brand is “龍映茗茶”; “陳老師茶行” remains an informal customer-facing alias in story and search text.
- The catalog must support at least 40 teas without a fixed 40-item ceiling.
- Products are entered one at a time through an elder-friendly one-page form.
- Minimum fields are name, single specification, price, tea category, and available / sold-out status.
- Each completed product may be published independently; unfinished products remain private drafts.
- Customers browse by both taste and tea category; the homepage still shows only three manually featured teas.
- A missing product photo uses a consistent branded placeholder labeled “商品照片準備中”; another tea’s photo must never be used as a substitute.
- The current shop and identifiable-person photos were confirmed as shop-created/uploaded and approved for website use; originals are preferred when available.
- Evidence is still required before publishing “無毒”, origin, year, producer, or similar verifiable claims.
- Phase 1 remains in progress; the Wave 1 baseline exists, while approved storefront capabilities remain unimplemented.

The homepage real-content composition was previously approved:

- Hero headline: “慢慢選一杯好茶”.
- Hero supporting copy: “從喜歡的香氣與口感開始，不必先懂茶，也能找到適合自己的茶。”
- Primary action remains “開始選茶”.
- Brand story uses the teacher-at-tea image as the main visual and the shop interior as support, with a warm “sit down for tea” tone.
- Featured teas use confirmed real-length data: 陳年白茶 (一兩／NT$800／清甜柔順), 霜雪龍 (二兩／NT$1,000／清香甘甜), and 東方美人 (一兩／NT$1,200／花果香柔順).
- Product cards show photo, taste, name, specification and price, then “查看茶品”; no complex option selector appears on the homepage.
- Desktop, tablet, and mobile composition directions were visually reviewed and approved.
- Missing product photos may use the approved labeled brand placeholder; temporary hero media must not imply a false origin.
- Existing shop photos have confirmed website-use permission; no photos are committed in this documentation milestone.
- Phase 1 remains in progress; the Wave 1 baseline exists, while real-content validation and older-user testing remain.

The desktop, responsive, state, and elder-safeguard design was previously approved:

- Desktop homepage uses a balanced split hero.
- Desktop product detail uses photography on the left and buying information on the right.
- Desktop checkout uses three steps on the left and an order summary on the right.
- Tablet checkout switches to one column with an expandable summary above the form.
- For four or more products, the summary shows the first three and lets the customer expand the remainder.
- Loading, empty-cart, network-error, sold-out, form-error, payment-processing, payment-failure, and order-success states are confirmed.
- Errors retain valid data and payment processing prevents duplicate submission.
- One-tap telephone help is primary; LINE is secondary.
- The cart may persist, while personal contact and address data is limited to the current browsing session and cleared after completion, cancellation, or expiry.
- Phase 1 remains in progress; evidence-gated content validation and prototype-based older-user testing remain.
- Wave 1 baseline application code exists; Wave 2 shell implementation is the current small implementation slice.

The elder-friendly single-product publishing design was previously approved:

- Works on both mobile and desktop.
- Publishes one single-specification product at a time.
- Uses one to three photos with assisted cropping and lighting preview.
- Uses only available / sold-out inventory in the first version.
- Generates an AI description draft from provided facts and tags; human confirmation is mandatory.
- Saves a draft before explicit publication.
- If actual stock is insufficient after ordering, the tea shop contacts the customer within 24 hours for exchange or refund.
- Wave 1 baseline application code exists; storefront commerce flows remain unimplemented.

The project-governance design was previously approved:

- Codex is the sole orchestrator.
- Each stage uses a dynamic team of two to four specialist roles.
- Codex leads development and integration.
- The local 35B model provides second review when its invocation method is available.
- Work may proceed automatically through testing, review, documentation, commit, and PR.
- Merge to `main` requires the user's explicit approval.
- A daily 08:00 Asia/Taipei report is enabled and sends only when meaningful GitHub progress, a blocker, or a GitHub access failure exists.

## Confirmed product decisions

- Complete and validate the storefront before selecting an ERP.
- Prioritize completing the approved goal; assess mature templates, components, and open-source features before custom development.
- Use Mock Data / Mock API during the frontend phase.
- Access commerce data through stable domain interfaces rather than hard-coded UI data.
- Prefer mature open-source ERP / commerce systems over building a full ERP.
- Isolate ERP, payment, and logistics providers behind adapters.
- Preserve credit-card and LINE Pay integration as expected future capabilities.
- Make product publishing usable by an older operator on phone and computer.
- Keep first-version product entry single-item, single-specification, and low-field.
- Do not let AI invent origin, health effects, or unsupported product claims.
- Use the Mountain Mist Nature visual direction.
- Keep shopping primary and use telephone / LINE as the secondary in-person tea contact.
- Let customers choose tea through four large taste cards.
- Keep product cards concise and buying essentials first on product detail pages.
- Allow guest checkout; require phone and keep email optional.
- Support home delivery and in-store pickup in the first version.
- Keep shipping fee and free-shipping threshold configurable.
- Avoid intrusive promotion, autoplay media, and exaggerated claims.
- Use the approved mobile design tokens, typography hierarchy, visible labels, focus states, and minimum touch targets.
- Treat environmental sound as an explicit opt-in enhancement only; default it off and keep it non-blocking.
- Use the approved desktop split layouts and single-column tablet checkout.
- Keep multi-item summaries concise and expandable.
- Preserve valid data through errors; keep personal data session-only and never retain payment credentials in frontend storage.
- Make one-tap telephone help primary and LINE secondary during checkout.
- Use the approved homepage hero copy, warm teacher-led story, and three confirmed featured-tea summaries.
- Use the public brand “龍映茗茶” and retain “陳老師茶行” as the informal alias in story and search text.
- Support at least 40 products with incremental draft-to-publish entry and no fixed 40-item ceiling.
- Let customers browse by both taste and tea category while keeping only three manually featured homepage products.
- Use a labeled brand placeholder when a product photo is missing; never use another product photo as a substitute.
- Existing shop photos have confirmed website-use permission; evidence remains mandatory for product and origin claims.
- Frontend stack is Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and pnpm.
- UI components depend on project-owned service interfaces, never directly on Mock data or a specific ERP SDK.
- Deployment stays Docker-portable and targets Cloud Run asia-east1.
- Real catalog entry starts only after persistence, authentication, authorization, and backup/restore are operational.

### Wave 3 domain and Mock Adapter slice — 2026-09-20

- Commits `0acfe28`, `c7199e8`, `e3699fe`, and `37cd1f0` add project-owned domain contracts, deterministic catalog and cart services, checkout validation, and single-specification publishing behavior.
- The synthetic catalog contains 48 stable products and supports cursor paging, taste/category filtering, empty/error results, sold-out behavior, purchase limits, and integer TWD totals.
- Local verification passed: Vitest 6 files / 14 tests, ESLint, TypeScript, and production build. Browser e2e and Docker smoke remain unverified locally.
- No real product data, customer data, payment credentials, ERP integration, authentication, persistence, or secrets were added.
- Wave 4 is the next implementation stage: integrate the catalog service into the approved home/catalog UI. Product detail, cart UI, checkout UI, payment, ERP, and real catalog entry remain out of scope until their planned waves.

### Wave 4 home catalog preview slice — 2026-09-20

- The homepage now injects the project-owned `CatalogService` and renders the first three deterministic products through a small catalog preview.
- Product cards show name, taste tags, summary, specification, integer TWD price, and the approved labeled placeholder; product detail navigation is intentionally not implemented.
- Loading, empty, and catalog-error states are covered by `tests/home-page.test.tsx`.
- Local verification passed: Vitest 6 files / 17 tests, ESLint, TypeScript, and production build. Browser e2e and Docker smoke remain unverified locally.
- No real product/customer/payment data, credentials, ERP integration, authentication, or persistence was added.
- Next slice: review the homepage/catalog preview in a browser, then plan the next catalog browsing interaction. Keep product detail, cart, checkout, payment, ERP, and real data out.

### Teacher story media slice — 2026-09-20

- User-provided teacher portrait and short video are now included in the homepage brand-story section.
- Committed assets are optimized WebP and silent MP4 only; original JPG/MOV remain outside Git. Video metadata was stripped before commit.
- The video is manual, muted, inline-capable, and has a poster plus accessible label; the portrait has descriptive alt text.
- Keep these assets as brand-story media, never as product imagery or evidence for origin/health claims.

### Wave 4.1 complete catalog browsing slice — 2026-09-20

- Branch/worktree: `wave-4-1-catalog-browsing` in the isolated Codex worktree.
- Added `CatalogBrowser`, which consumes the project-owned `CatalogService`, loads cursor pages, preserves existing products, and supports the approved taste filters: 清香、甘甜、濃郁、焙火.
- Added accessible `aria-pressed` filter controls, mobile two-column controls, load-more action, loading, empty, error, and retry states.
- Updated homepage tests to scope assertions to the featured preview after adding the complete catalog section.
- Local verification passed: Vitest 7 files / 22 tests, ESLint, TypeScript, Webpack production build, Chromium smoke/axe e2e (3/3), and headless Chromium catalog interaction review (12 initial products, 焙火 filter, 24 after load-more).
- Turbopack was blocked only by the isolated worktree's temporary external dependency junction; do not treat that as an application failure. Clean-runner CI remains authoritative for the standard build.
- Visual browser surface review and Docker smoke remain unverified; product detail, cart, checkout, payment, ERP, authentication, persistence, and real catalog data remain out of scope.

## Governance delivery

- The approved governance documents were prepared and reviewed through Pull Request #2.
- The conditional morning report is enabled; its first scheduled check is 2026-09-15 at 08:00 Asia/Taipei.
- A resilience governance update is being prepared on branch `docs/resilient-agent-governance` so routine work can continue through GitHub/authentication blockers without repeatedly interrupting the user.
- The resilience policy keeps merge-to-main, production, payment, credential, destructive, and major architecture changes behind explicit human confirmation.

## GitHub / external-blocker status convention

Use exactly one of these states when handing work to another agent:

- `SYNCED` — local and remote branch state are aligned.
- `LOCAL_COMMITS_PENDING` — coherent work is committed locally but cannot yet be pushed.
- `BLOCKED_EXTERNAL` — GitHub, authentication, connector, network, provider, or another external dependency requires intervention.

When blocked externally, record the current branch, latest commit hash if available, completed verification, the exact blocker, and the smallest human action needed. Do not repeatedly ask for the same intervention, and continue independent approved work when it is safe to do so.

## Open dependency

The method for invoking the local 35B model is unknown. When the computer and Coding Tools MCP are connected:

1. Inspect whether the model exposes an OpenAI-compatible API, Ollama endpoint, CLI, or desktop-only interface.
2. Verify a harmless test request.
3. Record the supported invocation and timeout policy without committing credentials.
4. Until verified, use a second QA/Security Agent as the review fallback.

## Next action

Review the Wave 4 homepage/catalog preview in a browser and confirm its responsive/older-user presentation. Then plan the next catalog browsing interaction through `CatalogService`; keep product detail, checkout, payment, ERP, and real customer data out.

## Wave 5 product detail and cart — 2026-09-21

- Branch: `codex/wave-5-product-detail-cart`; implementation tip `9b1b856` (`feat: polish product and cart accessibility`), based on the Wave 4.1 merge `bdbf18b`.
- Completed product detail at `/tea/[slug]`, catalog card links, cart at `/cart`, shared `CommerceProvider`, accessible quantity controls, synthetic sold-out/purchase-limit paths, and cart line update/remove/subtotal behavior.
- Provider state is shared across client navigation through one Mock Catalog/Cart service instance. No localStorage/sessionStorage, customer PII, payment credential, real product data, checkout, payment, ERP, login, or persistence was added.
- Verification report: `.superpowers/sdd/2026-09-20-product-detail-and-cart/task-7-report.md`. Direct `node node_modules/vitest/vitest.mjs run` passed 11 files / 40 tests. Direct ESLint exited 0 with one `@next/next/no-img-element` warning.
- Limitations: `pnpm test:run` attempted dependency reconciliation and was stopped after certificate failures; `pnpm lint`/`pnpm exec tsc --noEmit`/`pnpm build` could not be used as launchers because of the same package-manager guard. Direct typecheck failed at four `TS2532` assertions in `tests/commerce-provider.test.tsx`; webpack build compiled but failed at those type errors, while default Turbopack also hit the external dependency junction. Product/cart e2e could not start because `.next/standalone/server.js` was absent after the failed build. Docker is unavailable. `git diff --check` exited 0; its only notice concerns the unrelated pre-existing Task 1 report line endings.
- Pre-existing unrelated work remains untouched: `.superpowers/sdd/2026-09-20-product-detail-and-cart/task-1-report.md` and `next-env.d.ts` are modified in the worktree and are excluded from the Task 7 commit.
- Recommended next milestone: repair or rerun the typecheck/build/browser gate on a clean dependency environment, then begin Wave 6 checkout, payment-state, and product-draft work.

## Final Wave 5 verification — 2026-09-21

- Controller verification completed after `e6aedae` and `86bd48b`; the latter contains the final selector/cart acceptance fix.
- `node node_modules/next/dist/bin/next build --webpack` passed after rebuilding and synchronizing standalone static/public artifacts.
- Chromium acceptance passed 4/4 with `node node_modules/@playwright/test/cli.js test e2e/product-cart.spec.ts --project=chromium --workers=1 --reporter=line`.
- WebKit is blocked only by the missing `webkit-2359` executable. Docker remains unavailable. These are the only remaining environment limitations recorded for the final Wave 5 gate.
- Final review evidence includes strict provider-test tuple narrowing, catalog-derived sold-out cart behavior, stale product-response protection, `CommerceProvider` durable naming, and the corrected cart acceptance selector.
- Next milestone: Wave 6 checkout, payment-state, and product-draft work.

## Wave 6 final verification — 2026-09-21

- Branch: `codex/wave-6-checkout-product-draft`; implementation commits are `6af7399`, `cd0cf12`, `7684f07`, `457a18b`, `2d7f7c8`, `e7237e4`, `657afa0`, `d959b4b`, and `9c91d79` before this documentation checkpoint.
- Completed behavior: a project-owned Mock checkout service and three-step guest checkout retain valid contact/address values on error, guard duplicate final submission, and expose synthetic success/retry states; the product-draft prototype supports minimum fields, bounded local preview metadata, grounded editable Mock copy, draft save, preview, confirmation-gated synthetic publish, and duplicate-operation protection.
- Full local verification: Vitest passed 15 files / 96 tests; TypeScript passed with `--incremental false`; full ESLint exited 0 with one existing `@next/next/no-img-element` warning outside the Wave 6 diff.
- Unpassed gates: the sandboxed `next build --webpack` attempt failed with `EPERM` opening `.next/trace`; the approved retry reached Next.js but failed with `EBUSY` removing the locked `.next/standalone` directory. Chromium acceptance was therefore not started because the configured standalone server was not freshly built. WebKit is not installed and Docker CLI is unavailable. The Wave 6 spec header whitespace was corrected, and the complete branch diff check now passes.
- Security/privacy checks: the requested secret scan and a scan for browser storage, console logging, card number, and security-code terms found no matches in `app`, `features`, `lib`, `tests`, or `e2e`. The prototype still has no real authentication, payment provider, persistence, ERP integration, file upload, or real customer/order data.
- Pre-existing `next-env.d.ts` remains modified and intentionally unstaged; its working diff is line-ending normalization only.
- Full evidence, limits, risks, and the next action are in `.superpowers/sdd/2026-09-21-wave-6-checkout-product-draft/final-verification-report.md`.

## Previous Wave 6 next action

The Wave 6 filesystem/build limitation was carried into Wave 7-A and resolved for the local Webpack and Chromium gates in the isolated worktree; WebKit/Docker remain environment-limited.

## Wave 7-A frontend shopping quality gate — 2026-09-22

- Branch/worktree: `codex/wave-7-shopping-quality-gate`, based on merged Wave 6 commit `1aea1bb`; the base checkout and its pre-existing `next-env.d.ts` remain protected.
- Implemented only evidence-backed fixes: improved catalog count contrast, corrected the stale cart e2e expectation to the `/checkout` link contract, scoped checkout alert assertions away from Next's empty route-announcer alert, and added explicit hydration/heading readiness waits for cross-browser e2e.
- Verification: Vitest 15 files / 96 tests, TypeScript (`--incremental false`), Webpack production build, full diff check, Chromium 14/14, and WebKit 14/14 passed. Axe passed for homepage and the primary storefront routes: product detail, cart, checkout, and product draft.
- WebKit was installed with the official Playwright CLI using Node `--use-system-ca` only; no TLS bypass or system security change was made. Full WebKit acceptance then passed 14/14.
- Full ESLint exited 0 with one existing `@next/next/no-img-element` warning in `features/product/components/product-detail-page.tsx`; secret/privacy scan had no matches. Docker CLI remains unavailable and is an environment backlog item.
- GitHub state: `SYNCED` after commit `c39f250` was pushed to `origin/codex/wave-7-shopping-quality-gate`; no credentials, payment keys, API keys, or customer data were added.

## Current next action after Wave 7-A

Keep Docker as the only local environment backlog item. The next safe frontend stage is to prepare the older-user task-based validation plan and review checklist; do not start paid preview deployment without explicit environment and credential authorization. Real participant validation still requires arranging participants.

## Older-user walkthrough preparation — 2026-09-22

- Added `docs/testing/older-user-walkthrough.md` with facilitator wording, eight tasks (T1–T8), observation categories, issue template, success/failure criteria, privacy rules, and localhost setup.
- Added `docs/superpowers/plans/2026-09-22-older-user-walkthrough-preparation.md` as the offline execution plan. It uses only synthetic values and the existing Mock services.
- No real participant session, preview deployment, paid service, payment credential, login, persistence, ERP, or customer data was used.
- Next safe action: run a facilitator dry run locally, record no-participant observations separately, and only schedule real sessions when participants and consent handling are available. Docker remains an environment backlog item.

## Facilitator dry run — 2026-09-22

- Completed the scripted T1–T8 walkthrough on the local standalone server at `localhost:3001` with both `360×800` and `1280×800`: 16/16 automated facilitator steps passed.
- Recorded evidence in `docs/testing/older-user-walkthrough-dry-run-2026-09-22.md`; this is a host-flow rehearsal only and must not be presented as older-user research.
- Dry-run-only issues were corrected in `docs/testing/older-user-walkthrough-dry-run.mjs`: wait for the catalog entry after loading, use the actual cart line for T5, and use a standalone server when the dev junction blocks Turbopack. No frontend production behavior was changed.
- Remaining observation for real sessions: T4 has two back-navigation labels and may be cognitively long; button intuitiveness and product comprehension require real participant evidence.
- Formal older-user testing, preview deployment, paid services, and Docker remain paused/backlog items.

## Capability inventory and human-validation boundary — 2026-09-22

- Must be validated by real older participants, never inferred from automation: ease of understanding, button intuitiveness, navigation comprehension, and understanding of product facts/placeholders.
- Still mock/stub/draft: deterministic catalog/cart/checkout/publishing services, synthetic products and placeholders, transient cart and draft state, synthetic payment choices, and the unauthenticated product publishing prototype.
- Still incomplete or externally gated: real content evidence, Docker smoke, preview deployment, persistence, login/authorization, real payment, logistics, ERP, and real participant research.
- Selected offline candidate: add explicit checkout prototype-boundary copy and focused tests without changing payment behavior, collecting payment credentials, or adding a provider.

## Checkout prototype boundary copy — 2026-09-22

- Added visible prototype boundary copy to both active checkout steps and the synthetic success state: this is a synthetic prototype, sends no real payment, and stores no payment data.
- TDD evidence: the new initial-state test failed before implementation; the new success-state test failed before success-state implementation; both now pass.
- Verification after implementation: Vitest 15 files / 98 tests, TypeScript (`--incremental false`), Webpack build, lint 0 errors with one existing `no-img-element` warning, Chromium checkout e2e 6/6, WebKit checkout e2e 6/6. Earlier complete storefront gates remain Chromium/WebKit 14/14.
- No payment provider, payment credential, persistence, login, ERP, preview deployment, Docker, or real participant research was added.
- Next offline frontend item is intentionally not selected until a concrete low-risk issue or approved design need is identified; human comprehension, button intuitiveness, and product-information understanding remain real-user-only validations.

## Startup reminder

Follow `RESUME_PROMPT.md`, `AGENTS.md`, and `WORKFLOW.md`. If newer explicit user instructions conflict with this handoff, the newer instruction wins and the discrepancy must be recorded.

## Next-phase construction map — 2026-09-22

- Verified frontend complete: brand shell/story, 48-item Mock catalog, filters and paging, product detail, cart, three-step guest checkout, explicit checkout prototype boundary, and product draft/preview/synthetic publish. Current evidence is Wave 7-A browser/axe gate plus 98 unit tests.
- Mock/stub/draft: all four domain adapters, synthetic products/prices/inventory/receipts, transient cart/contact/draft state, synthetic payment choices, unauthenticated publishing prototype, and labeled placeholder media.
- Local-only work: regression maintenance and local fake adapter/DTO/error contract tests around existing interfaces. Do not invent new product behavior without a concrete issue or approved design need.
- Human-only work: older-user comprehension, button/navigation intuitiveness, product fact/placeholder understanding, task success and recovery behavior.
- External-gated work: Docker/clean runner, preview, real content evidence, persistence, authentication, payment, logistics, ERP, backup, monitoring, secrets and rollback.
- Future API boundary map is recorded in `CAPABILITY_MAP.md` and `WHITEPAPER.md`: Catalog, Cart, Checkout, tokenized Payment, Logistics, Publishing, and isolated ERP adapters.
- Recommended next phase: **Phase 8 — Integration-readiness contract hardening**. Minimal slice: local in-memory fake adapters plus DTO/error/adapter-swapping contract tests; no network, credentials, payment, login, persistence, logistics, ERP, or preview.

## Uncommitted generated-file record — 2026-09-22

- `AGENTS.md` remains untouched and uncommitted. It has no textual diff against HEAD; its `M` status is a worktree line-ending/index condition. Do not stage or reset it without resolving the environment condition.
- `next-env.d.ts` remains untouched and uncommitted. Its diff is generated by Next.js (`.next/types` references and generated comments) after the previous local build/dev work, not by this documentation stage. Do not stage, overwrite, or infer that it is project-authored.

## Phase 8 integration-readiness contract hardening — 2026-09-22

- Status: `LOCAL_COMMITS_PENDING` until the Phase 8 commit is pushed and remote equality is confirmed.
- Completed first minimal slice: explicit Catalog/Cart/Checkout/Publishing DTO aliases; Payment/Logistics/ERP request/result DTOs; independent service interfaces; normalized adapter error mapping; local in-memory fake adapters; and an in-memory default bundle for the existing CommerceProvider.
- Contract tests in `tests/integration-contracts.test.ts` cover DTO shape, exclusion of raw payment credentials, error mapping, fake adapter results, adapter swapping, and independent interface replaceability. Existing frontend provider injection and storefront behavior remain covered by the prior tests and browser regression.
- Verification passed: Vitest 16 files / 103 tests; `tsc --noEmit --incremental false`; ESLint 0 errors with one pre-existing `no-img-element` warning; Next Webpack build; Chromium 14/14; WebKit 14/14.
- Scope guard: no real payment, payment credential, login, persistence, logistics provider, ERP connector, preview deployment, Docker, or paid service was used. `simulated` fake results must never be presented as external authorization, fulfillment, or ERP synchronization.
- `AGENTS.md` and `next-env.d.ts` remain uncommitted and untouched. `AGENTS.md` has no textual diff and its modified status is an environment/index condition; `next-env.d.ts` contains prior Next-generated references. They are excluded from the Phase 8 commit.
- Next step after push: treat this first contract slice as complete; only continue with another independently bounded local contract improvement if a concrete gap is documented. Keep human validation and all real integrations externally gated.
- Follow-up local slice: `createInMemoryIntegrationAdapters` groups the three external-facing fake adapters behind one replacement boundary; it remains synthetic and is not connected to checkout or any external service.

## Phase 8 Catalog / Cart / Checkout boundary slice — 2026-09-22

- Added `boundary-validation.ts` with runtime validation for Catalog queries, Cart DTOs, and Checkout request DTOs. New stable errors are `invalid-catalog-query`, `invalid-cart`, and `invalid-checkout-request`; all are non-retryable local domain errors.
- `createInMemoryCommerceServices` now has explicit contract coverage proving that a Cart created beside an alternate Catalog resolves items through that injected Catalog, and that Checkout can be replaced independently.
- Verification: focused contract test 9/9; full Vitest 16 files / 107 tests; TypeScript passed; ESLint 0 errors with the existing `no-img-element` warning; Webpack build passed; Chromium 14/14 and WebKit 14/14 passed with one worker per browser.
- A combined parallel Chromium/WebKit run had one product-cart URL race while 27/28 passed. The affected product-cart test and the full suite passed when rerun serially; no production or test code was changed for this environmental concurrency observation.
- Scope remains local-only: no database, real catalog, payment, logistics, ERP, authentication, persistence, preview, Docker, or paid service.
- `AGENTS.md` and `next-env.d.ts` remain untouched and uncommitted. Before the next commit, preserve these files exactly as local environment state.

## Phase 8 Payment / Logistics contract slice — 2026-09-22

- Added runtime validators for Payment, shipping quote, and fulfillment request DTOs. Invalid shapes return `invalid-payment-request` or `invalid-logistics-request` before a fake adapter is called.
- Extended `createInMemoryIntegrationAdapters(overrides)` so Payment and Logistics can be swapped independently while preserving the typed service interfaces. ERP remains in the same local bundle but was not changed or connected.
- Contract coverage: Payment/Logistics DTO rejection, valid store-pickup fulfillment, and independent adapter identity swapping. Focused tests passed 11/11; full Vitest passed 16 files / 109 tests.
- Full verification passed: TypeScript, ESLint 0 errors with one existing image warning, Next Webpack build, Chromium 14/14, and WebKit 14/14 (single worker per browser).
- Scope guard remains active: no real payment, LINE Pay, card data, logistics API, database, ERP, authentication, persistence, preview, Docker, or paid service was used. UI and checkout behavior remain unchanged.

## Phase 8 Publishing / ERP contract slice — 2026-09-22

- Added runtime validation for ProductDraft, ERP product upsert, and ERP order sync DTOs. Added stable `invalid-publishing-request` and `invalid-erp-request` errors.
- Extended adapter error mapping with `publishing -> publishing-unavailable`; existing Mock Publishing `invalid-draft` behavior remains unchanged.
- Added Publishing and ERP adapter override/swapping tests plus a cross-service check that all local validation failures expose the same `{ code, message, retryable }` shape.
- Contract coverage matrix is recorded in `CAPABILITY_MAP.md` section N and `WHITEPAPER.md` section 41. Catalog, Cart, Checkout, Payment, Logistics, Publishing, and ERP now all have local DTO/interface/validation/error/fake/swap coverage.
- Verification after this slice: focused contracts 14/14; full Vitest 16 files / 112 tests; TypeScript passed; ESLint 0 errors with one existing image warning; Webpack build passed; Chromium 14/14 and WebKit 14/14 passed with one worker per browser.
- No real ERP, CMS, database, payment, logistics, authentication, persistence, preview, Docker, or paid service was used. `AGENTS.md` and `next-env.d.ts` remain untouched and uncommitted.

## Phase 8 closure — completed / integration-ready prototype — 2026-09-22

- Added `tests/phase-8-integration-smoke.test.tsx` as the minimal end-to-end service-boundary smoke: default in-memory Catalog/Cart/Checkout flow, Payment/Logistics/Publishing/ERP fake calls, adapter replacement, error mapping, and UI non-leakage probe.
- Smoke passed 2/2. Full verification passed: Vitest 17 files / 114 tests, TypeScript, ESLint 0 errors with one existing image warning, Webpack build, Chromium 14/14, and WebKit 14/14.
- Phase 8 is now `completed / integration-ready prototype`. No new service type was added in closure; no real API, database, payment, logistics, ERP, CMS, preview, Docker, or paid service was used.
- Phase 9 candidates only, not started: older-user research, real content evidence, preview/Docker/release pipeline, authentication/persistence/observability/backup, and future tokenized payment/logistics/CMS/ERP planning.

## Phase 9-A execution package — preparation complete, no participant result — 2026-09-22

- Added the final facilitator package at `docs/testing/phase-9a-older-user-and-content-validation-pack.md`, with consent wording, T1–T8 script, neutral prompting, observation categories, P0–P3 rubric, completion gates, and post-session document update instructions.
- Added `docs/testing/phase-9a-observation-template.md` for de-identified records and `docs/testing/phase-9a-real-content-replacement-checklist.md` for photo/copy source, permission, evidence, alt text, owner, and approval tracking.
- Added `docs/testing/phase-9a-preflight.mjs`; it passed all documentation checks and explicitly performs no server start, participant contact, external access, or data collection.
- Current placeholder/synthetic inventory remains unchanged: synthetic products/prices/inventory, labeled missing-photo placeholder, synthetic checkout/payment boundary, Mock receipt, synthetic publishing, local fulfillment and ERP references. No real content was substituted.
- No human session has occurred. Do not report dry run/e2e as participant evidence. After a real session, update WHITEPAPER, HANDOFF, and CAPABILITY_MAP only with de-identified direct observations and linked issue IDs.
- Waiting state: participant consent/session and store-approved real photo/copy evidence. No preview, paid service, formal deployment, authentication, persistence, payment, logistics, or ERP work is authorized in this preparation stage.
- Preserve uncommitted environment files: `AGENTS.md` and `next-env.d.ts` remain untouched and excluded from commits.

## Phase 9-A real product material import specification — ready, awaiting store data — 2026-09-22

- Added `docs/testing/phase-9a-real-product-material-import-spec.md`. It defines the JSON canonical format, CSV header, required/null fields, image requirements, stable IDs, filename/version rules, validation gates, evidence fields, publication status, and placeholder replacement flow.
- Covered fields: product name, tea type, origin, harvest year, weight, TWD price, aroma, taste, aftertaste, brewing guidance, inventory, product image, sort order, and publication status. No real values were entered.
- The spec explicitly reserves fields not currently supported by the prototype domain without changing runtime code. Missing or unverified facts remain `null`; failed image/content validation preserves the existing synthetic fixture and labeled placeholder.
- Waiting for the store to provide a data package, image permissions, fact sources, and reviewer information. Do not import, replace, deploy, or start paid/external services until then.

## Phase 9-A product import toolchain — ready, waiting for store data — 2026-09-22

- Added empty templates: `docs/testing/phase-9a-product-import-template.csv` and `.json`; added template usage notes and `phase-9a-placeholder-synthetic-map.md`. No real or fabricated product row was added to either template.
- Added `scripts/phase-9a-product-import.mjs` with CSV/JSON parsing, required/type checks, duplicate ID/sort checks, price/weight validation, image filename-to-content-ID validation, metadata/hash checks, optional image-directory existence checks, placeholder warnings, and publication evidence gates.
- The CLI is dry-run only: it emits a structured JSON report with `wouldWrite: false`; `--apply` is rejected, and it never overwrites existing fixtures or uploads files. Error reports include row, field, stable code, and readable message.
- Added typed declaration coverage and `tests/phase-9a-product-import.test.ts`. Focused import tests passed 5/5; full Vitest remains the project regression gate. Phase 9-A preflight checks the templates, map, tool markers, and preparation docs.
- No external service, database, payment, logistics, ERP, preview, or formal deployment was started. Wait for store data, image permissions, fact sources, and reviewer information.

## Phase 10 ERP reuse & integration planning — planning complete, not integrated — 2026-09-22

- Added `docs/erp/phase-10-erp-reuse-integration-planning.md` covering ERP capability requirements, module plan, candidate comparison, Website ↔ ERP contract, mapping, sync direction, normalized errors, ownership, implementation slices, and minimal PoC.
- Research candidates: ERPNext is the first fixture-mapping candidate; Odoo and Dolibarr are ERP alternatives; Medusa, Saleor, and Vendure are commerce-oriented comparison baselines. No final ERP selection or license approval was made.
- The plan preserves the current architecture: UI uses project-owned DTO/service boundaries; future server-side adapters own provider mapping, idempotency, retries, reconciliation, and sensitive-field exclusion. The website keeps brand content, UX, SEO, human validation, and publishing approval gates.
- Proposed next step only: Phase 10-B offline ERP-shaped fixture mapping contract PoC using synthetic data. It must not start an ERP, database, Docker environment, payment, logistics, or production deployment.
- Verification for this documentation-only slice: source links and capability mapping reviewed; no runtime code changed. Run `git diff --check` and the existing Vitest regression before commit.
- Preserve existing local environment changes: `AGENTS.md` and `next-env.d.ts` remain untouched and must not be staged or committed.

## 手機 Demo 購物車修正檢查點 — 2026-09-24

- 工作樹 `codex/wave-7-shopping-quality-gate` 原有未提交的 AGENTS、CAPABILITY_MAP、HANDOFF、WHITEPAPER、商品頁導向、next-env.d.ts 及 `docs/erp/`；先盤點並保留。商品頁加入成功後 `router.push('/cart')` 為既有修改，本階段未重寫該功能。
- 本階段修補商品頁及整合測試所需的 Router mock、驗證成功導向 `/cart`；購物車原有「繼續選茶」改為「繼續購買」，保留 `/checkout`；瀏覽器測試改為成功後直接檢查 `/cart`。
- edea 的 `pnpm` 不在 PATH；Corepack 已緩存 pnpm 11.19.0。`corepack pnpm test:run` 因無 TTY 的 modules purge 提示失敗；使用已安裝的 `node_modules/.bin/*.cmd` 執行檢查，不刪除既有 node_modules。Node 24.21.0 與 package.json 要求的 24.19.0 不一致。
- 驗證：Vitest 18 files／119 tests 通過；`tsc --noEmit --incremental false` 通過；ESLint 0 errors／1 個既有 `<img>` warning；`next build --webpack` 通過。Playwright Chromium 已安裝指定 v1243；獨立埠 3013 的購物車／結帳 10/10 通過。測試伺服器會將 build 的 static/public 複製到 standalone 目錄後啟動；3000 埠有既存 Node 進程，未碰觸。
- PR #15 的 S1 門檻仍未達成：目前 checkout 無 OTP／地址核實，Mock 訂單使用固定 `MOCK-ORDER-001` 且無持久化；沒有安全查單、顧客／店家通知、受權店家待辦、照片歸檔或出貨狀態。不得將現有原型當成手機 Demo 驗收通過；雲端測試部署必須等待本機功能與實機驗收。
- 下一步：建立服務端唯一且持久的測試訂單與受控模擬 OTP／查單權限，接著按狀態實作通知、店家拍照及人工交寄，再做手機驗收。正式金流與正式環境均未啟用。

## 手機 Demo 下一個本機切片 — 2026-09-24

- 增加台灣手機格式與正規化（前台、Mock service）；格式檢查不等於 SMS OTP，仍不能解鎖 PR #15 的後端驗證閘門。
- 已找到 edea 缺少 `pnpm` PATH 的安全執行方式：`corepack pnpm --config.verifyDepsBeforeRun=false test:run`，使用緩存 pnpm 11.19.0 並保留既有 node_modules；未做新的 frozen install。Node 24.21.0 與宣告 24.19.0 仍不同。
- 正在建立伺服端 Demo 訂單純記憶體契約與測試，沒有接入顧客／店家頁面，沒有持久化或真正通知。這只是下一階段的基礎，不代表手機 Demo 驗收完成。

## 手機 Demo 本機閉環收尾 — 2026-09-26

- 沿用既有 `router.push('/cart')`、SQLite Demo order/outbox、OTP、地址、merchant workflow 與 packing-photo 契約，沒有重寫已完成服務。新增 local-only runtime 與 API 組合，僅在 `DEMO_COMMERCE_LOCAL=enabled`、非 production、loopback／同源請求下可用。
- `/checkout` 在 `NEXT_PUBLIC_DEMO_COMMERCE=enabled` 時切換到合成 OTP 結帳；預設 build 仍保留原 prototype。`/orders` 要求高熵 token、下單手機、後三碼及一次性 OTP；訂單另存手機摘要，另一支有效合成手機也不能查詢。
- `/admin/orders` 使用獨立高熵店家密碼簽發短效 HttpOnly cookie，可模擬付款、上傳本機私有包裝照、明確人工出貨／送達、通知成功／失敗／重試。包裝完成只進入 `packed`，不會自動標為出貨。
- Email 是 outbox 的 `simulated-email`；手機推送只產生 `preview-only` payload，不註冊 service worker、不排隊、不送達外部裝置。地址只有指定合成地址可通過受控覆核，其他地址維持「需要人工介入」。
- 本機操作文件：`docs/testing/mobile-demo-local-runbook.md`。`.demo-data/` 已加入 Git ignore；測試資料、包裝照片、查單 token 與店家密碼不提交。
- 已通過 focused HTTP guard、runtime 與 mobile push preview tests，以及 Pixel 7 Chromium 顧客→店家→顧客閉環。正式付款、物流、SMS、Email、Web Push、會員、production、公開網路及正式客戶資料均未啟用。
- 完整交付閘門已通過：Vitest 29 files／167 tests；TypeScript；ESLint 0 errors（1 個既有 `<img>` warning）；Webpack build；既有 Chromium 14/14；Pixel 7 focused mobile Chromium 1/1；`git diff --check` 與常見 secret pattern scan 均無問題。WebKit 未重跑，沿用既知 Avast 隔離環境限制，未修改防毒設定。
- `AGENTS.md` 與 `next-env.d.ts` 是進場前既有環境變更，本階段未修改且不得納入提交。

## W. 第三輪真人驗收修正 — 2026-09-27

- 已追查首頁素材：`public/media/tea-sample-composite.png` 是既有 synthetic 示意圖，不是店家正式合成照；本階段不再將它當正式首頁素材，首頁改為明確提示正式合成照尚未提供。原始人物照、影片與 `tea-stream-birds.wav` 保留；鳥叫需明確點擊播放。
- 購物車新增「返回上一頁」；checkout 新增「返回上一頁」與「取消本次結帳」回購物車。離開不建立訂單，也不清空既有購物車。
- OTP 保留服務端驗證；同一有效 challenge 在 cooldown 期間重用，避免手機重按取得驗證碼卡死；錯誤 OTP 顯示明確提示。測試資料仍為允許的合成手機與 `123456`，不連接 SMS。
- 新增 `/admin/products` 本機 Demo 商品工作台：列出商品、照片、分類、規格、價格、庫存與上下架操作。下架只改 publication、保留商品與歷史訂單；公開 Catalog 與 authoritative order boundary 皆拒絕下架商品。
- 第九種素材流程以可替換 Mock 狀態展示「原始照片→檢查→拆解／辨識 Mock→合成預覽 Mock→人工確認→儲存→上架」；未宣稱真正 AI 辨識或合成。現階段原始檔只保留於瀏覽器草稿預覽，publish 會將首張圖片寫成 Demo catalog media；獨立 raw archive／derived manifest 尚未實作。
- 驗證：focused Vitest 42/42；webpack production build 通過；LAN Pixel 7 Chromium 在全新隔離 Demo data 上 `catalog-persistence` + `mobile-order-loop` 2/2 通過。Turbopack 因 worktree `node_modules` symlink 被限制；production `next start` 仍由安全 guard 禁止 Demo API，安全邊界未放寬。
- 不宣稱真人手機驗收通過。可供重跑網址：`http://172.20.10.4:3013`；後台：`/admin/products`、`/admin/products/new`、`/admin/orders`。正式合成照仍待店家提供；`AGENTS.md` 與 `next-env.d.ts` 為既有未提交環境變更，本階段未納入。
- `/admin/products` 目前提供清單、前台檢視與上下架操作；既有商品的獨立編輯表單仍待後續 bounded slice，不以新增頁冒充編輯功能。

## 同一區域網路真實手機驗收準備 — 2026-09-26

- 為實機展示增加明確 LAN opt-in：`DEMO_COMMERCE_LAN=enabled` 時，HTTP guard 只接受 RFC1918 私有 IPv4；未設定時仍只接受 loopback。production、公開／訪客網路與 `0.0.0.0` 綁定仍拒絕。
- LAN 模式的店家 cookie 改用不帶 `Secure` 的 `HttpOnly; SameSite=Strict; Path=/` 合成 cookie，因 HTTP 手機測試無法使用 `__Host-` cookie；loopback 預設仍維持 `__Host-...; Secure`。這只為本機假資料 Demo，不能帶入正式環境。
- 實機操作文件已補在 `docs/testing/mobile-demo-local-runbook.md`：取得私有 IP、啟動旗標、必要網址、手機與電腦同網、Windows 防火牆阻擋時停止並交由管理者處理，不自動修改安全設定。
- 待執行的真人手機驗收：用同一區網手機完整走商品→購物車→結帳→查單→店家處理→出貨狀態；目前尚未把此流程宣稱為真人／店家走查結果。Pixel 7 Chromium 自動化 1/1 仍是腳本證據。
- 本次已在本機私有介面 `172.20.10.4:3013` 啟動 Demo；必要網址為 `/`、`/cart`、`/checkout`、`/orders`、`/admin/orders`。主機 health／頁面可達；實際手機操作仍待陳老師在同一可信 Wi‑Fi 執行，不能由本機自動化代替。
- 已以同一 LAN URL `http://172.20.10.4:3013` 重跑 Pixel 7 Chromium synthetic flow，1/1 通過；這證明 LAN host/origin 與完整合成流程相容，不代表真實手機或真人走查已完成。
- 實機限制：HTTP LAN cookie 不具 Secure，故只允許假資料、假 OTP、假付款與假通知；不要輸入真實客戶／付款資料。Demo 結束應停止 server，並在確認路徑後清除 `.demo-data\lan-demo`。
- 實機限制：HTTP LAN cookie 不具 Secure，故只允許假資料、假 OTP、假付款與假通知；不要輸入真實客戶／付款資料。Demo 結束應停止 server，並在確認路徑後清除 `.demo-data\lan-demo`。

## V. Real-phone acceptance repair — 2026-09-27

## 第四輪實際 UI 與完整商品流程修正 — 2026-09-27

- 首頁已移除原 `teacher-story.mp4` 播放介面，改以 `picture` 實際引用 `public/media/teacher-hero-desktop-candidate.png` 與 `teacher-hero-mobile-candidate.png`；兩張素材是依現有 `teacher-portrait.webp` 生成的設計候選，尚未取得店家正式核准，不可當作最終品牌素材。`tea-stream-birds.wav` 仍保留為明確點擊播放，未使用 autoplay。
- 桌面／手機共用 header 已加入 `/orders`「訂單查詢」。下單後改導向獨立 `/checkout/success`，顯示感謝、訂單編號、收到訂單、狀態、返回首頁與查看訂單；查單 token 僅存於同一瀏覽器的 sessionStorage，不出現在成功頁 DOM 或查單連結。
- `/admin/products` 仍使用前台相同的 file-backed Demo Catalog，初始列出八款商品；新增可用的編輯入口，能更新茶名、類別、規格、價格與庫存而不改商品 identity。上下架仍只改 publication，保留商品及歷史訂單。
- 第九種流程維持清楚標示的本機 Mock：「原始照片→素材檢查→拆解／辨識 Mock→合成預覽 Mock→人工確認→儲存→上架」。沒有影像辨識／合成外部服務；不可把預覽或生成候選解讀為 AI 辨識已完成。原始照片的獨立 raw archive／derived manifest 仍未完成。
- 回歸證據：完整 Vitest 31 files／175 tests、TypeScript、ESLint 0 errors（5 warnings，含既有 `<img>` 與內部導向提示）、Webpack build 均通過；乾淨 synthetic data 的 LAN Pixel 7 Chromium `catalog-persistence` + `mobile-order-loop` 2/2 通過；截圖 runner 1/1 通過。
- 截圖證據保存在 `docs/testing/evidence/fourth-round-2026-09-27/`：`homepage-desktop.png`、`homepage-mobile.png`、`checkout-success.png`、`admin-products-eight.png`、`ninth-material-mock-workflow.png`、`admin-products-ninth-published.png`、`admin-products-ninth-unpublished.png`。這些是瀏覽器渲染證據，不是實體手機或真人走查結果。
- 實體手機第三輪／第四輪驗收仍未宣稱通過；正式合成照、正式影像處理服務、正式付款、物流、ERP 與公開部署仍未啟用。建議下一步由陳老師在 `http://172.20.10.4:3013` 以合成資料實際操作並回報截圖／問題。
- 本輪只提交本輪程式、測試、文件與證據；進場前既有 `AGENTS.md`、`next-env.d.ts` 未修改、未 staged、未提交。

- Root causes confirmed: Wave 7 previously lacked the checked-in sample media and used process-only catalog publishing; the active 3013 server was also verified and restarted from the Wave 7 demo with an isolated local data directory.
- Added the eight sample products and preserved photos, composite hero image, and bird-call WAV. Static checks against `http://172.20.10.4:3013` returned HTTP 200; audio is explicit click-to-play (`controls`, `preload="none"`), not autoplay.
- Added guarded file-backed local catalog/media storage. Admin publish writes to ignored `.demo-data`, survives reload/restart, and never calls ERP or external services. Catalog/Cart/Publishing continue through service boundaries; published product IDs and encoded Unicode slugs are handled correctly.
- Verification: Vitest 30 files / 173 tests; TypeScript passed; ESLint 0 errors with 4 existing image warnings; webpack production build passed. Turbopack remains blocked by the worktree `node_modules` symlink panic. LAN Pixel 7 Chromium `catalog-persistence` and `mobile-order-loop` passed 2/2 on clean isolated data.
- Real physical phone acceptance is still pending at `http://172.20.10.4:3013`; automated Chromium is not human/real-device evidence. `AGENTS.md` and `next-env.d.ts` remain pre-existing uncommitted environment changes and were not staged.

## P0 catalog recovery diagnosis — 2026-09-27

- The active listener is `172.20.10.4:3013`, PID `36808`, `node.exe`, started at 2026-09-27 03:23:58. The command-line query is restricted on this Windows environment, so the launch session itself remains the authoritative process/worktree evidence; the server session was started from this worktree with `DEMO_COMMERCE_LOCAL=enabled`, `DEMO_COMMERCE_LAN=enabled`, `NEXT_PUBLIC_DEMO_COMMERCE=enabled`, an explicit private LAN hostname, and the existing `.demo-data/lan-demo-third-round-final-2` directory.
- `GET http://172.20.10.4:3013/api/demo/catalog?limit=50` returned HTTP 200 and 8 published products: 台灣蜜香野生山茶、台灣佛手茶、烏龍綠茶、武夷玫瑰紅茶、午時金萱黃茶、白毛猴、大葉烏龍蜜香紅茶、藥香老烏龍。 The backing catalog contains 9 total records: those 8 published records plus the existing synthetic ninth draft; no files were cleared or rebuilt.
- Frontend and admin use the same `/api/demo/catalog` and file-backed `getDemoCatalogStore()` boundary. A 360×800 Playwright LAN inspection found all 8 product names on `/` and 9 admin rows on `/admin/products`; console, pageerror, requestfailed, hydration and catalog API checks were clean. Server logs recorded 200 for both public and `includeUnpublished=true` requests.
- Current evidence does not reproduce a missing-data application bug. The failure is consistent with a stale/wrong process, wrong LAN origin, disabled Demo flags, or a different `DEMO_DATA_DIR` being used by the phone session. The runbook now has a P0 preflight requiring PID/server/data-directory/API checks before handing the URL to a phone.
- Current screenshots: `docs/testing/evidence/p0-catalog-recovery-2026-09-27/homepage-mobile.png` and `admin-products-mobile.png`. These are browser evidence, not real-phone evidence. The phone must reload `http://172.20.10.4:3013/` after the server/API preflight.
- Focused regression: Vitest 4 files / 31 tests passed with the approved `corepack pnpm` invocation after the sandbox-only `spawn EPERM` retry. Existing `AGENTS.md` and `next-env.d.ts` changes remain untouched and must not be staged.
- Final cross-browser check: Chromium e2e 14/14 passed after the stale-copy assertion was corrected. WebKit reached 8/14 and then hung without further output in this managed Windows environment; it was stopped rather than treated as a product pass/fail. No WebKit failure implicated the catalog API or the P0 data boundary.

## 第五輪前後台閉環修正 — 2026-09-27

- P0 Catalog 以目前同一份 `.demo-data/lan-demo-third-round-final-2/catalog.json` 完成 API 關卡：價格 `1500 → 1555 → 1500`；下架時 public GET 不回傳、admin GET 顯示 `draft`；重新上架後恢復 `published`。沒有建立第二份商品清單。
- 目前資料為 10 筆：原始 8 件 published、既有 `第九種 UI 測試茶...` 1 件 draft、使用者新增的 `台灣野生紅茶` 1 件 published。重啟 server 後仍存在；public catalog total 9，admin-inclusive total 10。
- 真正重現並修正的 checkout P0 是空白選填 Email：UI 初始送出 `email: ""`，server validator 正確回傳 `Invalid email`（400），因此未進成功頁。現在 `normalizeDemoCheckoutDraft` 空白時移除欄位，有內容時保留並交給原有 validator；OTP 與 server 驗證未移除。
- LAN browser flow（360×800）驗證首頁「訂單查詢」、9 件 published 商品、OTP、`POST /api/demo/orders` 200、`/checkout/success` 感謝／訂單編號／狀態／返回首頁／主動查看訂單；無 pageerror／requestfailed。這仍是自動化 LAN 證據，不是真人手機驗收。
- P1 未接入影像服務：`raw-data/` 不存在，專案沒有 OCR／茶品辨識／圖片合成服務；只有可選的內建 image generation 能力與 Next 間接依賴的 `sharp`，不能據此宣稱 P1 完成。
- 驗證：Vitest 32 files／177 tests、TypeScript、Webpack build、ESLint 0 errors（5 warnings）、Chromium e2e 14/14；WebKit 仍受既知本機 hang／Avast 環境限制。`AGENTS.md`、`next-env.d.ts` 維持未提交。

## 第五輪補充驗收 — 2026-09-27

- 3013 已停止後由目前 `codex/wave-7-shopping-quality-gate` 工作樹重新啟動；重啟後 listener 為 `172.20.10.4:3013`，`GET /api/demo/catalog?limit=50` 回傳 HTTP 200。Windows 禁止查詢完整 Node command line，因此以啟動工作樹、啟動環境、listener 與 API 內容作版本證據；不能由此替代真人手機截圖。
- 第九種合成測試茶 `台灣野生紅茶` 在同一份 `.demo-data/lan-demo-third-round-final-2/catalog.json` 完成 `888 → 999` 價格修改、`published → draft`（公開 Catalog 隱藏）、再 `draft → published`；重啟 3013 後仍為價格 999、`published`，公開總數為 9。未清空或重建資料。
- 新增 360×800 Playwright 回歸關卡，確認品牌導覽中的「訂單查詢」可見且 bounding box 完整位於 viewport；對目前 Wave 7 渲染結果通過。證據圖為瀏覽器渲染，不是真人手機截圖：`docs/testing/evidence/fifth-round-2026-09-27-home-mobile.png`、`...-home-desktop.png`。
- 實際影像辨識／資訊提取／主體合成仍 BLOCKED：目前只有明確標示的 Mock 流程，沒有 raw-data 茶樣來源、OCR／vision provider 或可驗證的衍生素材 manifest；不得把 Mock 預覽算作完成。
- 本輪沒有新增網站業務功能或外部服務；`AGENTS.md`、`next-env.d.ts` 仍為既有未提交環境變更，未 staged、未提交。
- 本輪新回歸測試與驗證：Vitest 32 files／177 tests、TypeScript、Webpack build、ESLint 0 errors／5 warnings、Chromium e2e 15/15；WebKit 未重新宣稱通過，仍受既知 Avast／managed Windows 限制。

## 2026-09-27 收尾修復與明日交接

- 工程現場：branch `codex/wave-7-shopping-quality-gate`；本節驗證交付點以 Git log 與遠端分支確認為準。`AGENTS.md`、`next-env.d.ts` 是既有 Next.js／環境未提交變更，未覆蓋、未 staged。3013 使用目前 worktree、`DEMO_DATA_DIR=.demo-data/lan-demo-third-round-final-2`、LAN Demo flags，未清空資料。
- P0 品牌：公開 metadata、首頁品牌導覽與 aria-label 已統一為「陳老師茶行」；歷史 specs、舊證據與交接紀錄保留原貌。新增品牌一致性 tests，程式碼與 public storefront 不再暴露「龍映茗茶」。
- P0 結帳根因：API 實際回傳 200 且已建立訂單，但 `/checkout/success` route 原先丟棄 `?order=`，只等待 client storage effect，造成手機看見「正在準備訂單資訊」。現在 server page 直接傳入非敏感 order id；同源 LAN Chromium 已實際顯示感謝、訂單編號、狀態、返回首頁、查看訂單，查單 secret 仍不渲染。
- P0 Catalog：同一 file-backed store 的八種茶與測試茶保留；`台灣野生紅茶` 的 `888 → 999`、下架隱藏、重新上架、重啟持續結果已在前一階段驗證，未建立第二份商品清單。
- P0 手機導覽：360×800 與 1280×800 LAN browser 均實際看見品牌導覽「訂單查詢」；實體手機仍須明日重新載入 3013 並由陳老師確認，瀏覽器證據不能替代真人驗收。
- P1 後台欄位：既有／新增商品表單與 Catalog update boundary 已支援中文茶類、售價、庫存、香氣、口感、產地、商品介紹；既有八種 fixture 的 aroma／taste／teaRegion 會載入。圖片仍區分原始素材與未完成合成主圖，不宣稱 AI。
- P1 影像流程仍 BLOCKED：工作樹沒有可用 raw-data 茶樣、OCR／vision／composition provider 或授權衍生 manifest；目前 Mock 流程只能作 UI boundary。明日唯一優先工作是實體手機重跑 P0 閉環；影像服務需另行提供來源、授權與工具後再決策。
- 證據：`docs/testing/evidence/2026-09-27-finish/home-mobile.png`、`home-desktop.png`、`checkout-success.png`、`admin-product-fields.png`；均為 LAN Chromium 實際渲染，不是真人手機截圖。
- GitHub PR #15：本機沒有 `gh` CLI，未宣稱已讀取 PR 狀態；不影響本地修復，明日可用 GitHub connector／瀏覽器補查。

## 2026-09-27 後台商品管理簡化決策

- 內建影像辨識、資訊提取、主體拆解、圖片合成與 Mock 進度流程正式取消；網站不再宣稱或提供這些能力。照片由店家自行拍攝或使用外部工具處理後，再以上傳素材進入網站。
- `/admin/products` 改用 `ProductManagementPage`，新增頁與編輯頁共用 `ProductFields`、`minimumProblems` 與相同 Catalog PATCH／POST boundary。新增使用空白表單；編輯載入既有商品的名稱、類別、規格、價格、庫存、香氣、口感、產地與介紹。
- 後台清單保留新增、編輯、上架、下架；前台與後台均讀取同一 `/api/demo/catalog` 與 file-backed Catalog Store。publication 變更只改狀態，不刪除商品或歷史訂單。
- `PublishingService` 已移除 `generateSummary`，避免 service contract 保留已取消的 Mock 文案生成能力。既有八種茶與 Demo 資料未清空、未重建。
- `AGENTS.md` 與 `next-env.d.ts` 的既有未提交變更仍未 staged；本階段不得覆蓋或提交。
- 驗證：Vitest 35 files／176 tests、TypeScript、Webpack production build 通過；ESLint 0 errors、5 個既有 warning（圖片最佳化與 internal navigation）。真人手機驗收仍需由店家執行。影像 AI 現在是已取消／out of scope，不再是網站交付阻塞。

## 2026-09-27 晚間接續檢查（未改動 Demo 商品資料）

- 最新程式提交：`088926f` 保留結帳成功收據；`27326ed` 簡化姓名／手機末三碼查單介面；`17cb377` 為查單與 OTP 增加 SQLite Demo 限流。它們仍是本機合成 LAN Demo，不能視為正式驗證或正式推送服務。
- 當次重跑 Vitest：40 files／192 tests 全部通過；前一次同一工作目錄的 TypeScript 呼叫沒有顯示編譯錯誤。Node 仍是 24.21.0，和 package.json 固定 24.19.0 不符。後續另一次未先切到工作樹的 Corepack 命令觸發不必要下載，已停止；不將該次列為成功驗證。
- `http://172.20.10.4:3013/` 及 `/api/demo/catalog?limit=50` 當下均回傳 200，後者 `value.total=8`。舊交接曾記錄公開 9 件、含草稿 10 件；須先核對現行 PID／`DEMO_DATA_DIR`／相對應的 catalog.json，不能據此推定資料遺失，也不得清空、重建或將 fixture 覆寫現存資料。
- 保留進場前既有 `AGENTS.md`、`next-env.d.ts` 未提交改動；3013 正在運行，不任意終止。真正真人手機驗收、通知實際送達、正式支付與 ERP 均未完成。內建影像辨識及合成已取消，照片由外部處理後上傳。
- 下一個單一優先步驟：核定唯一 Demo data directory、用同一個 LAN origin 在實體手機完成姓名／末三碼／OTP 查單與感謝頁，並檢查 429 提示；有可重現錯誤才做小範圍修正。

## 2026-09-27 實機查單結果返回入口修正

- 游老師手機實際查單成功，截圖顯示訂單成立、模擬付款狀態及 preview-only 通知；指出結果卡片底部缺少返回首頁入口。這是已觀察到的真人 UI 缺口，不把通知預覽當作已推送。
- `OrderLookupPage` 在成功結果卡片末端加入前往 `/` 的「返回首頁」連結，未修改查單 OTP、姓名／末三碼、查單憑證、限流或 Demo 資料。回歸測試同時驗證未查到結果前不顯示該連結、查詢成功後連結指向 `/`。
- 本地驗證：focused Vitest 2/2、TypeScript `tsc --noEmit` 與 `git diff --check` 通過；未做真人手機第二次確認。`AGENTS.md`、`next-env.d.ts` 為原有未提交環境變更，保留不納入此修正。

## 2026-09-27 店家手機導覽接續

- 本機 3013 首頁與 `/admin/orders` 皆 HTTP 200；保留原有店家登入、付款確認、包裝照片、出貨及模擬通知。為店家訂單頁增加「返回首頁」連結，避免手機操作進入後無返回選項。
- 對應 UI 與工作流 focused Vitest 3 files／6 tests、`tsc --noEmit`、`git diff --check` 通過。沒有建立、修改或刪除任何現存 Demo 訂單／商品，也沒有重啟 3013。真人店家端登入與包裝、出貨仍待操作驗收；請勿於聊天或 Git 分享店家密碼。

## 2026-09-27 查單憑證遺失的 OTP 前置防護

- 實體手機查詢舊訂單時，因原下單分頁被覆蓋、查單憑證未帶入，先前仍能領取 Demo OTP，到提交查單才提示憑證缺失。這不代表舊訂單被刪除；伺服器僅持有查單憑證摘要，不能反推原憑證。
- 現已在取得 OTP 前檢查完整訂單編號與查單憑證；缺少時停用按鈕並明確提示原下單分頁或自己保存的憑證。查單原有姓名、手機末三碼、一次性 OTP、查單憑證及限流安全條件全部保留。敏感憑證不放入 URL、公開畫面或持久化 localStorage。
- 驗證：focused Vitest 2 files／5 tests、TypeScript `tsc --noEmit`、`git diff --check` 通過。此功能僅防止無謂領取 OTP，**沒有**完成舊憑證補發、跨分頁自動同步、正式簡訊或顧客實體手機再次驗收。若未來設計補發，需獨立核准身分確認、濫用限制與一次性換發契約。
- 現有 Demo 資料（8 published／11 total catalog、歷史訂單）未修改；`AGENTS.md`、`next-env.d.ts` 是原有未提交環境變更，不納入提交。

## 2026-09-27 手機查單固定返回入口修正

- 實體手機在缺少原查單憑證時，查單頁只顯示憑證前置警示、無可見返回首頁入口；原本連結誤放在 `result` 成功條件內。本輪改為頁面標題下方固定顯示「返回首頁」，不依賴登入、OTP、憑證或查單結果；成功結果不重複顯示第二個同名連結。
- 回歸測試覆蓋有保存收據、成功查單、缺少憑證時首頁連結均可見。focused Vitest 2 files／5 tests、TypeScript 與 diff check 通過。未重啟 3013、未清除或修改商品及訂單；截圖左下角顯示 2 Issues，尚未讀取開發 overlay 詳細錯誤，不能宣稱已修復。
- 先前要求游老師從新訂單開始的流程還未得到成功頁截圖，該驗收不能標註通過。下一步應先由手機驗證固定返回入口，再調查新訂單為何未帶入同分頁查單憑證；不得降低 OTP／查單憑證安全要求。

## 2026-09-27 成功頁同分頁收據重新讀取

- 發現 `/checkout/success?order=...` 的 server props 已有 orderId 時，原版 `DemoCheckoutSuccessPage` 的 effect 直接略過 `sessionStorage`，不會再核對或讀取原下單分頁完整收據；手機另開分頁時 sessionStorage 可能不存在。這是流程銜接問題，不能單憑此認定某筆手機訂單的唯一失敗原因。
- 修正：成功頁仍以 server 傳來的訂單編號立即顯示，但 client effect 只接受 `orderId` 完全相符的同分頁收據，不接受其他訂單的憑證；當收據缺失時明確說明同分頁限制，仍不在畫面或 URL 顯示 secret。查單端仍需原查單憑證、姓名／末三碼及 OTP，沒有實作繞過驗證的補發。
- focused Vitest 4 files／8 tests、`tsc --noEmit`、diff check 通過。既有本機 Demo 仍在 3013，未重啟或修改資料；本修正尚未取得真人手機新訂單完整驗收。`AGENTS.md` 與 `next-env.d.ts` 原有環境改動不納入提交。

## 2026-09-27 晚間最終交接 — 真人手機驗收完成

- 游老師本人手機依序完成結帳 1/3 身分與合成 OTP、2/3 配送地址、3/3 確認，看到感謝購買與新訂單編號，再進入同分頁查單；姓名 Yu、末三碼 000、同筆憑證自動帶入，取得查單 OTP 後顯示「訂單成立／待模擬確認」。不要再寫成未經真人驗收或要求重新下同一筆訂單。
- 查單頂端固定返回入口已真人確認；結果底部再次找不到入口，已於 2870803 新增第二個返回首頁並完成程式測試，但尚未單獨點擊驗收。全站深色實心白粗字按鈕方向已獲真人手機回饋「舒服多了」。
- Demo 店家密碼僅存 4090 本機權限限制的桌面文字檔，不可納入 Git／聊天；原資料目錄與備份保留，禁止清空商品、訂單。店家登入已真人完成，包裝拍照與出貨端到端仍需逐步真人驗收。
- 通知僅 preview-only；紅色 Next dev Issues 尚未定位詳情；影像辨識與合成已取消。保留既有 AGENTS.md 與 next-env.d.ts 未提交環境變動，勿 stage／覆寫。
- 明日先讀 README、AGENTS、WORKFLOW、HANDOFF、WHITEPAPER 和 Git；驗證 3013 與資料目錄，定位 dev Issues，再檢查查單底部返回入口與店家包裝出貨。不得碰正式金流、ERP 或宣稱正式通知完成。

## 2026-09-28 查單導覽安全補強（待實機驗收）
- 成功頁若缺少同分頁 sessionStorage 查單憑證，顯示補填及聯絡店家說明，入口改為「前往安全的訂單查詢」；不將秘密放入 URL、公開 DOM 或 localStorage，也不繞過 OTP、姓名、末三碼與限流。
- 查單錯誤提供明確重試、成功後可查另一筆；結帳離開導覽加強深色按鈕及手機寬度排列。只改 UI／提示及其測試，沒有清理 Demo 資料。
- 先前 Codex 執行 Vitest 遇 spawn EPERM；重新以現有 vitest.cmd 啟動後完成 41 files / 196 tests，TypeScript 與 focused ESLint 均通過，git diff --check 通過。新分頁缺憑證的提示與安全查單入口已增加回歸斷言。
- edea 3013 LAN dev server 已恢復並讀到既有 catalog 8 件 published；沿用 .demo-data/lan-demo-third-round-final-2，不重建 catalog、orders 或 outbox；非正式對外部署。
- 待游老師實體手機確認：同分頁下單查詢、新分頁缺憑證復原、查詢另一筆、返回首頁、店家包裝及出貨。正式付款、簡訊、Email/Web Push、ERP 仍未啟用。
- AGENTS.md 和 next-env.d.ts 是進場前未提交的環境變更，本階段不修改、不 stage、不 commit。


## 2026-09-28 店家協助補發查單密語（待手機實機驗收）

- 游老師手機已驗收：顧客下單、OTP 查單、店家模擬付款、上傳包裝照片、確認出貨。原訂單 DEMO-a2afefc2-e142-4469-b8b4-fe82afdd6ff5 在店家端為 shipped；顧客端刷新後 sessionStorage 遺失查單密語，無法驗證同步狀態，不能視為顧客端出貨查詢通過。
- 已加同分頁憑證重新讀取；若瀏覽器憑證真的遺失，必須由店家先以其他方式核對顧客身分，再於本機 Demo 店家已登入畫面針對單一訂單手動確認並輪替查單密語。舊密語立即失效，新的 32-byte random 密語只在授權回應和當次店家頁面顯示，不能從雜湊還原。回應 no-store，畫面可選取及複製；請勿透過公開聊天傳遞。正式網站尚未實作此功能。
- 顧客仍需使用訂單編號、完整合成手機號碼、姓名、更新後的查單密語及獨立 OTP；沒有姓名與末三碼直接繞過的捷徑。補發不改付款、出貨、包裝照片或通知紀錄，不自動寄送任何訊息。
- Codex 交付 commit 78ed6a0，補強 no-store 與可選取密語的兩個檔案尚需本輪單獨提交。獨立驗證：TypeScript 通過；focused 3 files / 22 tests；全套 41 files / 205 tests 通過（Vitest 限定 threads、單 worker，避開 Windows spawn EPERM）。尚未執行真人手機補發/重新查單驗收；不能宣稱端到端完成。
- 原本 AGENTS.md、next-env.d.ts 未提交修改保留；沒有清除或重建既有 .demo-data；沒有正式金流、物流、Email、推送。店家登入憑證保留在本機私有檔，勿發到聊天。

## 2026-09-28 顧客與店家共用訂單進度燈號（待手機視覺驗收）
- 五個固定關卡：訂單成立、模擬付款確認、完成包裝、確認出貨、確認送達；完成綠燈、未完成紅燈，搭配文字。依授權 API 訂單狀態判定，顧客仍需 OTP。通知 queued/preview-only 不視為實際送達。手機單欄版。
- TypeScript、focused 3 files / 12 tests、全套 42 files / 208 tests 通過。未清除既有資料，手機視覺驗收待確認。AGENTS.md、next-env.d.ts 既有修改不動。

## 2026-09-30 Wave 7 shopping quality gate / issue #17

- Customer payment is now traditional/manual only: bank transfer, cash, phone confirmation, or LINE voice confirmation. Credit-card and LINE Pay integration are not implemented. Orders record the selected method and start as `pending-manual-verification`.
- Only the authenticated merchant workflow can move an order to `manual-confirmed`; packing photo, shipment, and delivered remain separate states. Customer lookup shows the payment method and manual-payment state through the existing OTP and lookup-secret gates.
- Mobile checkout visibly includes the four traditional choices and explains the no-charge/manual-confirmation boundary. Primary navigation links are dark, high-contrast pill controls. Existing Catalog Store coverage verifies image replacement persistence across reload; the mobile e2e flow now covers delivered status.
- Scope guard: no AI image composition, OCR/vision provider, ERP expansion, external payment, real notification, or production deployment was added.
- Actual verification: `tsc --noEmit` passed; focused ESLint passed with 0 errors and 1 existing Next navigation warning; `git diff --check` passed. Vitest could not start because Vite config bundling hit the known Windows worktree symlink `spawn EPERM`; Turbopack hit the known invalid external `node_modules` symlink panic; `next build --webpack` also hit environment `spawn EPERM`. Full lint still reports only the two pre-existing generated `.demo-data/*.cjs` errors plus existing warnings.
- Commit `0cdd848` is pushed to `origin/codex/wave-7-shopping-quality-gate`; GitHub state is `SYNCED` for this branch. Local `gh` and the browser connector could not read PR #15; this remains an external read limitation, and no PR status is invented. Existing uncommitted `AGENTS.md` and `next-env.d.ts` changes remain untouched, unstaged, and uncommitted.

## 2026-09-30 Wave 7 closeout verification

- Preserved the pre-existing unstaged `AGENTS.md` and `next-env.d.ts` changes. Added only the quality-gate fixes: ignored generated `.demo-data` scripts in ESLint, corrected one-time OTP test fixture reuse, updated Demo E2E selectors to the current traditional-payment/product-photo scope, serialized the shared-data mobile Demo E2E to one worker, and fixed order-lookup hydration plus the product-management link contrast issue.
- Confirmed the payment boundary remains bank transfer, cash, phone confirmation, or LINE voice confirmation only. No credit-card or LINE Pay path was added. Demo orders remain `pending-manual-verification` until merchant confirmation; packing photo, shipped, and delivered remain distinct.
- Fresh verification: TypeScript passed; ESLint passed with 0 errors and 7 existing warnings; Vitest 42 files / 209 tests passed; webpack production build passed and generated all 17 static pages; Pixel 7 Chromium Demo E2E passed 2/2 covering catalog image replacement persistence, cart, three-step checkout, traditional payment, thank-you page, OTP lookup, merchant manual confirmation, packing photo, shipped, and delivered.
- Fresh Chromium axe targeted verification for the current product-new page passed 1/1 after rebuilding standalone output. The full legacy `playwright.config.ts` suite is not a release pass: its current run was 13/30 passed, with WebKit browser contexts closing in this Windows environment and several Chromium product-draft assertions still targeting the superseded pre-Wave-7 draft UI. These are separate from the passing current mobile Demo gate.
- Cloud Run is documented only as the future Docker target (`asia-east1`); the repository has no safe staging/preview deployment URL or deployment workflow. No cloud or production environment was changed. Remote PR #15 / Issue #17 API reads remained unavailable because `gh` is not installed and outbound GitHub API access was refused.

## 2026-09-30 手機 Demo 包裝照片確認流程收斂

- 本輪保留既有未提交的 `AGENTS.md` 與 `next-env.d.ts`，沒有 reset、clean、覆蓋或納入本輪 commit。實作範圍只含店家手機包裝照片流程、相關回歸測試與真實進度文件。
- `features/demo/components/admin-orders-page.tsx` 現在提供「開啟相機」與「選擇相簿」兩個入口；拍照／選取後只顯示本機預覽，提供取消與重選，必須按「確認包裝」才呼叫既有 `packingPhoto` API。照片失敗時預覽保留，不能直接變成已打包或可出貨。
- `tests/admin-orders-packing-photo.test.tsx` 覆蓋相機／相簿屬性、選取後未上傳、取消、重選、上傳失敗保留預覽，以及確認成功後才刷新為已打包；`e2e-demo/mobile-order-loop.spec.ts` 覆蓋相簿選取、明確確認、出貨與已送達。既有 checkout、order lookup 測試仍覆蓋銀行轉帳／現金／電話確認／LINE 語音確認、返回首頁與查單結果。
- 實際驗證：`node node_modules/typescript/bin/tsc --noEmit --incremental false` 通過；本輪檔案 focused ESLint 0 errors、1 個既有 `@next/next/no-img-element` warning；`git diff --check` 通過。Vitest 先以可用的單 worker threads 命令嘗試，因 Vite config bundling 的 Windows worktree `spawn EPERM` 無法啟動；改用 `--configLoader runner` 又因依賴 CommonJS `require` 在 runner 啟動失敗，未將 Vitest 記為通過，也沒有同錯重試。
- 公頻通道檢查結果：工作樹與目前可用工具沒有可確認授權的「不死系統／假人一號」發送通道，因此以下兩則訊息均未送達、不可宣稱已發布：開始訊息為「【茶行／開始】Codex 接續 wave-7 收斂手機 Demo；已檢查工作樹；預計修復包裝照片確認流程並執行測試。」；結束訊息為「【茶行／上傳結束】分支、commit SHA、測試結果、剩餘待游老師驗收事項。」
- 人工驗收清單仍未完成：游老師需在手機實際操作相機拍照、相簿選取、預覽後取消／重選／確認，再逐步確認付款、包裝、出貨、已送達與顧客查單狀態；新匯款流程尤其尚未人工驗收，不能宣稱通過。正式付款、正式通知、ERP 與 production 仍不在範圍。
- 交付阻塞：嘗試以本輪檔案建立 commit 時，Git 無法在 linked worktree 的外部 metadata 建立 `index.lock`，回傳 `Permission denied`；確認 `index.lock` 原本不存在，未刪除任何 lock，也未強行繞過 Git。因沒有新 commit，未執行 push；目前仍須在具 Git metadata 寫入權限的環境完成 stage／commit／push，並以遠端 SHA 驗證後才能發送結束公頻訊息。
