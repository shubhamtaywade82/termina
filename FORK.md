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

## Local changes to `@nemesis-oss/termina-ui`

- **TextInput and PasswordInput editing.** Grapheme-aware cursor and deletion,
  forward Delete, no-op Backspace at 0, Ctrl/Alt chords ignored, pasted control
  characters removed. Shared module `source/lib/grapheme.ts`.
- **Controlled `value` and notification contract.** `TextInput` and
  `PasswordInput` accept `value` (controlled) and `defaultValue` (uncontrolled).
  `TextInput`, `PasswordInput` and `EmailInput` call `onChange` from the edit
  path, once per edit that changes the value. None of them notify from an
  effect. Before this, a parent that re-rendered with a new callback received
  the same value again. An exception thrown by `onChange` re-throws during
  render, so an error boundary catches it. Edit logic is in
  `source/lib/text-edit.ts`. The buffer, controlled reconciliation and error
  handling are in `source/lib/use-text-buffer.ts`. Render has no side effects.
- **ScrollBox** (`source/components/scroll-box`): fixed-height viewport, arrow,
  page, home and end keys, mouse wheel through `<Box onWheel>` (needs
  `render(..., {mouse: true})`), keys read only when stdin supports raw mode,
  clamped offset, optional tail-follow, scrollbar track. Offsets move from a
  latest-offset ref, so bursts of events do not act on stale state.
- **LogStream** (`source/components/log-stream`): tail-following ScrollBox with a
  `maxLines` cap.

- **New components (22).** Accordion, Autocomplete, CodeBlock, DataTable, Dialog,
  DiffView, Divider, Gauge, Header, JSONViewer, KeyHint, LoadingBar, Markdown,
  Sparkline, Stepper, StreamingText, Table, Tabs, Toast, TokenCounter, Typewriter
  and TreeView. Each has a theme, a test file, a docs page and a live demo. They
  follow the public documentation of inkui (github.com/kamlesh723/inkui) as a
  behavior reference. No source was copied. `string-width` is a dependency, for
  column widths. `Dialog` has no focus trap, and `Tabs` and `DataTable` are
  described on their docs pages.

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
- **Not built yet:** multi-line text editor, Modal with focus trap, SplitPane,
  spatial focus wired to `useFocus`, OSC 8 and OSC 52 helpers
  as Ink components. The xterm-backed fixture in `packages/core/test/helpers/xterm-terminal.ts`
  has `getLine`, `cellAt`, `cells` and `emitKey`. It has no `getFocusedId`: tests read
  focus with a probe component (see `packages/core/test/xterm-fixture.tsx`).

## Test dependencies added

`@xterm/headless` (reflowing emulator, used by resize tests), `node-pty` (real
pseudo-terminal fixtures, as upstream), `delay`, `boxen`, `cat-names`, `p-queue`,
`ms`, `@faker-js/faker`, all pinned in `packages/*/package.json`. `pnpm-lock.yaml`
is committed so installs are reproducible. Upstream commits no lockfile.
