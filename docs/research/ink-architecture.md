# Ink 8 and ink-ui 2: verified architecture

Every claim below was checked against the upstream source at the pinned commits
(see `FORK.md`), or against a measurement noted inline. Where the earlier design
notes disagreed with the source, the correction is in the table at the end.

## 1. Packages and versions

| Package | Version | Node | Peer / key deps |
| --- | --- | --- | --- |
| `ink` (vadimdemedes/ink, `26d2c3f`) | 8.0.0 | `>=22` | React `>=19.3`, `react-reconciler ^0.34`, `yoga-layout ~3.2.1`, `chalk ^6`, `string-width ^8`, `wrap-ansi ^10`, `@alcalzone/ansi-tokenize` |
| `@inkjs/ui` (vadimdemedes/ink-ui, `14b1145`) | 2.0.0 | `>=18` | peer `ink >=5`; its own dev harness still targets ink 5 and React 18 |

Ink 8 requires Node 22 because it uses `Promise.withResolvers`. A Node 18 target,
as in the earlier spec, is not viable.

## 2. Render pipeline

```
React tree ──► react-reconciler (src/reconciler.ts, host config)
           ──► DOM-like nodes (src/dom.ts: ink-root, ink-box, ink-text)
           ──► Yoga layout (ink.tsx calculateLayout: width = stdout.columns, height = content)
           ──► render-node-to-output.ts walks nodes into output.ts (Output grid, clip/unclip ops)
           ──► Output.get(): one string per row, each row trimEnd()ed (output.ts:392)
           ──► log-update.ts diff ──► stdout, wrapped in DEC 2026 BSU/ESU (write-synchronized.ts)
```

- Renders are throttled to `maxFps` (default 30, `ink.tsx:452`), via es-toolkit `throttle`.
- Two writers exist in `log-update.ts`:
  - **standard** (default): erases the previous frame with `eraseLines(previousLineCount)` and rewrites the whole frame.
  - **incremental** (`incrementalRendering: true`): compares row by row and rewrites only changed rows. `line-update.ts` further narrows a changed row to its differing suffix, grapheme-aware.
- `<Static>` output is written once above the live frame and never redrawn. In alternate-screen mode it is replayed from `fullStaticOutput` on full clears (`ink.tsx`, `renderInteractiveFrame`).
- `alternateScreen: true` enters DECSET 1049, hides the cursor, and uses absolute `homeAndEraseDown` for full clears (`ink.tsx:54`).
- Non-interactive mode (CI, piped stdout) writes only the final frame at unmount.

### Measured cost of the default writer

Same 200-row frame, 120 columns, one counter changed per update
(`docs/research/measure-output-bytes.mjs`, run after `pnpm --filter @nemesis-oss/termina-core run build`):

| Mode | Bytes per one-counter update |
| --- | --- |
| default (full frame) | 21,588 |
| `incrementalRendering: true` | 701 |

A cell-level back/front buffer could go lower again, but this measurement shows
the cheap win is already in upstream and off by default.

## 3. Input pipeline

```
stdin 'readable' ──► input-parser.ts   tokenizes ESC/CSI/SS3/paste into events
                 ──► App.tsx           handleInputEvent: kitty replies, mouse (fork), control sequences
                 ──► parse-keypress.ts names keys, decodes modifiers (ctrl/meta/shift)
                 ──► use-input.ts      Key object; paste on its own channel (usePaste)
```

- Bracketed paste (`?2004h`) and raw mode are reference-counted by the App and released on suspend and unmount.
- A lone ESC is flushed after 40 ms (`escapeFlushDelayMilliseconds` in `input-parser.ts`, scheduled by `App.tsx`), which is how ESC and arrow keys are told apart. The window is 25–50 ms. It is a module constant, not a render option, so `test/escape-timing.tsx` pins the range instead of a caller setting.
- Kitty keyboard protocol: `CSI ? u` query, then `CSI > flags u` on success (`kitty-keyboard.ts`, `ink.tsx`).
- Upstream discards SGR mouse reports. Its test asserts they never reach `useInput`. This fork adds a mouse channel (see `FORK.md`).

## 4. Terminal control sequences in upstream

Verified by grep over `src/`:

| Sequence | Purpose | Location |
| --- | --- | --- |
| `CSI ? 2026 h/l` | synchronized output (BSU/ESU) | `write-synchronized.ts` |
| `CSI ? 1049 h/l` | alternate screen | `ansi-escapes` via `ink.tsx` |
| `CSI ? 25 l/h` | cursor hide/show | `cursor-helpers.ts` |
| `CSI ? 2004 h/l` | bracketed paste | `App.tsx` |
| `CSI ? u`, `CSI > n u` | kitty keyboard query and enable | `ink.tsx`, `kitty-keyboard.ts` |
| `OSC 8` | hyperlinks: preserved by sanitization (`sanitize-ansi.ts` keeps OSC tokens) | `sanitize-ansi.ts` |
| SGR mouse `CSI < … M/m` | **absent** upstream; reports are discarded | — |

Unknown private modes are ignored by terminals. The earlier concern that
`[?2026h` prints as text applies to non-TTY output and dumb terminals, which
this fork now gates.

## 5. Layout and clipping

- `Box` supports `overflow: hidden` (`render-node-to-output.ts:168`), `contentOffsetX/Y` (shifts children, `:204`), and `position: absolute`.
- `measureElement` returns layout-tree coordinates and `clientWidth/clientHeight`; `useBoxMetrics` tracks the same over time. Together they are enough to build a scroll viewport with a clamped offset and a hit test. `ScrollBox` in `@nemesis-oss/termina-ui` is built this way.
- Yoga lays out at the terminal's column count. Text wraps to the box's width. A frame taller than the viewport is treated as fullscreen (`ink.tsx`, `isFullscreen`).

## 6. Resize behavior

Upstream clears on width decrease using `eraseLines(previousLines.length)`, which
counts logical lines, not rows. A terminal reflows wrapped rows before Ink hears
about the resize, so the erase falls short and the rest of the frame survives as
ghost copies. This was reproduced with `@xterm/headless` 5.5.0 (reflowing):

| Step (80 → 40 → 20 → 60 → 100 columns) | Upstream `HEADER` count | Fork `HEADER` count |
| --- | --- | --- |
| initial | 1 | 1 |
| after 40 | 2 | 1 |
| after 20 | 3 | 1 |
| after 60 | 3 | 1 |
| after 100 | 3 | 1 |

Growing the window does not remove ghosts, because the upstream clear only runs
on decrease. The fork's fix (`src/reflow.ts`, `log-update.ts` `clearReflowed`,
`ink.tsx` `resized`) erases the rows the frame physically occupies at the new
width, then repaints inside one synchronized update. Regression tests:
`test/terminal-resize-reflow.tsx` (fails 3/3 on upstream `ink.tsx`, passes on the fork).

Known remaining gap: when a `useCursor()` position is active, the reflowed erase
falls back to the line-count erase. Cursor position after a reflow is not
reliably defined across terminals.

## 7. ink-ui structure

- `source/components/<name>/` holds the component, its `theme.ts`, and its state hook.
- `source/theme.tsx`: `ThemeProvider`, `useComponentTheme`, and `extendTheme` (deepmerge over per-component `styles`/`config` functions).
- Components: Alert, Badge, ConfirmInput, EmailInput, MultiSelect, OrderedList, PasswordInput, ProgressBar, Select, Spinner, StatusMessage, TextInput, UnorderedList.
- Not present: multi-line input, scroll viewport, log stream, data table, modal, tabs, split pane, spatial focus. The fork adds `ScrollBox` and `LogStream` (see below). Spatial focus exists only as the pure `nearestInDirection` helper, which the focus system does not call yet. Multi-line input is not built.

### Defects confirmed in `TextInput` and `PasswordInput`

Confirmed with tests before the fix (`test/text-input-editing.tsx`, 8 cases):

- Backspace at cursor 0 deleted the character after the cursor.
- Forward Delete (`CSI 3 ~`) behaved as Backspace.
- Editing by UTF-16 code unit split emoji surrogate pairs and detached combining marks.
- Ctrl+letter inserted the letter (Ctrl+A typed `a`).
- Pasted control characters, including newlines, were stored in a single-line value.

Fixed in `source/lib/grapheme.ts` (shared, `Intl.Segmenter`-based) and the edit
logic in `source/lib/text-edit.ts`. The cursor stays a UTF-16 index. Movement and
deletion step by grapheme cluster, but an inserted zero-width joiner can leave
the cursor inside a grapheme (see the TextInput edge cases).

### Known-bug markers in the upstream test suite

Seven ava `test.failing` cases encoded icon and box expectations for `Alert` and
`StatusMessage`. On this base their bodies pass, so the bugs they describe no
longer reproduce. They were converted to ordinary tests, which is what ava's
semantics require.

## 8. Corrections to the earlier design notes

| Earlier claim | Status in upstream 8.0.0 |
| --- | --- |
| No synchronized output (DEC 2026) | Present. Applied around every log, clear and console write. |
| No alternate screen | Present (`alternateScreen`). |
| Escape-key ambiguity needs a timer | Present: 20 ms flush in upstream. The fork moves it to `escapeFlushDelayMilliseconds` (40 ms, `input-parser.ts`). Still a constant, not a render option. |
| Kitty keyboard unsupported | Present (query, enable, flags). |
| Bracketed paste unsupported | Present, reference-counted. |
| Resize ghosting unaddressed | Real. Fixed in the fork (section 6). |
| Phase-2 `FrameBufferRenderer` as written | Would not fix ghosting: it counts logical lines for cursor-up, the same flaw. Not ported. |
| Target Node 18, tsup | Ink 8 requires Node 22. The fork builds with `tsc`, matching upstream. |
| Color down-sampling needed | Handled by chalk. `level 2` maps (255,128,0) to `38;5;214`, which is the 6×6×6 cube formula `16 + 36r + 6g + b`. Raw `\x1b[38;2;…` writes bypass chalk and must be avoided. |
| Mouse support needed | Was absent. Added in the fork (`FORK.md`). |
| Modal, DataTable, multi-line editor, tabs | Absent upstream. Not yet built in the fork. |
