# Chen Tea Shop Custom Agents

These repository-level GitHub Copilot custom agents follow the project's `AGENTS.md`, `WORKFLOW.md`, and safety boundaries.

## Roles

| Agent | Purpose | Target environment |
|---|---|---|
| `general-secretary` | Coordinate work, maintain decisions, and consolidate reports | ChatGPT cloud / coordinator context |
| `codex-supervisor-a` | Supervise deployment preparation and verification for the Acer environment | Acer, when an approved runner or remote connection exists |
| `codex-supervisor-b` | Supervise deployment preparation and verification for the RTX 4090 environment | RTX 4090, when an approved runner or remote connection exists |
| `hardware-inspector-a` | Read-only hardware and runtime checks for Acer | Acer, when an approved runner or remote connection exists |
| `hardware-inspector-b` | Read-only hardware and runtime checks for RTX 4090 | RTX 4090, when an approved runner or remote connection exists |

## Deployment boundary

These profiles define behavior and tool boundaries; they do not create host access. Acer and RTX 4090 deployment requires an explicitly configured GitHub Runner, SSH connection, or approved MCP server. Production deployment, credentials, permissions, and destructive operations still require human confirmation.
