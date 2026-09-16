# Wave 1 Reproducible Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a clean, reproducible, tested, and container-ready Next.js storefront baseline without importing candidate-template application code or implementing commerce features.

**Architecture:** A minimal Next.js App Router application owns its source and configuration. The only runtime behavior is a static baseline homepage and an infrastructure-only health route; Vitest/React Testing Library cover those contracts, Playwright covers Chromium/WebKit and accessibility, and a standalone multi-stage image provides the Cloud Run boundary.

**Tech Stack:** Node.js 24.19.0, pnpm 11.19.0, Next.js 16.3.5, React 19.3.0, TypeScript, Tailwind CSS 4, shadcn/ui project conventions, ESLint, Vitest, React Testing Library, Playwright, axe-core, Docker, and GitHub Actions.

**Spec:** `docs/superpowers/plans/2026-09-14-frontend-implementation-plan.md` (approved Wave 1 section), constrained by `docs/audits/2026-09-14-wave-0-template-audit.md`.

## Global Constraints

- Start from verified `main` commit `676136af246d9082fb8250f0923c6f44345d05f3` on `feature/wave-1-reproducible-baseline`.
- Pin Node.js to `24.19.0`, pnpm to `11.19.0`, Next.js to the current stable `16.3.5`, and direct dependencies to exact versions.
- Do not import any source, asset, registry configuration, domain data, fake authentication, or fake payment flow from the audited candidate template.
- Do not fetch shadcn registry components in this Wave. Establish `components.json` and a project-owned `lib/utils.ts`; add UI primitives only in later Waves after file-level review.
- Do not add ERP, database, authentication, payment, analytics, real product, or private customer data.
- `.env.example` contains variable names and safe non-secret defaults only. No credential may enter Git, build output, test output, health output, or logs.
- The health route must not call storage, Mock APIs, ERP, payments, or any external service.
- The standalone runtime must run as a non-root user, bind `0.0.0.0`, and accept Cloud Run's injected `PORT`.
- Browser coverage is limited to Playwright Chromium and WebKit. Accessibility is checked with axe-core on the baseline homepage.
- Run the initial dependency install with scripts disabled, inspect ignored build scripts, then run the required frozen install and all quality gates.
- Local Docker is unavailable on this host. The same Docker build and smoke commands must run on GitHub Actions before the PR is considered verified.

---

### Task 1: Reproducible Next.js and shadcn Project Baseline

**Files:**
- Create: `.gitignore`
- Create: `.node-version`
- Create: `.nvmrc`
- Create: `.env.example`
- Create: `THIRD_PARTY_NOTICES`
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `next.config.ts`
- Create: `eslint.config.mjs`
- Create: `postcss.config.mjs`
- Create: `components.json`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `features/home/components/home-page.tsx`
- Create: `lib/utils.ts`
- Create: `vitest.config.mts`
- Create: `tests/setup.ts`
- Test: `tests/home-page.test.tsx`

**Interfaces:**
- Consumes: no application interface; only the approved Wave 1 stack and baseline copy.
- Produces: `HomePage(): JSX.Element`, root route `/`, `cn(...inputs: ClassValue[]): string`, and scripts `lint`, `typecheck`, `test`, `test:run`, `build`, and `start`.

- [ ] **Step 1: Create the pinned package and toolchain configuration**

Create `package.json` with exact versions, `private: true`, `packageManager: "pnpm@11.19.0"`, exact Node/pnpm engines, and these scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

Runtime dependencies are exactly `next@16.3.5`, `react@19.3.0`, `react-dom@19.3.0`, `clsx@2.1.1`, and `tailwind-merge@3.7.0`. Development dependencies are exactly `tailwindcss@4.3.3`, `@tailwindcss/postcss@4.3.3`, `typescript@6.0.2`, `@types/node@26.5.1`, `@types/react@19.3.0`, `@types/react-dom@19.3.0`, `eslint@10.10.0`, `eslint-config-next@16.3.5`, `vitest@5.0.0`, `@vitejs/plugin-react@6.1.1`, `vite-tsconfig-paths@6.1.1`, `jsdom@30.0.1`, `@testing-library/react@16.3.3`, `@testing-library/dom@10.4.2`, and `@testing-library/jest-dom@7.0.1`.

- [ ] **Step 2: Add strict framework, styling, lint, shadcn, and test configuration**

Set `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` to `true` in `tsconfig.json`; keep the `@/*` path alias. Set `output: "standalone"` in `next.config.ts`. Configure Tailwind 4 through `@tailwindcss/postcss` and `@import "tailwindcss"`. Configure ESLint with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. Configure Vitest with React, tsconfig paths, `jsdom`, and `tests/setup.ts` importing `@testing-library/jest-dom/vitest`.

Create `components.json` for React Server Components, TSX, Tailwind CSS at `app/globals.css`, neutral base color, CSS variables, and aliases `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, and `@/hooks`. Do not configure a third-party registry.

- [ ] **Step 3: Write the failing homepage component test**

Create `tests/home-page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { HomePage } from "@/features/home/components/home-page";

it("gives visitors one clear storefront starting point", () => {
  render(<HomePage />);
  expect(screen.getByRole("heading", { level: 1, name: "慢慢選一杯好茶" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "開始選茶" })).toHaveAttribute("href", "#baseline");
});
```

- [ ] **Step 4: Run the focused test and verify RED**

Run: `pnpm test:run tests/home-page.test.tsx`

Expected: FAIL because `@/features/home/components/home-page` does not exist.

- [ ] **Step 5: Implement the minimal synchronous baseline homepage**

Create `HomePage` as a synchronous, data-free semantic component containing the tested heading and anchor. The anchor targets a small `id="baseline"` section that states this is the Wave 1 technical baseline; do not add product data, final brand styling, remote images, or commerce interactions. `app/page.tsx` only returns `<HomePage />`. `app/layout.tsx` uses system font fallbacks and Traditional Chinese metadata without remote font downloads.

- [ ] **Step 6: Verify GREEN and the static gates**

Run:

```text
pnpm test:run tests/home-page.test.tsx
pnpm lint
pnpm typecheck
```

Expected: one passing test, ESLint exit 0, and TypeScript exit 0.

- [ ] **Step 7: Record notices and safe environment names**

Create `.env.example` with only `PORT=3000` and `HOSTNAME=0.0.0.0`. `THIRD_PARTY_NOTICES` must state that no Wave 0 candidate-template source or asset was imported, list the direct open-source packages and upstream license locations, and explain that future copied shadcn primitives require file-level notice review.

- [ ] **Step 8: Create and verify the frozen lockfile**

Run:

```text
pnpm install --lockfile-only --ignore-scripts
pnpm install --frozen-lockfile --ignore-scripts
pnpm ignored-builds
pnpm install --frozen-lockfile
```

Expected: both frozen installs exit 0; any ignored scripts are reviewed and recorded before the normal frozen install.

- [ ] **Step 9: Commit Task 1**

```text
git add .gitignore .node-version .nvmrc .env.example THIRD_PARTY_NOTICES package.json pnpm-lock.yaml tsconfig.json next-env.d.ts next.config.ts eslint.config.mjs postcss.config.mjs components.json app features lib vitest.config.mts tests
git commit -m "feat: establish reproducible Next.js baseline"
```

---

### Task 2: Health Contract and Standalone Cloud Run Container

**Files:**
- Create: `app/api/health/route.ts`
- Test: `tests/health-route.test.ts`
- Create: `public/.gitkeep`
- Create: `Dockerfile`
- Create: `.dockerignore`

**Interfaces:**
- Consumes: Next.js standalone build and `pnpm@11.19.0` from Task 1.
- Produces: `GET(): Promise<Response>` at `/api/health`; OCI image entrypoint `node server.js` accepting `PORT` and `HOSTNAME`.

- [ ] **Step 1: Write the failing health-route contract test**

```ts
import { GET } from "@/app/api/health/route";

it("reports readiness without exposing runtime configuration", async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toContain("application/json");
  await expect(response.json()).resolves.toEqual({ status: "ok" });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm test:run tests/health-route.test.ts`

Expected: FAIL because `app/api/health/route.ts` does not exist.

- [ ] **Step 3: Implement the minimal health route**

Create an async `GET` returning `Response.json({ status: "ok" }, { status: 200 })`. Do not include timestamps, environment values, build identifiers, product data, or dependency checks.

- [ ] **Step 4: Verify GREEN**

Run: `pnpm test:run tests/health-route.test.ts`

Expected: one passing test.

- [ ] **Step 5: Add a non-root multi-stage standalone Dockerfile**

Use `node:24.19.0-alpine` for `base`, `deps`, `builder`, and `runner`. Activate exact pnpm with Corepack; install with `pnpm install --frozen-lockfile`; build in `builder`; copy `.next/standalone`, `.next/static`, and `public` into `runner`; create and run as UID/GID 1001; set `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, default `PORT=3000`; expose 3000; and start with `node server.js`.

- [ ] **Step 6: Restrict Docker build context**

`.dockerignore` must exclude `.git`, `.github`, `.next`, `node_modules`, coverage, Playwright output, test results, local logs, `work`, `.superpowers`, all `.env*`, and then explicitly allow `.env.example`. It must not exclude `app`, `features`, `lib`, `public`, `package.json`, or `pnpm-lock.yaml`.

- [ ] **Step 7: Verify unit, lint, type, and production build**

Run:

```text
pnpm test:run
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands exit 0 and `.next/standalone/server.js` exists.

- [ ] **Step 8: Commit Task 2**

```text
git add app/api/health tests/health-route.test.ts public/.gitkeep Dockerfile .dockerignore
git commit -m "feat: add standalone health container baseline"
```

---

### Task 3: Chromium, WebKit, Accessibility, CI, and Security Gates

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `playwright.config.ts`
- Create: `e2e/baseline.spec.ts`
- Create: `.github/workflows/quality.yml`

**Interfaces:**
- Consumes: `/`, `/api/health`, `pnpm build`, and the final Dockerfile.
- Produces: scripts `test:e2e` and `security:audit`; Chromium/WebKit coverage; axe accessibility coverage; CI Docker build and smoke evidence.

- [ ] **Step 1: Add exact browser-test dependencies and scripts**

Add exact dev dependencies `@playwright/test@1.63.0` and `@axe-core/playwright@4.13.0`. Add scripts:

```json
{
  "test:e2e": "playwright test",
  "security:audit": "pnpm audit --audit-level=high"
}
```

Regenerate the lockfile with scripts disabled, then run a frozen install.

- [ ] **Step 2: Configure Playwright against a production server**

Configure `baseURL` as `http://127.0.0.1:3000`, `webServer.command` as `pnpm start`, `reuseExistingServer` only outside CI, `forbidOnly` in CI, two retries in CI, traces retained on first retry, and projects named exactly `chromium` and `webkit`. This task's execution order must run `pnpm build` before `pnpm test:e2e`.

- [ ] **Step 3: Write executable browser and accessibility checks**

Create `e2e/baseline.spec.ts` with three independent tests:

1. `/` exposes the level-one heading `慢慢選一杯好茶` and the `開始選茶` link.
2. `/api/health` returns status 200 and exactly `{ status: "ok" }`.
3. `new AxeBuilder({ page }).analyze()` on `/` returns no violations.

- [ ] **Step 4: Install only required browsers and run both projects**

Run:

```text
pnpm exec playwright install chromium webkit
pnpm build
pnpm test:e2e
```

Expected: all three tests pass once in Chromium and once in WebKit; six results, zero failures.

- [ ] **Step 5: Add the GitHub Actions quality workflow**

On pull requests and pushes to `main`, use checkout, Node 24.19.0, and pnpm 11.19.0. Run frozen install, install Chromium/WebKit with system dependencies, lint, typecheck, Vitest, build, Playwright, `pnpm audit --audit-level=high`, `docker build -t cheng-tea-shop:wave-1 .`, start the image on port 3000, and retry `curl --fail --retry 20 --retry-connrefused http://127.0.0.1:3000/api/health`. Always print container logs on smoke failure and remove the smoke container.

- [ ] **Step 6: Run local dependency and secret checks**

Run:

```text
pnpm audit --audit-level=high
pnpm audit --prod --audit-level=high
pnpm list --depth Infinity
git diff --check
rg -n -i --hidden -g '!node_modules/**' -g '!.next/**' -g '!pnpm-lock.yaml' '(api[_-]?key|secret|token|password|private[_-]?key|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY)'
```

Expected: no high/critical advisory, no whitespace error, and no credential value. False-positive documentation/configuration variable names must be inspected, not silently suppressed.

- [ ] **Step 7: Commit Task 3**

```text
git add package.json pnpm-lock.yaml playwright.config.ts e2e .github/workflows/quality.yml
git commit -m "ci: enforce browser container and security gates"
```

---

### Task 4: Documentation, Final Verification, and Pull Request

**Files:**
- Modify: `WHITEPAPER.md`
- Modify: `CAPABILITY_MAP.md`
- Modify: `HANDOFF.md`
- Modify: `docs/superpowers/plans/2026-09-14-frontend-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-09-15-wave-1-reproducible-baseline-implementation-plan.md`

**Interfaces:**
- Consumes: verified Task 1–3 commits and CI evidence.
- Produces: truthful Wave 1 status, verification record, residual risks, and a PR awaiting explicit merge confirmation.

- [ ] **Step 1: Update milestone documents to match evidence**

Record Next.js 16.3.5, Node 24.19.0, pnpm 11.19.0, strict TypeScript, test/browser counts, standalone/container design, current Docker verification location, audit outcome, and the fact that no template application code, ERP, real payment, login, or real product data was added. Do not mark Docker smoke complete until GitHub Actions actually passes.

- [ ] **Step 2: Run the complete fresh local gate**

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
pnpm test:e2e
pnpm audit --audit-level=high
pnpm audit --prod --audit-level=high
git diff --check
```

Expected: every command exits 0. Record exact test counts and audit findings from this run.

- [ ] **Step 3: Complete QA/Security and deployment review**

Review the complete diff from merge-base `676136af246d9082fb8250f0923c6f44345d05f3`. Confirm requirements line by line, inspect direct/transitive dependencies and scripts, verify the frontend contains no direct Mock/ERP/payment dependency, and check Docker runs non-root without copying environment or Git data.

- [ ] **Step 4: Commit documentation and review corrections**

```text
git add WHITEPAPER.md CAPABILITY_MAP.md HANDOFF.md docs/superpowers/plans
git commit -m "docs: record Wave 1 reproducible baseline"
```

- [ ] **Step 5: Push the feature branch and create the PR**

Push `feature/wave-1-reproducible-baseline` to `origin`. Open a PR to `main` describing scope, exclusions, file groups, local verification, CI Docker verification, security findings, third-party notices, and residual risks. Do not merge.

- [ ] **Step 6: Wait for required CI evidence**

Wait for the quality workflow. If it fails, capture the failing command, reproduce locally where possible, fix through a failing test or executable reproduction, rerun all affected gates, push the fix, and wait again. Stop only when the PR is open and required checks are green, then report the PR URL and wait for `確認合併`.
