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

## 同一區域網路真實手機驗收準備 — 2026-09-26

- 為實機展示增加明確 LAN opt-in：`DEMO_COMMERCE_LAN=enabled` 時，HTTP guard 只接受 RFC1918 私有 IPv4；未設定時仍只接受 loopback。production、公開／訪客網路與 `0.0.0.0` 綁定仍拒絕。
- LAN 模式的店家 cookie 改用不帶 `Secure` 的 `HttpOnly; SameSite=Strict; Path=/` 合成 cookie，因 HTTP 手機測試無法使用 `__Host-` cookie；loopback 預設仍維持 `__Host-...; Secure`。這只為本機假資料 Demo，不能帶入正式環境。
- 實機操作文件已補在 `docs/testing/mobile-demo-local-runbook.md`：取得私有 IP、啟動旗標、必要網址、手機與電腦同網、Windows 防火牆阻擋時停止並交由管理者處理，不自動修改安全設定。
- 待執行的真人手機驗收：用同一區網手機完整走商品→購物車→結帳→查單→店家處理→出貨狀態；目前尚未把此流程宣稱為真人／店家走查結果。Pixel 7 Chromium 自動化 1/1 仍是腳本證據。
- 本次已在本機私有介面 `172.20.10.4:3013` 啟動 Demo；必要網址為 `/`、`/cart`、`/checkout`、`/orders`、`/admin/orders`。主機 health／頁面可達；實際手機操作仍待陳老師在同一可信 Wi‑Fi 執行，不能由本機自動化代替。
- 已以同一 LAN URL `http://172.20.10.4:3013` 重跑 Pixel 7 Chromium synthetic flow，1/1 通過；這證明 LAN host/origin 與完整合成流程相容，不代表真實手機或真人走查已完成。
- 實機限制：HTTP LAN cookie 不具 Secure，故只允許假資料、假 OTP、假付款與假通知；不要輸入真實客戶／付款資料。Demo 結束應停止 server，並在確認路徑後清除 `.demo-data\lan-demo`。
