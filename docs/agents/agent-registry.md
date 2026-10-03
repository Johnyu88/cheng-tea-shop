# Agent Registry

Updated: 2026-10-04

All registered Agent runtimes use `gpt-5.6-luna`. Runtime state and logs are audit records; the Codex thread is the conversational Agent runtime.

| Display name | Instance ID | Role file | Lifecycle | Current thread | Baseline |
|---|---|---|---|---|---|
| 4090監工 | `4090-supervisor-01` | `.github/agents/codex-supervisor-b.agent.md` | `running` | `01a1026c-1534-7941-bef9-27a84a69e9c9` | PASS |
| 4090掃地 | `4090-inspector-01` | `.github/agents/hardware-inspector-b.agent.md` | `running` | `01a1026d-3a0a-7140-ac5e-d3386851fc51` | PASS |
| Acer監工 | `acer-supervisor-01` | `.github/agents/codex-supervisor-a.agent.md` | `running` | `01a1026e-d532-77c3-b76a-ebd9127e2757` | PASS |
| Acer掃地 | `acer-inspector-01` | `.github/agents/hardware-inspector-a.agent.md` | `running` | `01a10270-01f9-7ad2-bc11-60a14ecb0bd9` | PASS |
| 總管秘書 | `general-secretary-01` | `.github/agents/general-secretary.agent.md` | `running` | `01a10261-9c42-7b33-b30a-ffe24df9a180` | PASS |

## Lifecycle acceptance rule

An Agent is marked PASS only with direct evidence of the exact model, stable instance ID, role, old thread archive/stop, a different new thread ID, prior-context recovery, and unfinished work-order recovery. A failure in one Agent is not masked by another Agent's result.

Per-Agent evidence is stored under `.agents/runtime/`; see `docs/checkpoints/2026-10-04-five-agent-kill-restart.md` for the aggregate gate.
