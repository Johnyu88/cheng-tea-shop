# General Secretary runtime records

This directory is the durable lifecycle, work-order, and audit layer for the independent General Secretary Agent instance `general-secretary-01`.

- `instance.json` stores the stable instance identity, selected model, current and previous thread IDs, lifecycle state, and recovery pointers.
- `work-orders.json` stores original work-order text and status. Original text must be immutable after registration.
- `events.ndjson` is an append-only audit log of lifecycle, assignment, acknowledgement, evidence, and recovery events.
- `acceptance-report.md` stores raw acceptance replies and evidence after the first-stage validation.

These records do not answer users and must never be used as a substitute for the Agent's raw thread response. The Agent runtime is the explicit Codex model thread created with `.github/agents/general-secretary.agent.md` and model `gpt-5.6-luna`.

## Lifecycle

1. Start a new Codex thread with the role file and these state paths.
2. Record the thread ID in `instance.json` and append a lifecycle event.
3. Stop/archive the old thread before restart.
4. Create a new thread using the same `instanceId`, role file, model, ledger, and event log.
5. Record the new thread ID while preserving unfinished work orders.

## Required report fields

Every acceptance report must include model, stable instance ID, every session/thread ID, role file, state and log paths, startup/stop/restart method, raw Agent replies, and evidence for each acceptance criterion.
