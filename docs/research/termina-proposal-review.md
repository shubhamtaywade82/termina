# Review of the termina proposal

## Decision

Do not build a second engine from a bare frame buffer. The proposal would replace
the reconciler, layout, output, and input layers that `@fork/core` already has, and
it would give up measured properties that matter for a streaming dashboard:
incremental output, the reflow-aware resize erase, and the input and terminal
lifecycle tests. Instead, this branch implements the parts of the proposal that
fill real gaps in the fork, and records what was checked. See the last section.

## Claims checked

| Claim in the proposal | Verdict | Evidence |
| --- | --- | --- |
| Vanilla Ink flushes raw ANSI chunk by chunk with no synchronized updates | False | DEC 2026 BSU/ESU wraps log, clear, and console writes (`src/write-synchronized.ts`, `src/ink.tsx`). |
| Vanilla Ink has no alternate screen | False | `alternateScreen` option (`src/ink.tsx`, `src/render.ts`). |
| Vanilla Ink can leave raw mode on after an abrupt exit | Not supported | Ink registers `signal-exit` to unmount, and unmount releases raw mode (`src/ink.tsx`, `src/components/App.tsx`). |
| Vanilla Ink is limited to 16 colors | False | Hex foreground and background both emit 24-bit sequences (`38;2;135;175;255`, `48;2;0;50;0`), probed. |
| Resize leaves ghost copies because erases count lines | True for 8.0.0, reproduced | Emulator run: `HEADER` count 2, then 3, and it stays at 3 after growing. Fixed here; see `docs/research/ink-architecture.md` section 6. |
| Vanilla Ink has no mouse support | True for 8.0.0 | Reports were parsed and discarded. Now implemented here, opt-in. |
| termina paint is grapheme-safe | False | The proposal's own paint loop advances one cell per code point. Measured: CJK `漢字テキスト` is 6 cells where the terminal needs 12; ZWJ family `👨‍👩‍👧‍👦` is 7 cells where it needs 2. |
| Dirty-cell diffing avoids I/O saturation | Not in the proposal's code | `ScreenBuffer.toString()` re-serializes every cell on every frame. Measured upstream: 19,588 bytes per one-counter update in full-frame mode, 691 in incremental mode. |
| Node 18 and tsup | Not viable | Ink 8 requires Node 22 (`engines`), and uses `Promise.withResolvers`. |
| `@termina/ui` has PrecisionMeter, SpectrumBar, MultilineEditor, VirtualTable, Modal, ScrollBox | Mostly absent | None exist in the proposal. This repo has `ScrollBox` and `LogStream`. Modal, table, and multi-line editor are not built. |
| Mouse should be on by default | Rejected | Tracking captures the wheel, which stops scrollback scrolling, and suppresses native text selection, for every app. Here it is opt-in with `render(..., {mouse: true})`. |

## Defects in the proposed code

1. **Mouse handlers are never wired.** `reconciler.ts` `commitUpdate` applies only
   `style`. `setEventListeners` is never called, so `eventListeners` stays empty and
   every `onClick` is a no-op.
2. **Colors and backgrounds mostly do not render.** `ScreenBuffer.toString()` maps
   `style.color` through `chalk[color]`, which accepts only named colors. Hex values
   such as `HEX_THEME.neonCyan` are dropped, and `backgroundColor` is not handled
   at all, so the diff bands and the state pills cannot render.
3. **Removed style props stay set.** `applyStyles` merges and never resets a
   property that was removed. `setWidth('100%')` on the root passes a string to a
   numeric setter.
4. **TurnStream does not compile against the proposed core.** It imports `Box`,
   `Text`, and `useInput` from `@termina/core`, which the proposed barrel does not
   export. It also uses `gap`, `backgroundColor`, `marginTop`, `marginLeft`,
   `marginBottom`, `numberOfLines`, and `height: '100%'`, none of which are in
   `StyleProps`, and it mixes lowercase intrinsics with those component names.
5. **Hit-testing ignores clipping and scroll offsets.** `hitTest` does not apply
   `overflow: hidden` or `contentOffsetY`, so a click inside a scrolled transcript
   would hit content that is not on screen.
6. **Streaming is not implemented.** The proposal's TurnStream file uses a static
   event array and has no event bus.
7. **Dependency and tooling mismatches.** React 18.3 and `react-reconciler` 0.29 are
   incompatible with Ink 8, which needs React 19.3 and reconciler 0.34. The root
   `test` script runs a `smoke-test` package that the manifests do not define.

## What this branch implements instead

- `<Box onClick | onMouseDown | onMouseUp | onWheel>`, with a hit test that applies
  clipping and `contentOffsetX/Y`, and bubbles to the nearest handler. A click is a
  press and release on the same handler (`src/mouse-dispatch.ts`).
- Mouse tracking is an opt-in render option. Handlers are stored on DOM nodes
  through the existing reconciler host config (`src/reconciler.ts`,
  `src/components/Box.tsx`, `src/components/MouseRouter.tsx`).
- A bug found while testing: `useMouse` did not enable raw mode, so a component
  that used only `useMouse` received nothing. `mouse.tsx` had passed only because
  it also mounted `useInput`. Fixed, with a regression test.
- Tests: 8 cases in `test/box-events.tsx`, covering in-place clicks, drag-off
  cancel, bubbling, closest handler, wheel, overflow clipping, `contentOffsetY`, and
  the default-off guarantee. Plus the mouse-only regression.
- TurnStream: clickable block headers that collapse the body, clickable pause and
  speed controls, diff rendering with real background bands on Edit results, and
  a footer hint that shift-drag selects text. Verified in a pseudo-terminal: the
  header click removes the body, and clicking `4×` raises the elapsed rate to about
  3.3× the 1× rate over the measured window.
- Test hygiene: `test/render.tsx` "keeps its selection visible after resize" sampled
  output when the header arrived, and the selected row could land in a later chunk.
  It failed once in seven runs. It now waits for the row itself.

## What to adopt from the proposal next

- The braille (U+2800 to U+28FF) and partial-block (U+2588 to U+258F) glyphs as
  sparkline and meter components in `@fork/ui`. These are real cell glyphs and
  need no engine change.
- Geometric title glyphs and borderless padded layouts, as a theme choice.
- The press-and-release click rule, which this branch already uses.

Still open from the original plan: a multi-line editor, a virtual table, a modal
with focus trap, and spatial focus wired into `useFocus`.
