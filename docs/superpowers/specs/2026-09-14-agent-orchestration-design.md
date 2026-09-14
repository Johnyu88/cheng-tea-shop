# Agent Orchestration and Reporting Design

Date: 2026-09-14
Status: Approved for documentation

## 1. Context

The Chen Tea Shop project needs a repeatable development system that can use Codex, a local 35B model, and specialist agents without losing decisions across desktop, web, mobile, or future projects. GitHub is the formal source of truth. Chat conversations provide direction but do not replace versioned project documents.

## 2. Goals

- Decompose each development stage into clear, testable work.
- Automatically select only the specialist roles needed for the current task.
- Use Codex as the single orchestrator and integrator.
- Use the local 35B model as a second reviewer when available.
- Preserve human control over merges.
- Produce a concise morning report only when meaningful changes exist.
- Keep the workflow reusable for later website-template extraction.

## 3. Non-goals

- Running every available agent on every task.
- Allowing an agent to merge independently.
- Treating an agent's report as verification.
- Requiring the 35B model for low-risk work while its interface is unavailable.
- Beginning storefront implementation before Phase 0 product decisions are approved.
- Extracting the generic website template before the Chen Tea Shop site is complete.

## 4. Architecture

Codex is the orchestrator. It reads project state, creates a task graph, selects two to four specialists, coordinates isolated work, integrates results, reruns verification, requests second review, updates documents, and prepares the PR.

Specialist roles are:

- Specification
- UI/UX
- Frontend
- API/Data
- ERP/Integration
- Payment/Logistics
- QA/Security
- Deployment

The local 35B model is a reviewer for second opinions, test cases, and document/code consistency. It has no merge authority. A second QA/Security Agent replaces it when unavailable.

## 5. Phase dispatch

| Phase | Specialist roles |
|---|---|
| Direction and specification | Specification, UI/UX, 35B or QA reviewer |
| UX/UI | UI/UX, Frontend, QA |
| Frontend prototype | Frontend, API/Data, QA, 35B |
| Backend capability map | API/Data, ERP/Integration, Specification |
| ERP selection | ERP/Integration, research, QA/Security |
| Integration | ERP/Integration, Payment/Logistics, Frontend, QA |
| Production hardening | QA/Security, Deployment, Integration, 35B |

More than four roles are split into sequential waves.

## 6. Execution flow

1. Read the repository, specifications, recent commits, PRs, and Git state.
2. Report current stage, completed work, decisions, conflicts, and the next step.
3. Obtain approval for the task or design.
4. Define task owners, scopes, dependencies, acceptance criteria, and verification.
5. Create an isolated branch or worktree.
6. Dispatch non-overlapping tasks in parallel and dependent tasks in order.
7. Integrate changes and rerun complete relevant checks.
8. Obtain 35B or QA fallback review.
9. Update project documents and scan for secrets.
10. Commit, push, and open a PR.
11. Stop before merge and wait for user approval.

## 7. Error handling

- Unexpected Git state or overlapping edits: stop and report.
- Ambiguous requirement: ask one question.
- Agent failure: retry once with smaller scope or clearer instructions.
- Continued failure: stop and report evidence.
- Test, build, or security failure: do not open a completion PR unless the PR is explicitly marked as incomplete for review.
- 35B unavailable: use QA fallback, except that 35B integration testing itself remains pending.
- GitHub unavailable: report access failure; never infer repository state.

## 8. Verification and security

Completion requires fresh evidence. Codex independently checks diffs and reruns relevant tests rather than trusting agent summaries.

Never commit:

- passwords or tokens;
- API or payment keys;
- private customer information;
- production secrets;
- unreviewed generated files.

Payment, authentication, customer data, and production deployment require QA/Security review.

## 9. Morning report

At 08:00 Asia/Taipei each day, inspect `Johnyu88/cheng-tea-shop`. Send a report only when there is a new commit or PR, phase-status change, test failure, blocker, or pending decision.

Report format:

- Status: normal, waiting, or blocked
- Latest completed work
- Current work
- Verification result
- PR awaiting confirmation
- Decision needed from the user
- Today's next step

If nothing meaningful changed, send nothing. If GitHub cannot be read, report the access failure without guessing.

## 10. Documentation ownership

- `WHITEPAPER.md`: product and architecture decisions
- `AGENTS.md`: roles, authority, and startup rules
- `WORKFLOW.md`: execution, review, and Git gates
- `CAPABILITY_MAP.md`: phase and capability status
- `HANDOFF.md`: latest state, blocker, and next action
- `RESUME_PROMPT.md`: concise entry prompt

## 11. Template evolution

Complete the Chen Tea Shop website first. After completion, extract stable, brand-neutral workflow and storefront components into a reusable website template. Apply that template later to the Wuliuzhuang vinegar website and the Yicha Sanfang tea-ware website; do not let those future sites expand the current scope.
