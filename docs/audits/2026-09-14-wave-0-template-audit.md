# Wave 0 Template Audit

Date: 2026-09-14
Candidate: shadcnspace/ecommerce-shadcn-nextjs-template
Pinned commit: 2df689427f1c22c6ed558ba59e13ac34965e6cec
Decision: Reject wholesale import; allow only individually reviewed MIT UI primitives and layout concepts
Application code imported: None

## Result

The candidate matches the chosen framework direction but fails maturity, security, architecture, accessibility, testing, asset, and deployment gates. It must not be copied into cheng-tea-shop. Wave 1 will create a clean project-owned baseline.

## Evidence scope

Repository metadata, history, license, package manifest, lockfile, configuration, and all 78 text source/configuration files at the pinned commit were reviewed. Independent Frontend/Architecture and QA/Security reviews agree. No source was imported or executed.

| Check | Evidence | Decision |
|---|---|---|
| License | MIT, copyright 2026 ShadcnSpace | Retain copyright and permission notice for any reused file |
| Maturity | Four commits, four stars, one fork, no release | Not a production foundation |
| Automation | No workflow, tests, e2e, audit, accessibility, or Docker scripts | Quality is unproven |
| Reproducibility | Lockfile exists; no packageManager or engines | Pin Node and pnpm in Wave 1 |
| Deployment | Empty next.config; no standalone or Docker | Create clean Cloud Run baseline |

## Security and supply chain

- package.json pins Next.js 16.1.7. GHSA-q4gf-8mx6-v5v3 affects Next.js 16 before 16.2.3.
- The official August 2026 release recommends 16.3.3 Active LTS or 15.5.24 Maintenance LTS. Wave 1 uses current patched stable; 16.3.3 is the minimum known on this date.
- No lifecycle script, direct git/tarball dependency, eval, new Function, child_process, exec, spawn, process.env reference, or committed credential was found in reviewed text.
- Static findings do not replace package-manager audit.
- components.json points to a remote registry; do not fetch it automatically.
- Source references remote product/brand media without a separate provenance list; these assets are unverified and must not be reused.
- Google Fonts creates build-time network dependence; approved Traditional Chinese fonts should be self-hosted.

## Architecture findings

- Home, shop, product detail, and catalog directly import lib/data.ts.
- Product types and 19 unrelated sample products share one file; there is no project Service/API interface or Mock Adapter.
- Cart/wishlist use Nova localStorage keys and omit tea variants, inventory, limits, and adapter behavior.
- Checkout accepts card-like fields and claims success without a payment provider.
- Login/register are visual forms, not authentication.
- English metadata, USD, shipping/return claims, small text, hover movement, and extensive animation conflict with approved requirements.
- ProductListing contains a duplicate default dataset.

## Keep, rewrite, remove

| Area | Decision |
|---|---|
| App Router organization | Keep as reference; recreate |
| Strict TypeScript, aliases, ESLint | Keep concept; rebuild |
| Tailwind CSS variables | Keep concept; replace Nova tokens |
| lib/utils and shadcn primitives | Conditional keep after file review and MIT notice |
| Header/footer/grid/cards | Rewrite for brand, elder usability, responsive and accessibility rules |
| Domain/data/cart/checkout | Rewrite behind project services and Mock Adapter |
| Images/fonts | Replace with owned or verified assets and self-hosted fonts |
| Tests/CI/Docker/Cloud Run | Create clean in Wave 1 |
| Nova/sample content/reviews | Remove |
| Fake payment/authentication | Remove |
| Wishlist/newsletter/testimonials | Remove unless later approved |
| Remote registry/images | Remove |

## Dynamic build result

Not executed: rejected at pre-install security gate. The pinned Next.js is below the current security baseline, static conflicts already prohibit wholesale reuse, and the execution environment was unavailable. Running the rejected snapshot would not change the decision.

This is not a passing build. If evidence is later required, run only in a disposable environment with frozen lockfile and lifecycle scripts disabled, then inspect advisories and run lint, typecheck, and build before destroying it.

## Exit review

| Criterion | Result |
|---|---|
| License and exact commit | Pass |
| Static dependency/code/secret review | Pass; dynamic audit moves to clean Wave 1 |
| Independent build | Rejected before install; explicitly not certified |
| Keep/rewrite/remove classification | Pass |
| No candidate code entered project | Pass |
| Architecture and QA/Security reviews | Pass |

Wave 0 is complete as a rejection decision. Wave 1 begins from a clean scaffold and safe current dependencies.

## Wave 1 gate

- Recheck official Next.js security guidance on implementation day.
- Use current patched stable; 16.3.3 is the known minimum on 2026-09-14.
- Pin Node, pnpm, dependencies, and lockfile.
- Install first with lifecycle scripts disabled and allow only reviewed scripts.
- Add lint, typecheck, Vitest/RTL, Playwright Chromium/WebKit, accessibility, build, and Docker smoke.
- Configure standalone output for Cloud Run.
- Add THIRD_PARTY_NOTICES before any approved third-party file.
- Keep UI behind project-owned service interfaces.

## Sources

- Candidate: https://github.com/shadcnspace/ecommerce-shadcn-nextjs-template
- Commit: https://github.com/shadcnspace/ecommerce-shadcn-nextjs-template/commit/2df689427f1c22c6ed558ba59e13ac34965e6cec
- License: https://raw.githubusercontent.com/shadcnspace/ecommerce-shadcn-nextjs-template/2df689427f1c22c6ed558ba59e13ac34965e6cec/LICENSE
- Package: https://raw.githubusercontent.com/shadcnspace/ecommerce-shadcn-nextjs-template/2df689427f1c22c6ed558ba59e13ac34965e6cec/package.json
- Advisory: https://github.com/advisories/GHSA-q4gf-8mx6-v5v3
- August security release: https://nextjs.org/blog/august-2026-security-release
- July security release: https://nextjs.org/blog/july-2026-security-release
