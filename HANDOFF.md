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
- GitHub state: the Wave 7-A branch is pushed and must be reconfirmed after the documentation follow-up commit; no credentials, payment keys, API keys, or customer data were added.

## Current next action after Wave 7-A

Keep Docker as the only local environment backlog item. The next safe frontend stage is to prepare the older-user task-based validation plan and review checklist; do not start paid preview deployment without explicit environment and credential authorization. Real participant validation still requires arranging participants.

## Startup reminder

Follow `RESUME_PROMPT.md`, `AGENTS.md`, and `WORKFLOW.md`. If newer explicit user instructions conflict with this handoff, the newer instruction wins and the discrepancy must be recorded.
