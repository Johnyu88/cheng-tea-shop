# Phase 10-C CI Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Phase 10-C safety checks run on the current feature branch and produce an auditable GitHub Actions result without touching ERP, payment, logistics, customer data, or production deployment.

**Architecture:** Reuse the existing GitHub Actions workflow and package scripts. Trigger the workflow on pull requests, `main`, and `feature/wave-1-reproducible-baseline`; keep the job limited to frozen dependency installation, Vitest, the focused Phase 10-C test, TypeScript, ESLint, and a repository secret scan.

**Tech Stack:** GitHub Actions, pnpm 11.19.0, Node.js 24.19.0, Vitest, TypeScript, ESLint, PowerShell-independent shell commands.

**Spec:** User request for the Phase 10-C CI safety gate.

## Global Constraints

- Do not merge to `main`.
- Do not start or modify ERPNext, connect formal website data, payment, logistics, or real customer data.
- Do not stage or modify the pre-existing `next-env.d.ts` change.
- Do not add secrets, credentials, tokens, or persistent customer data.
- Do not claim CI passed until a fresh GitHub Actions run is inspected.

## Review Focus

- The feature branch must actually trigger the workflow on push.
- Frozen installation must use the committed pnpm lockfile.
- The focused Phase 10-C test must run separately and be visible in CI output.
- The secret scan must fail closed when a credential-like literal is added.
- Documentation must distinguish local verification from GitHub CI verification.

### Task 1: Minimal CI workflow

**Files:**
- Modify: `.github/workflows/quality.yml`
- Create: `docs/superpowers/plans/2026-09-23-phase-10c-ci-gate.md`

**Interfaces:**
- Consumes existing `package.json` scripts and `tests/phase-10c-erpnext-physical-mapping.test.ts`.
- Produces a push-triggered `quality` workflow for the current branch and pull requests.

- [ ] Step 1: Confirm the existing workflow trigger excludes the feature branch.
- [ ] Step 2: Update triggers and retain only the approved safety checks.
- [ ] Step 3: Validate YAML structure and inspect the diff.

### Task 2: Verification and documentation

**Files:**
- Modify: `WHITEPAPER.md`
- Modify: `HANDOFF.md`
- Modify: `CAPABILITY_MAP.md`

**Interfaces:**
- Consumes the fresh local verification output and GitHub run result.
- Produces an accurate Phase 10-C CI status; it must remain pending until GitHub reports success.

- [ ] Step 1: Run the exact local CI commands.
- [ ] Step 2: Inspect GitHub workflow status for the pushed commit.
- [ ] Step 3: Record the workflow URL, result, and any remaining boundary limitations.
- [ ] Step 4: Commit only workflow, plan, and documentation files.
- [ ] Step 5: Push and confirm remote synchronization without merging.
