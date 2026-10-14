import test, {type TestContext} from 'node:test';
import React, {useState} from 'react';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {Box, Text, useFocus, useInput} from '@nemesis-oss/termina-core';
import * as ui from '../source/index.js';
import {render} from './helpers/render.js';

const escape = '\u{1B}';
// The core input parser holds a lone ESC for 40 ms to see whether it starts a sequence, so the wait must be longer than that.
const escapeWaitMs = 100;
const arrowDown = '\u{1B}[B';
const shiftTab = '\u{1B}[Z';
const tab = '\t';
const enter = '\r';
const width = 30;

const plain = (frame: string | undefined): string => stripAnsi(frame ?? '');

// Effects attach after render, so a key is written only once its listeners exist.
const pressKey = async (
	stdin: {readonly write: (data: string) => void},
	key: string,
	waitMs = 20,
) => {
	await delay(20);
	stdin.write(key);
	await delay(waitMs);
};

// Ui components are not focusable, so these tests bring their own focusable. It logs the keys it receives while it has focus.
function Field({
	name,
	log,
	autoFocus = false,
}: {
	readonly name: string;
	readonly log: string[];
	readonly autoFocus?: boolean;
}) {
	const {isFocused} = useFocus({autoFocus});

	useInput((input, key) => {
		if (isFocused && !key.tab && !key.escape) {
			log.push(`${name}:${input}`);
		}
	});

	return <Text>{`${isFocused ? '>' : ' '} ${name}`}</Text>;
}

// The field behind the modal is `out`. Pressing `m` opens the modal, which holds `in-a` and `in-b`.
function Host({
	log,
	autoFocus = false,
}: {
	readonly log: string[];
	readonly autoFocus?: boolean;
}) {
	const [isOpen, setIsOpen] = useState(false);

	useInput((input) => {
		if (input === 'm') {
			setIsOpen(true);
		}
	});

	return (
		<Box flexDirection="column" width={width} height={5}>
			<Field name="out" log={log} autoFocus={autoFocus} />
			<ui.Modal
				isOpen={isOpen}
				width={20}
				onClose={() => {
					setIsOpen(false);
				}}
			>
				<Field name="in-a" log={log} />
				<Field name="in-b" log={log} />
			</ui.Modal>
		</Box>
	);
}

const longOptions = [
	{label: 'first option in the list', value: 'first'},
	{label: 'second option in the list', value: 'second'},
	{label: 'third option in the list', value: 'third'},
];

test('the dialog overdraws the Text and Select cells under it', (t: TestContext) => {
	// Rows 0 and 4 are Text, rows 1 to 3 are the Select. The dialog is 20 columns by 3 rows, centred in the 30 by 5 parent, so it covers columns 5 to 24 and rows 1 to 3.
	const scene = (isOpen: boolean) => (
		<Box flexDirection="column" width={width} height={5}>
			<Text>{'a'.repeat(width)}</Text>
			<ui.Select options={longOptions} />
			<Text>{'e'.repeat(width)}</Text>
			<ui.Modal isOpen={isOpen} width={20} onClose={() => {}}>
				<Text>Dialog</Text>
			</ui.Modal>
		</Box>
	);

	const without = render(scene(false));
	const base = plain(without.lastFrame())
		.split('\n')
		.map((line) => line.padEnd(width));
	without.unmount();

	const withModal = render(scene(true));
	const framed = plain(withModal.lastFrame())
		.split('\n')
		.map((line) => line.padEnd(width));
	withModal.unmount();

	const dialog = [
		`╭${'─'.repeat(18)}╮`,
		`│ ${'Dialog'.padEnd(16)} │`,
		`╰${'─'.repeat(18)}╯`,
	];
	const expected = base.map((line, row) =>
		row < 1 || row > 3
			? line
			: line.slice(0, 5) + dialog[row - 1] + line.slice(25),
	);

	t.assert.ok(
		base[1]?.includes('first option in the list'),
		'the Select is visible without the Modal',
	);
	t.assert.deepStrictEqual(framed, expected);
});

const options = [
	{label: 'Red', value: 'red'},
	{label: 'Green', value: 'green'},
	{label: 'Blue', value: 'blue'},
];

test('keys do not reach a Select under an open Modal', async (t: TestContext) => {
	const picked: string[] = [];
	const scene = (isOpen: boolean) => (
		<Box flexDirection="column">
			<ui.Select
				options={options}
				onChange={(value) => {
					picked.push(value);
				}}
			/>
			<ui.Modal isOpen={isOpen} width={20} onClose={() => {}}>
				<Text>Dialog</Text>
			</ui.Modal>
		</Box>
	);

	const {stdin, rerender, unmount} = render(scene(false));

	// Control: with no Modal open, Enter selects the first option, so the Select does receive keys in this tree.
	await pressKey(stdin, enter);
	t.assert.deepStrictEqual(picked, ['red']);

	rerender(scene(true));
	await pressKey(stdin, arrowDown);
	await pressKey(stdin, enter);

	t.assert.deepStrictEqual(picked, ['red']);
	unmount();
});

test('Escape calls onClose, and other keys do not', async (t: TestContext) => {
	let closeCount = 0;
	const {stdin, unmount} = render(
		<Box flexDirection="column" width={width} height={5}>
			<ui.Modal
				isOpen
				width={20}
				onClose={() => {
					closeCount += 1;
				}}
			>
				<Text>Dialog</Text>
			</ui.Modal>
		</Box>,
	);

	await pressKey(stdin, 'x');
	t.assert.strictEqual(closeCount, 0);

	await pressKey(stdin, escape, escapeWaitMs);
	t.assert.strictEqual(closeCount, 1);
	unmount();
});

test('Tab and Shift+Tab cycle inside the open Modal and never reach the field behind it', async (t: TestContext) => {
	const log: string[] = [];
	const {stdin, unmount} = render(<Host log={log} />);

	await pressKey(stdin, 'm');
	await pressKey(stdin, 'x');
	await pressKey(stdin, tab);
	await pressKey(stdin, 'y');
	await pressKey(stdin, tab);
	await pressKey(stdin, 'z');
	await pressKey(stdin, shiftTab);
	await pressKey(stdin, 'w');

	t.assert.deepStrictEqual(log, ['in-a:x', 'in-b:y', 'in-a:z', 'in-b:w']);
	unmount();
});

test('focus returns to the field that had it when the Modal closed', async (t: TestContext) => {
	const log: string[] = [];
	const {stdin, unmount} = render(<Host autoFocus log={log} />);

	// `out` has focus, so it logs the `m` that opens the modal. Opening moves focus into the modal.
	await pressKey(stdin, 'm');
	await pressKey(stdin, 'x');
	await pressKey(stdin, escape, escapeWaitMs);
	await pressKey(stdin, 'q');

	t.assert.deepStrictEqual(log, ['out:m', 'in-a:x', 'out:q']);
	unmount();
});

test('a closed Modal renders nothing', (t: TestContext) => {
	const {lastFrame, unmount} = render(
		<Box flexDirection="column">
			<Text>base</Text>
			<ui.Modal isOpen={false} width={20} onClose={() => {}}>
				<Text>Dialog</Text>
			</ui.Modal>
		</Box>,
	);

	t.assert.strictEqual(plain(lastFrame()), 'base');
	unmount();
});
