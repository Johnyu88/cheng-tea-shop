# PROD-ADMIN-23 safe candidate deployment tool

Absolute tool path on Acer:

`C:\Users\alluser\Documents\Codex\2026-10-15\ui-rwd-01-johnyu88-cheng-tea\tools\prod-admin-23\cli.mjs`

The tool is intentionally candidate-only. It never stops, removes, or switches a formal container. Its default mode is `dry-run`, and its only allowlisted source is the synthetic `tea-prod-admin-23-test-source`.

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

The source must be explicitly allowlisted by the tool. Formal container names are rejected in dry-run/isolation mode. This phase does not provide a production-source flag by design; a future production deployment must add a separately reviewed allowlist and authorization gate.

## Rollback

On failed health check the tool automatically stops and removes only the candidate it created. On operator cancellation, run the candidate cleanup using the recorded candidate name/ID; do not target the formal container. Formal containers, Caddy, Funnel, SQLite, photos, orders, and the 8130 route are outside this tool's mutation scope.
