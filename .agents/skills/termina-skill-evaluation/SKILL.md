---
name: termina-skill-evaluation
description: Use when testing, benchmarking, auditing, or improving Termina's agent skills: skill discovery, instruction quality, generated TUI implementation quality, regression fixtures, scoring, and repeatable agent evaluation.
---

# Termina Skill Evaluation

Evaluate the skills by observing agent behavior on representative tasks. A well-written `SKILL.md` is not proof that an agent selects it, follows it, or produces a correct terminal application.

## Goals

- Verify that agents select the right skill(s) from a realistic task description.
- Verify that guidance results in Termina-correct implementations rather than generic Ink assumptions.
- Measure functional correctness, interaction quality, terminal resilience, accessibility, and engineering discipline.
- Catch regressions when skills or Termina APIs change.
- Keep evaluation repeatable: version the task prompt, environment, model/runtime, available tools, expected checks, and scoring rubric.

## Build a small task set

Start with 6–10 tasks; expand only when the first set yields useful, stable signals. Each fixture should contain:
- A realistic user request, not a request that explicitly names the skill.
- The intended skill(s), for analysis only.
- Repository context and permitted files/commands.
- Objective acceptance checks and optional qualitative rubric.
- Known traps and forbidden assumptions.
- A baseline result and the expected evidence report.

Recommended starter scenarios:

1. **Responsive status dashboard** — Build a dashboard with summary metrics, current activity, and a details region. Check compact and wide widths, clear hierarchy, no color-only status, and sensible handling of missing values.
2. **Keyboard-driven data browser** — Build a filterable/selectable list or table. Check navigation boundaries, Enter/Escape behavior, selection stability after data updates, and only one active input owner.
3. **Long-running log viewer** — Show appended events while allowing users to scroll back. Check tail-follow behavior, return-to-tail, unmount cleanup, and bounded/intentional log handling.
4. **Streaming agent response** — Render chunks, completion, empty output, and stream failure. Check that the UI does not claim the component fetches data or invent progress.
5. **Approval-gated action** — Present a consequential tool action with approve/reject. Check clear consequences, stale approval rejection in the service contract, keyboard operation, and no claim that the UI itself enforces authorization.
6. **Narrow-terminal adaptation** — Take a multi-region layout and make it usable at compact widths/heights. Check no hidden essential action, unreadable clipping, or layout based on JavaScript string length.
7. **Dialog behavior** — Use a dialog with the current documented contract. Check that the implementation does not falsely assume overlaying or focus trapping.
8. **Core regression task** — Introduce or reproduce a terminal input/render lifecycle defect. Check test-first reasoning, the correct core test harness, cleanup, and truthful reporting.
9. **Non-interactive execution** — Render useful output with piped stdin/non-TTY stdout. Check no raw-mode crash or interactive escape-sequence leakage.
10. **Component gap analysis** — Given a requested widget, inspect exports/docs/source/tests and decide whether to compose existing primitives or implement a new reusable component. Check that the agent does not invent APIs.

## Evaluate skill selection separately from code quality

For each run, record:
- Did the agent select the expected skill or subset?
- Did it read the repository's actual API/source/docs rather than relying on memory?
- Did it avoid loading unrelated skills for a small task?
- Did it hand off between design, architecture, implementation, agentic patterns, and validation at appropriate boundaries?
- Did it explain any real API gap instead of assuming unsupported behavior?

A task can produce correct code by coincidence while failing skill selection. Keep routing accuracy separate from implementation scores.

## Scoring rubric

Score each applicable dimension 0–2 with explicit evidence:

| Dimension | 0 | 1 | 2 |
| --- | --- | --- | --- |
| API grounding | Invents APIs or ignores repository | Partially verifies APIs | Uses real exports, docs, source, and limitations |
| UX hierarchy | Confusing or task-incomplete | Understandable with gaps | Clear primary task, status, actions, and recovery |
| Terminal resilience | Breaks at common constraints | Handles some constraints | Handles required sizes, Unicode, wrapping, and output modes |
| Interaction | Broken/conflicting input | Basic path works | Boundaries, focus, cancel, and state transitions verified |
| Async integrity | Invents state/progress | Mostly grounded | All displayed states match authoritative execution facts |
| Accessibility | Color/glyph-only meaning | Some textual cues | Clear labels and keyboard-first operation |
| Tests | None or irrelevant | Partial coverage | Tests cover key acceptance and regression paths |
| Engineering discipline | Broad/unverified changes | Some validation | Small scoped change, correct cleanup, truthful report |

For each task, report `score / applicable maximum`, hard-gate failures, and links/logs for evidence. Do not compare raw totals across tasks with different applicable dimensions.

## Hard gates

A high aggregate score cannot excuse any of these:
- Fabricating an API, component prop, or runtime capability.
- Treating the UI as an authorization/security boundary.
- Claiming cancellation or completion without authoritative confirmation.
- Ignoring destructive-action confirmation requirements.
- Crashing in a required non-TTY environment.
- Claiming tests or visual checks passed when they were not run.

A hard-gate failure means the task fails regardless of its numeric score.

## Run protocol

1. Pin the Termina commit, skills commit, task fixture, agent/model version, and relevant tool permissions.
2. Use a clean worktree or disposable branch per task; do not let one task's implementation contaminate another.
3. Run a baseline without the new skills and a treatment run with skill discovery enabled when comparing skill effectiveness.
4. Keep the user request identical across comparable runs. Use multiple runs for stochastic models before drawing conclusions.
5. Run the task's automated tests and prescribed validation commands. Capture terminal dimensions, rendered output, input sequence, and test output as appropriate.
6. Have reviewers score qualitative UX from a rubric without seeing whether the run used the skill when feasible.
7. Report score deltas, hard-gate failures, common omissions, and uncertainty. Do not claim causal improvement from a single successful run.

## Exit criteria for an initial evaluation

- Every starter task has objective acceptance checks.
- Each intended skill has at least one task that should trigger it and one adjacent task that should not require it.
- No hard-gate failures in the release candidate's critical tasks.
- All objective checks pass in the evaluated environment.
- Qualitative scores and failures are recorded with evidence.
- Skill-selection misses and recurring gaps result in focused edits to skill descriptions or instructions.

## Handoffs

- Use the skill being evaluated to implement a task; use this skill to design fixtures and assess results.
- Use `termina-tui-design` and `termina-tui-app-architecture` to define intended UX and state behavior.
- Use `termina-agentic-ui-patterns` for AI/tool lifecycle acceptance checks.
- Use `termina-ui` and `termina-core` to identify the relevant implementation/test surface.
- Use `termina-tui-validation` to implement repeatable technical checks.

## Repository evaluation fixtures

- Reusable task prompts and evaluator-only metadata live in `.agents/evals/tasks/*.json`.
- The baseline/treatment run protocol and evidence expectations are in [the evaluation suite guide](../../evals/README.md); use [the report template](../../evals/report-template.json) to record comparable runs.
- Run `pnpm evals:check` to validate task metadata, skill names, acceptance checks, evidence requirements, hard-gate definitions, and the prompt/report tooling smoke tests.
- Run `pnpm evals:prompt -- <task-id>` to export only the user-facing prompt; evaluator-only skill routing and rubric data are intentionally omitted.
- Use `pnpm evals:report:check -- <report.json> --partial` for a paired pilot, or omit `--partial` for a complete report with every task and at least three repetitions per condition.
- The scripts validate fixture/report integrity; they do not run an agent or certify generated application behavior. Only actual task-run evidence can support those claims.
