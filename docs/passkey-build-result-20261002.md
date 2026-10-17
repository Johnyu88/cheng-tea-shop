# Tea Passkey build result — 2026-10-02

Task: `TEA-BUILD-20261002-04`

## Result

The one authorized command was run once from the repository root:

```text
corepack pnpm run build
```

Actual result: exit code `1`.

The build compiled successfully, then failed while Next.js was running TypeScript:

```text
Running TypeScript ...
spawn EPERM
```

This is the sandbox process-spawn blocker. No same-condition retry was performed. The normal-host/work coordinator must run the command once in an environment that permits the TypeScript worker to spawn.

Additional output from the same run:

- Node warning: package requires `24.19.0`; this host reported `v24.21.0`.
- pnpm was `11.19.0`.
- Next.js reported five dynamic-filesystem tracing warnings in the existing file-backed demo stores, including `lib/server/merchant-passkey.ts`; these were warnings, not the terminating error.

## Standalone output

Before the run, `.next/standalone/server.js` existed from an earlier build. After the failed run, `.next/standalone/server.js` was absent; the directory contained only partial build artifacts. Therefore standalone readiness is **not proven** by this run.

The build did not add tracked source changes. Existing dirty production/Passkey files, customer lookup work, and `next-env.d.ts` were preserved. No tests, installs, deploys, commits, merges, or live startup were performed.

## Startup inspection and risks

`start-cloud-demo.mjs` currently:

1. imports `./lib/server/demo-cloud.ts` and checks cloud-demo configuration;
2. imports `./lib/server/merchant-passkey.ts` and calls `prepare()` when the merchant Passkey store is enabled;
3. sets `HOSTNAME=0.0.0.0`;
4. imports `./scripts/start-playwright-standalone.mjs`.

The helper requires `.next/standalone/server.js`, copies `.next/static` and `public`, and then imports that server. Concrete risks are:

- the current failed build leaves the required `server.js` unavailable;
- the wrapper depends on repository-relative `.ts` and `.mjs` files being present at the runtime working directory, while the Dockerfile's final image starts the copied standalone `server.js` directly instead;
- startup will reject missing/invalid cloud origin, preview-token hash, merchant secret, or cloud-auth settings before the server is usable;
- the local host's Node `24.21.0` differs from the pinned `24.19.0`, so host verification should use the pinned runtime or the documented normal-host/CI environment.

No live startup or cloud flow was claimed or tested.

## Smallest next fix

Run `corepack pnpm run build` once on the normal host with process spawning enabled and the pinned Node `24.19.0`, then verify that `.next/standalone/server.js` exists. If that host build passes, separately inspect the resulting standalone startup path; do not treat this sandbox result as a product or cloud acceptance pass.
