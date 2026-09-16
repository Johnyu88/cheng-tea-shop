# AGENTS

## 1. Purpose

This file defines how Codex, the local 35B model, and specialist agents collaborate on the Chen Tea Shop project.

The product strategy remains:

**Website First → Mock API → ERP Reuse → API Integration**

## 2. Instruction precedence

Use this order when instructions conflict:

1. The user's latest explicit instruction
2. This `AGENTS.md`
3. `WORKFLOW.md`
4. `HANDOFF.md` and `CAPABILITY_MAP.md`
5. `WHITEPAPER.md`, `DEVELOPMENT_STRATEGY.md`, and approved specs
6. Existing implementation conventions

Never resolve a material conflict silently. Report it before continuing.

## 3. Start-of-session protocol

Before planning or editing:

1. Read `README.md`.
2. Read `AGENTS.md`, `WORKFLOW.md`, `HANDOFF.md`, `CAPABILITY_MAP.md`, and `WHITEPAPER.md`.
3. Read the latest relevant file under `docs/superpowers/specs/`.
4. Inspect the latest commits, open pull requests, and current Git state.
5. Report:
   - current project stage;
   - last completed milestone;
   - confirmed decisions;
   - conflicts, blockers, and unfinished work;
   - the single best next step.
6. Do not begin implementation until the user approves the proposed design or task.

## 4. Team model

Codex is the sole orchestrator. It selects a dynamic team of two to four specialist roles for each stage. It may run independent tasks in parallel and must sequence dependent tasks.

| Role | Responsibilities |
|---|---|
| Codex Orchestrator | Read context, decompose work, assign ownership, integrate results, verify evidence, control phase gates, and prepare pull requests |
| Specification Agent | Requirements, acceptance criteria, capability mapping, contradiction checks |
| UI/UX Agent | Brand direction, flows, responsive experience, visual system, accessibility |
| Frontend Agent | Pages, components, state, responsive behavior, Mock API consumption |
| API/Data Agent | Domain models, contracts, fixtures, Mock Data, normalized errors |
| ERP/Integration Agent | Open-source ERP evaluation, adapters, synchronization |
| Payment/Logistics Agent | Credit card, LINE Pay, delivery adapters, failure paths |
| QA/Security Agent | Tests, review, secret and privacy checks, security verification |
| Deployment Agent | Build, environments, monitoring, backup, release checks |
| Local 35B Reviewer | Second opinion, test cases, document/code consistency review |

## 5. Dispatch rules

- Select only roles needed for the current capability; do not activate the full team by default.
- Give every task one owner, an explicit file scope, dependencies, acceptance criteria, and verification command.
- Agents must not edit outside their assigned scope.
- Parallel tasks must have non-overlapping ownership.
- Integration remains Codex's responsibility.
- No agent may merge to `main`.
- The local 35B model is a reviewer, not an independent merger or architectural authority.
- Until the 35B invocation method is verified, use a second QA/Security Agent for required review.
- Payment, customer data, secrets, authentication, and production changes require QA/Security review.

## 6. Required agent report

Every agent returns:

1. Work completed
2. Files changed
3. Verification evidence
4. Remaining risks or assumptions
5. Recommended next step

An agent report is not proof of completion. Codex must independently inspect the diff and rerun relevant verification.

## 7. Safety boundaries

- Never commit passwords, API keys, payment credentials, tokens, private customer data, or other secrets.
- Use placeholders and environment-variable names in examples.
- Do not bypass failing tests or security checks.
- Do not overwrite unrelated user changes.
- Do not build a full ERP before storefront requirements are validated.
- Do not couple frontend components directly to a specific ERP.

## 8. Human-in-the-loop policy

The user should be interrupted for decisions, not routine operations.

Agents may proceed without additional confirmation for low-risk, reversible work that is already inside an approved task scope, including:

- editing project files;
- running tests, lint, type checks, builds, and local verification;
- updating project documentation to match verified work;
- inspecting `git status`, diffs, and recent history;
- creating focused local commits;
- pushing an already-authorized working branch and opening or updating its pull request.

Agents must stop and request explicit user confirmation before high-risk or materially irreversible actions, including:

- merging to `main`;
- force-pushing or rewriting shared history;
- deleting large or important data sets;
- destructive database migrations;
- production deployment or production configuration changes;
- payment, LINE Pay, credit-card, secret, credential, or account-permission changes;
- major architecture changes outside the approved scope;
- any operation with a meaningful risk of data loss.

If a GitHub login, connector, permission, push, or remote API action requires human intervention, do not repeatedly interrupt the user for the same blocker. Follow the resilience procedure in `WORKFLOW.md`, preserve progress locally, record the blocker in `HANDOFF.md`, and continue any independent work that does not depend on the blocked remote action.

## 9. Task persistence principle

Models, agents, sessions, and computers are replaceable; project state is not.

Every meaningful milestone must be recoverable from durable project state. At minimum, preserve the current state through the combination of:

- Git commits;
- `HANDOFF.md`;
- `WHITEPAPER.md` when architecture, product strategy, or major decisions change;
- relevant specs or plans;
- actual verification results.

A new agent should be able to resume work by reading the project documents and Git state without depending on chat history or one specific model session.
