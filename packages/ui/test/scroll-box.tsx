import React from 'react';
import test, {type TestContext} from 'node:test';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {Box, Text} from '@nemesis-oss/termina-core';
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

test('a controlled parent that refuses an offset gets the offset it supplied on the next key', async (t: TestContext) => {
	const offsets: number[] = [];
	// The parent keeps offset 0 and never re-renders, so every request is refused.
	const instance = render(
		<ScrollBox
			height={5}
			offset={0}
			onScroll={(offset) => {
				offsets.push(offset);
			}}
		>
			{rows.map((line) => (
				<Text key={line}>{line}</Text>
			))}
		</ScrollBox>,
	);
	await settle();

	instance.stdin.write(arrowDown);
	await settle();
	instance.stdin.write(arrowDown);
	await settle();

	// Each request starts from the refused offset 0, so both ask for 1 rather than climbing to 2.
	t.assert.deepStrictEqual(offsets, [1, 1]);
	instance.unmount();
});

test('the mouse wheel scrolls only the viewport the pointer is over', async (t: TestContext) => {
	const instance = render(<Viewport />, {mouse: true});
	await settle();

	instance.stdin.write(wheelDown(60, 20));
	await settle();
	t.assert.ok((instance.lastFrame() ?? '').includes('line 00'));

	instance.stdin.write(wheelDown(2, 2));
	await settle();
	t.assert.ok((instance.lastFrame() ?? '').includes('line 03'));
	instance.unmount();
});

test('the mouse wheel is ignored unless the app enables mouse support', async (t: TestContext) => {
	const instance = render(<Viewport />);
	await settle();

	instance.stdin.write(wheelDown(2, 2));
	await settle();
	t.assert.ok((instance.lastFrame() ?? '').includes('line 00'));
	instance.unmount();
});

test('the viewport renders under piped stdin instead of throwing', async (t: TestContext) => {
	const instance = render(<Viewport />, {mouse: true, isStdinPiped: true});
	await settle();

	t.assert.ok((instance.lastFrame() ?? '').includes('line 00'));
	instance.unmount();
});

test('the wheel does nothing over a ScrollBox that is clipped out of view', async (t: TestContext) => {
	const instance = render(
		<Box flexDirection="column" height={2} overflow="hidden">
			<ScrollBox height={5}>
				{rows.map(row => (
					<Text key={row}>{row}</Text>
				))}
			</ScrollBox>
		</Box>,
		{mouse: true},
	);
	await settle();

	// Row 5 lies inside the ScrollBox's layout rectangle but below the two-row clip, so it is not on screen.
	instance.stdin.write(wheelDown(1, 5));
	await settle();
	t.assert.ok((instance.lastFrame() ?? '').includes('line 00'));

	// Row 2 is on screen, so the same wheel step scrolls.
	instance.stdin.write(wheelDown(1, 2));
	await settle();
	t.assert.ok((instance.lastFrame() ?? '').includes('line 03'));
	instance.unmount();
});

// The thumb is the last column of each viewport row, so the track is read from the end of every line.
const trackOf = (frame: string, rows: number): string[] =>
	stripAnsi(frame)
		.split('\n')
		.slice(0, rows)
		.map(line => line.at(-1) ?? '');

const Tall = ({rows: count, showScrollbar}: {readonly rows: number; readonly showScrollbar?: boolean}) => (
	<ScrollBox height={5} showScrollbar={showScrollbar}>
		{Array.from({length: count}, (_, index) => (
			<Text key={index}>{`row ${index}`}</Text>
		))}
	</ScrollBox>
);

test('the thumb sits at the top, moves with the scroll position, and reaches the bottom at the end', async (t: TestContext) => {
	const instance = render(<Viewport />);
	await settle();
	t.assert.deepStrictEqual(trackOf(instance.lastFrame() ?? '', 5), ['█', '│', '│', '│', '│']);

	// One page of 25 rows of scroll range over 4 track gaps: a 5-row offset lands on the second row.
	instance.stdin.write(pageDown);
	await settle();
	t.assert.deepStrictEqual(trackOf(instance.lastFrame() ?? '', 5), ['│', '█', '│', '│', '│']);

	instance.stdin.write(end);
	await settle();
	t.assert.deepStrictEqual(trackOf(instance.lastFrame() ?? '', 5), ['│', '│', '│', '│', '█']);
	instance.unmount();
});

test('the thumb is sized by the visible fraction of the content', async (t: TestContext) => {
	// 5 visible rows of 6: the thumb is round(25 / 6) = 4 rows tall.
	const instance = render(<Tall rows={6} />);
	await settle();
	t.assert.deepStrictEqual(trackOf(instance.lastFrame() ?? '', 5), ['█', '█', '█', '█', '│']);

	instance.stdin.write(end);
	await settle();
	t.assert.deepStrictEqual(trackOf(instance.lastFrame() ?? '', 5), ['│', '█', '█', '█', '█']);
	instance.unmount();
});

test('no track is drawn when the content fits the viewport', async (t: TestContext) => {
	const instance = render(<Tall rows={3} />);
	await settle();

	const frame = stripAnsi(instance.lastFrame() ?? '');
	t.assert.strictEqual(frame.includes('█'), false);
	t.assert.strictEqual(frame.includes('│'), false);
	instance.unmount();
});

test('showScrollbar={false} hides the track even when the content overflows', async (t: TestContext) => {
	const instance = render(<Tall rows={30} showScrollbar={false} />);
	await settle();

	const frame = stripAnsi(instance.lastFrame() ?? '');
	t.assert.strictEqual(frame.includes('█'), false);
	t.assert.strictEqual(frame.includes('│'), false);
	instance.unmount();
});
