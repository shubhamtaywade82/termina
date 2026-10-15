import test, {type TestContext} from 'node:test';
import React from 'react';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {Box, Text, renderToString, useFocus} from '@nemesis-oss/termina-core';
import * as ui from '../source/index.js';
import {render} from './helpers/render.js';

const tab = '\t';
// Xterm encodes Ctrl with the modifier 5 in CSI 1 ; 5 C and CSI 1 ; 5 D.
const ctrlLeft = '\u{1B}[1;5D';
const ctrlRight = '\u{1B}[1;5C';
const verticalRule = '│';
const horizontalRule = '─';

type SplitOptions = {
	readonly direction?: 'row' | 'column';
	readonly ratio?: number;
	readonly defaultRatio?: number;
	readonly onRatioChange?: (ratio: number) => void;
	readonly minSize?: number;
	readonly breakpoint?: number;
	readonly resizable?: boolean;
};

const plain = (frame: string | undefined): string => stripAnsi(frame ?? '');

const lines = (frame: string | undefined): string[] =>
	plain(frame)
		.split('\n')
		.map((row) => row.trimEnd());

// Layout is measured after the first commit, so a frame is read only after effects have run.
const settle = async () => {
	await delay(30);
};

// Effects attach after render, so a key is written only once its listeners exist.
const pressKey = async (
	stdin: {readonly write: (data: string) => void},
	key: string,
) => {
	await delay(20);
	stdin.write(key);
	await settle();
};

// The panes hold the words `left` and `right`, so a frame shows where each one is.
// A stacked layout sizes the first pane as a percentage of the split pane's height, so the wrapper passes a height when a test stacks the panes.
const split = (width: number, options: SplitOptions = {}, height?: number) => (
	<Box width={width} height={height} flexDirection="column">
		<ui.SplitPane {...options}>
			<Text>left</Text>
			<Text>right</Text>
		</ui.SplitPane>
	</Box>
);

// Field is focusable, so Tab has a stop before and after the split pane.
function Field({
	name,
	autoFocus = false,
}: {
	readonly name: string;
	readonly autoFocus?: boolean;
}) {
	const {isFocused} = useFocus({autoFocus});

	return <Text>{`${isFocused ? '>' : ' '} ${name}`}</Text>;
}

const withFields = (width: number, options: SplitOptions = {}) => (
	<Box width={width} flexDirection="column">
		<Field autoFocus name="before" />
		<ui.SplitPane {...options}>
			<Text>left</Text>
			<Text>right</Text>
		</ui.SplitPane>
		<Field name="after" />
	</Box>
);

// The row that holds both panes, when they sit side by side. The first pane is `firstWidth` cells, then one divider cell, then the second pane.
const sideBySide = (firstWidth: number) =>
	`${'left'.padEnd(firstWidth)}${verticalRule}right`;

// The row that holds the first pane. Undefined when the panes are stacked and it is on its own row.
const paneRow = (frame: string | undefined): string | undefined =>
	lines(frame).find((row) => row.includes('left'));

test('stacks the panes as a column below the breakpoint', async (t: TestContext) => {
	const {lastFrame, unmount} = render(split(40, {breakpoint: 60}, 6));
	await settle();
	const rows = lines(lastFrame());
	unmount();

	// Six rows: the first pane takes half, three rows, then the divider, then the second pane takes the last two.
	t.assert.deepStrictEqual(rows.slice(0, 5), [
		'left',
		'',
		'',
		horizontalRule.repeat(40),
		'right',
	]);
});

test('stacks the panes at 40 columns when direction is column, at any width', async (t: TestContext) => {
	const {lastFrame, unmount} = render(split(80, {direction: 'column'}, 6));
	await settle();
	const rows = lines(lastFrame());
	unmount();

	t.assert.deepStrictEqual(rows.slice(0, 5), [
		'left',
		'',
		'',
		horizontalRule.repeat(80),
		'right',
	]);
});

test('keeps the panes side by side at the breakpoint itself', async (t: TestContext) => {
	const {lastFrame, unmount} = render(split(40, {breakpoint: 40}));
	await settle();
	const row = paneRow(lastFrame());
	unmount();

	// Default ratio of 0.5 on 40 columns gives a 20 cell first pane.
	t.assert.strictEqual(row, sideBySide(20));
});

test('splits 80 columns in half by default when the panes sit side by side', async (t: TestContext) => {
	const {lastFrame, unmount} = render(split(80, {breakpoint: 60}));
	await settle();
	const row = paneRow(lastFrame());
	unmount();

	t.assert.strictEqual(row, sideBySide(40));
});

test('clamps the first pane up to minSize', async (t: TestContext) => {
	const {lastFrame, unmount} = render(split(80, {ratio: 0.05, minSize: 10}));
	await settle();
	const row = paneRow(lastFrame());
	unmount();

	// A 0.05 ratio is 4 cells, below the 10 cell minimum.
	t.assert.strictEqual(row, sideBySide(10));
});

test('clamps the second pane up to minSize', async (t: TestContext) => {
	const {lastFrame, unmount} = render(split(80, {ratio: 0.99, minSize: 10}));
	await settle();
	const row = paneRow(lastFrame());
	unmount();

	// 80 columns less the divider and a 10 cell second pane leaves 69 for the first.
	t.assert.strictEqual(row, sideBySide(69));
});

test('renders the ratio without clamping before the first layout', async (t: TestContext) => {
	const {frames, lastFrame, unmount} = render(
		split(80, {ratio: 0.0625, minSize: 10}),
	);
	// The first frame is written before the width is measured, so no clamp applies yet.
	const firstFrame = paneRow(frames[0]);
	await settle();
	const settled = paneRow(lastFrame());
	unmount();

	t.assert.strictEqual(firstFrame, sideBySide(5));
	t.assert.strictEqual(settled, sideBySide(10));
});

test('places the divider from a controlled ratio and follows the prop', async (t: TestContext) => {
	const {lastFrame, rerender, unmount} = render(
		split(80, {ratio: 0.25, minSize: 10}),
	);
	await settle();
	const before = paneRow(lastFrame());

	rerender(split(80, {ratio: 0.75, minSize: 10}));
	await settle();
	const after = paneRow(lastFrame());
	unmount();

	t.assert.strictEqual(before, sideBySide(20));
	t.assert.strictEqual(after, sideBySide(60));
});

test('a controlled ratio reports a resize but does not move until the parent updates it', async (t: TestContext) => {
	const ratios: number[] = [];
	const {lastFrame, stdin, unmount} = render(
		withFields(80, {
			ratio: 0.25,
			minSize: 10,
			resizable: true,
			onRatioChange(ratio) {
				ratios.push(ratio);
			},
		}),
	);
	await settle();
	await pressKey(stdin, tab);
	await pressKey(stdin, ctrlRight);
	const row = paneRow(lastFrame());
	unmount();

	t.assert.deepStrictEqual(ratios, [21 / 80]);
	t.assert.strictEqual(row, sideBySide(20));
});

test('starts from defaultRatio and moves one cell per resize key', async (t: TestContext) => {
	const ratios: number[] = [];
	const {lastFrame, stdin, unmount} = render(
		withFields(80, {
			defaultRatio: 0.25,
			minSize: 10,
			resizable: true,
			onRatioChange(ratio) {
				ratios.push(ratio);
			},
		}),
	);
	await settle();
	const start = paneRow(lastFrame());
	await pressKey(stdin, tab);
	await pressKey(stdin, ctrlRight);
	const afterRight = paneRow(lastFrame());
	await pressKey(stdin, ctrlLeft);
	const afterLeft = paneRow(lastFrame());
	unmount();

	t.assert.strictEqual(start, sideBySide(20));
	t.assert.strictEqual(afterRight, sideBySide(21));
	t.assert.strictEqual(afterLeft, sideBySide(20));
	t.assert.deepStrictEqual(ratios, [21 / 80, 20 / 80]);
});

test('resize keys move the divider only after Tab has put focus on the pane', async (t: TestContext) => {
	const ratios: number[] = [];
	const {lastFrame, stdin, unmount} = render(
		withFields(80, {
			resizable: true,
			onRatioChange(ratio) {
				ratios.push(ratio);
			},
		}),
	);
	await settle();
	// The first field has focus, so the resize keys have no effect.
	await pressKey(stdin, ctrlRight);
	const beforeTab = paneRow(lastFrame());
	await pressKey(stdin, tab);
	await pressKey(stdin, ctrlRight);
	const afterTab = paneRow(lastFrame());
	unmount();

	t.assert.strictEqual(beforeTab, sideBySide(40));
	t.assert.strictEqual(afterTab, sideBySide(41));
	t.assert.deepStrictEqual(ratios, [41 / 80]);
});

test('a pane that is not resizable is not a Tab stop', async (t: TestContext) => {
	const {lastFrame, stdin, unmount} = render(withFields(80));
	await settle();
	await pressKey(stdin, tab);
	const frame = lastFrame();
	unmount();

	t.assert.ok(lines(frame).includes('> after'), plain(frame));
});

test('a resize key does nothing once the first pane is at minSize', async (t: TestContext) => {
	const ratios: number[] = [];
	const {lastFrame, stdin, unmount} = render(
		withFields(80, {
			defaultRatio: 0.125,
			minSize: 10,
			resizable: true,
			onRatioChange(ratio) {
				ratios.push(ratio);
			},
		}),
	);
	await settle();
	await pressKey(stdin, tab);
	await pressKey(stdin, ctrlLeft);
	const row = paneRow(lastFrame());
	unmount();

	t.assert.deepStrictEqual(ratios, []);
	t.assert.strictEqual(row, sideBySide(10));
});

test('throws unless there are exactly two children', (t: TestContext) => {
	t.assert.throws(
		() =>
			renderToString(
				<ui.SplitPane>
					<Text>one</Text>
				</ui.SplitPane>,
			),
		/exactly two children/,
	);
	t.assert.throws(
		() =>
			renderToString(
				<ui.SplitPane>
					<Text>one</Text>
					<Text>two</Text>
					<Text>three</Text>
				</ui.SplitPane>,
			),
		/exactly two children/,
	);
});
