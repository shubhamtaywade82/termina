---
outline: [2, 3]
---

# Fork Provenance

termina is one pnpm workspace with two packages. Each is a fork of an upstream project: `packages/core` forks Ink 8.0.0, and `packages/ui` forks ink-ui 2.0.0. This page records the upstream sources, the local changes in each package, the deviations from the original plan, the test dependencies, and the license notices. Read it when you need to tell whether a behavior comes from upstream or from the fork, when you re-sync with upstream, or when you check license obligations.

The record for this page is `FORK.md` at the repository root. Each file path and behavior below was checked against the source and tests at HEAD.

## Packages and names

| Workspace path | Manifest name | Name used in these docs | Upstream | Manifest version |
| --- | --- | --- | --- | --- |
| `packages/core` | `@nemesis-oss/termina-core` | `@nemesis-oss/termina-core` | vadimdemedes/ink 8.0.0 | 0.2.0 |
| `packages/ui` | `@nemesis-oss/termina-ui` | `@nemesis-oss/termina-ui` | vadimdemedes/ink-ui 2.0.0 | 0.2.0 |

Both manifests set `"private": false`, and both packages are published to npm. The publish workflow (`.github/workflows/publish.yml`) releases them when a `v*` tag is pushed.

`FORK.md` says the packages were developed as `@fork/core` and `@fork/ui` and publish as `@nemesis-oss/termina-core` and `@nemesis-oss/termina-ui`. The import specifiers in `examples/turnstream` use the `@nemesis-oss` names. This documentation site uses `@nemesis-oss/termina-core` and `@nemesis-oss/termina-ui` for the same packages. The manifests and the example show what a workspace import resolves to.

## Upstream sources

| Fork path | Upstream repository | Commit recorded in `FORK.md` | Upstream version | License file |
| --- | --- | --- | --- | --- |
| `packages/core` | https://github.com/vadimdemedes/ink | `26d2c3f83008142061c22267482489588cc3823c` | 8.0.0 | `packages/core/LICENSE` (MIT) |
| `packages/ui` | https://github.com/vadimdemedes/ink-ui | `14b1145da0123a48cfc2f0ec9ff33dff0633f464` | 2.0.0 | `packages/ui/LICENSE` (MIT) |

The commit hashes are as `FORK.md` records them. This repository holds no upstream history, and the upstream repositories were not reachable from the environment where this page was checked, so the hashes are not verified here.

### How the upstream code was imported

`FORK.md` records the import. The upstream repositories were shallow-cloned. Their `src/`, `source/` (ui), and `test/` directories were copied in, along with the `examples/` subset that the engine tests import. Upstream history was not carried over. Re-syncing means diffing against the commits in the table above.

The import and the first local change are one commit. `edc640a` ("Fork ink 8.0.0 into packages/core with reflow-aware resize erase") adds 356 files. Those include the copied upstream source and the new `packages/core/src/reflow.ts`, along with the changes to `log-update.ts` and `ink.tsx`. Git history alone does not separate upstream code from local edits. Use the commits in the table above as the baseline for any diff.

## Fork history

Commits that change code, oldest first, with their subjects as `git log` records them. The first eleven rows are dated 2026-10-11.

| Commit | Subject |
| --- | --- |
| `edc640a` | Fork ink 8.0.0 into packages/core with reflow-aware resize erase |
| `0b39c69` | Add ui components, editing fixes, mouse and terminal features, turnstream example |
| `2eee3bd` | Add Box mouse handlers, opt-in mouse routing, and clickable TurnStream |
| `66b4de9` | Remove stray test logs committed with the previous change |
| `52cdc15` | Wait for the throttled render in the layout measurement test |
| `341159e` | Move the lone-ESC flush window to 40 ms and pin it with timing tests |
| `5214fbe` | Ignore extra mouse buttons, honor FORCE_COLOR levels, and export isElementAt |
| `a98ab55` | Route ScrollBox wheel events through the clip-aware hit test |
| `017db6c` | Mask PasswordInput one asterisk per grapheme cluster |
| `9d8b4c7` | Add cell, line and key accessors to the xterm fixture and cover exit and frame sync |
| `0b8bf02` | Correct the architecture notes and commit the byte measurement script |
| `d62e89a` | Rename packages to @nemesis-oss/termina-core and @nemesis-oss/termina-ui (2026-10-12) |

## Local changes in `@nemesis-oss/termina-core`

These are the changes listed in `FORK.md`, with the files checked against the source.

### Reflow-aware resize erase

- Files: `packages/core/src/reflow.ts` (new), `src/log-update.ts` (`clearReflowed`), `src/ink.tsx` (`resized`, `eraseReflowedFrame`, `forgetRenderedFrame`).
- The erase counts the physical rows that the frame occupies at the new width (`rowsToErase`), not logical lines.
- Writes are suppressed while suspended. The handler lays out for the new size and writes nothing, and `endSuspend()` forces a full redraw.
- Screen-reader frames end on a fresh row, so the cursor is off the frame content when the terminal narrows.
- Known gap: when a `useCursor()` position is active, `clearReflowed` falls back to the line-count erase. The source comment says a cursor-relative erase has no reflowed equivalent yet.

See [Resize](/guide/resize) for behavior and [Ink Internals](/architecture/ink-internals) for the erase path.

### Mouse protocol

Files named in `FORK.md`:

- `src/mouse.ts`: the SGR parser and the enable and disable sequences.
- `src/hooks/use-mouse.ts`: `useMouse`.
- `src/components/App.tsx`: reference-counted tracking, disabled on suspend, re-enabled on resume while the count is above zero, and released on unmount.
- `src/components/StdinContext.ts`: `setMouseTracking`.

Files that `FORK.md` does not name. Commits `2eee3bd` and `5214fbe` changed these:

- `src/mouse-dispatch.ts`: `MouseDispatcher` and `isElementAt`.
- `src/components/MouseRouter.tsx`.
- `src/components/Box.tsx`: the `onClick`, `onMouseDown`, `onMouseUp`, and `onWheel` props.
- `src/render.ts`: the `mouse` render option.
- `src/reconciler.ts` and `src/dom.ts`: storage of handlers on DOM nodes.
- `src/index.ts`: the exports.

Tracking enables DEC 1000, 1002, and 1006 (`CSI ? 1000 h`, `CSI ? 1002 h`, `CSI ? 1006 h`). Disabling sends the same modes in reverse order. Mouse reports go only to `useMouse`. They never reach `useInput`.

See [Mouse](/guide/mouse) for how to use the mouse props.

### OSC 8 hyperlinks

- File: `src/hyperlink.ts`. Export: `hyperlink(url, label)`.
- Throws `RangeError` when the URL is empty or contains a control character. The source comment gives the reason: a control character would end the OSC early or start a new sequence.
- The label may carry SGR styling. Layout measures its visible width, because OSC 8 has zero width.

### OSC 52 clipboard

- File: `src/clipboard.ts`. Exports: `clipboardSequence(text)` and `copyToClipboard(text, stream)`.
- `clipboardSequence` throws `RangeError` when the base64 payload is longer than 74,000 characters.
- `copyToClipboard` writes nothing and returns `false` when the stream is not a TTY. Its default stream is `process.stdout`.

### Capability probe

- File: `src/terminal-capabilities.ts`. Export: `detectTerminalCapabilities(environment, stream, inCi?)`.
- The probe reads `FORCE_COLOR`, `NO_COLOR`, `TERM`, `COLORTERM`, the CI flag, and the TTY state. It returns `interactive`, `colorLevel`, `synchronizedOutput`, `alternateScreen`, `mouse`, and `hyperlinks`.
- The color level follows chalk's supports-color rules, so raw styling and chalk agree.
- `render()` reads only the `interactive` field (`resolveInteractiveOption` in `src/ink.tsx`). A `TERM=dumb` value, a CI environment, or a non-TTY stdout makes the default non-interactive. The other fields are returned to callers. The renderer does not read them.

See [Terminal Features](/guide/terminal-features).

## Local changes in `@nemesis-oss/termina-ui`

### Grapheme-aware text editing

- Shared module: `packages/ui/source/lib/grapheme.ts`, built on `Intl.Segmenter`. It exports `sanitizeInsertedText`, `previousBoundary`, `nextBoundary`, `splitFirstGrapheme`, and `graphemes`.
- The editing state of `components/text-input` and `components/password-input` uses this module.
- Behavior per `FORK.md`: the cursor and deletion move by grapheme cluster; forward Delete is supported; Backspace at position 0 does nothing; Ctrl and Meta chords do not insert text (`use-text-input.ts`, `use-password-input.ts`); pasted control characters are removed.
- `PasswordInput` shows one asterisk per grapheme cluster (commit `017db6c`).
- Test: `packages/ui/test/text-input-editing.tsx`, eight cases.

See [TextInput](/ui/components/text-input) and [PasswordInput](/ui/components/password-input).

### ScrollBox

- File: `packages/ui/source/components/scroll-box/scroll-box.tsx`.
- A fixed-height viewport. Up and Down move one row, PageUp and PageDown move one viewport, and Home and End jump to the edges. The mouse wheel moves `wheelStep` rows inside the viewport.
- Wheel events are hit-tested against the viewport with `isElementAt` (commit `a98ab55`).
- The offset is clamped to `max(0, contentHeight - height)`. Each change moves from a latest-offset ref, so a burst of events does not act on stale state.

See [ScrollBox](/ui/components/scroll-box).

### LogStream

- File: `packages/ui/source/components/log-stream/log-stream.tsx`.
- Wraps `ScrollBox` with `followTail` set. Before layout, it keeps only the newest `maxLines` entries.

See [LogStream](/ui/components/log-stream).

### Theme and dependency changes

- Thirty-eight components have a `theme.ts` file. `ScrollBox` and `LogStream` do not.
- `packages/ui/source/theme.tsx` exports `ThemeProvider`, `extendTheme`, and `useComponentTheme`.
- Upstream ink-ui peers on `ink` (`>=5`), according to the research document. The fork's `packages/ui/package.json` instead depends on `@nemesis-oss/termina-core` through the workspace and peers on `react` (`>=19.3.0`).

See [Theming](/ui/theming).

## Deviations from the original plan

`FORK.md` lists these deviations. The middle column is the plan or the upstream baseline that the fork departs from.

| Area | Plan or upstream baseline | What the fork does |
| --- | --- | --- |
| Test runner | Jest, per `FORK.md`. The ui tests imported ava at the fork base `edc640a`. | Node's built-in `node:test` with `tsx`. "Switching would add a transform layer for every test file." The ui tests moved from ava to `node:test` in `0b39c69`. |
| Node version | Node 18 | Node 22 or newer. Ink 8 requires it. |
| Screen-reader output | Upstream output bytes | A newline follows each screen-reader frame. This keeps the cursor off frame content when the terminal narrows. Three byte-exact tests in `test/screen-reader.tsx` were updated to match. |
| Resize test in `test/render.tsx` | Reducer-based model | Runs on `@xterm/headless`, because the reducer does not model column reflow. |
| Known-bug markers | `test.failing` in `packages/ui/test/alert.tsx` and `status-message.tsx`, present at `edc640a` | Converted to ordinary tests in `0b39c69`, because their bodies pass on this base. The markers are absent from `packages/ui` at HEAD. |
| Cell-level renderer | A back and front buffer renderer | Not built. Incremental rendering is the measured fix, and it is already in upstream. See [Decisions](/architecture/decisions). |
| Components not built | Multi-line text editor, Modal with focus trap, SplitPane, spatial focus wired to `useFocus`, OSC 8 and OSC 52 helpers as Ink components | Modal and SplitPane are built. Spatial focus and the OSC helpers as components are not. The pure spatial geometry helper was removed in `cae5ff6`, because nothing called it. `MultilineTextInput`, `DataTable` and `Tabs` are built, and `Dialog` has no focus trap. `hyperlink()` and `copyToClipboard()` exist as functions in `@nemesis-oss/termina-core`. |

The xterm test fixture is `packages/core/test/helpers/xterm-terminal.ts`. It provides `getLine`, `cellAt`, `cells`, and `emitKey`. It has no `getFocusedId`. Tests read focus with a probe component (`packages/core/test/xterm-fixture.tsx`).

## Test dependencies

`FORK.md` lists the test dependencies that the fork added. The manifests declare them as caret ranges. `pnpm-lock.yaml` is committed and pins the resolved versions. Upstream commits no lockfile.

| Package | Declared in | Range |
| --- | --- | --- |
| `@xterm/headless` | `packages/core` devDependencies | `^5.5.0` |
| `node-pty` | `packages/core` devDependencies | `^1.2.0-beta.12` |
| `delay` | `packages/core` and `packages/ui` devDependencies | `^7.0.0` |
| `boxen` | `packages/core` and `packages/ui` devDependencies | `^9.0.0` |
| `cat-names` | `packages/ui` devDependencies | `^4.0.0` |
| `p-queue` | `packages/core` devDependencies | `^9.3.3` |
| `ms` | `packages/core` devDependencies | `^2.1.3` |
| `@faker-js/faker` | `packages/core` devDependencies | `^10.6.0` |

`@xterm/headless` is the reflowing emulator that the resize tests use. `node-pty` provides real pseudo-terminal fixtures.

## License notices

Both packages are licensed under the MIT License. Both manifests declare `"license": "MIT"`.

- `packages/core/LICENSE` carries two copyright lines: Vadym Demedes and Sindre Sorhus.
- `packages/ui/LICENSE` carries one copyright line: Vadym Demedes.
- Each file is the upstream MIT text. Neither file adds a copyright line for the fork's own changes. Both manifests name Shubham Taywade as author.
- The repository root has no LICENSE file, and the root `package.json` has no license field.

The MIT terms require that the copyright notice and the permission text be included in all copies or substantial portions of the software. Keep each package's LICENSE file with that package when you copy any part of it.
