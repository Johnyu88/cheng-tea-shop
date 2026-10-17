# Older User Walkthrough Preparation Plan

> **For agentic workers:** This is a documentation-only preparation plan. No participant session, preview deployment, payment service, login, persistence, or ERP work is authorized by this plan.

**Goal:** Prepare a repeatable local, task-based walkthrough for an older operator or first-time shopper before any real participant session.

**Architecture:** Keep the walkthrough outside the application runtime. A facilitator uses the local Next.js app, reads one task at a time without coaching, and records observable behavior in the supplied issue template. Existing Chromium/WebKit acceptance tests remain the automated regression gate; this walkthrough adds human-centered evidence for comprehension and operability.

**Tech Stack:** Existing Next.js App Router prototype, local Mock services, Playwright 1.63.0 for regression only, Markdown records.

**Spec:** `docs/superpowers/specs/2026-09-14-elder-friendly-product-publishing-design.md`, `docs/superpowers/specs/2026-09-14-desktop-responsive-and-state-design.md`, and `docs/superpowers/specs/2026-09-21-wave-6-checkout-product-draft-design.md`.

## Global Constraints

- Run only on localhost; do not use a public URL or paid preview.
- Use synthetic products and contact values only; never enter real personal, payment, or customer data.
- Do not imply that checkout submits a real payment or order.
- Facilitators may clarify the task wording, but must not lead the participant to a control or complete a task for them.
- Stop if the participant becomes uncomfortable, asks to stop, or encounters a data/privacy concern.

## Review Focus

- Text is readable at the chosen viewport and browser zoom; record squinting, rereading, or missed labels.
- Primary and recovery controls are discoverable and large enough; record mis-taps, missed focus, or accidental duplicate actions.
- Navigation and backtracking preserve context and entered values; record dead ends or uncertainty.
- Product facts, price, stock status, and placeholder imagery are understood without inventing claims.
- Validation and error messages explain what to fix and do not erase entered data.

## Offline execution tasks

- [ ] Start the local server from the isolated worktree with `node node_modules/next/dist/bin/next dev`.
- [ ] Open `http://localhost:3000/` in a local browser at one desktop viewport and one 360px-wide mobile viewport.
- [ ] Read the facilitator script in `docs/testing/older-user-walkthrough.md` and present one task at a time.
- [ ] Record each observation immediately with the issue template; do not rely on memory.
- [ ] After the session, classify each issue as blocker, friction, comprehension, accessibility, visual, or content evidence gap.
- [ ] Re-run the automated regression commands listed in the guide before accepting any code change.

