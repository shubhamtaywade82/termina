# Termina agent-skill evaluation suite

This directory contains repeatable task prompts and evaluator metadata for measuring whether repository-local skills improve Termina implementation work.

## What the checker does

Run the fixture checks and list available prompts:

```sh
pnpm evals:check
pnpm evals:prompt -- --list
pnpm evals:prompt -- responsive-status-dashboard
```

The prompt command writes **only** the task's `user_prompt` to stdout. It does not leak expected skill routing, acceptance checks, hard gates, or scoring metadata into the agent context.

The fixture checker validates task structure, skill references, unique task/check/gate identifiers, objective assertions, evidence requirements, score-dimension IDs, and coverage. The prompt checker verifies task IDs and prompt availability. Neither command executes an agent, renders a generated app, or certifies behavior. Those require running the task and collecting evidence from the resulting code and terminal output.

## Run protocol

1. Pin the Termina base commit, skill-pack commit, agent/runtime version, model/provider/version, tool permissions, and task fixture version.
2. For every task, use separate disposable worktrees for **baseline** (skill pack not discoverable/enabled) and **treatment** (skill pack discoverable/enabled). Keep the repository state and available tools otherwise equivalent.
3. Use the exact same `user_prompt` for both conditions. Do not include `expected_skills`, `adjacent_skills_not_required`, acceptance checks, or scoring metadata in the agent prompt.
4. Perform at least three independent repetitions per condition for an initial comparison. Randomize condition order where practical. Do not share generated implementations, transcripts, or task-specific context between runs.
5. Record which skills the agent actually selected/loaded, all objective evidence, and one score per applicable dimension. Score dimensions 0–2; use each fixture's `score_dimensions`, not a common total across all tasks.
6. Evaluate hard gates before looking at aggregate scores. Any hard-gate failure fails that run regardless of its numeric score.
7. Compare baseline and treatment by task, dimension, repetition, and hard-gate rate. Preserve unsuccessful attempts. Do not claim causal improvement from one run or compare aggregate totals across tasks with different applicable dimensions.

## Evidence standard

Use exact commands, test output, captured terminal output, source references, or review notes. A statement like “works at 40 columns” is not evidence without a reproducible command or captured output. Mark a check as not run or blocked rather than treating missing evidence as a pass.

## Fixture contract

Every task contains:
- A user-facing prompt that does not reveal evaluator-only skill names.
- Expected skill routing and adjacent skills that should not be necessary.
- Environment modes and terminal dimensions to exercise.
- Acceptance checks with verification method and required evidence.
- Hard-gate failure conditions.
- Applicable scoring dimensions.

## Preparing and validating a result report

Copy `.agents/evals/report-template.json`, then record one run for every task, condition, and repetition. A run object contains:
- `task_id`, `condition` (`baseline` or `treatment`), and `repetition`.
- `selected_skills` (empty for baseline runs with repository skills disabled).
- `acceptance_results`: one entry per acceptance check with `check_id`, `status` (`pass`, `fail`, `not_run`, or `blocked`), and `evidence`. A pass/fail requires evidence; not-run/blocked requires a reason in `note`.
- `scores` with exactly the task's applicable `score_dimensions`, each scored 0–2.
- `hard_gate_failures`, plus `hard_gate_evidence` when one or more gates fail.
- `review_notes` explaining the qualitative judgement and limitations.

Validate a complete report (all tasks, at least three repetitions per condition):

```sh
pnpm evals:report:check -- path/to/report.json
```

Validate a paired pilot subset without misrepresenting it as a complete suite:

```sh
pnpm evals:report:check -- path/to/report.json --partial
```

The report validator checks metadata, task/check/gate IDs, score ranges, evidence, paired baseline/treatment repetitions, and report completeness. A structurally valid report can still contain failed runs; any hard-gate failure remains a failure, regardless of numeric score.

Add or change fixtures deliberately; update this suite guide when the run protocol changes.
