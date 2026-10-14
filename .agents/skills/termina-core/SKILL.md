---
name: termina-core
description: Use when implementing, debugging, reviewing, or testing Termina's terminal runtime and renderer in packages/core: React reconciliation, Yoga layout, rendering and output diffs, terminal capabilities, stdin/key/paste/mouse input, focus, cursor, raw mode, alternate screen, ANSI/OSC sequences, resize/reflow, or stream lifecycle.
---

# Termina Core Engineering

Use this skill for changes to `@nemesis-oss/termina-core`, the React renderer and terminal runtime. Keep the core's public API stable unless the task explicitly calls for an API change.

## Start with repository facts

- Read `FORK.md` before changing inherited behavior. It records the pinned upstream Ink 8.0.0 commit and the fork-specific differences.
- Read the relevant section of `docs/research/ink-architecture.md` before changing rendering, input, output, or terminal behavior.
- Implementation lives in `packages/core/src/`; tests live in `packages/core/test/`.
- Public exports are defined in `packages/core/src/index.ts`. Check this file before assuming a helper or hook is public.
- This workspace requires Node.js `>=22`, pnpm, and React `>=19.3`.

## Workflow

1. **Reproduce first.** Add or update a focused regression test before changing behavior. Follow the existing `node:test` + `tsx` patterns and test helpers.
2. **Trace the full path.** For rendering, follow React tree → `react-reconciler` → Termina's DOM nodes → Yoga layout → rendered output rows → output diff/writer → stdout. For input, follow stdin → `input-parser.ts` → `App.tsx` routing → key, paste, or mouse consumers.
3. **Make the smallest correct change.** Keep inherited behavior and fork-specific changes separate in your reasoning. Do not copy an upstream fix blindly; compare it with the pinned revision and the local changes in `FORK.md`.
4. **Test edge conditions, not just the happy path.** Include cleanup and error paths when the change affects terminal modes, event listeners, timers, streams, or cursor state.
5. **Check public API and types.** Export intentional new APIs from `packages/core/src/index.ts`; keep internal helpers private. Update tests that assert actual behavior rather than duplicating the implementation.
6. **Verify and report.** State the commands run, relevant results, and any checks that could not be run.

## Core invariants

### Terminal capabilities and streams

- Never assume stdin or stdout is a TTY. Consider interactive TTY, piped/non-interactive output, CI, and `TERM=dumb` where relevant.
- Respect capability detection and environment overrides such as `NO_COLOR`, `FORCE_COLOR`, `CI`, `TERM`, and `COLORTERM`; do not independently reimplement policy in a component.
- Input hooks should remain safe when raw mode is unavailable. Do not call `setRawMode(true)` without checking the stream's support.
- Every terminal mode or listener acquired by mount/render must have a symmetric release path on unmount, suspension, exit, or failure. Check ref-counting when multiple consumers can request a mode.
- Do not emit interactive control sequences into non-TTY logs unless the public API explicitly requests that behavior.

### Rendering, layout, and resize

- Treat layout and terminal output as separate stages. A Yoga layout fix is not automatically an output-writer fix.
- Terminal resize/reflow bugs can depend on physical rows, cursor placement, wrapping, and viewport height. Use the xterm-backed fixture when physical terminal behavior matters; string snapshots alone are insufficient for wrap/reflow claims.
- Test narrow widths, exact viewport boundaries, empty output, unmounting, and consecutive frames when relevant.
- Preserve grapheme-aware handling for wide characters and combining sequences. Do not substitute JavaScript string length for terminal display width.
- Preserve `<Static>` semantics and the difference between interactive frames and the final non-interactive frame.

### Input, focus, and mouse

- Keep escape-sequence parsing distinct from key interpretation and event dispatch. Incomplete sequences and bracketed paste must not be misclassified as ordinary keypresses.
- Mouse reports must be routed through the mouse path and must not leak into `useInput` as ordinary key input.
- Verify coordinate conversion and hit-testing when layout, clipping, scrolling, or nested boxes change.
- Test focus registration, duplicate/custom IDs, disabled/inactive handlers, and key navigation when changing focus behavior.
- Verify mouse/raw-mode enablement and teardown on unmount, suspension, and errors.

### ANSI and OSC safety

- Treat terminal control sequences as protocol output, not ordinary text. Keep their enable/disable lifecycle balanced.
- Preserve input validation for OSC 8 hyperlinks and OSC 52 clipboard payloads. Reject control characters in hyperlink URLs and retain payload limits unless an intentional, tested API change supersedes them.
- Avoid clearing scrollback accidentally. Use the narrowest erase sequence consistent with the actual terminal state.
- Never weaken terminal-safety guards merely to make a test pass.

## Testing commands

Run focused checks first, then the broadest reasonable verification:

```sh
pnpm --filter @nemesis-oss/termina-core run test
pnpm --filter @nemesis-oss/termina-core run typecheck
pnpm --filter @nemesis-oss/termina-core run build
pnpm run verify
```

The core test script uses Node's built-in test runner with concurrency set to 1. Avoid parallelizing this suite unless the tests are first made independent. `pnpm run verify` builds, typechecks, and tests the workspace packages and examples.

## Completion checklist

- [ ] A regression test fails before the fix where practical and passes after it.
- [ ] Interactive and non-interactive behavior is considered.
- [ ] Cleanup and terminal mode restoration are covered.
- [ ] Unicode width, wrapping, and resize behavior are tested when relevant.
- [ ] Public exports and TypeScript declarations are correct.
- [ ] Tests and verification results are reported honestly.
