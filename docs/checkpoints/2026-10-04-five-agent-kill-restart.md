# Five-Agent Kill/Restart Checkpoint

Date: 2026-10-04 (Asia/Taipei)
Model: `gpt-5.6-luna` for every Agent thread
Scope: lifecycle acceptance only; no tea-shop feature work and no deployment

## Independent results

| Agent | Stable instance | Old thread (archived) | New thread | Work order | Result |
|---|---|---|---|---|---|
| 4090監工 | `4090-supervisor-01` | `01a10263-de81-78c0-b1f5-297fb629979c` | `01a1026c-1534-7941-bef9-27a84a69e9c9` | `acceptance-20261003-4090-supervisor-kill-restart` | PASS |
| 4090掃地 | `4090-inspector-01` | `01a10264-274f-7701-9134-eb606e66a184` | `01a1026d-3a0a-7140-ac5e-d3386851fc51` | `acceptance-20261003-4090-inspector-kill-restart` | PASS |
| Acer監工 | `acer-supervisor-01` | `01a10264-7b20-7690-b0a7-74a4cbf70461` | `01a1026e-d532-77c3-b76a-ebd9127e2757` | `acceptance-20261003-acer-supervisor-kill-restart` | PASS |
| Acer掃地 | `acer-inspector-01` | `01a10265-d69a-7f43-92cc-0d5cdd431749` | `01a10270-01f9-7ad2-bc11-60a14ecb0bd9` | `acceptance-20261003-acer-inspector-kill-restart` | PASS |
| 總管秘書 | `general-secretary-01` | `01a1025f-d23c-7732-8730-d7c867456db8` | `01a10261-9c42-7b33-b30a-ffe24df9a180` | Existing runtime acceptance work order | PASS |

## Gate decision

**5-Agent baseline: PASS.** Each of the four requested Agents has direct raw model evidence for identity, role, prior context, unfinished work order before Kill, archived old thread, and a different restarted thread recovering the same durable state. The General Secretary's earlier independent acceptance record is retained as the fifth baseline result. No result is inferred from another Agent.

## Evidence locations

- Per-Agent durable state: `.agents/runtime/<agent>/instance.json` and `work-orders.json`.
- Append-only lifecycle/event logs: `.agents/runtime/<agent>/events.ndjson`.
- Original model outputs and per-Agent acceptance decisions: `.agents/runtime/<agent>/acceptance-report.md`.
- Existing General Secretary evidence: `.agents/runtime/general-secretary/acceptance-report.md`.

The watchdog was unavailable for arming because monitoring is disabled in the host configuration; the Codex thread wait results completed normally. This is recorded as tooling context, not Agent acceptance evidence.
