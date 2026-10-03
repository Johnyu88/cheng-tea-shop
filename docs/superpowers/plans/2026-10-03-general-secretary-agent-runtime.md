# General Secretary Agent Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instantiate and verify one independent General Secretary Agent with durable lifecycle and restart recovery evidence.

**Architecture:** Use an explicit `gpt-5.6-luna` Codex thread as the real Agent runtime. Keep stable identity, lifecycle state, work-order ledger, and append-only audit events in `.agents/runtime/general-secretary/`; these files support recovery but never answer on behalf of the Agent.

**Tech Stack:** Codex App thread runtime, Markdown role prompt, JSON durable state, NDJSON event log, repository-local evidence Markdown.

**Spec:** `docs/superpowers/specs/2026-10-03-independent-agent-runtime-design.md`

## Global Constraints

- Do not modify website source, tests, assets, or deployment configuration.
- Do not deploy a website or connect to Acer/RTX 4090 hosts.
- Use `gpt-5.6-luna` as the explicit model selection.
- The existing `.github/agents/general-secretary.agent.md` remains authoritative.
- Runtime state and logs are persistence/audit only; raw Agent replies must come from the Codex thread.
- Do not claim `PASS` without all acceptance evidence.

## Review Focus

- Original work-order text must survive registration unchanged — verify with an exact text assertion in the ledger and raw Agent reply.
- A restart must create a different thread while retaining one stable instance ID — verify both IDs and state continuity.
- Missing evidence must be marked `UNVERIFIED` rather than inferred — verify the restart report.
- Old-session replies must stop after lifecycle stop — verify the old thread is archived/idle before restart.
- Website scope must remain untouched — verify scoped Git status and changed-file list.

### Task 1: Create durable General Secretary runtime records

**Files:**
- Create: `.agents/runtime/general-secretary/instance.json`
- Create: `.agents/runtime/general-secretary/work-orders.json`
- Create: `.agents/runtime/general-secretary/events.ndjson`
- Create: `.agents/runtime/general-secretary/README.md`

- [ ] **Step 1: Create the stable instance manifest**

Record a stable `instanceId`, role file path, model selection `gpt-5.6-luna`, lifecycle status, current thread ID placeholder, state paths, and explicit startup/stop/restart semantics. Do not include credentials or host addresses.

- [ ] **Step 2: Create the work-order ledger**

Start with an empty unfinished work-order list. Preserve original text as a separate immutable field when a work order is registered.

- [ ] **Step 3: Create the append-only event log**

Create an empty NDJSON log and document that events are appended by the orchestrator/runtime, never used to generate Agent replies.

- [ ] **Step 4: Document lifecycle commands and evidence fields**

Describe the actual Codex thread startup, stop/archive, and restart procedure without presenting a script as the Agent.

- [ ] **Step 5: Verify the runtime records**

Run: `git diff --check` and inspect only `.agents/runtime/general-secretary/`.

### Task 2: Start and verify the real General Secretary session

**Files:**
- Modify: `.agents/runtime/general-secretary/instance.json`
- Modify: `.agents/runtime/general-secretary/work-orders.json`
- Modify: `.agents/runtime/general-secretary/events.ndjson`
- Create: `.agents/runtime/general-secretary/acceptance-report.md`

- [ ] **Step 1: Start a fresh Codex thread with model `gpt-5.6-luna`**

Load `.github/agents/general-secretary.agent.md`, include the durable state paths, and record the returned stable instance ID, host ID, and thread ID.

- [ ] **Step 2: Run acceptance turns 1 and 2**

Send the exact questions `你是誰？你的工作是什麼？` and `我剛才問你的第一個問題是什麼？`; save the unmodified Agent replies and turn IDs.

- [ ] **Step 3: Run acceptance turn 3**

Send a test work order with a unique ID and exact original text. Verify the Agent registers and forwards it without editing the text; record the raw reply and ledger evidence.

### Task 3: Stop, restart, and verify recovery

**Files:**
- Modify: `.agents/runtime/general-secretary/instance.json`
- Modify: `.agents/runtime/general-secretary/events.ndjson`
- Modify: `.agents/runtime/general-secretary/acceptance-report.md`

- [ ] **Step 1: Stop the original session**

Archive/stop the old Codex thread and record lifecycle transition plus the old thread ID.

- [ ] **Step 2: Start a new thread for the same stable instance**

Use model `gpt-5.6-luna`, the same role file, and the durable ledger/log. Record the new thread ID and confirm it differs from the old one.

- [ ] **Step 3: Run restart acceptance**

Ask the restarted Agent who it is, its boundaries, and which work order remains unfinished. Save raw replies and confirm the exact original work-order text is recovered.

- [ ] **Step 4: Mark PASS/FAIL from evidence**

Mark `PASS` only when every spec criterion is evidenced; otherwise mark `FAIL` with the exact missing evidence and do not create the other four Agents.

- [ ] **Step 5: Verify scope**

Run: `git status --short`, `git diff --check`, and a changed-file audit proving no website or deployment file was touched.
