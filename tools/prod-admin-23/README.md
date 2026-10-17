# PROD-ADMIN-23 safe candidate deployment tool

Absolute tool path on Acer:

`C:\Users\alluser\Documents\Codex\2026-10-15\ui-rwd-01-johnyu88-cheng-tea\tools\prod-admin-23\cli.mjs`

The tool is intentionally candidate-only. It never stops, removes, or switches a formal container. Its default mode is `dry-run`, and its only allowlisted source is the synthetic `tea-prod-admin-23-test-source`.

`production-switch` is the sole exception and is disabled unless the exact authorization string `PROD-ADMIN-24-AUTHORIZED` is supplied. It is hard-coded to the verified PROD-ADMIN-24 source/candidate IDs, container name, backup root, and writer freeze list. It must not be invoked from automation or copied into a general deployment script.

## Safety model

- Docker Desktop Engine API is accessed through `\\.\pipe\docker_engine` by `DockerEngineClient`; Docker CLI `-e` is not used.
- Environment values are held in process memory only. Redacted output contains environment variable names, never values.
- Isolation mode requires explicit synthetic source allowlisting and replaces source mounts with isolation mounts.
- Windows paths and Docker Desktop `/run/desktop/mnt/host/c/...` paths are normalized before checking. Formal `private-accounting-v1-data` and `public-visibility-live` paths are rejected.
- Candidate containers use `restart: no`, an explicit loopback host port, and no formal data mounts.
- Health-check failure stops and removes the candidate. Successful candidates can be removed with `--cleanup`.
- The tool does not print stack traces or Docker error bodies, because those can contain configuration details.

## Usage

Dry-run against a synthetic source (no candidate is started):

```powershell
node .\tools\prod-admin-23\cli.mjs --mode dry-run --source tea-prod-admin-23-test-source
```

Create an isolated candidate on a loopback test port:

```powershell
node .\tools\prod-admin-23\cli.mjs --mode isolation --source tea-prod-admin-23-test-source --candidate tea-prod-admin-23-test-candidate --image tea-nextjs:prod-admin-23-test --host-port 33123 --cleanup
```

The source must be explicitly allowlisted by the tool. Formal container names are rejected in dry-run/isolation mode; formal access is available only through the separately gated `production-switch` mode below.

## Formal switch (explicit authorization only)

The following command is the only production entry point. It reads the verified source container environment through the named pipe in memory, freezes the known RW writers, creates the exact candidate on 8130, checks 8130/10001/10000, and restores the original container and writers if candidate health fails:

```powershell
node .\tools\prod-admin-23\cli.mjs --mode production-switch --authorize-production PROD-ADMIN-24-AUTHORIZED
```

The original container is preserved and remains the rollback target. The command prints only container IDs, image/config metadata, and environment variable names. It does not print environment values. A real password login and ordinary-phone acceptance remain manual checks.

## Rollback

On failed health check the tool automatically stops and removes only the candidate it created. On operator cancellation, run the candidate cleanup using the recorded candidate name/ID; do not target the formal container. Formal containers, Caddy, Funnel, SQLite, photos, orders, and the 8130 route are outside this tool's mutation scope.
