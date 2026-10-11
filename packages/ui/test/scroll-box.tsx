import React from 'react';
import test, {type TestContext} from 'node:test';
import delay from 'delay';
import {Text} from '@fork/core';
import {render} from './helpers/render.js';
import {ScrollBox} from '../source/index.js';

const rows = Array.from(
	{length: 30},
	(_, index) => `line ${String(index).padStart(2, '0')}`,
);

const arrowDown = '\u001B[B';
const arrowUp = '\u001B[A';
const pageDown = '\u001B[6~';
const home = '\u001B[H';
const end = '\u001B[F';

const wheelDown = (x: number, y: number) => `\u001B[<65;${x};${y}M`;

const Viewport = ({onScroll}: {readonly onScroll?: (offset: number) => void}) => (
	<ScrollBox height={5} onScroll={onScroll}>
		{rows.map(row => (
			<Text key={row}>{row}</Text>
		))}
	</ScrollBox>
);

const settle = async () => {
	await delay(40);
};

test('the viewport shows the first rows and clips the rest', async (t: TestContext) => {
	const instance = render(<Viewport />);
	await settle();

	const frame = instance.lastFrame() ?? '';
	t.assert.ok(frame.includes('line 00'));
	t.assert.ok(frame.includes('line 04'));
	t.assert.ok(!frame.includes('line 05'));
	instance.unmount();
});

test('arrow keys scroll one row at a time', async (t: TestContext) => {
	const instance = render(<Viewport />);
	await settle();

	for (let press = 0; press < 3; press++) {
		instance.stdin.write(arrowDown);
		await delay(15);
	}

	await settle();
	const frame = instance.lastFrame() ?? '';
	t.assert.ok(frame.includes('line 03'));
	t.assert.ok(!frame.includes('line 00'));
	t.assert.ok(!frame.includes('line 08'));
	instance.unmount();
});

test('page keys move by one viewport', async (t: TestContext) => {
	const instance = render(<Viewport />);
	await settle();

	instance.stdin.write(pageDown);
	await settle();

	const frame = instance.lastFrame() ?? '';
	t.assert.ok(frame.includes('line 05'));
	t.assert.ok(!frame.includes('line 04'));
	instance.unmount();
});

test('End jumps to the last rows and Home returns to the first', async (t: TestContext) => {
	const instance = render(<Viewport />);
	await settle();

	instance.stdin.write(end);
	await settle();
	t.assert.ok((instance.lastFrame() ?? '').includes('line 29'));
	t.assert.ok(!(instance.lastFrame() ?? '').includes('line 24'));

	instance.stdin.write(home);
	await settle();
	t.assert.ok((instance.lastFrame() ?? '').includes('line 00'));
	instance.unmount();
});

test('the offset is clamped at the top and the bottom', async (t: TestContext) => {
	const instance = render(<Viewport />);
	await settle();

	instance.stdin.write(arrowUp);
	await settle();
	t.assert.ok((instance.lastFrame() ?? '').includes('line 00'));

	instance.stdin.write(end);
	instance.stdin.write(arrowDown);
	await settle();
	t.assert.ok((instance.lastFrame() ?? '').includes('line 29'));
	instance.unmount();
});

test('onScroll reports each new offset', async (t: TestContext) => {
	const offsets: number[] = [];
	const instance = render(<Viewport onScroll={offset => offsets.push(offset)} />);
	await settle();

	instance.stdin.write(arrowDown);
	await settle();
	instance.stdin.write(arrowDown);
	await settle();

	t.assert.deepStrictEqual(offsets, [1, 2]);
	instance.unmount();
});

test('the mouse wheel scrolls only the viewport the pointer is over', async (t: TestContext) => {
	const instance = render(<Viewport />);
	await settle();

	instance.stdin.write(wheelDown(60, 20));
	await settle();
	t.assert.ok((instance.lastFrame() ?? '').includes('line 00'));

	instance.stdin.write(wheelDown(2, 2));
	await settle();
	t.assert.ok((instance.lastFrame() ?? '').includes('line 03'));
	instance.unmount();
});
