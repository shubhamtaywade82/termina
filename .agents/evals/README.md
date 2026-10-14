# Termina agent-skill evaluation suite

This directory contains repeatable task prompts and evaluator metadata for measuring whether repository-local skills improve Termina implementation work.

## What the checker does

Run:

```sh
pnpm evals:check
```

The checker validates fixture structure, skill references, unique task/check/gate identifiers, objective acceptance assertions, evidence requirements, and score-dimension IDs. It does **not** execute an agent, render a generated app, or certify behavior. Those require executing the task and collecting the evidence listed in each fixture.

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

Add or change fixtures deliberately; update this suite guide when the run protocol changes.
