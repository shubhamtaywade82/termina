---
outline: [2, 3]
---

# Rendering

`render()` mounts a React element on an output stream and keeps the output in step with React state. `renderToString()` renders an element to a string and does not write to a stream. This page covers the `render()` options and their defaults, the interactive and non-interactive output modes, frame throttling, the alternate screen, `<Static>` output, and `renderToString()`. For the layout and text components, read [Layout and Text](/guide/layout-and-text).

## render()

```ts
render(node: ReactNode, options?: RenderOptions | Writable): Instance;
```

The second argument is either a `RenderOptions` object or a writable stream. A stream is used as `stdout`, and `stdin` stays `process.stdin`. `Writable` is the class from `node:stream`.

`render()` returns an `Instance`:

| Member | Type | Behavior |
| --- | --- | --- |
| `rerender` | `(node: ReactNode) => void` | Replaces the root element. |
| `unmount` | `() => void` | Unmounts the app, writes the final output, and restores the terminal state. |
| `waitUntilExit` | `() => Promise<unknown>` | Settles when the app unmounts. Resolves with the value passed to `exit()`, or rejects with an `Error` passed to `exit()`. |
| `waitUntilRenderFlush` | `() => Promise<void>` | Settles after the pending output has been written to `stdout`. |
| `cleanup` | `() => void` | Unmounts the app and removes the renderer for this `stdout`, so a later `render()` on the same stream starts a new renderer. |
| `clear` | `() => void` | Erases the frame from the terminal. Does nothing in non-interactive or debug mode. |

Calling `render()` again on a stream that has not been unmounted reuses the existing renderer. The options passed to the second call are ignored, and Ink writes a warning to stderr. Call `unmount()` first.

## RenderOptions

All fields are optional. The `Default` column gives the value used when the field is omitted.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `stdout` | `NodeJS.WritableStream` | `process.stdout` | Stream the app writes to. |
| `stdin` | `NodeJS.ReadableStream` | `process.stdin` | Stream that input is read from. |
| `stderr` | `NodeJS.WritableStream` | `process.stderr` | Stream returned by `useStderr()`. Also receives `console.error` output when `patchConsole` is `true`. |
| `debug` | `boolean` | `false` | Writes each update as a separate frame. See the Debug mode section. |
| `exitOnCtrlC` | `boolean` | `true` | Calls `exit()` on Ctrl+C when input is in raw mode. |
| `patchConsole` | `boolean` | `true` | Routes `console.*` output above the live frame. Ink restores the native console when unmount starts. |
| `onRender` | `(metrics: {renderTime: number}) => void` | Not set | Called after each render pass. `renderTime` is in milliseconds. It does not wait for stream callbacks. |
| `isScreenReaderEnabled` | `boolean` | `process.env['INK_SCREEN_READER'] === 'true'` | Renders for screen readers. See the Screen reader mode section. |
| `maxFps` | `number` | `30` | Limits interactive redraws. See the Frame throttling section. |
| `incrementalRendering` | `boolean` | `false` | Rewrites only the changed parts of a frame. See the Incremental rendering section. |
| `concurrent` | `boolean` | `false` | Uses React's concurrent root. See the Concurrent rendering section. |
| `kittyKeyboard` | `KittyKeyboardOptions` | Not set | Enables the kitty keyboard protocol. See the Kitty keyboard protocol section. |
| `interactive` | `boolean` | `stdout.isTTY === true && TERM !== 'dumb' && !CI` | Forces interactive or non-interactive output. |
| `alternateScreen` | `boolean` | `false` | Renders on the alternate screen buffer. Applies only in interactive mode with a TTY stdout. See the Alternate screen section. |
| `mouse` | `boolean` | `false` | Enables mouse tracking and the `onClick`, `onMouseDown`, `onMouseUp`, and `onWheel` handlers on `Box`. See the Mouse section. |

For the default of `interactive`, CI is detected with the `is-in-ci` package, and the `TERM` check compares the value with `dumb`.

### Kitty keyboard protocol

`kittyKeyboard` is opt-in. Without it, Ink does not send the protocol sequences.

```ts
type KittyKeyboardOptions = {
	mode?: 'auto' | 'enabled' | 'disabled'; // default 'auto'
	flags?: KittyFlagName[]; // default ['disambiguateEscapeCodes']
};
```

| `mode` | Behavior |
| --- | --- |
| `'auto'` | In interactive mode with TTY stdin and stdout, Ink sends a query and enables the protocol if the terminal answers within 200 ms. |
| `'enabled'` | Enables the protocol when stdin and stdout are TTYs, including in CI and non-interactive mode. |
| `'disabled'` | Never enables the protocol. |

The protocol is turned off on unmount. The `flags` values are `disambiguateEscapeCodes`, `reportEventTypes`, `reportAlternateKeys`, `reportAllKeysAsEscapeCodes`, and `reportAssociatedText`. `reportAssociatedText` also enables `reportAllKeysAsEscapeCodes`. Ink accepts the alternate-key sequences but does not expose alternate keys. See [Keyboard and Focus](/guide/keyboard-and-focus).

## Interactive and non-interactive output

The output mode is chosen once, when `render()` creates the renderer. The default is interactive when stdout is a TTY, `TERM` is not `dumb`, and CI is not detected.

### Interactive mode

Ink redraws the frame in place:

- Each redraw erases the previous frame and writes the new one.
- A frame identical to the previous frame, with no cursor change, is not written again.
- Each write is wrapped in synchronized output markers (DEC private mode 2026) when stdout is a TTY. Terminals that support the mode apply each update as one step.
- On resize, Ink erases the frame by the rows it occupies after the terminal reflows it, then redraws it. See [Resize and Reflow](/guide/resize).
- Redraws are throttled by `maxFps`.

### Non-interactive mode

Non-interactive mode writes plain output without terminal control of the frame:

- No erase, cursor-movement, or synchronized output sequences are written.
- Resize handling is not attached.
- Kitty keyboard auto-detection does not run. `kittyKeyboard: {mode: 'enabled'}` still applies.
- `alternateScreen` is ignored.
- `clear()` does nothing.
- `<Static>` output is written when it is rendered.
- The dynamic output is written once, when the app unmounts.
- Console output is written as it is logged.
- Input hooks such as `useInput` receive input from `stdin`, as long as `stdin` supports raw mode. See [Getting Started](/guide/getting-started).

Debug mode writes every update, in interactive mode or not. See the Debug mode section.

### Forcing a mode

`interactive: true` on a stream that is not a TTY makes Ink write cursor-movement and erase sequences to that stream. `alternateScreen` still requires a TTY stdout.

### Frames that fill the terminal

On a TTY, a frame at least as tall as the terminal is treated as full height. Ink clears the viewport before it writes the frame in these cases:

- The previous frame is taller than the terminal.
- The new frame is taller than the terminal, and the previous frame also filled the terminal.
- The frame shrinks from full height to a shorter height.
- The terminal height shrinks while a full-height frame is on screen.
- The app unmounts while a full-height frame is on screen.

When a frame taller than the terminal follows a shorter frame, Ink erases only the previous frame's rows relative to the cursor and then writes the new frame, so output above it scrolls into scrollback. On the alternate screen the viewport is always cleared.

On Windows consoles, every full-height frame takes the full-clear path and writes the whole frame, so incremental rendering does not apply to it. The viewport is erased absolutely only when the previous frame also filled the terminal; otherwise the previous frame's rows are erased relative to the cursor.

## Frame throttling

In interactive mode, renders are limited to one per interval of `ceil(1000 / maxFps)` milliseconds. With the default `maxFps` of `30`, the interval is 34 ms.

A render that does not fall within an interval of the previous write is written at once. Renders that fall within the interval are merged, and the latest output is written when the interval ends. Only positive values of `maxFps` are supported.

Throttling does not apply to `<Static>` output, which is written as soon as it is committed. It also does not apply in debug mode or in screen reader mode, which render every update.

## Incremental rendering

With `incrementalRendering: true`, Ink compares each frame with the previous one line by line and rewrites only the lines that changed. Within a changed line, the leading part that is unchanged is kept on screen when that is safe. This applies to plain text and SGR styling. A line that contains other terminal controls, such as OSC hyperlinks, is rewritten in full.

Frames on the full-clear path, described under Frames that fill the terminal, are always written in full.

Use it for frames that update often while most lines stay the same. It is off by default.

## Debug mode

With `debug: true`, each update writes all accumulated `<Static>` output followed by the current frame. The output is appended below the previous output, and nothing is erased. Updates are not throttled. `patchConsole` has no effect, so `console.*` output is not routed through Ink.

Use it to capture every frame, for example in a log or a test fixture.

## Screen reader mode

With `isScreenReaderEnabled: true`, Ink redraws the frame with these differences from the default:

- Renders are not throttled.
- An update whose wrapped output equals the previous frame, with no new `<Static>` output, writes nothing. Any other update erases the previous frame and writes the new one in full, wrapped to the terminal width.
- Each frame ends on a new row.

Components also change what they render:

- `Box` with `aria-hidden` renders nothing.
- `Box` and `Text` with `aria-label` render the label in place of their children.
- `Transform` renders `accessibilityLabel` in place of its children when it is set. It does not apply its `transform` function.

See the accessibility props in [Layout and Text](/guide/layout-and-text).

## Alternate screen

With `alternateScreen: true`, in interactive mode with a TTY stdout, Ink switches to the alternate screen buffer when the renderer starts and hides the cursor. On unmount it restores the primary buffer and shows the cursor. Output written during teardown is not replayed after the primary buffer returns.

The alternate buffer has no scrollback. Ink keeps the accumulated `<Static>` output in memory and writes it again when the screen is fully cleared, so a full clear does not remove it.

`suspendTerminal()` leaves the alternate screen while a child process runs, and re-enters it when the terminal is returned. See [Alternate Screen and Suspend](/guide/alternate-screen-and-suspend).

## Mouse

With `mouse: true`, Ink enables mouse tracking and routes mouse events to the `onClick`, `onMouseDown`, `onMouseUp`, and `onWheel` handlers on `Box` elements. Tracking is off by default, because it captures the wheel and suppresses native text selection. Ink writes the tracking sequences only when stdout is a TTY.

Hit testing assumes the app starts at the top-left of the terminal. This holds with `alternateScreen` and no `<Static>` output above the app. See [Mouse](/guide/mouse).

## Concurrent rendering

With `concurrent: true`, Ink uses React's concurrent root. Updates are scheduled rather than committed synchronously. Suspense boundaries, `useTransition`, and `useDeferredValue` are available. Use `waitUntilRenderFlush()` to wait until the output of the latest commit has been written.

## Observing renders

`onRender` is called after each render pass that Ink runs, including passes whose output is unchanged. `renderTime` is the time the pass took. The callback does not wait for stream writes. To run code after output is written, use `waitUntilRenderFlush()`.

```tsx
import {Text, render} from '@nemesis-oss/termina-core';

const app = render(<Text>frame</Text>, {
	onRender({renderTime}) {
		process.stderr.write(`render took ${renderTime.toFixed(2)} ms\n`);
	},
});

await app.waitUntilRenderFlush();
app.unmount();
await app.waitUntilExit();
```

## Static output

`<Static>` renders output that is written once and then stays above the live frame. Use it for log lines, completed steps, or other output that does not change after it is written.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `T[]` | Required | Items to render. |
| `style` | `Styles` | `{position: 'absolute', flexDirection: 'column'}` | Style of the container. Accepts the style props of `Box`, plus `textWrap`. A key you pass overrides the default for that key, except `display`: when there is no new item, `display` is `none` whether or not you pass it. |
| `children` | `(item: T, index: number) => ReactNode` | Required | Renders one item. `index` is the item's index in `items`. Give the root element of each item a `key`. |

The behavior is as follows:

- Each item is rendered once. After each commit, only the items added since the previous commit are rendered and written. Changes to items that were already rendered are not written.
- The output is written above the live frame and is not erased by later frames.
- The output is written as soon as it is committed, without throttling.
- When there is no new item, the container has `display: none` and takes no space.
- In non-interactive mode the output is written when it is rendered. See the Interactive and non-interactive output section.

```tsx
import {useEffect, useState} from 'react';
import {Box, Static, Text, render, useApp} from '@nemesis-oss/termina-core';

const steps = ['install', 'compile', 'test'];

const Build = () => {
	const [done, setDone] = useState<string[]>([]);
	const {exit} = useApp();

	useEffect(() => {
		if (done.length < steps.length) {
			const timer = setTimeout(() => {
				setDone(previous => [...previous, steps[previous.length]!]);
			}, 200);

			return () => {
				clearTimeout(timer);
			};
		}

		const timer = setTimeout(exit, 200);

		return () => {
			clearTimeout(timer);
		};
	}, [done, exit]);

	return (
		<Box flexDirection="column">
			<Static items={done}>
				{step => <Text key={step} color="green">{`ok ${step}`}</Text>}
			</Static>
			<Text>
				{done.length < steps.length ? `running ${steps[done.length]}` : 'finished'}
			</Text>
		</Box>
	);
};

const {waitUntilExit} = render(<Build />);

await waitUntilExit();
```

## Alternate screen example

The example fills the terminal and returns to the primary screen on exit. It uses `useWindowSize()` for the height.

```tsx
import {Box, Text, render, useApp, useInput, useWindowSize} from '@nemesis-oss/termina-core';

const Fullscreen = () => {
	const {exit} = useApp();
	const {rows} = useWindowSize();

	useInput(input => {
		if (input === 'q') {
			exit();
		}
	});

	return (
		<Box flexDirection="column" height={rows} borderStyle="round">
			<Text>Alternate screen. Press q to return.</Text>
		</Box>
	);
};

const {waitUntilExit} = render(<Fullscreen />, {alternateScreen: true});

await waitUntilExit();
console.log('back on the primary screen');
```

## renderToString()

```ts
renderToString(node: ReactNode, options?: RenderToStringOptions): string;
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `columns` | `number` | `80` | Width of the virtual terminal in columns. |

`renderToString()` renders synchronously. It does not write to a stream and does not add terminal listeners, so it suits generating documentation, writing output to a file, and tests.

Its behavior differs from `render()` in these ways:

- The terminal hooks (`useInput`, `useStdin`, `useStdout`, `useStderr`, `useApp`, `useFocus`, and `useFocusManager`) return the default values of their contexts. Their methods do nothing. They do not throw.
- `useEffect` runs, but a state update made in it does not change the returned string. A state update made in `useLayoutEffect` is reflected.
- `<Static>` output is placed before the dynamic output.
- A component that throws stops the call. The error is rethrown after the tree is torn down.
- Text must be inside `<Text>`. A string placed directly in a `Box` throws `Text string "..." must be rendered inside <Text> component`.

```tsx
import {Box, Text, renderToString} from '@nemesis-oss/termina-core';

const output = renderToString(
	<Box padding={1}>
		<Text color="green">Hello World</Text>
	</Box>,
	{columns: 40},
);

console.log(output);
```

For testing rendered output in a terminal-like environment, see [Testing](/guide/testing).
