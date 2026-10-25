import {PassThrough} from 'node:stream';
import test, {type TestContext} from 'node:test';
import React from 'react';
import delay from 'delay';
import {Text, render} from '../src/index.js';
import {bsu, esu} from '../src/write-synchronized.js';
import createStdout from './helpers/create-stdout.js';

const createInput = (): NodeJS.ReadStream => {
	const stdin = new PassThrough() as PassThrough & {
		isTTY: boolean;
		setRawMode: (isRaw: boolean) => void;
	};
	stdin.isTTY = true;
	stdin.setRawMode = () => {};
	return stdin as unknown as NodeJS.ReadStream;
};

// Each frame is written as three calls: the BSU marker, the erase and redraw, then the ESU marker. The terminal applies the redraw only at ESU, so a tick never shows a half-erased frame.
test('every interactive frame, including the first, is written between synchronized update markers', async (t: TestContext) => {
	const stdout = createStdout(80, true);
	const instance = render(<Text>tick 0</Text>, {
		stdout,
		stdin: createInput(),
		interactive: true,
		patchConsole: false,
		exitOnCtrlC: false,
	});
	await instance.waitUntilRenderFlush();

	for (let tick = 1; tick <= 3; tick++) {
		instance.rerender(<Text>{`tick ${tick}`}</Text>);
		// eslint-disable-next-line no-await-in-loop -- Each tick must flush before the next one is drawn.
		await instance.waitUntilRenderFlush();
		// eslint-disable-next-line no-await-in-loop -- Each tick must flush before the next one is drawn.
		await delay(5);
	}

	const writes = stdout.getWrites();
	const frames = writes
		.map((write, index) => ({write, index}))
		.filter(({write}) => write.includes('tick '));
	t.assert.strictEqual(frames.length, 4);
	// The first frame also hides the cursor inside the bracket, so only cursor-visibility writes may sit between a frame and its markers.
	const isCursorVisibility = (write: string) => write.startsWith('\u{1B}[?25');
	for (const {index} of frames) {
		const open = writes.lastIndexOf(bsu, index);
		const close = writes.indexOf(esu, index);
		t.assert.notStrictEqual(
			open,
			-1,
			`a BSU must open the frame at write ${index}`,
		);
		t.assert.notStrictEqual(
			close,
			-1,
			`an ESU must close the frame at write ${index}`,
		);
		t.assert.ok(
			writes.slice(open + 1, index).every((write) => isCursorVisibility(write)),
		);
		t.assert.ok(
			writes
				.slice(index + 1, close)
				.every((write) => isCursorVisibility(write)),
		);
	}

	instance.unmount();
});

test('a non-interactive render writes no synchronized update markers', (t: TestContext) => {
	const stdout = createStdout(80, true);
	const instance = render(<Text>tick 0</Text>, {
		stdout,
		stdin: createInput(),
		interactive: false,
		patchConsole: false,
	});
	instance.rerender(<Text>tick 1</Text>);
	instance.unmount();

	t.assert.strictEqual(stdout.getWrites().includes(bsu), false);
	t.assert.strictEqual(stdout.getWrites().includes(esu), false);
});
