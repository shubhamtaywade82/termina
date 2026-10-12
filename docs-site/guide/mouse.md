---
outline: [2, 3]
---

# Mouse

Mouse input is off by default. Turn it on with the `mouse` render option to get `onClick`, `onMouseDown`, `onMouseUp`, and `onWheel` on `Box`. Call `useMouse` to receive every raw mouse report instead. Use this page when a component needs clicks, wheel steps, or hit testing against the rendered layout.

Keyboard handling is covered on [Keyboard and Focus](/guide/keyboard-and-focus). Capability detection, which reports whether mouse input is available, is covered on [Terminal Features](/guide/terminal-features).

## Preview

The frame shows the click counter from Enabling mouse before any click, a round-bordered button that reads Clicked 0 times.

<TerminalPreview id="mouse-button-default" />

## Enabling mouse

Pass `mouse: true` to `render()`:

```tsx
import {useState} from 'react';
import {Box, Text, render, useApp, useInput} from '@nemesis-oss/termina-core';

function ClickCounter() {
	const [clicks, setClicks] = useState(0);
	const {exit} = useApp();

	useInput(input => {
		if (input === 'q') {
			exit();
		}
	});

	return (
		<Box flexDirection="column">
			<Box borderStyle="round" paddingX={1} onClick={() => setClicks(count => count + 1)}>
				<Text>Clicked {clicks} times</Text>
			</Box>
			<Text>Press q to quit</Text>
		</Box>
	);
}

render(<ClickCounter />, {mouse: true, alternateScreen: true});
```

This table lists the mouse option of `render()`. The other render options are listed in [API: @nemesis-oss/termina-core](/api/core).

| Option | Type | Default | Description |
|---|---|---|---|
| `mouse` | `boolean` | `false` | Mounts an internal router that hit-tests the rendered tree and calls the `Box` mouse handlers. |

What the option does and does not do:

- The option controls only the `Box` handlers. `useMouse` turns tracking on by itself, so a component that calls it receives reports without the option.
- Tracking asks the terminal for three modes: DEC 1000 (press and release reports), DEC 1002 (drag reports, which are motion while a button is held), and DEC 1006 (SGR encoding, which keeps columns above 223 from overflowing).
- Tracking captures the wheel and suppresses native text selection while it is on. Users cannot select text with the mouse in that state.
- Nothing is written when stdout is not a TTY, so tracking is not requested.
- Tracking is released when the last active `useMouse` unmounts, and when the app unmounts.
- `suspendTerminal()` releases tracking, so a child process does not receive mouse reports. Resuming turns tracking back on for the components that are still mounted. See [Alternate Screen and Suspend](/guide/alternate-screen-and-suspend).

## Box mouse handlers

This table lists the four mouse props on `Box`. `Box` accepts other props, which this page does not cover.

| Prop | Type | Fires |
|---|---|---|
| `onClick` | `(event: MouseEvent) => void` | On a release that completes a click. See [The click rule](#the-click-rule). |
| `onMouseDown` | `(event: MouseEvent) => void` | On a press over the element or one of its descendants. |
| `onMouseUp` | `(event: MouseEvent) => void` | On a release over the element or one of its descendants. |
| `onWheel` | `(event: MouseEvent) => void` | On each wheel step over the element or one of its descendants. |

For a single click, the order is `onMouseDown` on the press, then `onMouseUp` on the release, then `onClick` if the click rule is met. A press with no release fires `onMouseDown` only.

### The click rule

A click is a press and a release that resolve to the same `onClick` target:

1. On press, the dispatcher finds the closest element under the pointer that has an `onClick` handler and remembers it.
2. On release, it finds the closest `onClick` target again.
3. `onClick` fires only when the two are the same element.

Dragging off the element before releasing cancels the click. Two sibling elements do not form a click when the press lands on one and the release lands on the other. A release with no earlier press over an element never clicks.

### Bubbling

Each handler name bubbles on its own. The dispatcher walks from the element under the pointer toward the root and calls the closest element that defines that handler. Ancestors above it are not called. An element without its own handler passes the event up to its ancestor.

```tsx
import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';

function Row() {
	const [selected, setSelected] = useState(false);

	return (
		<Box width={10} height={3} onClick={() => setSelected(value => !value)}>
			<Box width={4} height={1}>
				<Text>{selected ? 'on' : 'off'}</Text>
			</Box>
		</Box>
	);
}
```

A click on the inner `Box` toggles the state once, because the inner `Box` has no `onClick` of its own and the click bubbles to the outer `Box`.

### Wheel

`onWheel` receives wheel steps. `event.button` is one of `'wheelUp'`, `'wheelDown'`, `'wheelLeft'`, or `'wheelRight'`. A step goes to the closest element under the pointer that defines `onWheel`, following the same bubbling rule as the other handlers.

```tsx
import {useState} from 'react';
import {Box, Text, render, type MouseEvent} from '@nemesis-oss/termina-core';

function WheelCounter() {
	const [steps, setSteps] = useState(0);

	const handleWheel = (event: MouseEvent) => {
		if (event.button === 'wheelDown') {
			setSteps(count => count + 1);
		} else if (event.button === 'wheelUp') {
			setSteps(count => count - 1);
		}
	};

	return (
		<Box width={24} height={3} borderStyle="round" onWheel={handleWheel}>
			<Text>Wheel steps: {steps}</Text>
		</Box>
	);
}

render(<WheelCounter />, {mouse: true, alternateScreen: true});
```

## useMouse

`useMouse` calls a handler with every report the app receives.

```tsx
import {useMouse, type MouseEvent} from '@nemesis-oss/termina-core';

useMouse((event: MouseEvent) => {
	if (event.action === 'press' && event.button === 'left') {
		// Left button pressed at event.x, event.y
	}
});
```

Signature: `useMouse(handler: (event: MouseEvent) => void, options?: {isActive?: boolean}): void`

| Option | Type | Default | Description |
|---|---|---|---|
| `isActive` | `boolean` | `true` | When `false`, the hook does not enable tracking and does not listen. |

Behavior:

- The handler receives presses, releases, drags, moves, and wheel steps.
- Box handlers receive presses, releases, and wheel steps only. Drags and moves reach `useMouse` handlers only.
- Mouse reports are never passed to `useInput`.
- `useMouse` also turns raw mode on, so the non-TTY rule from [Keyboard and Focus](/guide/keyboard-and-focus#non-tty-input) applies to it.

### MouseEvent

`MouseEvent` is exported as a type.

| Field | Type | Description |
|---|---|---|
| `action` | `'press' \| 'release' \| 'drag' \| 'move' \| 'wheel'` | What the report describes. |
| `button` | `'left' \| 'middle' \| 'right' \| 'none' \| 'wheelUp' \| 'wheelDown' \| 'wheelLeft' \| 'wheelRight'` | The button, or `'none'` for motion with no button. |
| `x` | `number` | Column, 1-based, as the terminal reports it. |
| `y` | `number` | Row, 1-based, as the terminal reports it. |
| `shift` | `boolean` | Shift was held during the report. |
| `meta` | `boolean` | Meta was held during the report. |
| `ctrl` | `boolean` | Ctrl was held during the report. |

Notes on the reports:

- Only SGR (1006) reports are decoded. Other encodings are not parsed.
- A drag is motion with a button held. Tracking requests DEC 1002, which reports only that kind of motion, so `move` is not expected from the modes the app enables.
- Extra buttons, such as back and forward, are ignored.
- Malformed reports are rejected, including reports with a zero coordinate.

`parseMouseEvent` is exported for decoding a single complete SGR report:

```ts
import {parseMouseEvent} from '@nemesis-oss/termina-core';

parseMouseEvent('\u001B[<0;24;12M');
// {action: 'press', button: 'left', x: 24, y: 12, shift: false, meta: false, ctrl: false}
```

It returns `undefined` for anything else.

## Hit testing

The dispatcher finds the target by walking the rendered tree from the root:

- Children are tested from last to first, so a later sibling is found before an earlier one.
- An element with `display: none` is skipped.
- An element with `overflow: hidden` clips its children to its own box on that axis. Clipping accumulates down the tree.
- `contentOffsetX` and `contentOffsetY` shift the children, so hit targets move with the drawn content.

Clipping decides what can be clicked, not only what is drawn:

```tsx
import {useState} from 'react';
import {Box, Text} from '@nemesis-oss/termina-core';

function ClippedList() {
	const [clicks, setClicks] = useState(0);

	return (
		<Box width={10} height={3} overflow="hidden" flexDirection="column">
			<Box width={10} height={6} flexShrink={0} onClick={() => setClicks(count => count + 1)}>
				<Text>Clicks: {clicks}</Text>
			</Box>
		</Box>
	);
}
```

The child is six rows tall, but the parent shows only three. Clicks on the three clipped rows reach no handler.

Offsets move the hit targets with the content. Take a three-row parent (`height={3}`, `flexDirection="column"`, `contentOffsetY={2}`) that holds four one-row children, each with `flexShrink={0}`. Without `flexShrink={0}`, Box's default `flexShrink` of 1 shrinks the children to fit, and the top visible row reaches the fourth child. With the flexShrink set, the first two children are scrolled off the top, so a click on the top visible row reaches the third child's `onClick`.

### isElementAt

`isElementAt` answers whether a cell lands on an element, using the same test the dispatcher uses:

```ts
import {isElementAt, type DOMElement} from '@nemesis-oss/termina-core';

// isElementAt(element: DOMElement, x: number, y: number): boolean
```

`x` and `y` are 1-based, as the terminal reports them. The result is `true` when the cell lands on `element` or one of its descendants. The test uses the same clip and offset rules as the dispatcher. Layout rectangles alone are not enough for this check: an element inside a clipping ancestor, an element moved out of view by `contentOffset`, and an element covered by something drawn over it, such as a modal, all return `false`.

Get the element from a `ref` on `Box`. Use `useMouse` to see clicks that land outside the element:

```tsx
import {useRef, useState} from 'react';
import {Box, Text, isElementAt, render, useMouse, type DOMElement} from '@nemesis-oss/termina-core';

function Dialog({onClose}: {readonly onClose: () => void}) {
	const ref = useRef<DOMElement>(null);

	useMouse(event => {
		if (event.action !== 'press' || !ref.current) {
			return;
		}

		if (!isElementAt(ref.current, event.x, event.y)) {
			onClose();
		}
	});

	return (
		<Box ref={ref} borderStyle="round" paddingX={1}>
			<Text>Click outside this box to close it</Text>
		</Box>
	);
}

function App() {
	const [open, setOpen] = useState(true);

	return open ? <Dialog onClose={() => setOpen(false)} /> : <Text>Dialog closed.</Text>;
}

render(<App />, {alternateScreen: true});
```

## Coordinates and the primary screen

Hit testing assumes the app starts at the terminal's top-left corner. That holds in alternate-screen mode when no `<Static>` output sits above the app. Pass `alternateScreen: true` to `render()` for an app that uses mouse hit testing. The option takes effect only in interactive mode.

On the primary screen the live region moves down as output accumulates above it. The hit test does not account for that offset, so a click can land on the wrong element. This is the case the `mouse` option's own documentation warns about.

## Terminal support

`detectTerminalCapabilities()` reports `mouse` as `true` when the stream is an interactive terminal, using the same rule that governs the alternate screen. See [Terminal Features](/guide/terminal-features#detectterminalcapabilities).

## ScrollBox

`ScrollBox` in the UI kit calls `useMouse` for its wheel handling. It applies the same clip-aware hit test as `Box` `onWheel`, so a box that is scrolled or clipped out of view ignores the wheel. See [ScrollBox](/ui/components/scroll-box).

## Related

- [Keyboard and Focus](/guide/keyboard-and-focus) for `useInput`, `usePaste`, and focus.
- [Layout and Text](/guide/layout-and-text) for the layout that hit testing reads.
- [Alternate Screen and Suspend](/guide/alternate-screen-and-suspend) for how tracking behaves across `suspendTerminal()`.
- [Terminal Features](/guide/terminal-features) for capability detection.
- [API: @nemesis-oss/termina-core](/api/core) for the full export list.
