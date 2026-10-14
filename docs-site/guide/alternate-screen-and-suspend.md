---
outline: [2, 3]
---

# Alternate Screen and Suspend

The alternate screen runs the app on a separate buffer, and the primary screen returns when the app exits. `suspendTerminal()` gives the terminal to a child process, such as an editor or a pager, and takes it back when the child exits. Use this page for a full-screen app, for an app that starts a program that needs the terminal, or to see what Ink writes during either.

For the render options these build on, see [Rendering](/guide/rendering). For mouse tracking across a suspension, see [Mouse](/guide/mouse).

## Preview

A ten-row layout with a notes.txt header and a key-hint footer, showing the status line in its first state, before `e` has been pressed.

<TerminalPreview id="alternate-screen-and-suspend-viewer-idle" />

## Alternate screen

Pass `alternateScreen: true` to `render()`. The option is off by default. It takes effect only when the renderer is interactive and stdout is a TTY. In non-interactive mode, or when stdout is not a TTY, it is ignored.

The renderer writes these sequences:

1. When `render()` creates the renderer, it writes `ESC [?1049h`, which switches to the alternate buffer, and hides the cursor.
2. Frames are drawn on the alternate buffer.
3. On unmount, it writes `ESC [?1049l`, which returns to the primary buffer, and then `ESC [?25h`, which shows the cursor.

Output written during teardown is not replayed onto the primary screen. Ink restores the primary buffer after React's cleanup. Teardown-time frames, `useStdout().write()` output and `console.*` output are not replayed after the primary screen is restored.

### Exit paths

The primary screen is restored on each of these exits:

- `exit()` from `useApp()`, or a call to `unmount()`.
- Ctrl+C, when `exitOnCtrlC` is `true`, which is the default, and input is in raw mode.
- Process exit. Ink registers its unmount with `signal-exit`, so the primary screen is restored when the process exits.

The pty test in `packages/core/test/alternate-screen-exit.tsx` checks the byte stream for both `q` and Ctrl+C. It checks that the alternate buffer is entered before the first frame, that it is left only after the key is handled, and that the cursor is shown after it is left.

### Scrollback and `<Static>` output

The alternate buffer has no scrollback. While the alternate screen is in use, Ink keeps all `<Static>` output in memory. It writes that output again whenever it clears the viewport: on a full clear, when a frame taller than the viewport replaces an earlier frame, and on a resize. The stored output grows for the life of the app.

## Suspending the terminal

`suspendTerminal` is a property of the object returned by `useApp()`:

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

`SuspendTerminal` and `TerminalSuspension` are exported as types from `@nemesis-oss/termina-core`.

There are two forms.

**Callback form.** `await suspendTerminal(async () => { ... })` hands over the terminal, runs the callback, and resumes in a `finally` block. If the callback throws, the terminal is still reclaimed and the error is rethrown to the caller.

**Handle form.** `const suspension = await suspendTerminal()` returns a `TerminalSuspension`. Call `suspension.resume()` to take the terminal back. A second call to `resume()` does nothing. `await using suspension = await suspendTerminal()` calls the same function, through `Symbol.asyncDispose`, when the enclosing block exits.

Only one suspension can be active at a time. A call to `suspendTerminal()` while the terminal is already suspended rejects with the message `The terminal is already suspended. Resume the current suspension before suspending again.`

When the renderer is not interactive, the callback still runs, but Ink does not hand over the terminal. The handle form returns a suspension whose `resume()` does nothing.

### Handover

When the renderer is interactive, Ink does the following, in this order:

1. Flushes pending throttled renders and log writes, so the screen is settled.
2. Erases its frame and shows the cursor.
3. Pops the kitty keyboard protocol if it is enabled.
4. Leaves the alternate screen if `alternateScreen` is on.
5. Turns off bracketed paste and mouse tracking, for each mode a mounted component uses.
6. If raw mode is on, turns it off, unrefs stdin, detaches its input listener and resets its key parser.

While the terminal is suspended:

- Ink writes nothing to stdout or stderr. Render passes are discarded, and a resize lays out the tree without writing.
- Output through `useStdout().write()` and `useStderr().write()` is dropped. So is `console.*` output when `patchConsole` is on, which is the default.
- Ink does not read stdin, so the child process receives the keys.

Input is released before anything is written to the screen. If that step fails, for example because `setRawMode(false)` throws, the screen is left as it was, Ink turns input back on, clears the suspended state and rethrows the error. A later call to `suspendTerminal()` works.

### Resume

When the renderer is interactive, resuming does the following:

1. Turns raw mode back on, and turns bracketed paste and mouse tracking back on, for the components that still use them. Hooks that changed during the suspension are respected.
2. On the alternate screen, enters it again and writes the `<Static>` output it kept, as it does on a full clear. In debug mode the redraw writes that output itself, so the replay is skipped.
3. Pushes the kitty keyboard protocol again with the same flags, if it was enabled.
4. Forgets the last frame and draws the frame again in full, at the cursor position the child process left. Nothing above the frame is erased. The redraw hides the cursor again.

The promise returned by `suspendTerminal()`, or by `resume()`, settles after the redraw has been written.

### Stop signals

A stop signal (`SIGTSTP`, sent by Ctrl+Z when the terminal is in cooked mode, or by `kill -TSTP`) takes the same handover as `suspendTerminal()`, then stops the process with `SIGSTOP`. A shell's job control reports that stop as it reports Ctrl+Z. On `SIGCONT`, Ink resumes as described above. Before this, a stopped app left the alternate screen, the hidden cursor and the kitty keyboard protocol on under the shell.

If another `SIGTSTP` listener is registered, Ink does nothing and that listener decides.

Ink does not handle `SIGTSTP` or `SIGCONT` when it is not interactive.

Exit signals (`SIGINT`, `SIGTERM`, `SIGHUP`) and an uncaught error unmount the app first. The unmount leaves the alternate screen, shows the cursor and pops the kitty keyboard protocol, so the shell gets the terminal back in its own state.

### Example

This app opens `$EDITOR`, or `vi` when `EDITOR` is not set, on `notes.txt` when `e` is pressed, and quits when `q` is pressed. The editor runs in the terminal that Ink has handed over.

```tsx
import {spawn} from 'node:child_process';
import process from 'node:process';
import {useState} from 'react';
import {Box, Text, render, useApp, useInput} from '@nemesis-oss/termina-core';

const runChild = async (command: string, args: string[]): Promise<void> =>
	new Promise((resolve, reject) => {
		// stdio: 'inherit' gives the child the terminal, so Ink must release it first.
		const child = spawn(command, args, {stdio: 'inherit'});

		child.on('error', reject);
		child.on('exit', code => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`exited with code ${code ?? 'unknown'}`));
			}
		});
	});

const Viewer = () => {
	const {exit, suspendTerminal} = useApp();
	const [status, setStatus] = useState('press e to edit notes.txt, q to quit');

	useInput(input => {
		if (input === 'q') {
			exit();
			return;
		}

		if (input !== 'e') {
			return;
		}

		void (async () => {
			try {
				await suspendTerminal(async () => {
					await runChild(process.env['EDITOR'] ?? 'vi', ['notes.txt']);
				});
				setStatus('back from the editor');
			} catch (error) {
				setStatus(`editor failed: ${(error as Error).message}`);
			}
		})();
	});

	return (
		<Box borderStyle="round" paddingX={1}>
			<Text>{status}</Text>
		</Box>
	);
};

const {waitUntilExit} = render(<Viewer />, {alternateScreen: true});

await waitUntilExit();
console.log('done');
```

The editor runs on the primary screen, because Ink leaves the alternate screen before the handover. When the editor exits, Ink enters the alternate screen again and draws the frame.

### Limits

- Ink erases only its own frame. Anything the child process writes above the frame stays on screen.
- A child process started with `suspendTerminal()` runs on the primary screen. A child that uses the alternate screen itself enters and leaves it on its own.
- Output written by Ink or by `console.*` during the handover is dropped. Send child output through the child's own stdio, and log from the app after `suspendTerminal()` returns.

The pty test in `packages/core/test/suspend-terminal.tsx` runs a child process in a pseudo-terminal. It checks that the child's output appears before Ink's redraw. See [Testing](/guide/testing) for how the pty helpers work.
