# Roadmap to a first-choice TUI library

This file lists what stands between termina and a library developers pick first for terminal apps. Each item has an acceptance check, so "done" is verifiable. Status is updated in the same commit that closes an item.

Status values: `open`, `in progress`, `done`, `deferred`.

## P0: correctness

### R1. Text in a shrinking box overflows its row
- Status: `done`. Core rounds the measured width down to whole columns and caps the render-time wrap width at the parent's content width. The `ui` list markers are wrapped in `Box flexShrink={0}`, which is what lets the `flexBasis={0}` workarounds go. Removing the workarounds alone changed list output (the marker lost its trailing space at narrow widths), so the marker guard is part of the fix. Evidence: `packages/core/test/text-in-shrinking-box.tsx` passes, including the acceptance shape at 16 columns. Two `ui` regression tests (ordered list, markdown bullet) fail without the marker guard and pass with it. Against the old output, every list shape probed is identical at widths 10 to 60, except a markdown list beside a sibling `Text`, which used to overflow and now wraps. The full core and `ui` suites pass.
- Open edge (outside this acceptance): a sibling `Text` that ends in a space can lose it when its row shrinks, for example `<Text>x </Text>` beside a wrapping box at 10 columns. Fixed-width chrome must sit in a `Box flexShrink={0}`.
- Problem: a `Box` holding wrapped `Text` that sits beside a sibling in a row overflows when it shrinks. Yoga measures the text at the wrapped width during the flex-basis pass and does not re-measure it after the shrink. Components work around this with `flexBasis={0}`. Users have to know about the workaround.
- Acceptance: a core test renders `<Box><Text>- </Text><Box><Text>{LONG}</Text></Box></Box>` at 16 columns, with no `flexBasis` set, and every line is at most 16 columns wide. The `flexBasis={0}` workarounds in `ui` can then be removed without changing output.

### R2. A timing-sensitive core test is flaky under load
- Status: `in progress`. The wait is fixed. Evidence so far: the file passed 11 runs in a row, 6 of them with four CPU-burning processes competing for the cores. The 20-run full-suite check will come from CI history.
- Problem: `hasMeasured resets when tracked ref switches to a detached element` (`packages/core/test/use-box-metrics.tsx`) waits a fixed 50 ms. It failed once in a full-suite run and passed on every rerun.
- Acceptance: the test waits for the render flush instead of a fixed delay. It passes 20 consecutive full-suite runs.

### R3. `ScrollBox` controlled offset can drift
- Status: `done`. Controlled requests last one turn of the event loop. After that, the next scroll starts from the offset the parent last supplied. A regression test fails without the fix and passes with it.
- Problem: in controlled mode, `latestOffsetRef` advances on each scroll, but it is only resynced on render. If a parent rejects an offset without re-rendering, later key presses start from the rejected value.
- Acceptance: a test where the parent ignores `onScroll` shows that the next key press starts from the value the parent last provided.

## P1: adoption and maintainability

### R4. Lint is not enforced across the repository
- Status: `open`
- Problem: `xo` reports about 1,000 problems. CI only checks that changed files do not get worse (`scripts/lint-ratchet.mjs`).
- Acceptance: `pnpm lint` runs in CI and exits 0 across all packages.

### R5. CI covers only Linux
- Status: `open`
- Problem: every CI job runs on `ubuntu-latest`. Terminal behavior differs on macOS and Windows, and the Windows pseudo-terminal path is untested. The package test scripts use `env -u ...`, which is not available on Windows shells.
- Acceptance: the test job runs on `ubuntu-latest`, `macos-latest` and `windows-latest`, and all three are green.

### R6. Docs can drift from the code
- Status: `done`. `scripts/check-docs.mjs` (`pnpm docs:check`) reads each `docs-site/api/<name>.md` against `packages/<name>/build/index.d.ts` through the TypeScript checker. It checks top-level headings and `useApp().member` headings against the function's return type. It also checks every internal `link:` in `docs-site/.vitepress/config.ts`. The docs job in CI runs it after the build. Evidence: it passes on the repo (42 names, 61 links). It fails with exit 1 on an injected fake export, a missing member and a dead link. This check found `suspendTerminal` documented as a top-level export, which was a member of `useApp()`.
- Problem: the spatial-focus docs described an export that did not exist, and nothing in CI caught it.
- Acceptance: a script checks that every name documented in `docs-site/api/*.md` is exported from the built `index.d.ts`, and that every sidebar link resolves to a page. The script runs in CI.

### R7. No render-performance baseline
- Status: `open`
- Problem: there is no benchmark for rendering throughput, so claims about smoothness are not measured.
- Acceptance: a benchmark script reports frames per second and bytes written for a fixed scenario (for example, 1,000 streamed log lines). It writes a JSON report that CI keeps as an artifact.

### R8. Release process is not documented or rehearsed
- Status: `done`. `CHANGELOG.md` covers 0.2.0 onward, and `docs/RELEASING.md` gives the versioning policy and the steps. `pnpm release:rehearse` (`scripts/rehearse-release.mjs`) runs `pnpm publish --dry-run` for every package, packs each one, and checks its tarball. A `release-rehearsal` CI job runs it. The acceptance said "both packages", but the workspace has three public packages (core, ui, genui), so all three are rehearsed. Evidence: the rehearsal passes on the repo, and it fails with exit 1 when `packages/ui/build/index.d.ts` is missing. A plain `publish --dry-run` skipped core and ui, because npm already has 0.2.0. That is why the rehearsal passes `--force`.
- Problem: there is no changelog, no versioning policy, and no dry-run of the publish step in CI.
- Acceptance: `CHANGELOG.md` exists, `docs/RELEASING.md` describes the process, and CI runs `pnpm publish --dry-run` for both packages.

### R9. No starter template
- Status: `done`. `examples/starter` uses core for rendering, input and app control, and ui for `Header`, `Select`, `StatusMessage` and `KeyHint`. It typechecks with `pnpm typecheck`, which CI runs. It starts with `pnpm --filter termina-example-starter start`. Evidence: in a pseudo-terminal, Enter selects an option, the arrow keys move focus, and `q` exits with status 0.
- Problem: a new developer has to assemble a project from the docs.
- Acceptance: `examples/starter` contains a small app that uses core and ui. It typechecks and runs with `pnpm --filter ... start`, and CI typechecks it.

## Deferred

- **Dialog focus trap.** `Dialog` is documented as non-modal, and `Modal` provides the trapped overlay. Revisit only if users report confusion.
