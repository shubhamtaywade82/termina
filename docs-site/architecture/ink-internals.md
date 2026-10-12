---
outline: [2, 3]
---

# Ink Internals

This page describes how `@nemesis-oss/termina-core` turns a React tree into terminal output and input events. It covers the layout and output path, the frame writers, the input pipeline, and the resize path, and it gives the measured output costs with their source. Read it when output does not match the layout, when key or escape timing looks wrong, or when a resize leaves artifacts. For how to use these behaviors, see [Rendering](/guide/rendering), [Resize](/guide/resize), and [Keyboard and Focus](/guide/keyboard-and-focus).

The base is Ink 8.0.0. Upstream behavior is taken from `docs/research/ink-architecture.md`, which records each claim as checked against the upstream source. Where the fork still contains that code, this page checks the claim against the source. Sections that the fork changed say so.

## Packages and versions

| Package | Version | Node | Key dependencies |
| --- | --- | --- | --- |
| Ink (`packages/core`) | 8.0.0 upstream; manifest version 0.1.0 | `>=22` | React `>=19.3.0` (peer), `react-reconciler ^0.34.0`, `yoga-layout ~3.2.1`, `chalk ^6.0.1`, `string-width ^8.3.0`, `wrap-ansi ^10.0.2`, `@alcalzone/ansi-tokenize ^0.3.1` |
| ink-ui (`packages/ui`) | 2.0.0 upstream; manifest version 0.1.0 | `>=22` | React `>=19.3.0` (peer), `@nemesis-oss/termina-core` (workspace) |

The dependency ranges above are from the `packages/core/package.json` and `packages/ui/package.json` manifests.

Ink 8 requires Node 22 or newer. The research document gives the reason as `Promise.withResolvers`, which `packages/core/src/ink.tsx` calls at line 758. A Node 18 target is not viable. See [Decisions](/architecture/decisions).

Upstream ink-ui peers on `ink` (`>=5`), and its dev harness still targets ink 5 and React 18, according to the research document. The fork's ui package peers on React and depends on the core package through the workspace.

## Render pipeline

```text
React tree
  -> react-reconciler host config      src/reconciler.ts
  -> DOM-like nodes                    src/dom.ts  (ink-root, ink-box, ink-text, ink-virtual-text)
  -> Yoga layout                       src/ink.tsx, calculateLayout()
  -> render-node-to-output             src/render-node-to-output.ts
  -> Output grid, with clip and unclip src/output.ts
  -> one string per row, trimEnd()     src/output.ts:392
  -> log-update writer                 src/log-update.ts
  -> stdout, inside DEC 2026 BSU/ESU   src/write-synchronized.ts
```

### Layout

- The root Yoga node takes the terminal's column count as its width (`calculateLayout` in `src/ink.tsx`). The height argument is `undefined`, so the height comes from the content.
- A frame at least as tall as the viewport counts as fullscreen (`isFullscreen` in `src/ink.tsx`). A fullscreen frame is written without the trailing newline that a shorter frame gets.
- Each row has its trailing whitespace trimmed before it is written (`src/output.ts:392`).
- `position` takes `'absolute' | 'relative' | 'static'` (`src/styles.ts:29`).
- `overflow: hidden` clips children (`src/render-node-to-output.ts:168-170`). `contentOffsetX` and `contentOffsetY` shift children (`src/render-node-to-output.ts:204-205`).
- `measureElement` returns layout-tree coordinates (`x`, `y`, `width`, `height`, `clientWidth`, `clientHeight`). It returns zeros when called during render, so call it from effects or handlers. Its coordinates do not include an ancestor's `contentOffsetX` or `contentOffsetY`. A hit test inside a scrolled container has to subtract those offsets. `useBoxMetrics` tracks the same values over time.
- `ScrollBox` in `packages/ui` is built on `useBoxMetrics` (`packages/ui/source/components/scroll-box/scroll-box.tsx`).

### Frame rate

- Renders go through `throttle` from es-toolkit (`src/ink.tsx`). `maxFps` defaults to 30, which is a minimum interval of `ceil(1000 / 30)` ms (`src/ink.tsx:452-457`).
- Rendering is not throttled when `debug` is set or a screen reader is enabled (`src/ink.tsx:451`).

### Frame writers

`src/log-update.ts` contains two writers. The `incrementalRendering` render option selects one. The default is `false`.

- Standard (`createStandard`): erases the previous frame with `eraseLines(previousLineCount)` and writes the whole frame again (`src/log-update.ts:103`).
- Incremental (`createIncremental`): compares the new frame with the previous one row by row and writes only the rows that changed. The chunks collect in one buffer and are written at the end (`src/log-update.ts:288`).

Within a changed row, `src/line-update.ts` keeps the identical prefix when that is safe. It repaints the whole row when the two rows share no prefix, or when either contains a control character other than SGR. Examples are OSC sequences and tabs. The module segments non-ASCII text by grapheme with `Intl.Segmenter` (`src/line-update.ts:4`).

When a `useCursor()` position is set, the writer moves the cursor from the bottom of the output to that position and shows it (`src/cursor-helpers.ts`).

#### Measured cost

The research document records these figures. They come from one 200-row frame at 120 columns, with one counter changed per update. They were measured with `docs/research/measure-output-bytes.mjs`, run after `packages/core` is built.

| Mode | Bytes per one-counter update |
| --- | --- |
| Default (full frame) | 21,588 |
| `incrementalRendering: true` | 701 |

Running that script on this checkout printed 21,588 bytes for each of five updates in default mode, and 701 bytes for each of five updates with incremental rendering. The initial frame in the same run was 19,987 bytes. The script writes nothing to the repository.

`docs/research/termina-proposal-review.md` records 19,588 and 691 bytes for the same measurement. Those values do not match this script at this commit, so this page uses the figures above.

The research document notes that a cell-level back and front buffer could emit fewer bytes than incremental rendering. That renderer is not built. See [Decisions](/architecture/decisions).

#### Synchronized output and interactive mode

- DEC 2026 (`CSI ? 2026 h` and `CSI ? 2026 l`) wraps the frame, clear, and resize writes when `shouldSynchronize()` is true. That requires stdout to be a TTY and the instance to be interactive (`src/write-synchronized.ts`, `src/ink.tsx`).
- Interactive mode is decided once per instance. The `interactive` option wins. Otherwise the default is `detectTerminalCapabilities(...).interactive` (`resolveInteractiveOption` in `src/ink.tsx`). That is false in CI, with `TERM=dumb`, and when stdout is not a TTY.
- In non-interactive mode, Ink disables ANSI erase sequences, cursor manipulation, synchronized output, resize handling, and kitty keyboard auto-detection. It writes only the final frame, at unmount (the `interactive` option docs in `src/render.ts`).
- On a TTY with `TERM=linux`, the capability probe reports `synchronizedOutput: false`. The renderer does not read that field. It gates on `shouldSynchronize()`, which does not check the terminal name. When the instance is interactive, the Linux console therefore receives DEC 2026 sequences.

#### Static output and alternate screen

- `<Static>` output is written once, above the live frame, and is not redrawn.
- On the primary screen, a full clear erases only the previous frame. Static output is not replayed.
- On the alternate screen, the accumulated static output is replayed ahead of the frame on each full clear. The alternate screen has no scrollback, so anything the clear removes is gone. The write is `homeAndEraseDown + this.fullStaticOutput + outputToRender` (`src/ink.tsx`).

### Alternate screen

- `alternateScreen: true` takes effect only when the instance is interactive and stdout is a TTY (`resolveAlternateScreenOption` in `src/ink.tsx`).
- Entering writes `ansiEscapes.enterAlternativeScreen`, which is DECSET 1049. It then hides the cursor with `CSI ? 25 l` (`src/ink.tsx`, around line 684).
- Full clears use `homeAndEraseDown`, which is an absolute cursor move to row 1, column 1 followed by erase-down (`src/ink.tsx:54-55`). The source comment says that `CSI 2J` makes VS Code and Windows Terminal push the viewport into scrollback, so the fork avoids it.

## Input pipeline

```text
stdin 'readable'
  -> input-parser.ts           tokenizes ESC, CSI, SS3 and bracketed paste into events
  -> App.tsx handleInputEvent  kitty replies, SGR mouse reports, control sequences
  -> parse-keypress.ts         names keys, decodes ctrl, meta and shift
  -> use-input.ts              Key object; paste goes to its own channel (usePaste)
```

### Raw mode and paste ownership

- Raw mode and bracketed paste are reference-counted in `App.tsx` (`rawModeEnabledCountRef` and `bracketedPasteModeEnabledCountRef`). Each component that needs input adds to the count, and the count drops on unmount.
- Suspend releases raw mode, and paste mode too, so a child process owns the terminal. Resume restores the modes that still have an owner.

### Escape timing

- A lone ESC waits `escapeFlushDelayMilliseconds`, which is 40 ms (`src/input-parser.ts:6`). `App.tsx` schedules the flush with that constant (`src/components/App.tsx`).
- The window separates a lone Escape from an escape sequence that is split across reads. If the rest of a sequence arrives inside the window, the input is one key, such as an arrow. If it arrives after the window, the tail is literal text.
- The window is a module constant, not a render option. `test/escape-timing.tsx` asserts that it lies between 25 and 50 ms, and it runs the cases against real timers.
- Upstream used a 20 ms literal inside `App`. This is visible in the fork base commit (`git show edc640a:packages/core/src/components/App.tsx`, line 125). Commit `341159e` moved the value to 40 ms as a constant.

### Other input rules

- Backspace (`0x7F`, `0x08`) and Ctrl+C (`0x03`) inside a chunk of ordinary text are split into single events. A held key that repeats within one read would otherwise corrupt the key state (`src/input-parser.ts`).
- A complete CSI or SS3 sequence that maps to no `Key` is dropped. It is not delivered to `useInput` with the ESC stripped (`handleInputEvent` in `src/components/App.tsx`).
- Bracketed paste: `App.tsx` writes `CSI ? 2004 h` and `CSI ? 2004 l`. A pasted string goes to `usePaste` handlers. When no paste listener is mounted, the text goes to `useInput` as input (`App.tsx`, the `listenerCount('paste')` check).
- SGR mouse reports are parsed and sent only to `useMouse`. They never reach `useInput`. Upstream discarded them (research document, section 3). See [Mouse](/guide/mouse).

### Kitty keyboard protocol

- The protocol is opt-in. Without the `kittyKeyboard` option, Ink does nothing (`src/ink.tsx`).
- Auto-detection requires an interactive instance, a TTY stdin, and a TTY stdout (`src/ink.tsx`).
- Ink writes `CSI ? u` and waits 200 ms for a reply. A reply enables the protocol with `CSI > flags u`. Replies go through `App`'s normal input pipeline, so user input is not read twice (`confirmKittySupport` and `enableKittyProtocol` in `src/ink.tsx`).

### Terminal control sequences

| Sequence | Purpose | Location |
| --- | --- | --- |
| `CSI ? 2026 h` / `l` | Synchronized output (BSU and ESU) | `src/write-synchronized.ts` |
| `CSI ? 1049 h` / `l` | Alternate screen, through `ansi-escapes` | `src/ink.tsx` |
| `CSI ? 25 l` / `h` | Cursor hide and show | `src/cursor-helpers.ts` |
| `CSI ? 2004 h` / `l` | Bracketed paste | `src/components/App.tsx` |
| `CSI ? u` and `CSI > n u` | Kitty keyboard query and enable | `src/ink.tsx` |
| `CSI ? 1000 h`, `1002 h`, `1006 h` and the matching `l` sequences | Mouse tracking (fork) | `src/mouse.ts` |
| `OSC 8` | Hyperlinks (fork helper `hyperlink()`) | `src/hyperlink.ts`; `src/sanitize-ansi.ts` handles OSC tokens |
| `OSC 52` | Clipboard write (fork helper `copyToClipboard()`) | `src/clipboard.ts` |

The probe's source comment notes that unknown private modes are ignored by most terminals. It excludes the Linux console from `synchronizedOutput`, because that console has no documented behavior for these modes. See the note about the renderer in the synchronized output section above.

## Layout and clipping

- `Box` supports `overflow: hidden`, `contentOffsetX` and `contentOffsetY`, and `position: absolute`. `ScrollBox` sets `overflow="hidden"` and `contentOffsetY` on its viewport box (lines 181 and 182). The content box inside the viewport is the child that the offset shifts.
- `measureElement` and `useBoxMetrics` together give a viewport's size and a content's size. A scroll offset is then clamped to `max(0, contentHeight - height)`. `ScrollBox` uses that bound.
- Yoga lays out at the terminal's column count, and text wraps to the width of its box.

## Resize

### Upstream behavior

The research document (section 6) records that upstream clears on a width decrease with `eraseLines(previousLines.length)`. That count is in logical lines, not rows. A terminal reflows wrapped rows before Ink receives the resize event. The erase then falls short, and the rest of the frame stays on screen as ghost copies. Growing the window does not remove the ghosts, because the upstream clear runs only on a decrease.

The research document measured the header line count after each step with `@xterm/headless` 5.5.0:

| Step, from 80 to 40 to 20 to 60 to 100 columns | Upstream `HEADER` count | Fork `HEADER` count |
| --- | --- | --- |
| Initial | 1 | 1 |
| After 40 | 2 | 1 |
| After 20 | 3 | 1 |
| After 60 | 3 | 1 |
| After 100 | 3 | 1 |

### Fork behavior

The following describes `resized` in `packages/core/src/ink.tsx`.

1. The `resize` listener is attached only when the instance is interactive (`src/ink.tsx`, around line 554).
2. The handler reads the new size. While the terminal is suspended, it lays out for the new size and writes nothing. `endSuspend()` forces a full redraw.
3. If synchronized output applies, it writes BSU first.
4. If the width changed and `debug` is off, the frame is erased by the physical rows it now occupies:
   - On the primary screen, `log.clearReflowed(columns)` erases `rowsToErase(previousOutput, columns)` rows (`src/log-update.ts`, `src/reflow.ts`).
   - On the alternate screen, the handler writes `homeAndEraseDown` followed by the accumulated static output, and resets the writer.
5. Otherwise, if the height decreased while a cursor position is set, the writer clears and the rendered frame is forgotten.
6. Layout is recalculated and the frame is rendered. Any throttled repaint is flushed so that it lands inside the synchronized update. Then ESU is written.

Row counting in `src/reflow.ts`:

- `rowsForLine(line, columns)` is `max(1, ceil(stringWidth(line) / columns))`. A line that exactly fills `columns` takes one row. The terminal keeps the cursor in a pending-wrap state until the next newline.
- `rowsToErase(text, columns)` sums the rows of each line. When the frame ends with a newline, the cursor sits on the empty row below it, so one more row is counted.

Screen-reader frames end with a newline (`screenReaderFrame` in `src/ink.tsx`). A cursor left on the last line of a frame can be clamped into that line when the terminal narrows, which would start the reflowed erase one row too high.

### Known gap

When a `useCursor()` position is active, `clearReflowed` falls back to the line-count erase. The source comment says a cursor-relative erase has no reflowed equivalent yet. The research document adds that cursor position after a reflow is not reliably defined across terminals.

### Regression test

`packages/core/test/terminal-resize-reflow.tsx` draws a three-line frame whose middle line wraps below 80 columns. It resizes through 40, 20, 60, and 100 columns, and it counts `HEADER-MARK` occurrences at each step. The research document records that this test fails 3 of 3 runs against the upstream `ink.tsx` and passes on the fork. That run is not repeated here.

## Color output

- Colors go through chalk, which maps them to the level that the terminal supports.
- Raw `38;2` truecolor writes bypass chalk, and the research document says they must be avoided.
- At level 2, chalk maps RGB `(255, 128, 0)` to `38;5;214`. The 6 by 6 by 6 cube formula is `16 + 36r + 6g + b`, with each channel in the range 0 to 5.
- The capability probe applies chalk's supports-color rules, so raw styling and chalk agree. See [Terminal Features](/guide/terminal-features).

## Sources

- `docs/research/ink-architecture.md`, sections 1 to 8.
- `docs/research/measure-output-bytes.mjs`.
- Source: `packages/core/src/ink.tsx`, `log-update.ts`, `line-update.ts`, `reflow.ts`, `output.ts`, `render-node-to-output.ts`, `measure-element.ts`, `input-parser.ts`, `write-synchronized.ts`, `terminal-capabilities.ts`, `mouse.ts`, and `components/App.tsx`.
- Tests: `test/escape-timing.tsx`, `test/terminal-resize-reflow.tsx`, `test/screen-reader.tsx`, and `test/mouse.tsx`.
