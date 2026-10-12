---
outline: [2, 3]
---

# LogStream

`LogStream` is a viewer for a list of log entries that grows while the app runs. It shows the newest entry at the bottom and keeps it there as entries arrive. When the user scrolls up, it stops following and holds the view. Scrolling back to the bottom resumes following. Use it for output such as build logs or service logs. For a list that does not grow, use [ScrollBox](/ui/components/scroll-box).

`LogStream` and `LogStreamProps` are exported from `@nemesis-oss/termina-ui`, the `packages/ui` workspace package in this repository. The package is not published to npm yet, so import it from another workspace package. For the full component list, read the [UI Kit overview](/ui/overview).

## Preview

This frame shows three entries in a 6-row viewport, where a newline and a long entry each take a second row.

<TerminalPreview id="log-stream-entries-wrap" />

This frame shows a LogStream with `maxLines` set to 3, so only the newest three of fourteen entries are rendered.

<TerminalPreview id="log-stream-max-lines" />

## Usage

```tsx
import {useEffect, useState} from 'react';
import {Box, Text, render} from '@nemesis-oss/termina-core';
import {LogStream} from '@nemesis-oss/termina-ui';

function Logs() {
	const [lines, setLines] = useState<string[]>([]);

	useEffect(() => {
		let count = 0;
		const timer = setInterval(() => {
			count += 1;
			setLines(previous => [...previous, `tick ${count}`]);
		}, 500);

		return () => {
			clearInterval(timer);
		};
	}, []);

	return (
		<Box flexDirection="column">
			<Text>Up and Down scroll. End returns to the newest entry.</Text>
			<LogStream lines={lines} height={6} />
		</Box>
	);
}

render(<Logs />, {alternateScreen: true});
```

`LogStream` is a `ScrollBox` with `followTail` set, so its keys and wheel steps are the ones described on the [ScrollBox](/ui/components/scroll-box) page.

## Props

`LogStreamProps` is exported from `@nemesis-oss/termina-ui`. `LogStream` takes only these four props.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `lines` | `readonly string[]` | Required | One entry per log record. Each entry is rendered in its own `Text`. An entry may contain newlines, and each newline starts a new row. Entries wrap to the viewport width. |
| `height` | `number` | Required | Viewport height in rows. |
| `maxLines` | `number` | `1000` | Number of newest entries that are rendered. Earlier entries are not rendered. See maxLines below. |
| `isActive` | `boolean` | `true` | Passed to the underlying `ScrollBox`. When `false`, keys and wheel steps are ignored, and the viewer does not enable raw mode or mouse tracking. |

`LogStream` does not accept `children`, `offset`, `onScroll`, `followTail`, `showScrollbar`, or `wheelStep`. To control any of these, use [ScrollBox](/ui/components/scroll-box) with `followTail`.

## Following

The viewer starts pinned to the newest entry. While it is pinned, new entries keep the newest one at the bottom of the viewport.

- Up, PageUp, Home, or an upward wheel step releases the pin. The view then holds its rows while new entries arrive below.
- End, or a downward wheel step that reaches the bottom, re-pins the view.
- If the view is already at the bottom without being pinned, End and downward input do not change the offset, so they do not re-pin. Scroll up one row and back down to re-pin.

The scrollbar is drawn whenever the entries are taller than the viewport. `LogStream` does not pass `showScrollbar`, so the default applies and cannot be changed here.

## Entries

- Each entry is rendered in its own `Text`, so it wraps at the viewport width with the default wrap of `Text`. See [Layout and Text](/guide/layout-and-text).
- A newline inside an entry starts a new row.
- Every rendered entry is laid out on every render, so `maxLines` bounds the cost of each frame.

## maxLines

Only the newest `maxLines` entries are rendered. On each render, `LogStream` takes `lines.slice(-maxLines)` when `lines` is longer than `maxLines`. Earlier entries are not laid out.

- `LogStream` does not change the array you pass. Entries beyond `maxLines` remain in your state. If that array grows without limit, trim it in your own state.
- The value is not validated. `0` keeps every entry, because `slice(-0)` returns the whole array. Pass a positive integer.

## Edge cases

- **A held view is not tied to an entry.** The offset is a row count. When the user has scrolled up and trimming removes entries above the viewport, the same offset shows different entries. In a check with `maxLines={12}` and a held view on entries 5 to 7, one new entry moved the view to entries 6 to 8. `LogStream` has no prop that keeps the same entries in view across trimming. Use a `maxLines` large enough that trimming does not start while the user reads, or build the view on [ScrollBox](/ui/components/scroll-box) with a controlled `offset` that the parent adjusts.
- **A single unbroken string wider than the viewport.** While the scrollbar is drawn, the viewport is one column narrower. In the test renderer at 100 columns, a 100-character string with no spaces rendered 99 characters on its first row and left the second row blank. Entries with spaces wrapped at the spaces as expected.
- **Inactive viewers hold no input.** With `isActive={false}`, the viewer ignores keys and wheel steps and does not enable raw mode or mouse tracking.
- **Mouse tracking is on while mounted and active.** Tracking captures the wheel and suppresses native text selection in the terminal. See [Mouse](/guide/mouse).
- **No focus.** `LogStream` does not take focus, so every active `LogStream` on screen responds to the same keys. Set `isActive={false}` on the viewers that should not respond. See [Keyboard and Focus](/guide/keyboard-and-focus).

## See also

- [ScrollBox](/ui/components/scroll-box), the viewport this component is built on
- [Mouse](/guide/mouse), for wheel handling and mouse tracking
- [Alternate Screen and Suspend](/guide/alternate-screen-and-suspend), for the screen mode most apps use with a viewer
- [API reference](/api/ui), for the export list
