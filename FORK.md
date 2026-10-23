# Fork provenance and local changes

## Package names

The packages were developed as `@fork/core` and `@fork/ui`. They publish as
`@nemesis-oss/termina-core` and `@nemesis-oss/termina-ui`. The names in this file
use the published names, and the rename left the code unchanged apart from import specifiers.

## Upstream

| Fork path | Upstream | Commit | License |
| --- | --- | --- | --- |
| `packages/core` (`@nemesis-oss/termina-core`) | https://github.com/vadimdemedes/ink | `26d2c3f83008142061c22267482489588cc3823c` (8.0.0) | MIT, `packages/core/LICENSE` |
| `packages/ui` (`@nemesis-oss/termina-ui`) | https://github.com/vadimdemedes/ink-ui | `14b1145da0123a48cfc2f0ec9ff33dff0633f464` (2.0.0) | MIT, `packages/ui/LICENSE` |

The upstream repositories were shallow-cloned and their `src/`, `source/`, `test/`,
and `examples/` (the subset the engine tests import) were copied in. Upstream
history is not carried over. Re-syncing means diffing against the commits above.

## Local changes to `@nemesis-oss/termina-core`

- **Reflow-aware resize erase.** `src/reflow.ts` (new), `src/log-update.ts`
  (`clearReflowed`), `src/ink.tsx` (`resized`, `eraseReflowedFrame`,
  `forgetRenderedFrame`). Erases by physical rows at the new width. Writes are
  suppressed while suspended. Screen-reader frames end on a fresh row. Rows are counted
  per grapheme, so a wide character that wraps early is not undercounted.
- **Mouse protocol.** `src/mouse.ts` (SGR 1000/1002/1006 parser and enable/disable
  sequences), `src/hooks/use-mouse.ts` (`useMouse`), App ref-counting and
  suspend/resume/unmount release in `src/components/App.tsx`, `setMouseTracking`
  in `StdinContext.ts`. Mouse reports are routed to `useMouse` and never reach `useInput`.
  `<Box onClick onMouseDown onMouseUp onWheel>` are hit-tested by `src/mouse-dispatch.ts`
  when `render(..., {mouse: true, alternateScreen: true})` is set and stdin supports raw
  mode. `onClick` is left-button only.
- **Input hooks idle without raw mode.** `useInput`, `usePaste` and `useMouse`
  check `isRawModeSupported` and stay idle on piped stdin instead of throwing.
  Upstream throws. A direct `setRawMode(true)` call still throws.
- **OSC 8 hyperlinks.** `src/hyperlink.ts`. Rejects URLs containing control characters.
- **OSC 52 clipboard.** `src/clipboard.ts`. Rejects payloads above 74,000 base64 characters.
- **Capability probe.** `src/terminal-capabilities.ts`. Reads `TERM`, `COLORTERM`,
  `NO_COLOR`, `FORCE_COLOR`, `CI`, and TTY state. `render()` now also defaults to
  non-interactive when `TERM=dumb`. `FORCE_COLOR` levels follow chalk; `NO_COLOR` wins over them.
- **Viewport-bounded shrink writes.** `src/log-update.ts` (`boundShrinkMoves`,
  `previousScrolledPastTop`). An incremental write that shrinks a frame taller
  than the viewport caps its erase and climb to the viewport height, so the
  cursor never requests travel above the top row. A previous block that
  overflowed the viewport is rewritten in full, because its top rows are in
  scrollback and cannot be diffed. Without a known viewport height (`stream.rows`
  not a number) the moves and skips are unchanged. Ink PR #917 (open at the time
  of writing) clamps `cursorUp` in its cursor-suffix builder instead; that builder
  is not bounded here, because a cursor on a row that has scrolled away has no
  visible position to clamp to.

- **Soft-wrap spacing.** `src/wrap-text.ts`. A soft wrap drops the space it breaks on, so a continuation row never starts or ends with a space, and a break that leaves only a space adds no row. Each input line keeps its leading indentation on its first row. `hard` wrapping is unchanged. Measurement (`src/dom.ts`) and painting (`src/render-node-to-output.ts`) call the same function, so the row counts agree.

- **Directional focus.** `src/spatial.ts` holds `nearestInDirection`, the pure geometry that `cae5ff6` had removed as unwired. It is now called by `focusDirection` in `useFocusManager`, and it is exported with its types. A focusable passes its `Box` ref to `useFocus({ref})`, and `focusDirection` measures its visible rectangle with `visibleBoundsOf`. `src/visible-box.ts` holds the box and clip walk that hit-testing (`src/mouse-dispatch.ts`) also uses, so a click and a focus move agree about what is drawn. The element ref is stored in place, like the scope, so re-rendering does not change the Tab order.

## Local changes to `@nemesis-oss/termina-ui`

- **TextInput and PasswordInput editing.** Grapheme-aware cursor and deletion,
  forward Delete, no-op Backspace at 0, Ctrl/Alt chords ignored, pasted control
  characters removed. Shared module `source/lib/grapheme.ts`.
- **Controlled `value` and notification contract.** `TextInput`,
  `PasswordInput` and `EmailInput` accept `defaultValue` (uncontrolled), and
  `TextInput` and `PasswordInput` also accept `value` (controlled). All three call
  `onChange` from the edit path, once per edit that changes the value, and none
  of them notify from an effect, so a parent that re-renders with a new callback
  does not receive the same value again. The caret is kept in state: a rejected
  edit leaves it where the user left it, and a new `value` from the parent keeps
  its offset, clamped to the new length. An exception thrown by `onChange` is
  rethrown during the next render, so an error boundary catches it. Edit logic is
  in `source/lib/text-edit-reducer.ts` and `source/lib/use-synced-reducer.ts`,
  controlled caret in `source/lib/use-controlled-caret.ts`, and change
  notification in `source/lib/use-change-notifier.ts`.
- **ScrollBox** (`source/components/scroll-box`): fixed-height viewport, arrow,
  page, home and end keys, mouse wheel through `<Box onWheel>` (needs
  `render(..., {mouse: true})`), keys read only when stdin supports raw mode,
  clamped offset, optional tail-follow, scrollbar track. Offsets move from a
  latest-offset ref, so bursts of events do not act on stale state.
- **LogStream** (`source/components/log-stream`): tail-following ScrollBox with a
  `maxLines` cap.

- **New components (25).** Accordion, Autocomplete, CodeBlock, DataTable, Dialog,
  DiffView, Divider, Gauge, Header, JSONViewer, KeyHint, LoadingBar, Markdown,
  Modal, MultilineTextInput, Sparkline, SplitPane, Stepper, StreamingText, Table,
  Tabs, Toast, TokenCounter, Typewriter and TreeView. Each has a theme, a test file, a docs page and a live demo. They
  follow the public documentation of inkui (github.com/kamlesh723/inkui) as a
  behavior reference. No source was copied. `string-width` is a dependency, for
  column widths. `Dialog` has no focus trap, and `Tabs` and `DataTable` are
  described on their docs pages.

- **Table and DataTable fit their container.** `source/lib/fit-column-widths.ts` shrinks the widest column one cell at a time until the row fits, so short columns keep their width. `source/lib/use-fitted-column-widths.ts` measures the container with `useBoxMetrics`, and uses the terminal width until the first measurement. Cells truncate with `…`. The rule is a one-row clip, so it never shows an ellipsis. DataTable's focus highlight covers the table's width.
- **List and Markdown item text.** Item content boxes take the width the marker leaves (`flexBasis: 0`). Without it, wrapped text was measured at the full row width and overflowed the row by the marker's width.
- **Select and MultiSelect scroll up symmetrically.** Up scrolls only when focus moves above the first visible row, as Down scrolls only below it. Focus can rest on the top visible row.

## Deviations from the original plan

- **Test runner.** Node's built-in `node:test` with `tsx`, not Jest. The inherited
  core suite (1,724 tests: 1,719 pass, 5 skipped, measured with
  `pnpm --filter @nemesis-oss/termina-core run test`) and the ported ui suite both use it. Switching would
  add a transform layer for every test file.
- **Node 22+** instead of Node 18 (Ink 8 requires it).
- **Screen-reader output bytes changed.** A trailing newline is now written after
  each screen-reader frame. This is what keeps the cursor off frame content when
  the terminal narrows. Three byte-exact tests in `test/screen-reader.tsx` were
  updated to match. The old reducer-based resize test in `test/render.tsx` now runs on
  `@xterm/headless`, because the reducer does not model column reflow.
- **Known-bug markers removed** in `packages/ui/test/alert.tsx` and
  `packages/ui/test/status-message.tsx`. Their bodies pass on this base.
- **Not built:** a cell-level back/front buffer renderer. Measured data is in
  `docs/research/ink-architecture.md`, section 2. The cheap win (incremental
  rendering) is already in upstream.
- **Not built yet:** OSC 8 and OSC 52 helpers as Ink components. The xterm-backed fixture in `packages/core/test/helpers/xterm-terminal.ts`
  has `getLine`, `cellAt`, `cells` and `emitKey`. It has no `getFocusedId`: tests read
  focus with a probe component (see `packages/core/test/xterm-fixture.tsx`).

## Test dependencies added

`@xterm/headless` (reflowing emulator, used by resize tests), `node-pty` (real
pseudo-terminal fixtures, as upstream), `delay`, `boxen`, `cat-names`, `p-queue`,
`ms`, `@faker-js/faker`, all pinned in `packages/*/package.json`. `pnpm-lock.yaml`
is committed so installs are reproducible. Upstream commits no lockfile.
