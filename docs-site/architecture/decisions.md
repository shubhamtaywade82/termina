---
outline: [2, 3]
---

# Decisions

This page records the decisions that the design documents and `FORK.md` make about the engine and the UI kit, with the reason for each as the source writes it. The sources are `docs/research/termina-proposal-review.md`, `docs/research/ink-architecture.md`, and `FORK.md`. Decisions that appear only as comments in the source are listed at the end. Use this page to see why the fork differs from the original proposal or from upstream, and which questions are still open.

The reasons below are quoted from the sources where the source gives a reason. Where it gives none, the entry says so.

## Engine

| Decision | Reason as written | Source |
| --- | --- | --- |
| Keep the existing engine, and do not build a second engine from a bare frame buffer. Implement only the parts of the proposal that fill real gaps in the fork. | "The proposal would replace the reconciler, layout, output, and input layers that `@nemesis-oss/termina-core` already has, and it would give up measured properties that matter for a streaming dashboard: incremental output, the reflow-aware resize erase, and the input and terminal lifecycle tests." | Proposal review, Decision |
| Target Node 22 and build with `tsc`, not Node 18 and tsup. | "Ink 8 requires Node 22 (`engines`), and uses `Promise.withResolvers`." The fork "builds with `tsc`, matching upstream." | Proposal review, claims table; ink-architecture, section 8 |
| Use React 19.3 and `react-reconciler` 0.34. | "React 18.3 and `react-reconciler` 0.29 are incompatible with Ink 8, which needs React 19.3 and reconciler 0.34." | Proposal review, defect 7 |
| Run tests with `node:test` and `tsx`, not Jest. | "Switching would add a transform layer for every test file." | `FORK.md`, deviations |
| Commit `pnpm-lock.yaml`. | "`pnpm-lock.yaml` is committed so installs are reproducible. Upstream commits no lockfile." | `FORK.md`, test dependencies |

## Input and mouse

| Decision | Reason as written | Source |
| --- | --- | --- |
| Mouse tracking is opt-in, through `render(..., {mouse: true})`, and is not on by default. | "Tracking captures the wheel, which stops scrollback scrolling, and suppresses native text selection, for every app." | Proposal review, claims table |
| A click is a press and a release on the same `onClick` target. The hit test applies clipping and `contentOffsetX` and `contentOffsetY`. | The proposal's `hitTest` "does not apply `overflow: hidden` or `contentOffsetY`, so a click inside a scrolled transcript would hit content that is not on screen." | Proposal review, defect 5 and "What this branch implements" |
| The lone-ESC flush window is a module constant of 40 ms, not a render option. | "It is a module constant, not a render option, so `test/escape-timing.tsx` pins the range instead of a caller setting." | ink-architecture, section 3 |

## Resize

| Decision | Reason as written | Source |
| --- | --- | --- |
| Erase the frame by the physical rows it occupies at the new width, not by logical line count. | "Upstream clears on width decrease using `eraseLines(previousLines.length)`, which counts logical lines, not rows. A terminal reflows wrapped rows before Ink hears about the resize, so the erase falls short and the rest of the frame survives as ghost copies." | ink-architecture, section 6 |
| Do not port the phase-2 `FrameBufferRenderer` as written. | "Would not fix ghosting: it counts logical lines for cursor-up, the same flaw. Not ported." | ink-architecture, section 8 |
| A screen-reader frame ends with a newline. | "This is what keeps the cursor off frame content when the terminal narrows." | `FORK.md`, deviations |

## Rendering and output

| Decision | Reason as written | Source |
| --- | --- | --- |
| Write DEC 2026 synchronized output only on a TTY, and make `render()` non-interactive when `TERM=dumb`. | "The earlier concern that `[?2026h` prints as text applies to non-TTY output and dumb terminals, which this fork now gates." | ink-architecture, section 4; `FORK.md`, local changes |
| Convert color levels through chalk. Do not write raw `38;2` sequences. | "Handled by chalk." Raw `\x1b[38;2;…` writes "bypass chalk and must be avoided." | ink-architecture, section 8 |
| No cell-level back and front buffer renderer is built. The output-size gain comes from upstream incremental rendering. (The buffer question is open; see below.) | "Not built: a cell-level back/front buffer renderer." The cheap win (incremental rendering) "is already in upstream." | `FORK.md`, deviations; ink-architecture, section 2 |

## UI kit

| Decision | Reason as written | Source |
| --- | --- | --- |
| Edit text by grapheme cluster, through one shared module, `source/lib/grapheme.ts`. | Upstream editing "split emoji surrogate pairs and detached combining marks." The proposal's paint loop was also measured as not grapheme-safe: CJK text takes 6 cells where the terminal needs 12, and a ZWJ family emoji takes 7 cells where it needs 2. | ink-architecture, section 7; proposal review, claims table |
| Remove the `test.failing` markers and run the converted tests as ordinary tests. | "On this base their bodies pass, so the bugs they describe no longer reproduce." | ink-architecture, section 7; `FORK.md`, deviations |
| Run the resize test on `@xterm/headless`, not on a reducer. | "The old reducer-based resize test in `test/render.tsx` now runs on `@xterm/headless`, because the reducer does not model column reflow." | `FORK.md`, deviations |
| Ship `ScrollBox` and `LogStream` in the kit. | The review marks the proposal's components "Mostly absent" and lists `ScrollBox` and `LogStream` as what this repository has. No further reason is written. | Proposal review, claims table |

## Rejected from the proposal review

The proposal review records these verdicts on claims in the original proposal.

| Proposal claim | Verdict | Evidence as recorded |
| --- | --- | --- |
| Vanilla Ink flushes raw ANSI chunk by chunk, with no synchronized updates. | False | DEC 2026 wraps log, clear, and console writes. |
| Vanilla Ink has no alternate screen. | False | The `alternateScreen` option exists. |
| Vanilla Ink can leave raw mode on after an abrupt exit. | Not supported | Ink registers `signal-exit` to unmount, and unmount releases raw mode. |
| Vanilla Ink is limited to 16 colors. | False | Hex foreground and background both emit 24-bit sequences. |
| Resize leaves ghost copies because erases count lines. | True for 8.0.0 | Reproduced with the emulator. Fixed in the fork. |
| Vanilla Ink has no mouse support. | True for 8.0.0 | Implemented in the fork, opt-in. |
| termina paint is grapheme-safe. | False | The proposal's paint loop advances one cell per code point. |
| Dirty-cell diffing avoids I/O saturation. | Not in the proposal's code | `ScreenBuffer.toString()` re-serializes every cell on every frame. The review's figures for this claim do not match the measurement script (see [Ink Internals](/architecture/ink-internals)). |
| Node 18 and tsup. | Not viable | Ink 8 requires Node 22. |
| `@termina/ui` has `PrecisionMeter`, `SpectrumBar`, `MultilineEditor`, `VirtualTable`, `Modal`, and `ScrollBox`. | Mostly absent | None exist in the proposal. The repository has `ScrollBox` and `LogStream`. Modal, table, and multi-line editor are not built. |
| Mouse should be on by default. | Rejected | See the opt-in decision above. |

The review also lists defects in the proposed code: mouse handlers never wired, colors and backgrounds mostly not rendering, removed style props staying set, a TurnStream that does not compile against the proposed core, hit testing that ignores clipping, streaming not implemented, and a React and reconciler version mismatch. The fork does not contain that code, so these defects do not apply to it.

## Adopt next, not built

The review lists these items to adopt from the proposal. None is built in the current source.

| Item | Reason as written | Status |
| --- | --- | --- |
| Braille (U+2800 to U+28FF) and partial-block (U+2588 to U+258F) glyphs as sparkline and meter components in `@nemesis-oss/termina-ui`. | "These are real cell glyphs and need no engine change." | Not built. The kit has no sparkline or meter component. |
| Geometric title glyphs and borderless padded layouts, as a theme choice. | None written. | Not built. |
| The press-and-release click rule. | None written. | Already used by the fork's `Box` click handling. |

The review also lists these items from the original plan as still open: a multi-line editor, a virtual table, a modal with a focus trap, and spatial focus wired into `useFocus`.

## Open questions

These questions are not closed by any source.

- **Cell-level back and front buffer renderer.** Status: not built, and no decision to build or to reject it is recorded. The research document says: "A cell-level back/front buffer could go lower again, but this measurement shows the cheap win is already in upstream and off by default." The measured figures are 21,588 bytes per update in the default writer and 701 bytes with incremental rendering. The question is therefore open, and the sources do not settle it.
- **Cursor position after a reflow.** Status: open. The research document says: "Cursor position after a reflow is not reliably defined across terminals." When a `useCursor()` position is active, the fork falls back to the line-count erase.
- **Spatial focus wired into `useFocus`.** Status: not built. `nearestInDirection` is a pure function, and `FORK.md` says it "is not wired into focus management."
- **Components not yet built.** Status: not built. These are a multi-line text editor, a Modal with a focus trap, SplitPane, and the OSC 8 and OSC 52 helpers as Ink components. DataTable and Tabs were built later, and Dialog covers a modal's content without a focus trap.

## Recorded without a stated reason

The sources record these states but give no reason for them.

- Incremental rendering is off by default in upstream (ink-architecture, section 2).
- Upstream history is not carried over, and re-syncing means diffing against the recorded commits (`FORK.md`).
- The spatial focus helper is not wired into focus management (`FORK.md`).
- The choice of `ScrollBox` and `LogStream` for the kit has no reason beyond the review's verdicts.

## Decisions recorded in source comments

These reasons appear as comments in the source. They are not in the design documents.

| Decision | Reason as written in the comment | Location |
| --- | --- | --- |
| Mouse reports never reach `useInput`. | "They are complete CSI sequences, so they must never reach useInput as text." | `packages/core/src/components/App.tsx` |
| `useMouse` takes raw mode itself. | "Reports only arrive while stdin is read, and stdin is read only in raw mode." | `packages/core/src/hooks/use-mouse.ts` |
| The lone-ESC window is 40 ms, in the middle of the 25 to 50 ms range. | "a shorter window risks splitting a sequence that arrives in two reads, and a longer one delays a real Escape press." | `packages/core/src/input-parser.ts` |
| The reflowed erase on the alternate screen is absolute. | "The alternate screen has no scrollback and the frame owns the whole viewport, so erase it absolutely." | `packages/core/src/ink.tsx`, `eraseReflowedFrame` |
| The screen-reader frame ends on a fresh row. | "A cursor left on the frame's last line can be clamped into that line when the terminal narrows, which would start a reflowed erase one row too high." | `packages/core/src/ink.tsx`, `screenReaderFrame` |
| The capability probe follows chalk's supports-color rules. | "so raw styling and chalk always agree" | `packages/core/src/terminal-capabilities.ts` |
| The Linux console is excluded from `synchronizedOutput`. | "the Linux console is excluded because it has no documented behavior for them." The renderer does not read this field, so the exclusion is not applied when rendering. | `packages/core/src/terminal-capabilities.ts` |
| Hyperlink URLs that contain control characters are rejected. | "Any C0, DEL or C1 control character would end the OSC early or start a new sequence, so a URL containing one is rejected rather than escaped." | `packages/core/src/hyperlink.ts` |
| OSC 52 payloads are capped at 74,000 base64 characters. | "Terminals commonly cap an OSC 52 payload at about 75 KB of base64. A larger copy is rejected here, because the terminal would otherwise truncate it silently." | `packages/core/src/clipboard.ts` |
| `ScrollBox` moves from a latest-offset ref. | "Input events can arrive faster than React renders." | `packages/ui/source/components/scroll-box/scroll-box.tsx` |
| `LogStream` keeps only the newest `maxLines` entries. | "Every entry is laid out on each render, so an unbounded log would make each frame slower than the last." | `packages/ui/source/components/log-stream/log-stream.tsx` |

## Related pages

- [Fork Provenance](/architecture/fork-provenance) lists each local change and the files it touches.
- [Ink Internals](/architecture/ink-internals) describes the mechanisms behind these decisions.
