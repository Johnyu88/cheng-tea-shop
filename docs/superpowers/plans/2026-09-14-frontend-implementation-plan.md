# Frontend Implementation Plan

Date: 2026-09-14
Status: Approved design plan; implementation not started
Project: Johnyu88/cheng-tea-shop
Deployment target: Google Cloud Run, Taiwan asia-east1

## Goal

Turn the approved 龍映茗茶 storefront, progressive 40-plus catalog, elder-friendly product publishing concept, Mock API boundary, and image-placeholder rules into small, testable delivery Waves. This document authorizes planning only. Website code starts only after this PR is merged and 游老師 gives an explicit「開始實作」or Wave 0 approval.

## Confirmed technical baseline

- Framework: Next.js App Router with TypeScript.
- Styling and components: Tailwind CSS and shadcn/ui.
- Package manager: pnpm with a committed lockfile.
- Unit and component tests: Vitest and React Testing Library.
- Browser tests: Playwright on Chromium and WebKit.
- Deployment: Next.js standalone output inside Docker, targeting Cloud Run asia-east1.
- Secrets: environment variables in the deployment platform; never commit credentials or real payment keys.

## Reuse decision

Candidate page skeleton:
https://github.com/shadcnspace/ecommerce-shadcn-nextjs-template

Before importing code, Wave 0 must verify the license, pin an exact commit, scan dependencies and scripts, run the unmodified build, and classify each area as keep, rewrite, or remove. The candidate is a starting skeleton, not the product architecture.

Architecture reference:
https://github.com/vercel/commerce

Use Vercel Commerce only to study provider separation and storefront organization. Do not import Shopify-specific data types, SDK calls, checkout flows, environment variables, or provider assumptions.

Excluded now:

- Deprecated Medusa Next.js starter: do not adopt.
- Saleor storefront/backend coupling: reconsider only in the later ERP/backend selection phase.
- Any template that requires secrets, remote install scripts, unclear licensing, or a provider-specific runtime before the audit passes.

## Architecture boundary

Required request path:

Page or Component
→ project-owned Frontend Service / API Interface
→ Mock Adapter during Phase 2
→ ERP Adapter after backend selection

UI code must not import mock fixtures, database clients, Shopify types, or ERP SDKs directly. Service interfaces own loading, empty, error, pagination, price, inventory, cart, checkout, and product-draft contracts.

Expected source areas:

- app for routes and page composition.
- components for reusable UI.
- features for catalog, product, cart, checkout, and publishing.
- lib/domain for project-owned types and validation.
- lib/services for frontend service interfaces.
- lib/adapters/mock for synthetic prototype behavior.
- tests and e2e for automated verification.

## Data and content rules

- Store money as integer TWD amounts; format only in presentation code.
- Prototype products are synthetic, clearly non-authoritative, and small in number.
- The UI must still be tested with generated lists exceeding 40 products.
- Missing images use a visibly labeled brand placeholder.
- Product or origin claims require evidence before publication.
- Draft, published, sold-out, over-limit, loading, empty, and error states are explicit.
- Do not ask 陳老師 to enter the real 40-plus catalog until persistent storage, sign-in, role authorization, backup, and restore are verified.

## Delivery workflow for every Wave

1. Create an isolated feature branch.
2. Confirm the Wave scope and acceptance checks.
3. Write the failing test or executable check first where applicable.
4. Implement only the approved scope.
5. Run automated verification and inspect responsive behavior.
6. Update WHITEPAPER.md, CAPABILITY_MAP.md, and HANDOFF.md when decisions or status change.
7. Complete code and security review.
8. Commit, push, open a PR, and stop for 游老師’s「確認合併」.

## Wave 0 — Template audit and pinning

Owner roles: Orchestrator, Architect, Security Reviewer, QA.

Work:

- Record candidate repository URL, license text, exact commit SHA, dependency list, and build requirements.
- Check package scripts, post-install behavior, remote downloads, telemetry, environment variables, and bundled assets.
- Run the candidate independently before copying anything.
- Produce a keep/rewrite/remove table for routes, components, styles, data access, checkout, authentication, analytics, and deployment files.
- Reject all provider-specific or unexplained code.

Exit checks:

- License and pinned commit are documented.
- Dependency and secret scan passes.
- Clean install and build results are recorded.
- No template code has entered main before the audit PR is approved.

## Wave 0 audit result — 2026-09-14

- Candidate pinned at commit 2df689427f1c22c6ed558ba59e13ac34965e6cec.
- Result: FAIL for wholesale import; PASS for proceeding with a clean project-owned baseline.
- No template code was copied or executed.
- Pre-install review failed because Next.js 16.1.7 is below the official security baseline, no tests or CI evidence exists, and data, payment, authentication, assets, and deployment conflict with this project.
- Dynamic build was not run after rejection; the execution environment was also unavailable. This is not build success.
- Only individually reviewed MIT UI primitives or layout concepts may be considered later with the required notice retained.
- Full evidence: docs/audits/2026-09-14-wave-0-template-audit.md.

## Wave 1 — Reproducible project baseline

Owner roles: Frontend Engineer, QA.

Work:

- Establish Next.js App Router, TypeScript strict mode, Tailwind, shadcn/ui, pnpm lockfile, lint, Vitest, React Testing Library, and Playwright.
- Add environment example with names only and no secret values.
- Configure Next.js standalone output and a minimal Docker build.
- Add a health route or equivalent smoke target.

Exit checks:

- pnpm install with frozen lockfile succeeds.
- lint, typecheck, unit tests, production build, and Docker smoke test pass.
- No production service, ERP, payment, or private product data exists.

## Wave 2 — Brand design system and responsive shell

Owner roles: UI/UX, Frontend Engineer, Accessibility Reviewer.

Work:

- Implement approved color, typography, spacing, border, focus, and motion tokens.
- Build header, navigation, footer, container, button, form, dialog, feedback, and image-placeholder primitives.
- Ensure minimum comfortable tap targets, clear focus, readable text, and reduced-motion support.
- Keep ambient sound off by default; bird and insect sound concepts require a separate consent-based feature decision.

Exit checks:

- Mobile, tablet, and desktop shell snapshots are reviewed.
- Keyboard navigation, focus visibility, contrast, and reduced motion pass.
- Components expose loading, disabled, error, and success states.

## Wave 3 — Domain interfaces and Mock Adapter

Owner roles: Architect, Frontend Engineer, QA.

Work:

- Define project-owned Product, ProductVariant, Money, InventoryStatus, Cart, CheckoutDraft, and ProductDraft contracts.
- Define catalog, cart, checkout, and publishing service interfaces.
- Implement deterministic synthetic Mock Adapter behavior for happy, empty, error, sold-out, and purchase-limit paths.
- Keep UI imports independent of fixtures.

Exit checks:

- Contract tests prove an adapter can be replaced without changing components.
- Price arithmetic uses integer TWD values.
- Generated 40-plus product data verifies pagination or progressive loading without becoming real catalog content.

## Wave 4 — Home and catalog

Owner roles: UI/UX, Frontend Engineer, QA.

Work:

- Build the approved 龍映茗茶 home experience and catalog discovery.
- Add category/filter controls, accessible product cards, price and availability display, placeholder labeling, and clear empty/error recovery.
- Preserve calm pacing, generous spacing, and elder-friendly controls.

Exit checks:

- Home and catalog pass mobile and desktop visual review.
- Keyboard, screen reader labels, loading, empty, error, and 40-plus-item behavior pass.
- No product facts are presented as verified unless evidence exists.

## Wave 5 — Product detail and cart

Owner roles: Frontend Engineer, UX Reviewer, QA.

Work:

- Build product imagery, description, variants, weight/price choices, inventory status, quantity controls, purchase limit messages, and cart editing.
- Make the multi-choice purchase panel visually grouped and easy to scan.
- When requested quantity exceeds the allowed amount, stop online completion and show the approved telephone-contact path for exchange or refund handling.

Exit checks:

- Variant selection, unavailable combinations, quantity limits, totals, removal, persistence behavior, and recovery states pass automated tests.
- Mobile purchase controls remain clear without covering important content.

## Wave 6 — Checkout and product-draft prototype

Owner roles: Frontend Engineer, UX Reviewer, Security Reviewer, QA.

Work:

- Build Mock checkout with contact, delivery, review, success, and failure states; do not integrate real payment.
- Build the elder-friendly one-page product draft form with large inputs, plain language, image preview, validation summary, save draft, and publish confirmation.
- Keep publishing synthetic and local to the Mock Adapter.

Exit checks:

- Sensitive fields are not logged or stored in client fixtures.
- Form recovery, validation, confirmation, and accidental double-submit protections pass.
- Real admin authentication and real publication remain explicitly blocked.

## Wave 7 — Release-quality verification and preview deployment

Owner roles: QA Lead, Accessibility Reviewer, Security Reviewer, DevOps.

Work:

- Run lint, typecheck, unit/component tests, Playwright Chromium and WebKit, accessibility scans, build, and Docker smoke tests.
- Verify responsive layouts, slow/error states, asset licenses, dependency risks, secret scanning, and adapter boundaries.
- Deploy a non-production preview container to Cloud Run asia-east1 with budget and log-retention limits.
- Conduct task-based testing with real older users after the operable prototype exists.

Exit checks:

- Critical user journeys pass on iPhone Safari-equivalent WebKit and desktop Chromium.
- No high-severity accessibility, security, secret, or data-loss issue remains.
- Older-user findings are recorded and prioritized before declaring Phase 1 complete.

## Required CI quality gate

Every implementation PR must pass:

- Frozen pnpm installation.
- Lint and TypeScript checking.
- Vitest unit and React Testing Library component tests.
- Playwright Chromium and WebKit journeys.
- Accessibility checks on key pages and dialogs.
- Next.js production build.
- Docker build and container smoke test.
- Secret and dependency review.
- Reviewer confirmation that UI imports only project-owned service interfaces.

## Cloud Run boundary

- Region: asia-east1.
- Runtime: stateless container with Next.js standalone output.
- Configuration: runtime environment variables; no credentials in Git.
- Logs: redact contact, checkout, and future account information.
- Costs: set conservative instance and concurrency limits before preview deployment.
- Persistence: Cloud Run container storage is not the product database and must never hold the only copy of catalog data.

## References

- Next.js testing with Vitest: https://nextjs.org/docs/app/guides/testing/vitest
- Next.js testing with Playwright: https://nextjs.org/docs/app/guides/testing/playwright
- Next.js deployment and standalone output: https://nextjs.org/docs/app/getting-started/deploying
- Cloud Run Next.js quickstart: https://cloud.google.com/run/docs/quickstarts/frameworks/deploy-nextjs-service
- Cloud Run regions: https://cloud.google.com/run/docs/locations
- shadcn/ui: https://ui.shadcn.com/
- Candidate ecommerce skeleton: https://github.com/shadcnspace/ecommerce-shadcn-nextjs-template
- Vercel Commerce reference: https://github.com/vercel/commerce

## Wave 1 execution record — 2026-09-16

- Wave 1 branch: `feature/wave-1-reproducible-baseline`; PR #12 is open as a draft.
- Implemented baseline: Next.js 16.3.5, Node 24.19.0, pnpm 11.19.0, strict TypeScript, Tailwind 4, shadcn configuration, Vitest/RTL, health route, standalone non-root Dockerfile, Playwright Chromium/WebKit, axe, and CI quality gates.
- Explicit exclusions remain intact: no wholesale candidate import, ERP, real payment, real login, real product data, or secrets.
- CI evidence: clean-runner lockfile bootstrap passed; first full Quality run failed at pnpm ignored-build policy for `unrs-resolver`, now addressed through a narrowly scoped `onlyBuiltDependencies` allowlist. Fresh full Quality verification is pending.
- `BLOCKED_EXTERNAL`: local npm/GitHub TCP restrictions prevent frozen install and Docker smoke reproduction; `NEEDS_ADVANCED_REVIEW`: final QA/Security and PR readiness require the fresh CI result.

## Start gate

This plan becomes executable only after:

1. The documentation PR is merged.
2. 游老師 explicitly says「開始實作」or approves Wave 0.
3. The implementation branch is created from the verified latest main.

Until then, do not write website code or import template code.
