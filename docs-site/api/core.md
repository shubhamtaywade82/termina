---
outline: [2, 3]
---

# @nemesis-oss/termina-core

`@nemesis-oss/termina-core` is the terminal renderer. It is a fork of Ink 8.0.0: a React reconciler (react-reconciler 0.34) with a Yoga layout engine and a terminal output layer. Use it to render a React tree to a terminal, read keys and mouse reports, manage focus, measure layout, and control the terminal. For the component kit built on top of it, see [@nemesis-oss/termina-ui](/api/ui).

`@nemesis-oss/termina-core` is published to npm from `packages/core`. Install it with `npm install @nemesis-oss/termina-core react`.

This page lists every export of the package entry (`packages/core/src/index.ts`), grouped by area. Each entry gives its TypeScript signature, a one-line description, and the guide page that explains it. Signatures and defaults come from the source. The upstream Ink readme describes upstream behavior. Where it differs from the fork, this page follows the source.

## Rendering

### render()

```ts
function render(node: ReactNode, options?: Writable | RenderOptions): Instance;
```

Mounts `node` and renders it to `stdout`. `Writable` is the Node.js stream type from `node:stream`.

Passing a stream as `options` is shorthand for `{stdout: stream}`. Stdin stays `process.stdin`.

If the same stdout already has a live instance, `render()` returns that instance and renders `node` into it. It writes a warning to `process.stderr` and ignores the new options. Call `unmount()` or `cleanup()` first to change options.

```tsx
import {Box, Text, render, useApp, useInput} from '@nemesis-oss/termina-core';

function Menu() {
	const {exit} = useApp();

	useInput(input => {
		if (input === 'q') {
			exit();
		}
	});

	return (
		<Box borderStyle="round" paddingX={1}>
			<Text color="green">Press q to quit</Text>
		</Box>
	);
}

const app = render(<Menu />);
await app.waitUntilExit();
```

See [Rendering](/guide/rendering).

### Instance

```ts
type Instance = {
	rerender: (node: ReactNode) => void;
	unmount: (error?: Error | number | null) => void;
	waitUntilExit: () => Promise<unknown>;
	waitUntilRenderFlush: () => Promise<void>;
	cleanup: () => void;
	clear: () => void;
};
```

The object returned by `render()`.

- `rerender(node)` replaces the root node, or updates the props of the current root.
- `unmount()` unmounts the app. The declared type accepts an optional error argument, but the `unmount` that `render()` returns does not pass it on. Call it with no arguments.
- `waitUntilExit()` resolves with the value given to `exit(value)`, and with `undefined` after `exit()`. It rejects with the error given to `exit(error)`.
- `waitUntilRenderFlush()` resolves after pending output has been written to stdout.
- `clear()` erases the rendered output. It does nothing when the app is not interactive or when `debug` is set.
- `cleanup()` unmounts the app and removes the instance for this stdout. The next `render()` on that stream creates a new instance.

See [Rendering](/guide/rendering) and [Getting Started](/guide/getting-started).

### RenderOptions

```ts
type RenderOptions = {
	stdout?: NodeJS.WritableStream;
	stdin?: NodeJS.ReadableStream;
	stderr?: NodeJS.WritableStream;
	debug?: boolean;
	exitOnCtrlC?: boolean;
	patchConsole?: boolean;
	onRender?: (metrics: RenderMetrics) => void;
	isScreenReaderEnabled?: boolean;
	maxFps?: number;
	incrementalRendering?: boolean;
	concurrent?: boolean;
	kittyKeyboard?: KittyKeyboardOptions;
	interactive?: boolean;
	alternateScreen?: boolean;
	mouse?: boolean;
};
```

Options for `render()`. `RenderMetrics` is `{renderTime: number}`, the time spent rendering in milliseconds. It is the parameter type of `onRender` and is not exported from the entry point.

| Option | Type | Default | Description |
|---|---|---|---|
| `stdout` | `NodeJS.WritableStream` | `process.stdout` | Stream the app renders to. |
| `stdin` | `NodeJS.ReadableStream` | `process.stdin` | Stream the app reads input from. |
| `stderr` | `NodeJS.WritableStream` | `process.stderr` | Error stream. |
| `debug` | `boolean` | `false` | Writes each update as separate output instead of replacing the previous one. |
| `exitOnCtrlC` | `boolean` | `true` | Exits the app on Ctrl+C. When `false`, Ctrl+C reaches `useInput` handlers. |
| `patchConsole` | `boolean` | `true` | Routes `console.*` output above the app so it does not mix with the frame. |
| `onRender` | `(metrics: RenderMetrics) => void` | none | Called after each render with its render time. It does not wait for stream flushes; use `waitUntilRenderFlush()` for that. |
| `isScreenReaderEnabled` | `boolean` | `process.env.INK_SCREEN_READER === 'true'` | Enables screen reader mode. Frame throttling is off in this mode. |
| `maxFps` | `number` | `30` | Caps renders at one per `Math.ceil(1000 / maxFps)` ms. Values of `0` or less are not a supported way to turn throttling off. |
| `incrementalRendering` | `boolean` | `false` | Redraws only the lines that changed. |
| `concurrent` | `boolean` | `false` | Uses React concurrent rendering. Reusing the same stdout without calling `unmount()` first is unsupported. |
| `kittyKeyboard` | `KittyKeyboardOptions` | none | Enables the kitty keyboard protocol. When omitted, no protocol query or flags are sent. |
| `interactive` | `boolean` | detected | Detected as `true` only when stdout is a TTY, `TERM` is not `dumb`, and CI is not detected. |
| `alternateScreen` | `boolean` | `false` | Renders on the alternate screen and restores the primary screen on exit. Takes effect only when the app is interactive and stdout is a TTY. |
| `mouse` | `boolean` | `false` | Routes mouse reports to the `onClick`, `onMouseDown`, `onMouseUp` and `onWheel` props of `Box`. |

See [Rendering](/guide/rendering) for the modes these options select.

### renderToString()

```ts
function renderToString(node: ReactNode, options?: RenderToStringOptions): string;
```

Renders `node` synchronously to a string. It does not write to a stream, read input, or add listeners.

```ts
type RenderToStringOptions = {
	columns?: number; // default 80
};
```

- `columns` is the width of the virtual terminal.
- The result is the `<Static>` output followed by the dynamic output.
- Terminal hooks return their default values. `useStdin` reports `isRawModeSupported: false` with a no-op `setRawMode`. `useStdout` and `useStderr` return no-op `write` functions. `useApp().exit` does nothing. These hooks do not throw, and they do not behave as they do in a live terminal.
- `useEffect` callbacks run, but state updates they make do not change the output. State updates made in `useLayoutEffect` are reflected in the output.
- If a component throws, the first error is rethrown after the tree is unmounted.

```tsx
import {Box, Text, renderToString} from '@nemesis-oss/termina-core';

const output = renderToString(
	<Box padding={1}>
		<Text color="green">Hello</Text>
	</Box>,
	{columns: 40},
);

console.log(output);
```

See [Rendering](/guide/rendering).

## Components

### Box

```ts
const Box: ForwardRefExoticComponent<PropsWithChildren<BoxProps> & RefAttributes<DOMElement>>;
```

A flex container. `flexDirection` defaults to `'row'` and `flexWrap` defaults to `'nowrap'`.

`BoxProps` is every style prop of the internal `Styles` type except `textWrap`, plus the accessibility and mouse props below. `children` is accepted. `ref` receives the element's `DOMElement`, which is the input to the measurement helpers.

| Prop | Type | Default |
|---|---|---|
| `position` | `'absolute' \| 'relative' \| 'static'` | |
| `top` | `number \| string` | |
| `right` | `number \| string` | |
| `bottom` | `number \| string` | |
| `left` | `number \| string` | |
| `columnGap` | `number` | |
| `rowGap` | `number` | |
| `gap` | `number` | |
| `margin` | `number` | |
| `marginX` | `number` | |
| `marginY` | `number` | |
| `marginTop` | `number` | |
| `marginBottom` | `number` | |
| `marginLeft` | `number` | |
| `marginRight` | `number` | |
| `padding` | `number` | |
| `paddingX` | `number` | |
| `paddingY` | `number` | |
| `paddingTop` | `number` | |
| `paddingBottom` | `number` | |
| `paddingLeft` | `number` | |
| `paddingRight` | `number` | |
| `flexGrow` | `number` | `0` |
| `flexShrink` | `number` | `1` |
| `flexDirection` | `'row' \| 'column' \| 'row-reverse' \| 'column-reverse'` | `'row'` |
| `flexBasis` | `number \| string` | |
| `flexWrap` | `'nowrap' \| 'wrap' \| 'wrap-reverse'` | `'nowrap'` |
| `alignItems` | `'flex-start' \| 'center' \| 'flex-end' \| 'stretch' \| 'baseline'` | |
| `alignSelf` | `'flex-start' \| 'center' \| 'flex-end' \| 'auto' \| 'stretch' \| 'baseline'` | |
| `alignContent` | `'flex-start' \| 'flex-end' \| 'center' \| 'stretch' \| 'space-between' \| 'space-around' \| 'space-evenly'` | |
| `justifyContent` | `'flex-start' \| 'flex-end' \| 'space-between' \| 'space-around' \| 'space-evenly' \| 'center'` | |
| `width` | `number \| string` | |
| `height` | `number \| string` | |
| `minWidth` | `number` | |
| `minHeight` | `number \| string` | |
| `maxWidth` | `number` | |
| `maxHeight` | `number \| string` | |
| `aspectRatio` | `number` | |
| `display` | `'flex' \| 'none'` | |
| `borderStyle` | `keyof Boxes \| BoxStyle` | none |
| `borderTop` | `boolean` | `true` |
| `borderBottom` | `boolean` | `true` |
| `borderLeft` | `boolean` | `true` |
| `borderRight` | `boolean` | `true` |
| `borderColor` | `LiteralUnion<ForegroundColorName, string>` | |
| `borderTopColor` | `LiteralUnion<ForegroundColorName, string>` | |
| `borderBottomColor` | `LiteralUnion<ForegroundColorName, string>` | |
| `borderLeftColor` | `LiteralUnion<ForegroundColorName, string>` | |
| `borderRightColor` | `LiteralUnion<ForegroundColorName, string>` | |
| `borderDimColor` | `boolean` | `false` |
| `borderTopDimColor` | `boolean` | `false` |
| `borderBottomDimColor` | `boolean` | `false` |
| `borderLeftDimColor` | `boolean` | `false` |
| `borderRightDimColor` | `boolean` | `false` |
| `borderBackgroundColor` | `LiteralUnion<ForegroundColorName, string>` | |
| `borderTopBackgroundColor` | `LiteralUnion<ForegroundColorName, string>` | |
| `borderBottomBackgroundColor` | `LiteralUnion<ForegroundColorName, string>` | |
| `borderLeftBackgroundColor` | `LiteralUnion<ForegroundColorName, string>` | |
| `borderRightBackgroundColor` | `LiteralUnion<ForegroundColorName, string>` | |
| `overflow` | `'visible' \| 'hidden'` | `'visible'` |
| `overflowX` | `'visible' \| 'hidden'` | `'visible'` |
| `overflowY` | `'visible' \| 'hidden'` | `'visible'` |
| `contentOffsetX` | `number` | `0` |
| `contentOffsetY` | `number` | `0` |
| `backgroundColor` | `LiteralUnion<ForegroundColorName, string>` | none; children inherit it |
| `aria-label` | `string` | |
| `aria-hidden` | `boolean` | |
| `aria-role` | `'button' \| 'checkbox' \| 'combobox' \| 'list' \| 'listbox' \| 'listitem' \| 'menu' \| 'menuitem' \| 'option' \| 'progressbar' \| 'radio' \| 'radiogroup' \| 'tab' \| 'tablist' \| 'table' \| 'textbox' \| 'timer' \| 'toolbar'` | |
| `aria-state` | `{busy?, checked?, disabled?, expanded?, multiline?, multiselectable?, readonly?, required?, selected?: boolean}` | |
| `onClick` | `(event: MouseEvent) => void` | |
| `onMouseDown` | `(event: MouseEvent) => void` | |
| `onMouseUp` | `(event: MouseEvent) => void` | |
| `onWheel` | `(event: MouseEvent) => void` | |

Notes on the table:

- `borderStyle` takes a key of cli-boxes' `Boxes` or a `BoxStyle` object. Without it, no border is drawn. The `border*` side props only remove sides from a border that `borderStyle` has drawn.
- Color props accept the values described under [Text](#text).
- `overflow`, `overflowX` and `overflowY` clip children when set to `'hidden'`. Combine `overflow` with `contentOffsetX` or `contentOffsetY` to build scrollable views.
- When screen reader mode is on, `aria-hidden` makes the `Box` render nothing, and `aria-label` replaces its children with the label text.
- The mouse props are described in the [Mouse](#mouse) section.

See [Layout and Text](/guide/layout-and-text).

### Text

```ts
function Text(props: TextProps): ReactNode;
```

Renders text with color and text attributes. `Text` is a function component and does not forward a `ref`.

```ts
type TextProps = {
	'aria-label'?: string;
	'aria-hidden'?: boolean;
	color?: LiteralUnion<ForegroundColorName, string>;
	backgroundColor?: LiteralUnion<ForegroundColorName, string>;
	dimColor?: boolean;
	bold?: boolean;
	italic?: boolean;
	underline?: boolean;
	strikethrough?: boolean;
	inverse?: boolean;
	wrap?: 'wrap' | 'hard' | 'truncate-end' | 'truncate' | 'truncate-middle' | 'truncate-start';
	children?: ReactNode;
};
```

| Prop | Type | Default |
|---|---|---|
| `aria-label` | `string` | |
| `aria-hidden` | `boolean` | `false` |
| `color` | `LiteralUnion<ForegroundColorName, string>` | |
| `backgroundColor` | `LiteralUnion<ForegroundColorName, string>` | inherited from the nearest parent `Text` or `Box` |
| `dimColor` | `boolean` | `false` |
| `bold` | `boolean` | `false` |
| `italic` | `boolean` | `false` |
| `underline` | `boolean` | `false` |
| `strikethrough` | `boolean` | `false` |
| `inverse` | `boolean` | `false` |
| `wrap` | `'wrap' \| 'hard' \| 'truncate-end' \| 'truncate' \| 'truncate-middle' \| 'truncate-start'` | `'wrap'` |
| `children` | `ReactNode` | |

- `color` and `backgroundColor` accept a chalk color name such as `'green'`, a hex string such as `'#ff8800'`, `'ansi256(n)'`, or `'rgb(r, g, b)'`. Any other string is ignored and the text keeps its default color.
- `wrap: 'wrap'` wraps at word boundaries and breaks words that are wider than the line. `'hard'` fills each line to the full width and breaks words without word wrapping. `'truncate'` and `'truncate-end'` keep one line and cut off the end. `'truncate-middle'` and `'truncate-start'` cut from the middle and the start.
- When screen reader mode is on, a non-empty `aria-label` replaces the children, and `aria-hidden` removes the text.

See [Layout and Text](/guide/layout-and-text).

### Static

```ts
function Static<T>(props: StaticProps<T>): ReactNode;
```

Renders each item permanently above the live output. It is intended for output that does not change after it is written, such as completed tasks or log lines.

```ts
type StaticProps<T> = {
	items: T[];
	style?: Styles;
	children: (item: T, index: number) => ReactNode;
};
```

- `items` is the array to render. `children` is called only for items added since the previous commit, so each item is rendered once.
- Give the element returned by `children` a `key`.
- `style` accepts the `Styles` type: every style prop that `Box` accepts, plus `textWrap`. Ink applies `position: 'absolute'` and `flexDirection: 'column'` by default, and `style` can override both.

```tsx
import {Static, Text, render} from '@nemesis-oss/termina-core';

function Log({lines}: {readonly lines: string[]}) {
	return (
		<>
			<Static items={lines}>
				{(line, index) => <Text key={index}>{line}</Text>}
			</Static>
			<Text>Ready</Text>
		</>
	);
}

render(<Log lines={['started', 'connected']} />);
```

See [Rendering](/guide/rendering) (Static output).

### Transform

```ts
function Transform(props: TransformProps): ReactNode;
```

Passes the rendered text of its children through `transform` before it is written.

```ts
type TransformProps = {
	accessibilityLabel?: string;
	transform: (children: string, index: number) => string;
	children?: ReactNode;
};
```

- `transform` is called once for each output line of the children. The string it receives contains ANSI escape codes when the children use `Text` styling props.
- `index` is the zero-based row of the line, counted from the top of the element.
- When screen reader mode is on, `transform` is not applied. `accessibilityLabel` is rendered in place of the children if it is set.

```tsx
import {Text, Transform, render} from '@nemesis-oss/termina-core';

function Status() {
	return (
		<Transform transform={line => `> ${line}`}>
			<Text>status: ok</Text>
		</Transform>
	);
}

render(<Status />);
```

See [Layout and Text](/guide/layout-and-text) (Transform).

### Newline

```ts
function Newline(props: NewlineProps): ReactNode;
```

Inserts one or more newline characters. Use it inside `Text`.

```ts
type NewlineProps = {
	count?: number; // default 1
};
```

See [Layout and Text](/guide/layout-and-text) (Newline).

### Spacer

```ts
function Spacer(): ReactNode;
```

Fills the free space along the main axis of its parent. It renders `<Box flexGrow={1} />`.

See [Layout and Text](/guide/layout-and-text) (Spacer).

The package's `global.d.ts` declares the intrinsic host elements `ink-box` and `ink-text` for its own source. The components render these elements. They are not part of the public API. Application code uses `Box` and `Text`.

## Hooks

### useApp()

```ts
function useApp(): AppProps;
```

Returns the app lifecycle methods.

```ts
type AppProps = {
	exit: (errorOrResult?: Error | unknown) => void;
	waitUntilRenderFlush: () => Promise<void>;
	suspendTerminal: SuspendTerminal;
};
```

- `exit()` unmounts the app and resolves `waitUntilExit()` with `undefined`.
- `exit(value)` unmounts the app and resolves `waitUntilExit()` with `value`.
- `exit(error)` unmounts the app and rejects `waitUntilExit()` with `error`.
- `waitUntilRenderFlush()` resolves after pending output has been written to stdout.
- `suspendTerminal` is described under [Terminal](#suspendterminal).

See [Getting Started](/guide/getting-started) (Exiting).

### useStdin()

```ts
function useStdin(): StdinProps;
```

Returns the input stream and raw mode control.

```ts
type StdinProps = {
	readonly stdin: NodeJS.ReadableStream;
	readonly setRawMode: (isEnabled: boolean) => void;
	readonly isRawModeSupported: boolean;
};
```

- `stdin` is the stream passed to `render()`, or `process.stdin`.
- `setRawMode` is reference counted. Raw mode stays on until every caller has released it. Use this function instead of `process.stdin.setRawMode`, so that Ink keeps control of Ctrl+C.
- `setRawMode` throws when the stdin does not support raw mode. Check `isRawModeSupported` first.

See [Keyboard and Focus](/guide/keyboard-and-focus) (Non-TTY input).

### useStdout()

```ts
function useStdout(): StdoutProps;
```

Returns the output stream and a function that writes strings without disturbing the app's output.

```ts
type StdoutProps = {
	readonly stdout: NodeJS.WritableStream;
	readonly write: (data: string) => void;
};
```

`write` accepts a string only. It cannot accept components. Use `<Static>` for rendered output that should persist.

See [Rendering](/guide/rendering).

### useStderr()

```ts
function useStderr(): StderrProps;
```

Returns the error stream and a function that writes strings to it without disturbing the app's output.

```ts
type StderrProps = {
	readonly stderr: NodeJS.WritableStream;
	readonly write: (data: string) => void;
};
```

See [Rendering](/guide/rendering).

### useIsScreenReaderEnabled()

```ts
function useIsScreenReaderEnabled(): boolean;
```

Returns whether screen reader mode is on. Screen reader mode is set by the `isScreenReaderEnabled` render option. When that option is unset, it is on when `INK_SCREEN_READER` is `'true'`.

See [Rendering](/guide/rendering) (Screen reader mode).

### useAnimation()

```ts
function useAnimation(options?: {
	readonly interval?: number;
	readonly isActive?: boolean;
}): AnimationResult;

type AnimationResult = {
	readonly frame: number;
	readonly time: number;
	readonly delta: number;
	readonly reset: () => void;
};
```

Drives a frame counter, elapsed time and frame delta for a component. All animations share one timer.

- `interval` is the time between ticks in milliseconds. The default is `100`. Non-finite values use `100`. Values below `1` are raised to `1`. Values above the timer maximum of `2147483647` are clamped to it.
- `isActive` defaults to `true`. Setting it to `false` stops the animation. Setting it back to `true` resets `frame`, `time` and `delta` to `0`.
- `frame` is the number of intervals elapsed. `time` is the elapsed milliseconds. `delta` is the milliseconds since the previous rendered tick, which accounts for throttled renders.
- `reset()` sets `frame`, `time` and `delta` to `0` and restarts timing from the current moment.
- The `maxFps` render option limits how often animation updates are rendered. It does not speed up or slow down `frame` or `time`.

```tsx
import {Text, render, useAnimation} from '@nemesis-oss/termina-core';

const frames = ['|', '/', '-', '\\'];

function Spinner() {
	const {frame} = useAnimation({interval: 80});
	return <Text>{frames[frame % frames.length]} Working</Text>;
}

render(<Spinner />);
```

See [Rendering](/guide/rendering) (Frame throttling).

### useWindowSize()

```ts
function useWindowSize(): WindowSize;

type WindowSize = {
	readonly columns: number;
	readonly rows: number;
};
```

Returns the terminal size in character cells. The component re-renders when stdout emits `resize`.

See [Resize and Reflow](/guide/resize).

### useCursorShape()

```ts
function useCursorShape(shape: CursorShape): void;

type CursorShape = 'default' | 'block' | 'bar' | 'underline';
```

Sets the terminal cursor shape while the component is mounted. The shapes are steady, so the cursor does not blink. `default` hands the cursor back to the terminal's own setting.

- Each shape is written as a DECSCUSR sequence: `default` is `ESC [ 0 q`, `block` is `ESC [ 2 q`, `underline` is `ESC [ 4 q`, and `bar` is `ESC [ 6 q`. A terminal that does not support DECSCUSR ignores the sequence.
- When several components request a shape, the most recent request is shown. When a component unmounts, its request is removed, and the request before it is shown again.
- Ink writes a shape only on an interactive terminal. Output to a pipe or another non-terminal stream gets no sequence. A shape is written only when the effective shape changes, so the same shape requested twice is written once.
- Restore: when Ink has set a shape other than `default`, it writes `ESC [ 0 q` to give the cursor back to the terminal's setting. Ink does this on unmount, which includes exit, as the last of its cursor writes. It also does this before [`suspendTerminal()`](#suspendterminal) hands the terminal to a child process, so the child never runs with Ink's shape. Requests made while the terminal is suspended take effect when Ink takes the terminal back. Nothing is written when `default` is already in effect.
- The hook is opt-in. `TextInput` and the other editors do not set a shape, so their look does not change.

```tsx
import {Text, render, useCursorShape} from '@nemesis-oss/termina-core';

function Prompt() {
	useCursorShape('bar');

	return <Text>Name</Text>;
}

render(<Prompt />);
```

## Input

### useInput()

```ts
function useInput(
	inputHandler: (input: string, key: Key) => void,
	options?: {isActive?: boolean},
): void;
```

Calls `inputHandler` for each key press. `input` is the typed text. `key` describes special keys.

- `isActive` defaults to `true`. Setting it to `false` removes the listener and releases raw mode.
- When `exitOnCtrlC` is `true`, the default, Ctrl+C exits the app and the handler does not receive it.
- Mouse reports are never passed to `useInput`. They go to `useMouse`.
- While a `KeyboardCapture` is active, the handler receives input only when it sits inside the innermost active capture. Input from outside that capture is not delivered. See [KeyboardCapture](#keyboardcapture).
- When no `usePaste` listener is mounted, pasted text arrives as one string. When a `usePaste` listener is mounted, pasted text is delivered only to it. An enabled `TextInput`, `PasswordInput` or `MultilineTextInput` mounts one, so this holds while an enabled editor is mounted.
- `useInput` calls `setRawMode(true)` while it is active, without checking `isRawModeSupported`. On a stdin without raw mode support, `setRawMode` throws, so guard the component with `isRawModeSupported` from `useStdin()`.

```ts
type Key = {
	upArrow: boolean;
	downArrow: boolean;
	leftArrow: boolean;
	rightArrow: boolean;
	pageDown: boolean;
	pageUp: boolean;
	home: boolean;
	end: boolean;
	return: boolean;
	escape: boolean;
	ctrl: boolean;
	shift: boolean;
	tab: boolean;
	backspace: boolean;
	delete: boolean;
	meta: boolean;
	super: boolean; // kitty keyboard protocol only
	hyper: boolean; // kitty keyboard protocol only
	capsLock: boolean; // kitty keyboard protocol only
	numLock: boolean; // kitty keyboard protocol only
	eventType?: 'press' | 'repeat' | 'release'; // kitty keyboard protocol only
};
```

```tsx
import {Text, render, useInput} from '@nemesis-oss/termina-core';

function Cursor() {
	useInput((input, key) => {
		if (key.leftArrow) {
			// move left
		}

		if (input === 'q') {
			// quit
		}
	});

	return <Text>Use arrows, q to quit</Text>;
}

render(<Cursor />);
```

See [Keyboard and Focus](/guide/keyboard-and-focus).

### usePaste()

```ts
function usePaste(handler: (text: string) => void, options?: {isActive?: boolean}): void;
```

Calls `handler` once for each paste, with the full pasted text, newlines included.

- While active, bracketed paste mode is enabled on stdout, so the terminal wraps a paste in markers and the text is not read as key presses. Bracketed paste is written only when stdout is a TTY.
- `isActive` defaults to `true`. Several `usePaste` hooks can be mounted, and each receives the same paste.
- While a `KeyboardCapture` is active, a paste reaches only the `usePaste` handlers inside the innermost active capture. A paste that reaches only handlers outside it is dropped. See [KeyboardCapture](#keyboardcapture).
- Paste content is never passed to `useInput` while a `usePaste` listener is mounted. An enabled `TextInput`, `PasswordInput` or `MultilineTextInput` mounts one, so a `useInput` listener stops seeing paste while an enabled editor is mounted. The editors insert the pasted text themselves. See [Keyboard and Focus](/guide/keyboard-and-focus).

```tsx
import {Text, render, usePaste} from '@nemesis-oss/termina-core';

function Paste() {
	usePaste(text => {
		// text is the whole pasted string
	});

	return <Text>Paste something</Text>;
}

render(<Paste />);
```

See [Keyboard and Focus](/guide/keyboard-and-focus) (Paste with usePaste).

### KeyboardCapture

```ts
function KeyboardCapture(props: KeyboardCaptureProps): React.ReactNode;

type KeyboardCaptureProps = {
	isActive?: boolean; // default true
	children?: React.ReactNode;
};
```

A component that makes the input inside it the only input the app delivers while it is active. Keys, paste and mouse reports go to the `useInput`, `usePaste` and `useMouse` listeners inside the capture. Listeners outside it receive nothing. It renders its children and nothing else, so it adds no cells to the layout.

- `isActive` defaults to `true`. While it is `false`, the children behave as if the capture were not there, and their input is not restricted.
- Captures nest. The innermost active capture decides, so a listener receives input only when its nearest capture is the top one. Closing the inner capture returns input to the outer one.
- Ctrl+C still exits the app before any capture is checked.
- A plain Escape does not clear focus while a capture is active.
- Tab and Shift+Tab move focus only among the focusable components in the scope of the top capture. See [useFocusScope()](#usefocusscope).
- Suspending the terminal keeps the capture, so the same input is restricted when the app resumes.
- Pasted text follows the rule under [usePaste()](#usepaste).

`KeyboardCapture` is a component, not a hook. A listener learns its owner from the component tree, and only a component can pass that owner down to its children.

```tsx
import {Box, KeyboardCapture, Text, render, useInput} from '@nemesis-oss/termina-core';

function DialogBody() {
	// Receives keys only while the dialog's capture is the innermost one.
	useInput(input => {
		if (input === 'y') {
			// confirm
		}
	});

	return <Text>Press y to confirm</Text>;
}

function Dialog({isOpen}: {readonly isOpen: boolean}) {
	return (
		<Box flexDirection="column">
			<KeyboardCapture isActive={isOpen}>
				<DialogBody />
			</KeyboardCapture>
		</Box>
	);
}

render(<Dialog isOpen />);
```

See [Keyboard and Focus](/guide/keyboard-and-focus#keyboard-capture) for the full rules, and [Modal](/ui/components/modal) for a dialog built on it.

## Mouse

Mouse reports are enabled in two ways. `useMouse` enables tracking while it is mounted and active. `render(..., {mouse: true})` mounts a router that dispatches reports to the `Box` mouse props. Tracking uses SGR reporting with button and drag events (`?1000h`, `?1002h`, `?1006h`).

### useMouse()

```ts
function useMouse(handler: (event: MouseEvent) => void, options?: {isActive?: boolean}): void;
```

Calls `handler` for every mouse report: presses, releases, drags and wheel steps.

- Tracking is reference counted. It stays on while at least one active `useMouse` is mounted, and it is released when the last one unmounts or when the terminal is suspended.
- `useMouse` turns on raw mode itself. A component that uses only `useMouse` receives reports without `useInput`.
- `isActive` defaults to `true`.

```tsx
import {Text, render, useMouse} from '@nemesis-oss/termina-core';

function Pointer() {
	useMouse(event => {
		if (event.action === 'wheel' && event.button === 'wheelUp') {
			// scroll up
		}
	});

	return <Text>Scroll over the app</Text>;
}

render(<Pointer />);
```

See [Mouse](/guide/mouse) (useMouse).

### MouseEvent, MouseAction, MouseButton

```ts
type MouseEvent = {
	readonly action: MouseAction;
	readonly button: MouseButton;
	readonly x: number; // 1-based column, as the terminal reports it
	readonly y: number; // 1-based row, as the terminal reports it
	readonly shift: boolean;
	readonly meta: boolean;
	readonly ctrl: boolean;
};

type MouseAction = 'press' | 'release' | 'drag' | 'move' | 'wheel';

type MouseButton =
	| 'left'
	| 'middle'
	| 'right'
	| 'none'
	| 'wheelUp'
	| 'wheelDown'
	| 'wheelLeft'
	| 'wheelRight';
```

`x` and `y` are 1-based in both `useMouse` handlers and `Box` mouse handlers. Extra buttons (back and forward) are not reported.

See [Mouse](/guide/mouse) (MouseEvent).

### parseMouseEvent()

```ts
function parseMouseEvent(sequence: string): MouseEvent | undefined;
```

Parses one complete SGR mouse report of the form `ESC [ < Cb ; Cx ; Cy M` or `m`. Returns `undefined` for any other input, including reports with a zero coordinate and reports for extra buttons.

See [Mouse](/guide/mouse).

### isElementAt()

```ts
function isElementAt(element: DOMElement, x: number, y: number): boolean;
```

Returns `true` when the terminal cell at (`x`, `y`) lands on `element` or on one of its descendants. `x` and `y` are 1-based, as the terminal reports them.

The check follows the same hit test as the mouse dispatcher. It respects clipping by `overflow: 'hidden'` ancestors and `contentOffsetX`/`contentOffsetY`. If another element covers the cell, such as a modal drawn over the element, the check returns `false`.

See [Mouse](/guide/mouse) (isElementAt).

### Box mouse props

`Box` accepts four mouse props. They work when the app is rendered with `mouse: true`.

- `onClick` fires when a press and the following release resolve to the same element. Dragging off the element before release cancels the click.
- `onMouseDown` fires on a press over the element or one of its descendants.
- `onMouseUp` fires on a release over the element or one of its descendants.
- `onWheel` fires for each wheel step over the element or one of its descendants.

A descendant without its own handler passes the event to its nearest ancestor that has one. The closest handler receives the event, and ancestors do not also fire for it.

```tsx
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';

function Button() {
	const {exit} = useApp();

	return (
		<Box borderStyle="round" paddingX={1} onClick={() => exit()}>
			<Text>Click to quit</Text>
		</Box>
	);
}

const app = render(<Button />, {mouse: true});
await app.waitUntilExit();
```

See [Mouse](/guide/mouse) (Box mouse handlers).

## Focus

### useFocus()

```ts
function useFocus(options?: {
	isActive?: boolean;
	autoFocus?: boolean;
	id?: string;
	ref?: RefObject<DOMElement | null>;
}): {
	isFocused: boolean;
	focus: (id: string) => void;
};
```

Registers the component as focusable and returns whether it is focused.

- Components are focused in registration order. Tab moves focus to the next focusable component, and Shift+Tab moves it to the previous one. Both wrap around.
- Pressing Escape while focus management is enabled clears focus.
- `isActive` defaults to `true`. An inactive component keeps its place in the order but cannot receive focus.
- `autoFocus` defaults to `false`. It focuses the component when nothing else has focus.
- `id` defaults to an ID generated by React's `useId`. It must be unique among focusable components. Components that share an ID count as one slot in navigation.
- `focus(id)` focuses the active, registered component with that ID. It does nothing for an unknown or inactive ID.
- `ref` is the `Box` this component renders. `focusDirection` from `useFocusManager` uses its on-screen rectangle. Without it, the component is reachable only with Tab.
- While active, the hook turns on raw mode when stdin supports it.

```tsx
import {Box, Text, render, useFocus} from '@nemesis-oss/termina-core';

function Field({label}: {readonly label: string}) {
	const {isFocused} = useFocus();
	return <Text inverse={isFocused}>{label}</Text>;
}

render(
	<Box flexDirection="column">
		<Field label="Name" />
		<Field label="Email" />
	</Box>,
);
```

See [Keyboard and Focus](/guide/keyboard-and-focus) (useFocus).

### useFocusManager()

```ts
function useFocusManager(): {
	enableFocus: () => void;
	disableFocus: () => void;
	focusNext: () => void;
	focusPrevious: () => void;
	focusDirection: (direction: Direction) => void;
	focus: (id: string) => void;
	activeId: string | undefined;
};
```

Returns controls for focus across the whole app.

- `enableFocus()` turns focus management on.
- `disableFocus()` turns focus management off and clears the focused component.
- `focusNext()` moves focus to the next active component. From no focus, it selects the first one. From the last one, it wraps to the first.
- `focusPrevious()` moves focus to the previous active component. From no focus, it selects the last one. From the first one, it wraps to the last.
- `focusDirection(direction)` moves focus to the nearest active component that lies in `direction` from the focused one, by on-screen position. It stays put when nothing lies that way. See [Directional focus](/guide/keyboard-and-focus#directional-focus).
- `focus(id)` focuses the active component with that ID. An unknown ID leaves focus unchanged.
- `activeId` is the ID of the focused component, or `undefined`.

See [Keyboard and Focus](/guide/keyboard-and-focus) (useFocusManager).

### nearestInDirection()

```ts
function nearestInDirection(
	origin: Rect,
	candidates: readonly FocusCandidate[],
	direction: Direction,
): string | undefined;

type Rect = {x: number; y: number; width: number; height: number};
type Direction = 'up' | 'down' | 'left' | 'right';
type FocusCandidate = {id: string; rect: Rect};
```

Returns the `id` of the candidate nearest to `origin` in `direction`, or `undefined` when none lies ahead. It is pure: it reads no layout and changes no focus. `focusDirection` uses it with each focusable's on-screen rectangle.

- A candidate lies ahead when its center is strictly past the origin's center in `direction`.
- The distance is `Math.hypot(along, across)`, with vertical offsets scaled by 2, since a terminal row is about twice as tall as a column is wide.
- Equally near candidates resolve to the earlier one in `candidates`.
- The origin never qualifies, because its center is not ahead of itself.
- The function does not check that a candidate can take focus. Filter the list first.

Given a 2 by 2 grid of 10 by 5 cells, with `A` top left, `B` top right, `C` bottom left, and `D` bottom right:

```ts
const a: Rect = {x: 0, y: 0, width: 10, height: 5};
const d: Rect = {x: 12, y: 6, width: 10, height: 5};
const candidates: FocusCandidate[] = [
	{id: 'A', rect: a},
	{id: 'B', rect: {x: 12, y: 0, width: 10, height: 5}},
	{id: 'C', rect: {x: 0, y: 6, width: 10, height: 5}},
	{id: 'D', rect: d},
];

nearestInDirection(a, candidates, 'right'); // 'B'
nearestInDirection(a, candidates, 'down'); // 'C'
nearestInDirection(a, candidates, 'left'); // undefined
nearestInDirection(d, candidates, 'up'); // 'B'
```

### useFocusScope()

```ts
function useFocusScope(): {focusFirstInScope: () => void};
```

Returns `focusFirstInScope`, which focuses the first active focusable component in the scope of the nearest active `KeyboardCapture`. Outside every capture, it focuses the first focusable component that is not inside one. It does nothing when no active focusable component is in the scope, and it does nothing while focus management is disabled.

Call the hook in a component rendered inside the capture. That component can focus its first field when it opens.

- Each focusable component belongs to the scope of the capture that encloses it when it registers. A focusable component outside every capture is in the app scope.
- While a capture is active, Tab and Shift+Tab cycle only through the focusable components in its scope. With none in scope, they do nothing. Outside every capture, they reach every focusable component, as before.

```tsx
import {useEffect} from 'react';
import {KeyboardCapture, Text, useFocusScope} from '@nemesis-oss/termina-core';

function DialogBody() {
	const {focusFirstInScope} = useFocusScope();

	useEffect(() => {
		focusFirstInScope();
	}, [focusFirstInScope]);

	return <Text>Dialog</Text>;
}

const Dialog = () => (
	<KeyboardCapture>
		<DialogBody />
	</KeyboardCapture>
);
```

See [Keyboard and Focus](/guide/keyboard-and-focus#focus-scope) for the navigation rules.

## Terminal

### detectTerminalCapabilities()

```ts
function detectTerminalCapabilities(
	environment: Readonly<Record<string, string | undefined>>,
	stream: {readonly isTTY?: boolean},
	inCi?: boolean, // default: Boolean(environment.CI)
): TerminalCapabilities;

type ColorLevel = 'none' | 'ansi16' | 'ansi256' | 'truecolor';

type TerminalCapabilities = {
	readonly interactive: boolean;
	readonly colorLevel: ColorLevel;
	readonly synchronizedOutput: boolean;
	readonly alternateScreen: boolean;
	readonly mouse: boolean;
	readonly hyperlinks: boolean;
};
```

Reads the environment once and reports what the terminal can display. Pass `process.env` and `process.stdout` for the current process.

- `interactive` is `true` when the stream is a TTY, `TERM` is not `dumb`, and `inCi` is `false`.
- `colorLevel` follows chalk's rules. When `FORCE_COLOR` is set, it decides: `false` or `0` gives `none`, an empty value or `true` gives `ansi16`, and `1` to `3` give `ansi16`, `ansi256` and `truecolor`. Otherwise a non-empty `NO_COLOR` gives `none`. Otherwise a non-TTY stream or `TERM=dumb` gives `none`. Otherwise `COLORTERM` of `truecolor` or `24bit` gives `truecolor`, `TERM` containing `256color` gives `ansi256`, and anything else gives `ansi16`.
- `synchronizedOutput` is `true` when the app is interactive and `TERM` is not `linux`.
- `alternateScreen` and `mouse` are `true` when the app is interactive.
- `hyperlinks` is `true` when the stream is a TTY, `TERM` is not `dumb`, and `TERM` is not `linux`.

```ts
import {detectTerminalCapabilities} from '@nemesis-oss/termina-core';

const capabilities = detectTerminalCapabilities(process.env, process.stdout);
```

See [Terminal Features](/guide/terminal-features) (detectTerminalCapabilities and Color level).

### hyperlink()

```ts
function hyperlink(url: string, label: string): string;
```

Wraps `label` in an OSC 8 hyperlink. Terminals that support it show `label` as a link. Other terminals show `label` unchanged. Throws a `RangeError` when `url` is empty or contains a control character.

The label may contain SGR styling. Layout measures its visible width, because the OSC 8 sequence has zero width.

```tsx
import {Text, hyperlink, render} from '@nemesis-oss/termina-core';

function Docs() {
	return <Text>{hyperlink('https://example.com/docs', 'docs')}</Text>;
}

render(<Docs />);
```

See [Terminal Features](/guide/terminal-features) (hyperlink).

### clipboardSequence() and copyToClipboard()

```ts
function clipboardSequence(text: string): string;

function copyToClipboard(
	text: string,
	stream?: {isTTY?: boolean; write: (data: string) => unknown},
): boolean;
```

`clipboardSequence` returns an OSC 52 sequence that asks the terminal to place `text` on the system clipboard. It throws a `RangeError` when the base64 payload is longer than 74,000 characters, because terminals truncate longer payloads.

`copyToClipboard` writes that sequence to `stream`, which defaults to `process.stdout`. It returns `true` after writing. It returns `false` without writing when `stream.isTTY` is not `true`. The sequence moves no cursor and draws nothing. The terminal must allow clipboard writes.

See [Terminal Features](/guide/terminal-features) (Clipboard).

### kittyFlags and kittyModifiers

```ts
const kittyFlags: {
	readonly disambiguateEscapeCodes: 1;
	readonly reportEventTypes: 2;
	readonly reportAlternateKeys: 4;
	readonly reportAllKeysAsEscapeCodes: 8;
	readonly reportAssociatedText: 16;
};

const kittyModifiers: {
	readonly shift: 1;
	readonly alt: 2;
	readonly ctrl: 4;
	readonly super: 8;
	readonly hyper: 16;
	readonly meta: 32;
	readonly capsLock: 64;
	readonly numLock: 128;
};

type KittyFlagName = keyof typeof kittyFlags;

type KittyKeyboardOptions = {
	mode?: 'auto' | 'enabled' | 'disabled'; // default 'auto'
	flags?: KittyFlagName[]; // default ['disambiguateEscapeCodes']
};
```

`kittyFlags` holds the bit values of the kitty keyboard protocol flags. `kittyModifiers` holds the modifier bits used in CSI u sequences. On the wire, the modifier value is one more than the sum of the bits.

`KittyKeyboardOptions` is the value of the `kittyKeyboard` render option.

- `'auto'` sends a query to interactive TTYs and enables the protocol if the terminal answers. The wait is 200 ms. Suspending the terminal cancels a pending query.
- `'enabled'` enables the protocol when stdin and stdout are both TTYs, even in CI.
- `'disabled'` never enables the protocol.
- `reportAssociatedText` also enables `reportAllKeysAsEscapeCodes`.

See [Terminal Features](/guide/terminal-features) (kittyKeyboard).

### useCursor()

```ts
function useCursor(): {
	setCursorPosition: (position: CursorPosition | undefined) => void;
};

type CursorPosition = {
	x: number;
	y: number;
};
```

Places the terminal cursor at a position relative to the app's output origin, so that an input method can show its composing text there. Passing `undefined` hides the cursor. The position is applied at commit, and it is cleared when the component unmounts.

See [Resize and Reflow](/guide/resize) (the primary-screen limitation of useCursor).

### suspendTerminal

```ts
type SuspendTerminal = {
	(callback: () => void | Promise<void>): Promise<void>;
	(): Promise<TerminalSuspension>;
};

type TerminalSuspension = {
	readonly resume: () => Promise<void>;
	readonly [Symbol.asyncDispose]: () => Promise<void>;
};
```

`suspendTerminal` is the `suspendTerminal` property of [`useApp()`](#useapp). It hands the terminal to a child process, then restores Ink's terminal state and redraws the screen.

- With a callback, the terminal is restored even if the callback throws. The callback runs without the handoff when the app is not interactive.
- Without a callback, it returns a `TerminalSuspension`. Call `resume()`, or use `await using`, to give the terminal back to Ink.
- A nested suspend while the terminal is already suspended is rejected.

```tsx
import {spawn} from 'node:child_process';
import {Text, render, useApp, useInput} from '@nemesis-oss/termina-core';

function Editor() {
	const {suspendTerminal} = useApp();

	useInput(async input => {
		if (input === 'e') {
			await suspendTerminal(
				() =>
					new Promise<void>(resolve => {
						spawn(process.env['EDITOR'] ?? 'vi', ['notes.txt'], {
							stdio: 'inherit',
						}).on('exit', () => resolve());
					}),
			);
		}
	});

	return <Text>Press e to edit</Text>;
}

render(<Editor />);
```

See [Alternate Screen and Suspend](/guide/alternate-screen-and-suspend).

## Measurement

### measureElement()

```ts
function measureElement(node: DOMElement): ElementMetrics;

type ElementMetrics = {
	x: number;
	y: number;
	width: number;
	height: number;
	clientWidth: number;
	clientHeight: number;
};
```

Returns the layout metrics of a `Box`, given the `DOMElement` from its `ref`.

- `x` and `y` are the element's position in the live layout region, found by adding up the offsets of its ancestors. They are layout coordinates, not terminal coordinates. They do not include `contentOffsetX` or `contentOffsetY`.
- `clientWidth` and `clientHeight` exclude borders. They are the space the content can occupy. Padding is not excluded.
- During render, `measureElement()` returns the layout from the most recent layout pass. A node that has never been laid out reports zeros. Read the values after commit (from `useEffect`, `useLayoutEffect`, an input handler or a timer) so they match the current render.

See [Layout and Text](/guide/layout-and-text) (Measuring layout).

### useBoxMetrics()

```ts
function useBoxMetrics(ref: RefObject<DOMElement | null>): UseBoxMetricsResult;

type BoxMetrics = {
	readonly width: number;
	readonly height: number;
	readonly left: number;
	readonly top: number;
	readonly clientWidth: number;
	readonly clientHeight: number;
};

type UseBoxMetricsResult = BoxMetrics & {
	readonly hasMeasured: boolean;
};
```

Returns the layout metrics of the element that `ref` points to, and updates them after each render and after each layout commit of the app.

- All metrics are zero until the first layout pass, and they are zero while the ref is detached.
- `left` and `top` are relative to the parent. Like `measureElement`, they do not include an ancestor's `contentOffsetX` or `contentOffsetY`.
- `hasMeasured` is `true` once the tracked element has been measured.

```tsx
import {useRef} from 'react';
import {Box, Text, render, useBoxMetrics, type DOMElement} from '@nemesis-oss/termina-core';

function Panel() {
	const ref = useRef<DOMElement>(null);
	const {width, height, hasMeasured} = useBoxMetrics(ref);

	return (
		<Box ref={ref} borderStyle="single">
			<Text>{hasMeasured ? `${width}x${height}` : 'measuring'}</Text>
		</Box>
	);
}

render(<Panel />);
```

See [Layout and Text](/guide/layout-and-text) (useBoxMetrics).

## Types

### DOMElement

```ts
type DOMElement = {
	nodeName: 'ink-root' | 'ink-box' | 'ink-text' | 'ink-virtual-text';
	parentNode: DOMElement | undefined;
	childNodes: DOMNode[];
	style: Styles;
	yogaNode?: YogaNode;
	// Other fields are internal to the renderer.
};
```

The host node type that `Box` renders. A `ref` on `Box` receives a `DOMElement`. `Text` does not forward refs. Pass the element to [`measureElement()`](#measureelement), [`isElementAt()`](#iselementat) or [`useBoxMetrics()`](#useboxmetrics). The fields listed above are the ones those helpers read. Other fields are internal, and they may change without notice.

### Type index

Type-only exports and the section where each one is documented.

| Type | Documented under |
|---|---|
| `AnimationResult` | Hooks, useAnimation |
| `AppProps` | Hooks, useApp |
| `BoxMetrics` | Measurement, useBoxMetrics |
| `BoxProps` | Components, Box |
| `ColorLevel` | Terminal, detectTerminalCapabilities |
| `CursorPosition` | Terminal, useCursor |
| `CursorShape` | Hooks, useCursorShape |
| `Direction` | Focus, nearestInDirection() |
| `DOMElement` | Types |
| `ElementMetrics` | Measurement, measureElement |
| `FocusCandidate` | Focus, nearestInDirection() |
| `Instance` | Rendering, Instance |
| `Key` | Input, useInput |
| `KeyboardCaptureProps` | Input, KeyboardCapture |
| `KittyFlagName` | Terminal, kittyFlags and kittyModifiers |
| `KittyKeyboardOptions` | Terminal, kittyFlags and kittyModifiers |
| `MouseAction` | Mouse, MouseEvent |
| `MouseButton` | Mouse, MouseEvent |
| `MouseEvent` | Mouse, MouseEvent |
| `NewlineProps` | Components, Newline |
| `Rect` | Focus, nearestInDirection() |
| `RenderOptions` | Rendering, RenderOptions |
| `RenderToStringOptions` | Rendering, renderToString() |
| `StaticProps` | Components, Static |
| `StderrProps` | Hooks, useStderr |
| `StdinProps` | Hooks, useStdin |
| `StdoutProps` | Hooks, useStdout |
| `SuspendTerminal` | Terminal, suspendTerminal |
| `TerminalCapabilities` | Terminal, detectTerminalCapabilities |
| `TerminalSuspension` | Terminal, suspendTerminal |
| `TextProps` | Components, Text |
| `TransformProps` | Components, Transform |
| `UseBoxMetricsResult` | Measurement, useBoxMetrics |
| `WindowSize` | Hooks, useWindowSize |
