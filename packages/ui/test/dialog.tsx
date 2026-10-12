/* eslint-disable no-await-in-loop */
import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {Box, Text, useInput} from '@nemesis-oss/termina-core';
import {render} from './helpers/render.js';
import {Dialog} from '../source/components/dialog/index.js';

const escape = '\u001B';
// The core input parser holds a lone ESC for 40 ms to see whether it starts a sequence, so waiting for 20 ms would miss it.
const escapeWaitMs = 100;

const plain = (frame: string | undefined): string => stripAnsi(frame ?? '');

const uniqueLineWidths = (frame: string | undefined): number[] => [
	...new Set(plain(frame).split('\n').map(line => line.length)),
];

const confirmDialog = (onClose?: () => void, width?: number) => (
	<Dialog title="Confirm" onClose={onClose} width={width}>
		<Text>Delete 3 files?</Text>
	</Dialog>
);

// Effects attach after render, so the key is written only once the listener exists.
const pressKey = async (
	stdin: {readonly write: (data: string) => void},
	key: string,
	waitMs = 20,
) => {
	await delay(20);
	stdin.write(key);
	await delay(waitMs);
};

function KeyLogger({log}: {readonly log: string[]}) {
	useInput((input, key) => {
		log.push(key.escape ? 'escape' : input);
	});

	return null;
}

test('renders the title, a blank row, the content, and the footer inside a rounded border', (t: TestContext) => {
	const {lastFrame} = render(confirmDialog(() => {}, 30));

	t.assert.strictEqual(
		plain(lastFrame()),
		[
			`╭${'─'.repeat(28)}╮`,
			`│ ${'Confirm'.padEnd(26)} │`,
			`│${' '.repeat(28)}│`,
			`│ ${'Delete 3 files?'.padEnd(26)} │`,
			`│${' '.repeat(28)}│`,
			`│ ${'Esc to close'.padEnd(26)} │`,
			`╰${'─'.repeat(28)}╯`,
		].join('\n'),
	);
});

test('stacks several children in one column without blank rows between them', (t: TestContext) => {
	const {lastFrame} = render(
		<Dialog title="Confirm" width={30}>
			<Text>Remove 3 files?</Text>
			<Text>This cannot be undone.</Text>
		</Dialog>,
	);

	t.assert.strictEqual(
		plain(lastFrame()),
		[
			`╭${'─'.repeat(28)}╮`,
			`│ ${'Confirm'.padEnd(26)} │`,
			`│${' '.repeat(28)}│`,
			`│ ${'Remove 3 files?'.padEnd(26)} │`,
			`│ ${'This cannot be undone.'.padEnd(26)} │`,
			`╰${'─'.repeat(28)}╯`,
		].join('\n'),
	);
});

test('applies the default theme: blue border, bold title, dim footer', (t: TestContext) => {
	const {lastFrame} = render(confirmDialog(() => {}, 30));

	const frame = lastFrame() ?? '';
	t.assert.ok(frame.includes(chalk.blue(`╭${'─'.repeat(28)}╮`)));
	t.assert.ok(frame.includes(chalk.bold('Confirm')));
	t.assert.ok(frame.includes(chalk.dim('Esc to close')));
});

test('hides the footer when onClose is omitted', (t: TestContext) => {
	const {lastFrame} = render(confirmDialog());

	t.assert.ok(plain(lastFrame()).includes('Confirm'));
	t.assert.ok(!plain(lastFrame()).includes('Esc to close'));
});

test('Escape calls onClose', async (t: TestContext) => {
	let closeCount = 0;
	const {stdin} = render(
		confirmDialog(() => {
			closeCount++;
		}),
	);

	await pressKey(stdin, escape, escapeWaitMs);

	t.assert.strictEqual(closeCount, 1);
});

test('keys other than Escape do not call onClose', async (t: TestContext) => {
	let closeCount = 0;
	const {lastFrame, stdin} = render(
		confirmDialog(() => {
			closeCount++;
		}),
	);
	const frameBefore = lastFrame();

	for (const key of ['x', '\r', '\u001B[A', '\u001B[B']) {
		await pressKey(stdin, key);
	}

	t.assert.strictEqual(closeCount, 0);
	t.assert.strictEqual(lastFrame(), frameBefore);
});

test('no key changes the dialog when onClose is omitted', async (t: TestContext) => {
	const {lastFrame, stdin} = render(confirmDialog());
	const frameBefore = lastFrame();

	await pressKey(stdin, escape, escapeWaitMs);
	await pressKey(stdin, 'x');
	await pressKey(stdin, '\r');

	t.assert.strictEqual(lastFrame(), frameBefore);
});

test('stays on screen after Escape, so the parent decides whether to unmount it', async (t: TestContext) => {
	const {lastFrame, stdin} = render(confirmDialog(() => {}));

	await pressKey(stdin, escape, escapeWaitMs);

	t.assert.ok(plain(lastFrame()).includes('Confirm'));
	t.assert.ok(plain(lastFrame()).includes('Esc to close'));
});

test('adding or removing onClose after mount toggles the footer and Escape', async (t: TestContext) => {
	let closeCount = 0;
	const handleClose = () => {
		closeCount++;
	};
	const {lastFrame, rerender, stdin} = render(confirmDialog());

	rerender(confirmDialog(handleClose));
	await delay(20);
	t.assert.ok(plain(lastFrame()).includes('Esc to close'));
	await pressKey(stdin, escape, escapeWaitMs);
	t.assert.strictEqual(closeCount, 1);

	rerender(confirmDialog());
	await delay(20);
	t.assert.ok(!plain(lastFrame()).includes('Esc to close'));
	await pressKey(stdin, escape, escapeWaitMs);
	t.assert.strictEqual(closeCount, 1);
});

test('renders in normal flow without overlaying the content above and below it', (t: TestContext) => {
	const {lastFrame} = render(
		<Box flexDirection="column">
			<Text>above</Text>
			{confirmDialog(undefined, 20)}
			<Text>below</Text>
		</Box>,
	);

	t.assert.strictEqual(
		plain(lastFrame()),
		[
			'above',
			`╭${'─'.repeat(18)}╮`,
			`│ ${'Confirm'.padEnd(16)} │`,
			`│${' '.repeat(18)}│`,
			`│ ${'Delete 3 files?'.padEnd(16)} │`,
			`╰${'─'.repeat(18)}╯`,
			'below',
		].join('\n'),
	);
});

test('does not trap focus: other input handlers still receive Escape and other keys', async (t: TestContext) => {
	const keys: string[] = [];
	let closeCount = 0;
	const {stdin} = render(
		<>
			{confirmDialog(() => {
				closeCount++;
			})}
			<KeyLogger log={keys} />
		</>,
	);

	await pressKey(stdin, 'a');
	await pressKey(stdin, escape, escapeWaitMs);

	t.assert.deepStrictEqual(keys, ['a', 'escape']);
	t.assert.strictEqual(closeCount, 1);
});

test('fills the terminal width at the root and the width of a column parent when width is omitted', (t: TestContext) => {
	const atRoot = render(confirmDialog());
	const inColumn = render(<Box flexDirection="column">{confirmDialog()}</Box>);

	t.assert.deepStrictEqual(uniqueLineWidths(atRoot.lastFrame()), [100]);
	t.assert.deepStrictEqual(uniqueLineWidths(inColumn.lastFrame()), [100]);
});

test('is only as wide as its content inside a row parent', (t: TestContext) => {
	const {lastFrame} = render(<Box>{confirmDialog()}</Box>);

	// No parent width to stretch into, so the box shrinks to its widest line: 15 columns of text plus 4 for padding and border.
	t.assert.deepStrictEqual(uniqueLineWidths(lastFrame()), [19]);
});

test('wraps a long title and long content inside the border', (t: TestContext) => {
	const {lastFrame} = render(
		<Dialog title="A title that is far too long" width={20}>
			<Text>Content that also needs several lines</Text>
		</Dialog>,
	);

	t.assert.deepStrictEqual(uniqueLineWidths(lastFrame()), [20]);
	t.assert.strictEqual(plain(lastFrame()).split('\n').length, 8);
});

test('renders the footer but ignores Escape when stdin is piped', async (t: TestContext) => {
	let closeCount = 0;
	const {lastFrame, stdin} = render(
		confirmDialog(() => {
			closeCount++;
		}),
		{isStdinPiped: true},
	);

	await pressKey(stdin, escape, escapeWaitMs);

	t.assert.ok(plain(lastFrame()).includes('Confirm'));
	t.assert.ok(plain(lastFrame()).includes('Esc to close'));
	t.assert.strictEqual(closeCount, 0);
});
