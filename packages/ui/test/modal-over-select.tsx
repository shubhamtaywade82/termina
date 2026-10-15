import process from 'node:process';
import {createRequire} from 'node:module';
import path from 'node:path';
import test, {type TestContext} from 'node:test';
import url from 'node:url';
import delay from 'delay';
import stripAnsi from 'strip-ansi';

const require = createRequire(import.meta.url);

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const {spawn} = require('node-pty') as typeof import('node-pty');

const uiDir = url.fileURLToPath(new URL('..', import.meta.url));
const example = path.join(uiDir, 'examples/modal-over-select/index.tsx');

const escape = '\u{1B}';
const down = '\u{1B}[B';
const enter = '\r';
const ctrlC = '\u{3}';
const enterAltScreen = '\u{1B}[?1049h';
const exitAltScreen = '\u{1B}[?1049l';
const showCursor = '\u{1B}[?25h';

// Ink writes each frame between these synchronized-update markers. Inside them it erases the previous frame and writes the whole next one, so the text between two markers is a complete screen.
// eslint-disable-next-line no-control-regex, regexp/no-control-character -- The pattern matches the escape bytes Ink writes.
const frameBlock = /\u{1B}\[\?2026h(?<frame>[\s\S]*?)\u{1B}\[\?2026l/gu;

// The text of every frame, in the order written, with escape sequences removed.
const frames = (output: string): string[] =>
	Array.from(output.matchAll(frameBlock), (match) =>
		stripAnsi(match.groups?.['frame'] ?? '').replaceAll('\r\n', '\n'),
	);

const lastFrame = (output: string): string => frames(output).at(-1) ?? '';

// The pointer glyph depends on the terminal's Unicode support, so either form counts as the highlight.
const isHighlighted = (frame: string, label: string): boolean =>
	new RegExp(`^[❯›>] ${label}`, 'mu').test(frame);

// Polls until the condition holds. Output arrives asynchronously, so a fixed delay would be flaky.
const waitFor = async (isMet: () => boolean, timeoutMs = 5000) => {
	const deadline = Date.now() + timeoutMs;

	while (!isMet()) {
		if (Date.now() > deadline) {
			throw new Error('Timed out waiting for the next frame');
		}

		// eslint-disable-next-line no-await-in-loop
		await delay(20);
	}
};

type Session = {
	output: string;
	write: (input: string) => void;
	exited: Promise<number>;
	kill: () => void;
};

const start = (): Session => {
	const ps = spawn(process.execPath, ['--import=tsx', example], {
		name: 'xterm-color',
		cols: 40,
		rows: 8,
		cwd: uiDir,
		env: {
			...(process.env as Record<string, string>),
			// eslint-disable-next-line @typescript-eslint/naming-convention
			CI: 'false',
			// eslint-disable-next-line @typescript-eslint/naming-convention
			NODE_NO_WARNINGS: '1',
		},
	});

	const session: Session = {
		output: '',
		write(input: string) {
			ps.write(input);
		},
		exited: new Promise<number>((resolve) => {
			ps.onExit(({exitCode}) => {
				resolve(exitCode);
			});
		}),
		kill() {
			ps.kill();
		},
	};

	ps.onData((data) => {
		session.output += data;
	});

	return session;
};

// The example is 40 by 8. The Select sits on rows 1 to 3 and the dialog is centred over them, so the keys written here are the only input the example reads.
test('arrow keys in a Modal do not move the Select under it, and Escape hands them back (PTY)', async (t: TestContext) => {
	const ps = start();

	try {
		await waitFor(() => isHighlighted(lastFrame(ps.output), 'Apple'));
		t.assert.ok(lastFrame(ps.output).includes('Chosen: apple'));

		ps.write(down);
		await waitFor(() => isHighlighted(lastFrame(ps.output), 'Banana'));

		ps.write('m');
		await waitFor(() => lastFrame(ps.output).includes('Dialog'));
		await delay(50);
		t.assert.ok(lastFrame(ps.output).includes('Press Escape to close.'));

		// Keys in the modal produce no new frame, so the Select did not change and nothing re-rendered.
		const framesWhenOpen = frames(ps.output).length;
		ps.write(down);
		await delay(150);
		ps.write(enter);
		await delay(150);
		t.assert.strictEqual(frames(ps.output).length, framesWhenOpen);

		// A lone Escape is held for 40 ms before it is read as a key, so wait for the frame that closes the dialog.
		ps.write(escape);
		await waitFor(() => !lastFrame(ps.output).includes('Dialog'));
		await delay(50);
		t.assert.ok(isHighlighted(lastFrame(ps.output), 'Banana'));

		// Enter now reaches the Select, which chooses the row it highlighted before the modal opened.
		ps.write(enter);
		await waitFor(() => lastFrame(ps.output).includes('Chosen: banana'));
		t.assert.strictEqual(
			lastFrame(ps.output),
			[
				'Chosen: banana',
				'  Apple',
				'❯ Banana ✔',
				'  Cherry',
				'Press m to open the dialog.',
				'',
				'',
				'',
			].join('\n'),
		);

		const beforeExit = ps.output.length;
		ps.write(ctrlC);
		const exitCode = await ps.exited;

		t.assert.strictEqual(exitCode, 0);
		t.assert.ok(ps.output.slice(0, beforeExit).includes(enterAltScreen));
		t.assert.ok(ps.output.slice(beforeExit).includes(exitAltScreen));
		t.assert.ok(ps.output.slice(beforeExit).includes(showCursor));
	} finally {
		ps.kill();
	}
});
