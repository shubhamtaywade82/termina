import {Readable} from 'node:stream';
import test, {type TestContext} from 'node:test';
import React from 'react';
import delay from 'delay';
import {render, useInput, type Key} from '../src/index.js';
import {escapeFlushDelayMilliseconds} from '../src/input-parser.js';
import createStdout from './helpers/create-stdout.js';

const esc = '\u{1B}';

const createInput = (): Readable & {isTTY: boolean; setRawMode: () => void} => {
	const stdin = Object.assign(new Readable({read() {}}), {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		isTTY: true,
		setRawMode() {},
	});
	stdin.setEncoding('utf8');
	return stdin;
};

// Mounts a probe that records every key it receives, so each test can assert on what was delivered and when.
const mountProbe = async (t: TestContext) => {
	const keys: Array<{input: string; key: Key}> = [];

	function Probe() {
		useInput((input, key) => {
			keys.push({input, key});
		});
		return null;
	}

	const stdout = createStdout(80, true);
	const stdin = createInput();
	const instance = render(<Probe />, {
		stdout,
		stdin: stdin as unknown as NodeJS.ReadStream,
		stderr: stdout,
		interactive: true,
		exitOnCtrlC: false,
		patchConsole: false,
	});
	t.after(() => {
		instance.unmount();
		stdin.destroy();
	});

	await instance.waitUntilRenderFlush();
	return {keys, stdin};
};

test('the escape flush window is 25-50 ms, the range that keeps split sequences intact without making Escape feel stuck', (t: TestContext) => {
	t.assert.ok(escapeFlushDelayMilliseconds >= 25);
	t.assert.ok(escapeFlushDelayMilliseconds <= 50);
});

test('a lone ESC is held for the flush window, then delivered once as the Escape key', async (t: TestContext) => {
	const {keys, stdin} = await mountProbe(t);

	stdin.push(esc);
	await delay(5);
	t.assert.strictEqual(
		keys.length,
		0,
		'ESC must not be delivered before the window closes',
	);

	await delay(escapeFlushDelayMilliseconds + 150);
	t.assert.strictEqual(keys.length, 1);
	t.assert.strictEqual(keys[0]?.key.escape, true);
});

test('an ESC whose CSI tail arrives inside the window is one arrow key, not Escape followed by text', async (t: TestContext) => {
	const {keys, stdin} = await mountProbe(t);

	stdin.push(esc);
	// Half the window: well inside it, even on a busy host.
	await delay(Math.floor(escapeFlushDelayMilliseconds / 4));
	stdin.push('[A');
	await delay(escapeFlushDelayMilliseconds + 150);

	t.assert.strictEqual(keys.length, 1);
	t.assert.strictEqual(keys[0]?.key.upArrow, true);
	t.assert.strictEqual(keys[0]?.key.escape, false);
});

test('an ESC whose tail arrives after the window is delivered as Escape and then literal text', async (t: TestContext) => {
	const {keys, stdin} = await mountProbe(t);

	stdin.push(esc);
	await delay(escapeFlushDelayMilliseconds + 150);
	stdin.push('[A');
	await delay(150);

	t.assert.strictEqual(keys[0]?.key.escape, true);
	t.assert.strictEqual(
		keys.some(({key}) => key.upArrow),
		false,
	);
	// Printable text is one chunk, so the late tail stays literal as a single event.
	t.assert.deepStrictEqual(
		keys.slice(1).map(({input}) => input),
		['[A'],
	);
});

test('a second ESC inside the window restarts the window instead of letting the first timer fire', async (t: TestContext) => {
	const {keys, stdin} = await mountProbe(t);

	stdin.push(esc);
	await delay(Math.floor(escapeFlushDelayMilliseconds / 2));
	stdin.push(esc);
	// The first timer's deadline is `escapeFlushDelayMilliseconds` after the first push, which is 5 ms before this check. Nothing may be delivered yet.
	await delay(Math.floor(escapeFlushDelayMilliseconds / 2) + 5);
	t.assert.strictEqual(
		keys.length,
		0,
		'the first timer must be cancelled by the second ESC',
	);

	await delay(escapeFlushDelayMilliseconds + 150);
	// Two ESC bytes with nothing after them are one pending unit, so they are delivered once.
	t.assert.strictEqual(keys.length, 1);
});
