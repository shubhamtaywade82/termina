---
outline: [2, 3]
---

# ScrollBox

`ScrollBox` is a fixed-height viewport over content that is taller than the viewport. It clips the content to the viewport, moves it by rows with the arrow keys, PageUp, PageDown, Home, End, and the mouse wheel, and draws a one-column scrollbar at its right edge. Use it for a list, a report, or any view with more rows than fit on screen. For output that grows over time and stays pinned to its newest entry, use [LogStream](/ui/components/log-stream), which is built on `ScrollBox`.

`ScrollBox` and `ScrollBoxProps` are exported from `@nemesis-oss/termina-ui`, the `packages/ui` workspace package in this repository. The package is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Usage

```tsx
import {Text, render} from '@nemesis-oss/termina-core';
import {ScrollBox} from '@nemesis-oss/termina-ui';

const rows = Array.from({length: 100}, (_, index) => `row ${index}`);

function Report() {
	return (
		<ScrollBox height={10}>
			{rows.map(row => (
				<Text key={row}>{row}</Text>
			))}
		</ScrollBox>
	);
}

render(<Report />, {alternateScreen: true});
```

The box owns its offset and starts at the top. It sets no width of its own, so it fills the width its parent gives it, less the one column of the scrollbar when the scrollbar is drawn.

The example does not pass `mouse` to `render()`. The box turns on mouse tracking itself while it is mounted and active. [Mouse](/guide/mouse) describes what tracking changes in the terminal.

## Props

`ScrollBoxProps` is exported from `@nemesis-oss/termina-ui`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `height` | `number` | Required | Viewport height in rows. PageUp and PageDown move by this many rows. |
| `children` | `ReactNode` | `undefined` | Content. It is laid out in a column at its natural height, and the viewport clips it. |
| `offset` | `number` | `undefined` | Controlled scroll offset, in rows from the top of the content. When omitted, the box keeps its own offset, which starts at `0`. The value is clamped to the scroll range on each render. |
| `onScroll` | `(offset: number) => void` | `undefined` | Called with the new offset when a key or wheel step changes it. Not called when a step leaves the offset unchanged, and not called when the offset moves by clamping or by follow tail. |
| `wheelStep` | `number` | `3` | Rows moved by one wheel step. |
| `isActive` | `boolean` | `true` | When `false`, keys and wheel steps are ignored. The box also does not enable raw mode or mouse tracking. |
| `followTail` | `boolean` | `false` | Keeps the box at the bottom while content grows. See Follow tail below. |
| `showScrollbar` | `boolean` | `true` | Draws the scrollbar when the content is taller than the viewport. When `false`, no column is reserved, so the viewport uses the full width. |

## Keyboard

While the box is active, it registers a `useInput` handler. It acts on six keys and ignores the rest.

| Key | Effect |
| --- | --- |
| Up arrow | Scrolls up 1 row. |
| Down arrow | Scrolls down 1 row. |
| PageUp | Scrolls up by `height` rows. |
| PageDown | Scrolls down by `height` rows. |
| Home | Moves to the top, offset `0`. |
| End | Moves to the bottom, the maximum offset. |

Every move is clamped to the scroll range. PageDown on the last page stops at the bottom, and Up at the top does nothing.

Keys are not routed by focus. `useInput` does not consult the focus engine, so every active `ScrollBox` scrolls on the same key, and so does any other active `useInput` handler. Set `isActive={false}` on the boxes that should not respond. The box is not focusable. [Keyboard and Focus](/guide/keyboard-and-focus) covers `useInput` and focus.

## Mouse wheel

The box handles the `wheelUp` and `wheelDown` buttons. Each step moves the offset by `wheelStep` rows. `wheelLeft` and `wheelRight` are ignored.

A wheel step counts only when the pointer is over the visible part of the viewport. The check is the same clip-aware hit test that `<Box onWheel>` uses. The following cells do not scroll the box:

- The scrollbar column. It is a sibling of the viewport, not a part of it.
- Cells that an ancestor with `overflow="hidden"` clips out of view, or that an ancestor's content offset scrolls out of view.
- Cells covered by an element that comes later in the tree and sits over the box, such as a modal.

The hit test assumes the app starts at the terminal's top-left corner. That holds in alternate-screen mode with no `<Static>` output above the app. On the primary screen the live region moves down as output accumulates, and the wheel check can miss its target. See [Alternate Screen and Suspend](/guide/alternate-screen-and-suspend).

## Scrollbar

The scrollbar is one column wide and sits to the right of the viewport. It is as tall as the viewport. It is drawn only when `showScrollbar` is `true` and the content is taller than the viewport. Every row of it is dimmed.

Each row is either the thumb, `█`, or the track, `│`. The thumb size and position come from the content height, the viewport height, and the offset. Let `contentHeight` be the measured content height and `maxOffset` be `contentHeight - height`.

- Thumb size: `max(1, round(height * height / contentHeight))` rows. The thumb is the visible fraction of the content, applied to the length of the track. It is never shorter than one row.
- Thumb top: `round(offset / maxOffset * (height - thumbSize))`. The thumb is at the top at offset `0`, and its last row is the bottom row of the track at `maxOffset`.

Both values are rounded, so the thumb approximates the scroll fraction. For example, with 30 rows in a 5-row viewport the thumb is 1 row. At offset `5` of `25` its top is the second row, and at offset `25` it is the last row. With 6 rows in the same viewport the thumb is 4 rows, `round(25 / 6)`.

The track does not respond to the mouse. Wheel steps over it are ignored, as described above.

## Follow tail

`followTail` keeps the box at the bottom while the content grows. The box starts in the following state when `followTail` is `true` at mount.

- While following, the offset is the maximum offset, so the newest rows stay visible. The `offset` prop is ignored in this state.
- A scroll that leaves the offset short of the maximum releases follow. Up, PageUp, Home, and an upward wheel step all do this.
- A scroll that lands on the maximum offset resumes follow. End does this, and so does a downward step that reaches the bottom.
- If the box is already at the bottom and not following, End and downward input do not change the offset, so they do not resume follow. Scroll up one row and then back down to resume.
- The follow state is set from `followTail` once, at mount. Changing `followTail` after mount does not change the follow state. A box mounted with `followTail={false}` does not pin to the bottom when `followTail` later becomes `true`. Mount the box with the value it needs.
- Growth of the content while following does not call `onScroll`. Only input calls it.

## Controlled and uncontrolled offset

Without `offset`, the box stores its own offset. With `offset`, the box renders the value it is given, clamped to the scroll range. It never changes that value itself. Keys and wheel steps call `onScroll` with the new offset, so the parent must store the value and pass it back:

```tsx
import {useState} from 'react';
import {Text, render} from '@nemesis-oss/termina-core';
import {ScrollBox} from '@nemesis-oss/termina-ui';

const rows = Array.from({length: 40}, (_, index) => `row ${index}`);

function Controlled() {
	const [offset, setOffset] = useState(0);

	return (
		<ScrollBox height={8} offset={offset} onScroll={setOffset}>
			{rows.map(row => (
				<Text key={row}>{row}</Text>
			))}
		</ScrollBox>
	);
}

render(<Controlled />, {alternateScreen: true});
```

If the parent does not update `offset` from `onScroll`, the callback still runs for each step, but the view does not move.

## Edge cases

- **Measured after layout.** The content height comes from a layout measurement. The first render has no measured content, so the offset is `0` and no scrollbar is drawn. When the content overflows, the scrollbar appears on the next layout pass.
- **The scrollbar takes a column.** While the scrollbar is drawn, the viewport is one column narrower. Content that fit at full width can wrap to an extra row when the scrollbar appears.
- **The offset counts rows, not children.** The offset is a row count from the top of the content. If rows above the viewport are removed, the same offset shows different children. [LogStream](/ui/components/log-stream) shows this when `maxLines` trims entries.
- **An inactive box holds no input.** With `isActive={false}`, the box does not enable raw mode, does not enable mouse tracking, and ignores keys and wheel steps.
- **Mouse tracking is on while the box is mounted and active.** Tracking captures the wheel and suppresses native text selection in the terminal. See [Mouse](/guide/mouse).
- **No focus.** A `ScrollBox` does not take focus. Set `isActive={false}` on the boxes that should not react to keys, as described under Keyboard above.

## See also

- [LogStream](/ui/components/log-stream), a tail-following viewer built on `ScrollBox`
- [Mouse](/guide/mouse), for the `onWheel` and tracking behavior the box depends on
- [Keyboard and Focus](/guide/keyboard-and-focus), for `useInput` and `isActive`
- [Layout and Text](/guide/layout-and-text), for how content is sized and wrapped
- [API reference](/api/ui), for the export list
