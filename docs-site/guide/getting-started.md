---
outline: [2, 3]
---

# Getting Started

`@nemesis-oss/termina-core` is the renderer. It mounts a React tree on a terminal output stream, lays it out with Yoga, and writes each frame. `@nemesis-oss/termina-ui` is the component kit built on it. Both packages are workspace packages in this repository and are not published to npm, so you use them from another package in the same workspace. This page covers the workspace setup, a first app, how the app exits, and how output behaves when stdout is not a terminal. For every `render()` option, read [Rendering](/guide/rendering). For the layout and text components, read [Layout and Text](/guide/layout-and-text).

## Requirements

- Node.js 22 or newer. Both packages declare `"engines": {"node": ">=22"}`.
- pnpm 10. The root `package.json` sets `"packageManager": "pnpm@10.28.0"`.
- React 19.3 or newer. `@nemesis-oss/termina-core` declares `react` as a peer dependency with the range `>=19.3.0`.

## Workspace setup

The workspace in `pnpm-workspace.yaml` includes `packages/*` and `examples/*`. From the repository root, run:

```sh
pnpm install
pnpm build
```

`pnpm build` runs the `build` script of each package in `packages/*` in dependency order, so `@nemesis-oss/termina-core` builds before `@nemesis-oss/termina-ui`. Both packages resolve to their compiled output: `main` and `exports` point at `./build/index.js`. Run `pnpm build` again after you change package source and before you run code in another workspace package that imports them.

To use the packages from another workspace package, declare them as workspace dependencies. `examples/turnstream` does the same:

```json
{
  "type": "module",
  "dependencies": {
    "@nemesis-oss/termina-core": "workspace:*",
    "react": ">=19.3.0"
  },
  "devDependencies": {
    "@types/react": "^19.3.0",
    "tsx": "^4.23.15",
    "typescript": "^5.8.3"
  }
}
```

The examples on these pages use the React 19 automatic JSX runtime, so they do not import `React` for JSX. Set `"jsx": "react-jsx"` in the tsconfig of the package that contains them. `examples/turnstream` uses the classic runtime (`"jsx": "react"`) and imports `React` in each file that contains JSX, which is `src/index.tsx`.

## Your first app

This app renders a bordered box with a counter. It exits after three ticks.

```tsx
import {useEffect, useState} from 'react';
import {Box, Text, render, useApp} from '@nemesis-oss/termina-core';

const Counter = () => {
	const [count, setCount] = useState(0);
	const {exit} = useApp();

	useEffect(() => {
		const timer = setInterval(() => {
			setCount(previous => previous + 1);
		}, 100);

		return () => {
			clearInterval(timer);
		};
	}, []);

	useEffect(() => {
		if (count >= 3) {
			exit();
		}
	}, [count, exit]);

	return (
		<Box borderStyle="round" paddingX={1}>
			<Text color="green">Ticks: {count}</Text>
		</Box>
	);
};

const {waitUntilExit} = render(<Counter />);

await waitUntilExit();
console.log('done');
```

Save the file as `src/app.tsx` in a workspace package that has `"type": "module"`, then run it with the loader that `examples/turnstream` uses:

```sh
node --import=tsx src/app.tsx
```

The example uses top-level `await`, so the file must be an ES module.

The example uses three parts of the public API:

- `render(node)` mounts the tree on `process.stdout` and returns an `Instance`. Hooks that read input use `process.stdin`.
- `useApp()` returns `exit`, which unmounts the app.
- `waitUntilExit()` returns a promise that settles when the app unmounts.

## Preview

This is the frame the counter app draws at the third tick. The preview is rendered from the same JSX by the package itself, so it shows what the code produces.

<TerminalPreview id="getting-started-counter" />

## Exiting

`exit()` unmounts the app. The promise returned by `waitUntilExit()` settles based on the argument passed to `exit()`:

| Call | `waitUntilExit()` |
| --- | --- |
| `exit()` | Resolves with `undefined`. |
| `exit(value)` | Resolves with `value`. |
| `exit(new Error('...'))` | Rejects with the error. |

`unmount()` on the `Instance` ends the app without a value.

To quit from the keyboard, read input with `useInput`:

```tsx
import {Text, render, useApp, useInput} from '@nemesis-oss/termina-core';

const QuitHint = () => {
	const {exit} = useApp();

	useInput(input => {
		if (input === 'q') {
			exit();
		}
	});

	return <Text>Press q to quit</Text>;
};

const {waitUntilExit} = render(<QuitHint />);

await waitUntilExit();
console.log('quit');
```

Input hooks such as `useInput` put the terminal into raw mode while they are mounted. In raw mode, Ctrl+C is delivered to the app as input. With `exitOnCtrlC` set to its default, `true`, the app exits on Ctrl+C. Without raw mode, the terminal sends Ctrl+C to the process as `SIGINT` instead.

`useInput` needs `process.stdin` to support raw mode. When `process.stdin` is not a TTY, for example when input is piped, mounting `useInput` fails with `Raw mode is not supported on the current process.stdin`, and the app exits with that error. Run input examples in a terminal.

If Node's event loop becomes empty while `waitUntilExit()` is pending, Node emits `beforeExit` and Ink unmounts the app.

See [Keyboard and Focus](/guide/keyboard-and-focus) for `useInput` options and key names.

## Non-interactive output

Ink decides at startup whether to redraw the output in place. This is interactive mode. Ink uses non-interactive mode when any of the following is true:

- `stdout.isTTY` is not `true`, for example when stdout is piped or redirected to a file.
- The `TERM` environment variable is `dumb`.
- CI is detected by the `is-in-ci` package.

The `interactive` option overrides this decision. See [Rendering](/guide/rendering) for the full list of differences.

In non-interactive mode Ink does not redraw. It writes `<Static>` output when that output is rendered. It writes the dynamic output once, when the app unmounts. Console output is written as it is logged. Running the first app with its output piped, `node --import=tsx src/app.tsx | cat`, prints the last frame once, followed by `done`.

An app that never unmounts writes no dynamic output in non-interactive mode.

## Next steps

- [Rendering](/guide/rendering): every `render()` option, frame output, `<Static>`, and `renderToString()`.
- [Layout and Text](/guide/layout-and-text): `Box`, `Text`, spacing, borders, and measurement.
- [Keyboard and Focus](/guide/keyboard-and-focus): input handling and focus.
- [Testing](/guide/testing): testing rendered output.
- [API Reference](/api/core): the exports of `@nemesis-oss/termina-core`.
