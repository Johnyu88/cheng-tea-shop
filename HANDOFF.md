# HANDOFF

Last updated: 2026-09-16

## Current state

- Repository: `Johnyu88/cheng-tea-shop`
- Default branch: `main`
- Product stage: Phase 2 — Frontend prototype, Wave 0 audit completed
- Application code: not started; no candidate template code imported
- Highest principle: **Website First → Mock API → ERP Reuse → API Integration**
- GitHub state: `SYNCED` on `main`; governance resilience changes are under review on `docs/resilient-agent-governance`.

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
- Phase 1 remains in progress; application code has not started.

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
- Phase 1 remains in progress; application code has not started.

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
- No application code has been started.

The elder-friendly single-product publishing design was previously approved:

- Works on both mobile and desktop.
- Publishes one single-specification product at a time.
- Uses one to three photos with assisted cropping and lighting preview.
- Uses only available / sold-out inventory in the first version.
- Generates an AI description draft from provided facts and tags; human confirmation is mandatory.
- Saves a draft before explicit publication.
- If actual stock is insufficient after ordering, the tea shop contacts the customer within 24 hours for exchange or refund.
- No application code has been started.

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

After the Wave 0 audit PR is merged, execute Wave 1 on a new branch: scaffold a clean project-owned Next.js baseline with the current patched stable release, pnpm lockfile, strict TypeScript, lint, Vitest/RTL, Playwright, standalone output, and Docker smoke checks. Reuse only individually approved MIT primitives and keep all UI data behind project-owned service interfaces.

## Startup reminder

Follow `RESUME_PROMPT.md`, `AGENTS.md`, and `WORKFLOW.md`. If newer explicit user instructions conflict with this handoff, the newer instruction wins and the discrepancy must be recorded.
