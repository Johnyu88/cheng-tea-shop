# Independent Agent Runtime — General Secretary First Stage

Date: 2026-10-03
Status: Approved for implementation

## Goal

Turn the existing General Secretary role into a genuinely independent conversational Agent instance with its own model runtime, role prompt, session/thread, durable status and log, stop/restart procedure, and restart recovery evidence.

This stage covers only the General Secretary. The 4090 Supervisor, 4090 Inspector, Acer Supervisor, and Acer Inspector remain blocked until this stage passes every acceptance test.

## Non-goals

- No website feature changes.
- No website deployment.
- No Acer or RTX 4090 host deployment.
- No daemon, PowerShell, Python, JSON state, or CLI output may impersonate an Agent response.
- No role redesign. The existing `.github/agents/general-secretary.agent.md` remains the authoritative role prompt.

## Architecture

The Agent runtime is an explicit Codex model thread created with model `gpt-5.6-luna`. The thread is the conversational Agent instance and produces the user-visible replies. The role file is loaded as the Agent's role/system instruction; the orchestrator only creates the thread, sends user turns, waits for completion, and records evidence.

Durable recovery state is stored separately under `.agents/runtime/general-secretary/`. It contains the stable Agent instance identity, current thread identity, lifecycle status, work-order ledger, and append-only event log. These files are persistence and audit artifacts, not an Agent and never generate replies.

On restart, the previous session is stopped/archived, a fresh Codex thread is created with the same stable instance identity and role prompt, and the Agent is instructed to read the durable ledger and log before answering. The new thread ID is recorded as a new runtime session for the same Agent instance.

## General Secretary boundaries

The Agent may receive and register original work orders, record assignment time, track supervisor acknowledgement, receive original reports, check for evidence, write status stamps, request recheck, clear completed ledger entries after the manager confirms, and request the next work order. It may chat naturally within this scope.

It must not decide for the manager, interpret engineering work for a supervisor, write code for Codex, alter an original work order, deploy, change credentials or permissions, or claim evidence that is absent.

All Agents use these status markers:

- `UNVERIFIED`: evidence is missing.
- `KNOWLEDGE-GAP`: required professional knowledge is not available.
- `CONFLICT`: sources or reports disagree.

## Lifecycle

`created → running → stopped → restarting → running`.

The stop action must prevent further turns on the old session. Restart must preserve the stable instance ID, role file path, unfinished work orders, and event log while creating a new session/thread ID.

## Acceptance criteria

1. First conversation turn is answered by the General Secretary instance and includes its role and responsibility.
2. Second turn on the same thread correctly recalls the first question.
3. A test work order is recorded and transmitted without changing its original text; the ledger marks it unfinished.
4. The old session is stopped/archived; a new session is started with the same stable instance ID and a different thread ID.
5. After restart, the Agent can state its identity, role boundaries, and the unfinished test work order from durable state.
6. Evidence records the exact model, stable Agent instance ID, both session/thread IDs, role file, state path, log path, startup method, stop method, raw replies, and all acceptance results.
7. No website files are modified and no deployment is performed.

## Evidence rule

An Agent is `PASS` only when every acceptance criterion has direct evidence. Missing model, instance, thread, restart, ledger, or raw-reply evidence is `FAIL`.
