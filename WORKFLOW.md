# WORKFLOW

## 1. Operating principle

Codex may discuss and plan without changing GitHub. A write phase begins only after the user gives explicit approval such as **「本階段完成」** or a direct implementation instruction.

The automatic boundary is:

**Plan → Branch → Implement → Test → Review → Document → Pull Request → Stop**

Merging to `main` always requires the user's explicit confirmation.

## 2. Workflow

### Step 1 — Context check

- Follow the start-of-session protocol in `AGENTS.md`.
- Check current branch, uncommitted changes, recent commits, open PRs, and relevant specs.
- Stop and report unexpected or overlapping work.

### Step 2 — Task graph

Before custom implementation, Codex performs a reuse-first assessment:

- search for mature templates, components, workflows, and open-source capabilities relevant to the approved goal;
- compare license, maintenance, security, architectural fit, modification cost, and lock-in;
- prefer adapting a suitable solution over rebuilding it;
- remove unnecessary modules and keep the project's stable interfaces;
- record why a candidate was reused or rejected;
- never let a template override approved product requirements.

Codex then decomposes the approved work into small capabilities. Every task records:

- owner role;
- goal and non-goals;
- allowed files;
- dependencies;
- acceptance criteria;
- verification method;
- risk level.

Independent, non-overlapping tasks may run in parallel. Dependent tasks run in order.

### Step 3 — Isolated work

- Create a purpose-specific branch or worktree.
- Suggested names: `docs/<topic>`, `feature/<capability>`, `fix/<bug>`.
- Never develop directly on `main`.
- Preserve unrelated work.
- Features and bug fixes use test-first development where practical.

### Step 4 — Integration

Codex:

1. Inspects every change.
2. Resolves integration conflicts.
3. Runs the complete relevant test and build commands.
4. Confirms acceptance criteria line by line.
5. Requests 35B review or the QA fallback.
6. Runs security review for high-risk areas.

Failed work is retried once with a smaller scope or clearer instructions. If it still fails, stop and report the evidence and blocker.

### Step 5 — Documentation

For every important milestone, update the documents that changed in meaning:

- `WHITEPAPER.md`: strategy, architecture, major decisions, phase status
- `CAPABILITY_MAP.md`: capability ownership and completion status
- `HANDOFF.md`: last work, current state, blockers, next action
- relevant design spec or implementation plan

Do not create documentation-only claims that contradict the actual code or tests.

### Step 6 — Secret and quality gate

Before committing:

- inspect the diff;
- scan for secrets, credentials, personal data, and generated noise;
- run relevant tests, lint, type checks, builds, and contract checks;
- record actual results, including failures.

### Step 7 — Commit and PR

- Use focused commits with clear messages.
- Push the working branch.
- Open a PR containing scope, changed files, verification evidence, risks, and follow-up work.
- Stop before merge.

### Step 8 — User gate

Only merge after the user clearly approves the reviewed PR. After merge:

1. Confirm the merge result.
2. Verify the expected files on `main`.
3. Update `HANDOFF.md` in the next approved documentation change if the merge changes the recorded next step.

### Step 9 — External blocker resilience

GitHub, connector, authentication, permission, network, provider, or remote API failures are external blockers. They must not automatically stop unrelated local work.

When a remote GitHub action cannot proceed:

1. Retry only when the failure is plausibly transient and a retry is safe.
2. Do not repeatedly ask the user to perform the same login, approval, or permission action.
3. Preserve all completed work in the safest available local form.
4. Create a focused local commit when Git is available.
5. Record the exact blocker and the smallest required human action in `HANDOFF.md`.
6. Set the GitHub state to one of:
   - `SYNCED` — local and remote state are aligned;
   - `LOCAL_COMMITS_PENDING` — work is committed locally but not yet pushed;
   - `BLOCKED_EXTERNAL` — a remote dependency requires external intervention.
7. Continue the next approved task if it is independent of the blocked remote operation.
8. Stop only when the blocker prevents safe progress, changes the approved scope, or requires a high-risk decision.

A blocked push is not equivalent to a failed implementation. Verification evidence, local commits, and documentation remain valid work products if they accurately reflect the actual state.

### Step 10 — Checkpoint discipline

Long-running work must leave recoverable checkpoints so that another agent, model, machine, or session can resume without relying on chat memory.

Before a planned stop, after a meaningful milestone, or before a risky operation:

- commit completed, coherent work when possible;
- update `HANDOFF.md` with what changed, current branch, latest commit, blocker status, and next action;
- update `WHITEPAPER.md` when architecture, product strategy, or major decisions changed;
- record failed verification honestly rather than hiding it;
- do not leave the only copy of important reasoning inside an agent session.

## 3. Phase-specific dispatch

| Product phase | Default specialist roles |
|---|---|
| Phase 0 — Direction and specification | Specification, UI/UX, 35B or QA reviewer |
| Phase 1 — UX/UI | UI/UX, Frontend, QA |
| Phase 2 — Frontend prototype | Frontend, API/Data, QA, 35B reviewer |
| Phase 3 — Backend capability map | API/Data, ERP/Integration, Specification |
| Phase 4 — ERP selection | ERP/Integration, research, QA/Security |
| Phase 5 — Integration | ERP/Integration, Payment/Logistics, Frontend, QA |
| Phase 6 — Production hardening | QA/Security, Deployment, Backend/Integration, 35B reviewer |

When a phase needs more than four specialist roles, split it into sequential waves.

## 4. Definition of done

A task is done only when:

- acceptance criteria are met;
- fresh verification evidence exists;
- required review is complete;
- documents match reality;
- no prohibited secret is present;
- a PR has been opened;
- the user has approved merge when merge is requested.

If an external GitHub blocker prevents opening the PR, the implementation may be recorded as locally complete but must not be represented as fully delivered. `HANDOFF.md` must show `LOCAL_COMMITS_PENDING` or `BLOCKED_EXTERNAL` and identify the smallest remaining sync action.
