# PROD-ADMIN-23 Safe Candidate Deployment Design

## Goal

Provide a reusable Acer-local Docker Engine API tool for creating and validating an isolated candidate without exposing secrets or touching formal services.

## Boundaries

- Default mode is dry-run and the only built-in source allowlist entry is the synthetic test source.
- Isolation mode can create, start, health-check, stop, and remove only a candidate created by the tool.
- Formal containers, formal data directories, Caddy, Funnel, 8130, 10000, and 10001 are not mutation targets.

## Data flow

`DockerEngineClient` reads a synthetic source inspection through the Docker Desktop named pipe. `buildCandidateFromInspect` keeps environment values in memory, replaces mounts with validated isolation mounts, and produces a Docker Engine create body. `createAndHealthCheckCandidate` starts the candidate and removes it on health failure. Only a redacted diff is printed.

## Security decisions

1. No Docker CLI `-e` arguments or env-file generation.
2. No secret values in output, stack traces, temporary files, or repository files.
3. Explicit source allowlist and synthetic-only isolation mode.
4. Windows path normalization before rejecting formal data roots.
5. Loopback test ports and restart policy `no` for candidates.

## Verification

Unit tests cover path normalization, formal mount rejection, allowlist enforcement, redacted output, and failure cleanup. The isolation E2E uses only a synthetic Secret and independent data/mounts; it must not use the formal container or formal data.

## PROD-ADMIN-24 production gate

The production switch is a separate, explicit mode. It requires the exact verified source container ID, source image ID/tag, candidate image ID/tag, backup manifest, and known RW writer freeze list. It reads the source environment only after those checks pass, creates the candidate through the Engine API, performs health checks, and restores the original source container plus frozen writers on failure. The old container is never deleted. No production switch is run by this implementation phase.
