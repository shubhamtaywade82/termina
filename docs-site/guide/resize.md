---
outline: [2, 3]
---

# Resize and Reflow

When the terminal changes size, Ink erases the frame it drew and draws it again at the new size. This page covers which resizes Ink handles, how the previous frame is erased on the primary and alternate screens, how the erase counts rows after the terminal has reflowed them, and the one case where the erase is incomplete. Read it when a frame leaves copies of itself after a width change, or when a component reads the current size with `useWindowSize()`.

For how frames are written in general, see [Rendering](/guide/rendering). For the alternate screen, see [Alternate Screen and Suspend](/guide/alternate-screen-and-suspend).

## Resize events

Ink listens for `resize` on `stdout` only in interactive mode. In non-interactive mode the frame is written once, at unmount, and no resize handling is attached.

The handler runs when the event fires and does not wait for `maxFps`. A pending throttled write is flushed inside the handler, so the redraw is written before the handler returns.

When stdout is a TTY and the renderer is interactive, the erase and the redraw are wrapped in synchronized output markers (DEC private mode 2026). Terminals that support the mode apply them as one step.

## What a resize does

The handler checks the cases below in order. The first case that applies decides the erase. Ink compares the new size with the size it last recorded, which is the size at `render()` or at the previous resize.

| Case | Erase | Redraw |
| --- | --- | --- |
| The terminal is suspended by `suspendTerminal()` | None. Ink writes nothing while suspended. | A full redraw when the suspension resumes. |
| The width changed, and `debug` is not set | The rows the previous frame occupies at the new width. On the alternate screen, the whole viewport. | A full frame. |
| The height decreased, and the last frame was drawn with a `useCursor()` position | What is left of the frame, erased from the cursor position. | A full frame. |
| Anything else | None. | A normal render. A frame that did not change is not written again. |

When the width changed, the height case does not run, even if the height also decreased. In debug mode the width case erases nothing, because debug mode appends each update instead of erasing the previous one.

## Erasing on the primary screen

Terminals reflow soft-wrapped rows when their width changes, before the `resize` event reaches Ink. A three-line frame can occupy five rows after it is narrowed. Erasing by line count would leave the wrapped rows behind as copies of the frame, so Ink erases by physical rows.

`rowsToErase()` in `src/reflow.ts` counts the rows at the new width:

- A line takes `ceil(width / columns)` rows, where `width` is its display width, with a minimum of one. An empty line takes one row.
- A line that exactly fills the width takes one row. The cursor waits in the last column until the next newline, so no extra row is added.
- SGR styling does not count toward the width. Wide characters count as two columns.
- A frame that ends with a newline also counts the empty row below it, where the cursor sits. A frame that does not end with a newline ends on its last physical row.

The count assumes the cursor is where the last write left it. Ink erases upward from that position with `eraseLines`, then draws the frame again in full.

## Erasing on the alternate screen

The alternate screen has no scrollback, and the frame owns the whole viewport. Ink moves the cursor to the top-left corner, erases to the end of the screen, writes the `<Static>` output it kept in memory, and draws the frame. No row count is needed, so the known limitation described under the primary screen, below, does not apply on this screen.

## Height changes

A height change on its own does not clear the screen. What Ink does depends on whether the last frame had a cursor position.

- **The height decreases and a `useCursor()` position is set.** The terminal drops the rows below the cursor, or scrolls the top rows away. Ink erases what is left of the frame and draws it again. Lines above the frame are kept.
- **The height decreases and no cursor position is set.** Ink does not erase on the resize. The render that the resize triggers follows the rules in the Frames that fill the terminal section of [Rendering](/guide/rendering). A frame that still fits is not written again.
- **The height increases.** Ink does not clear the viewport. The frame is redrawn by the normal update path, which erases the previous frame by its line count and writes it again.

## Known limitation: `useCursor()` on the primary screen

When the last frame was drawn with a `useCursor()` position, the reflow erase cannot count physical rows. `clearReflowed()` in `src/log-update.ts` falls back to erasing by logical line count, which is how Ink erased frames before the fork. Rows that wrapped at the new width and fall outside that count stay above the redrawn frame as a partial copy.

Reproduced with the emulator helper that the test suite uses: a frame with a header line, a wrapped paragraph and a footer line, resized from 80 to 40 columns. With no cursor position, the header appears once on screen. With `useCursor()` set, the header appears twice.

The erase is exact when no line of the frame wraps, because the line count and the row count are then equal. The fallback does not apply on the alternate screen.

The test suite has no test that combines a wrapping width change with `useCursor()`. The architecture notes record the reason: the cursor position after a reflow is not reliably defined across terminals. To keep a frame intact across width changes, use `alternateScreen`, or do not set a cursor position on a frame that can wrap.

## Screen reader mode

In screen reader mode the frame is hard-wrapped to the current width on every render and ends on a new row. After a width change, the frame is erased by the same reflow count and drawn again at the new width. `<Static>` output above it stays where it was written and is not replayed.

## `useWindowSize()`

```ts
useWindowSize(): WindowSize;

type WindowSize = {
	readonly columns: number;
	readonly rows: number;
};
```

`WindowSize` is exported as a type from `@nemesis-oss/termina-core`.

- The first value is read from `stdout`. If `stdout.columns` or `stdout.rows` is missing or `0`, Ink uses the `terminal-size` package and then falls back to 80 columns and 24 rows.
- The component re-renders when `stdout` emits `resize`.
- The hook reads the size again when it subscribes, so a resize that happens before the subscription is still reflected.

Layout does not depend on this hook. On every resize Ink lays the tree out again at the new width, so `Box` and `Text` wrap at the new width without reading the size. The hook is for components that need the number itself.

```tsx
import {Box, Text, render, useApp, useInput, useWindowSize} from '@nemesis-oss/termina-core';

const Ruler = () => {
	const {exit} = useApp();
	const {columns, rows} = useWindowSize();

	useInput(input => {
		if (input === 'q') {
			exit();
		}
	});

	return (
		<Box flexDirection="column">
			<Text>{`${columns} x ${rows}, press q to quit`}</Text>
			<Text>{'-'.repeat(columns)}</Text>
		</Box>
	);
};

const {waitUntilExit} = render(<Ruler />);

await waitUntilExit();
```

The rule line fills the full width, so it takes one row at every width. The first line wraps when the terminal is narrow, which shows the reflow erase at work.

## Testing resize behavior

A fake stdout does not reflow. To check what a user would see after a width change, use the emulator helper described in [Testing](/guide/testing). On a fake stdout, `stdout.emit('resize')` after setting `columns` or `rows` runs the same handler, provided the renderer is interactive.
