---
outline: [2, 3]
---

# Testing

The tests for `@nemesis-oss/termina-core` check three things: the output that `render()` and `renderToString()` produce, what a terminal shows after an emulator (`@xterm/headless`) has parsed that output, and the byte stream that a real pseudo-terminal (`node-pty`) receives. This page covers how to run the tests, the helpers under `packages/core/test/helpers`, how to write a test with them, and how to assert on color.

The helpers are not exported from `@nemesis-oss/termina-core`. `src/index.ts` exports the public API only, and the package's `files` list publishes only `build`. `@nemesis-oss/termina-ui` uses the same test runner. Read this page when you add a test to `packages/core` or `packages/ui` in this repository.

## Preview

The frame that the `render box with border` test captures from `renderToString`, a single-bordered box around one line of text.

<TerminalPreview id="testing-bordered-box" />

## Running the tests

- `pnpm test` at the repository root builds the packages, then runs the test script of each package in `packages/`.
- `pnpm --filter @nemesis-oss/termina-core run test` runs the tests for `@nemesis-oss/termina-core`. Its `pretest` script runs `tsc` first.
- The test script runs `node --import=tsx --test --test-concurrency=1 "test/*.{ts,tsx}"` with `FORCE_COLOR=true`.
- Test files are the direct children of `packages/core/test`. Helpers and fixtures live in subdirectories, so the glob does not run them as tests.
- `--test-concurrency=1` runs one file at a time.
- To run a single file, run `node --import=tsx --test test/<name>.tsx` from `packages/core` with `FORCE_COLOR=true` in the environment. The tests import the source in `src/`, so the build step is not needed for a single file.

## The `node:test` runner

The tests use the built-in `node:test` runner, with `tsx` loading the TypeScript sources. Follow these conventions, which the existing files use:

- Import `test` from `node:test`, and type the context as `TestContext`. Assert with `t.assert`, for example `t.assert.strictEqual`.
- Clean up with `t.after(() => { ... })`, or with `try` and `finally`.
- Wait for output before you read it. Use `await instance.waitUntilRenderFlush()` after `render()`, and `await terminal.settle()` after an emulator change.
- To change a fake stdout's size and run the resize handler, set `stdout.columns` or `stdout.rows`, then call `stdout.emit('resize')`.
- Frames written in interactive mode to a TTY stdout are wrapped in synchronized output markers (`ESC [?2026h` and `ESC [?2026l`). `test/sync-frames.tsx` checks that every frame sits between them, and that non-interactive output has none.

## Test helpers

These helpers are in `packages/core/test/helpers`. Imports from a test file use a relative path, such as `./helpers/create-stdout.js`.

| Helper | File | What it does |
| --- | --- | --- |
| `createStdout(columns?, isTTY?)` | `create-stdout.ts` | Fake stdout. Defaults are 100 columns and `isTTY` set. `getWrites()` returns every write, and `get()` returns the last non-empty one. `rows` can be set, and `emit('resize')` runs the resize handler. |
| `createStdin()`, `emitReadable(stdin, chunk)` | `create-stdin.ts` | Fake stdin with a stubbed `setRawMode`. `emitReadable` delivers one chunk to the input listener. |
| `renderSync`, `renderAsync`, `withAct`, `waitForSuspense` | `test-renderer.ts` | `renderSync` and `renderAsync` render in debug mode. `renderAsync` uses concurrent mode inside `act()`. `withAct` and `waitForSuspense` wrap their work in `act()`. |
| `renderToString`, `renderToStringAsync` | `render-to-string.ts` | Test wrappers that call `render()` in debug mode. They are not the exported `renderToString()`. |
| `act` | `act.ts` | React's `act()`. It sets the act environment flag only while the callback runs. |
| `enableTestColors()`, `disableTestColors()` | `force-colors.ts` | Set chalk to truecolor (level 3), and restore the detected level. |
| `createXtermTerminal(columns, rows)` | `xterm-terminal.ts` | An `@xterm/headless` emulator behind fake streams. See the emulator section. |
| `term(fixture, args?)`, `run(fixture, {env, columns})` | `term.ts`, `run.ts` | Start a fixture in a pseudo-terminal. See the pty section. |
| `reconstructTerminalLines(output, rows)` | `reconstruct-terminal.ts` | Replays the cursor and erase sequences that Ink writes onto a line model. It does not reflow wrapped rows. |
| `mockTimerCalls()` | `mock-timer-calls.ts` | Counts `setTimeout` and `clearTimeout` calls and records the delays. |

## Fake stdout with `render()`

For output that does not depend on the terminal, pass a fake stdout and set `debug: true`. In debug mode each update is written in full, without erasing and without throttling, so the writes can be read as soon as `render()` returns. With `concurrent: true`, await `waitUntilRenderFlush()` before reading the writes.

The fake below records writes and calls the write callback. Ink's `waitUntilRenderFlush()` waits for that callback, so a fake that never calls it stalls any code that awaits a flush.

```tsx
import EventEmitter from 'node:events';
import test, {type TestContext} from 'node:test';
import {Box, Text, render} from '@nemesis-oss/termina-core';

const createStdout = (columns: number) => {
	const writes: string[] = [];
	const stdout = Object.assign(new EventEmitter(), {
		columns,
		isTTY: true,
		write(data: string, callback?: () => void) {
			writes.push(data);
			if (callback) {
				queueMicrotask(callback);
			}

			return true;
		},
	});

	return {stdout: stdout as unknown as NodeJS.WriteStream, writes};
};

test('a boxed greeting is written in green', (t: TestContext) => {
	const {stdout, writes} = createStdout(40);
	const app = render(
		<Box borderStyle="round">
			<Text color="green">hello</Text>
		</Box>,
		{stdout, debug: true},
	);
	t.after(() => {
		app.unmount();
	});

	const output = writes.join('');
	t.assert.ok(output.includes('hello'));
	t.assert.ok(output.includes('\u001B[32m'));
});
```

The snippet imports from `@nemesis-oss/termina-core`, which resolves to the build output in `build/`. The tests inside `packages/core` import the source instead, with `../src/index.js`. The same code works with either import.

### `renderToString()`

`renderToString()` needs no stdout, and its terminal hooks return default values. Assert on the returned string:

```tsx
import test, {type TestContext} from 'node:test';
import {Text, renderToString} from '@nemesis-oss/termina-core';

test('renderToString returns the frame as a string', (t: TestContext) => {
	t.assert.strictEqual(renderToString(<Text>ok</Text>), 'ok');
});
```

The helper `renderToString` in `test/helpers/render-to-string.ts` has the same name but is different. It wraps `render()` in debug mode and is used by the repository's tests. Do not import it expecting the exported function.

## Style assertions

Color depends on the environment. The test script sets `FORCE_COLOR=true`, which selects the 16-color level. The capability probe and chalk follow the same rule, so Ink writes SGR codes for named colors. Assert on the code itself, for example `\u001B[32m` for green, as the snippet above does.

- Compare visible text with `strip-ansi`, a devDependency of `@nemesis-oss/termina-core`, as the tests do. Compare the escape codes directly when the style is the thing under test.
- For RGB or hex colors, call `enableTestColors()` in `before()` and `disableTestColors()` in `after()`. `test/colorize.ts` follows this pattern.
- When `FORCE_COLOR` is unset and stdout is not a TTY, Ink writes no SGR codes. Set `FORCE_COLOR=true` when you run a single file.

## Emulator-backed tests

Use the emulator when the test checks what is on screen: wrapping after a resize, the cursor, the style of specific cells, or focus.

`createXtermTerminal(columns, rows)` creates an `@xterm/headless` terminal and returns fake streams and helpers:

| Member | What it does |
| --- | --- |
| `stdout`, `stdin` | Fake streams to pass to `render()`. Writes to stdout go to the emulator, with `\n` translated to `\r\n`. |
| `resize(columns, rows?)` | Resizes the emulator, which reflows wrapped rows first. Then it emits `resize` on stdout, as a window manager does, and settles. |
| `settle()` | Waits about 150 ms, then waits until the emulator has parsed the queued writes. |
| `screen()` | Lines of the buffer, scrollback included, with trailing blank rows removed. |
| `getLine(row)` | One viewport row as text. Row 0 is the top of the viewport. Trailing blanks are trimmed. |
| `cellAt(row, column)` | `{char, width, bold, dim, inverse}` for one cell, or `undefined` outside the grid. |
| `cells()` | The whole viewport as a row-major matrix of cells. |
| `emitKey(key)` | Sends a key sequence to stdin, waits for the app to process it, and settles. Escape waits out the app's escape-key flush window. |
| `dispose()` | Disposes the emulator. |

The emulator reflows soft-wrapped rows when its width changes, as the terminals that Ink targets do. The reflow tests in `test/terminal-resize-reflow.tsx` use it to check that a width change leaves one copy of the frame. For the behavior under test, see [Resize and Reflow](/guide/resize). `test/xterm-fixture.tsx` uses it with a focus probe, because the helper has no focus accessor. Read focus from inside the tree with a probe component, as that file does.

## Pseudo-terminal tests

Use a pseudo-terminal when the test checks the bytes that a terminal receives: alternate-screen sequences, cursor visibility, raw mode, or the output of a child process.

- `term(fixture, args?)` starts `test/fixtures/<fixture>.tsx` in a pseudo-terminal that is 100 columns wide, through `node --import=tsx`. It returns `{write, output, waitForExit}`.
- The fixture must write `__READY__` once it is listening for input. `write(input)` waits for that marker before it sends the input, so a key is never sent too early.
- `output` holds every byte the terminal received, escape sequences included. Tests search it with `indexOf` and `lastIndexOf`.
- `waitForExit()` resolves when the fixture exits with code 0, and rejects otherwise.
- `run(fixture, {env, columns})` runs a fixture without input and resolves with its full output.

Each pty test starts a separate Node process. `test/alternate-screen-exit.tsx` and the PTY test in `test/suspend-terminal.tsx` are the examples to follow. For the behavior they check, see [Alternate Screen and Suspend](/guide/alternate-screen-and-suspend). `node-pty` is built when the dependencies are installed, because the root `package.json` lists it under `pnpm.onlyBuiltDependencies`.

## Line model for erase sequences

`reconstructTerminalLines(chunks, rows)` replays Ink's output onto a line model and returns the lines still visible, scrollback included. A chunk of the form `{rows: n}` shrinks the modeled terminal. The model handles only the sequences that Ink writes. It does not reflow wrapped rows, so use the emulator when wrapping matters. `test/terminal-resize.tsx` uses the model to check what remains above a frame after a height shrink.
