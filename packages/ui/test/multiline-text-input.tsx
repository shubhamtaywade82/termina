/* eslint-disable no-await-in-loop -- Each key waits for the editor to commit it before the next key is written. */
import test, {type TestContext} from 'node:test';
import React, {useState} from 'react';
import chalk from 'chalk';
import delay from 'delay';
import {Box, Text, usePaste} from '@nemesis-oss/termina-core';
import {MultilineTextInput} from '../source/components/multiline-text-input/index.js';
import {render} from './helpers/render.js';

const cursor = (character = ' ') => chalk.inverse(character);

const pasteStart = '\u{1B}[200~';
const pasteEnd = '\u{1B}[201~';

const keys = {
	left: '\u{1B}[D',
	right: '\u{1B}[C',
	up: '\u{1B}[A',
	down: '\u{1B}[B',
	home: '\u{1B}[H',
	end: '\u{1B}[F',
	delete: '\u{1B}[3~',
	backspace: '\u{7F}',
	enter: '\r',
	tab: '\t',
	ctrlA: '\u{1}',
	ctrlD: '\u{4}',
};

// A sibling that mounts usePaste. While it is mounted, paste is delivered on the paste channel and never reaches useInput.
const PasteListener = ({
	onPaste,
}: {
	readonly onPaste: (text: string) => void;
}) => {
	usePaste(onPaste);
	return null;
};

// Writes each key on its own, so the editor commits each one before the next arrives.
const press = async (
	write: (data: string) => void,
	sequence: string[],
): Promise<void> => {
	for (const key of sequence) {
		write(key);
		await delay(30);
	}
};

test('an empty value shows the placeholder on the first row', (t: TestContext) => {
	const {lastFrame} = render(
		<MultilineTextInput placeholder="Start typing..." rows={2} />,
	);

	t.assert.strictEqual(
		lastFrame(),
		cursor('S') + chalk.dim('tart typing...') + '\n',
	);
});

test('an empty value with no placeholder shows the caret', (t: TestContext) => {
	const {lastFrame} = render(<MultilineTextInput rows={2} />);

	t.assert.strictEqual(lastFrame(), `${cursor()}\n`);
});

test('a disabled empty value shows only the dimmed placeholder', (t: TestContext) => {
	const {lastFrame} = render(
		<MultilineTextInput isDisabled placeholder="Start typing..." rows={2} />,
	);

	t.assert.strictEqual(lastFrame(), chalk.dim('Start typing...') + '\n');
});

test('typing inserts text on the caret row', async (t: TestContext) => {
	let value: string | undefined;
	const instance = render(
		<MultilineTextInput
			rows={2}
			onChange={(next) => {
				value = next;
			}}
		/>,
	);

	await delay(50);
	instance.stdin.write('ab');
	await delay(50);
	instance.unmount();

	t.assert.strictEqual(value, 'ab');
	t.assert.strictEqual(instance.lastFrame(), `ab${cursor()}\n`);
});

test('Enter inserts a newline and does not submit', async (t: TestContext) => {
	let value: string | undefined;
	const submitted: string[] = [];
	const instance = render(
		<MultilineTextInput
			rows={3}
			onChange={(next) => {
				value = next;
			}}
			onSubmit={(next) => {
				submitted.push(next);
			}}
		/>,
	);

	await delay(50);
	await press(instance.stdin.write, ['a', keys.enter, 'b']);
	await delay(50);
	instance.unmount();

	t.assert.strictEqual(value, 'a\nb');
	t.assert.deepStrictEqual(submitted, []);
	t.assert.strictEqual(instance.lastFrame(), `a\nb${cursor()}\n`);
});

test('Ctrl+D submits the value with its line feeds', async (t: TestContext) => {
	const submitted: string[] = [];
	const instance = render(
		<MultilineTextInput
			rows={3}
			onSubmit={(value) => {
				submitted.push(value);
			}}
		/>,
	);

	await delay(50);
	await press(instance.stdin.write, ['a', keys.enter, 'b', keys.ctrlD]);
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(submitted, ['a\nb']);
});

test('a burst of text with a carriage return between letters gives a line feed', async (t: TestContext) => {
	let value: string | undefined;
	const instance = render(
		<MultilineTextInput
			rows={2}
			onChange={(next) => {
				value = next;
			}}
		/>,
	);

	await delay(50);
	instance.stdin.write('a\rb');
	await delay(50);
	instance.unmount();

	t.assert.strictEqual(value, 'a\nb');
});

const keyCases: Array<[string, string[], string]> = [
	['left moves one grapheme back', [keys.left], 'ab\ncXd'],
	['left crosses the line feed', [keys.left, keys.left, keys.left], 'abX\ncd'],
	[
		'left past the line feed continues on the first row',
		[keys.left, keys.left, keys.left, keys.left],
		'aXb\ncd',
	],
	['right at the end does nothing', [keys.right], 'ab\ncdX'],
	['up keeps the column on the row above', [keys.up], 'abX\ncd'],
	['up then left', [keys.up, keys.left], 'aXb\ncd'],
	['home moves to the start of the line', [keys.home], 'ab\nXcd'],
	['up then end moves to the end of that line', [keys.up, keys.end], 'abX\ncd'],
	['up then down returns to the column', [keys.up, keys.down], 'ab\ncdX'],
	['up on the first row does nothing', [keys.up, keys.up], 'abX\ncd'],
	['down on the last row does nothing', [keys.down], 'ab\ncdX'],
	[
		'backspace deletes the grapheme before the caret',
		[keys.backspace],
		'ab\ncX',
	],
	[
		'backspace crosses the line feed',
		[keys.backspace, keys.backspace, keys.backspace],
		'abX',
	],
	['delete at the end does nothing', [keys.delete], 'ab\ncdX'],
	[
		'delete crosses the line feed',
		[keys.left, keys.left, keys.left, keys.delete],
		'abXcd',
	],
	['Enter inserts a newline', [keys.enter], 'ab\ncd\nX'],
	['Tab is not text', [keys.tab], 'ab\ncdX'],
	['a control chord is not text', [keys.ctrlA], 'ab\ncdX'],
	[
		'backspace at the start of the value does nothing',
		[keys.up, keys.up, keys.home, keys.backspace],
		'Xab\ncd',
	],
];

for (const [label, sequence, expected] of keyCases) {
	test(`key table: ${label}`, async (t: TestContext) => {
		let value: string | undefined;
		const instance = render(
			<MultilineTextInput
				defaultValue={'ab\ncd'}
				rows={3}
				onChange={(next) => {
					value = next;
				}}
			/>,
		);

		await delay(50);
		await press(instance.stdin.write, sequence);
		instance.stdin.write('X');
		await delay(50);
		instance.unmount();

		t.assert.strictEqual(value, expected);
	});
}

test('a paste with CRLF line endings keeps one line feed per line', async (t: TestContext) => {
	let value: string | undefined;
	const instance = render(
		<>
			<MultilineTextInput
				rows={3}
				onChange={(next) => {
					value = next;
				}}
			/>
			<PasteListener onPaste={() => {}} />
		</>,
	);

	await delay(50);
	instance.stdin.write(`${pasteStart}a\r\nb\r\nc${pasteEnd}`);
	await delay(50);
	instance.unmount();

	t.assert.strictEqual(value, 'a\nb\nc');
});

test('control characters are removed from a paste and tabs become spaces', async (t: TestContext) => {
	let value: string | undefined;
	const instance = render(
		<>
			<MultilineTextInput
				rows={2}
				onChange={(next) => {
					value = next;
				}}
			/>
			<PasteListener onPaste={() => {}} />
		</>,
	);

	await delay(50);
	instance.stdin.write(`${pasteStart}a\u{7}b\u{1B}c\u{7F}d\te${pasteEnd}`);
	await delay(50);
	instance.unmount();

	// BEL, ESC and DEL are removed. The tab becomes four spaces.
	t.assert.strictEqual(value, 'abcd    e');
});

test('the editor keeps rows lines of height when they are empty', (t: TestContext) => {
	const {lastFrame} = render(
		<Box flexDirection="column">
			<MultilineTextInput defaultValue="a" rows={3} />
			<Text>after</Text>
		</Box>,
	);

	t.assert.strictEqual(lastFrame(), `a${cursor()}\n\n\nafter`);
});

test('a long value scrolls vertically so the caret row stays visible', async (t: TestContext) => {
	const instance = render(
		<MultilineTextInput
			defaultValue={'one\ntwo\nthree\nfour\nfive'}
			rows={2}
		/>,
	);

	await delay(50);
	t.assert.strictEqual(instance.lastFrame(), `four\nfive${cursor()}`);

	await press(instance.stdin.write, [keys.up]);
	t.assert.strictEqual(instance.lastFrame(), `four${cursor()}\nfive`);

	await press(instance.stdin.write, [keys.up]);
	t.assert.strictEqual(instance.lastFrame(), `thre${cursor('e')}\nfour`);

	// The goal column stays 4 through the vertical moves, so the caret sits at the end of 'one'.
	await press(instance.stdin.write, [keys.up, keys.up]);
	t.assert.strictEqual(instance.lastFrame(), `one${cursor()}\ntwo`);
	instance.unmount();
});

test('a line wider than the editor scrolls horizontally so the caret stays visible', async (t: TestContext) => {
	const line = '0123456789abcdefghijklmnopqrst';
	const instance = render(
		<Box width={10}>
			<MultilineTextInput defaultValue={line} rows={1} />
		</Box>,
	);

	await delay(50);
	t.assert.strictEqual(instance.lastFrame(), `lmnopqrst${cursor()}`);

	await press(instance.stdin.write, [keys.home]);
	t.assert.strictEqual(instance.lastFrame(), `${cursor('0')}123456789`);
	instance.unmount();
});

test('a controlled edit the parent rejects keeps the caret', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<MultilineTextInput
			value={'ab\ncd'}
			rows={2}
			onChange={(next) => {
				changes.push(next);
			}}
		/>,
	);

	await delay(50);
	await press(instance.stdin.write, [keys.left]);
	instance.stdin.write('X');
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['ab\ncXd']);
	t.assert.strictEqual(instance.lastFrame(), `ab\nc${cursor('d')}`);
});

test('a controlled value that the parent stores follows each key', async (t: TestContext) => {
	const frames: string[] = [];

	function Form() {
		const [value, setValue] = useState('');
		return <MultilineTextInput value={value} rows={2} onChange={setValue} />;
	}

	const instance = render(<Form />);

	await delay(50);
	await press(instance.stdin.write, ['a', keys.enter, 'b']);
	await delay(50);
	frames.push(instance.lastFrame() ?? '');
	instance.unmount();

	t.assert.deepStrictEqual(frames, [`a\nb${cursor()}`]);
});

test('a disabled editor ignores keys and paste', async (t: TestContext) => {
	const changes: string[] = [];
	let siblingPaste: string | undefined;
	const instance = render(
		<>
			<MultilineTextInput
				isDisabled
				defaultValue="ab"
				rows={2}
				onChange={(next) => {
					changes.push(next);
				}}
			/>
			<PasteListener
				onPaste={(text) => {
					siblingPaste = text;
				}}
			/>
		</>,
	);

	await delay(50);
	await press(instance.stdin.write, [keys.enter, 'x', keys.backspace]);
	instance.stdin.write(`${pasteStart}pasted${pasteEnd}`);
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(changes, []);
	t.assert.strictEqual(siblingPaste, 'pasted');
});

test('a value that shrinks under the caret moves the caret to its new end', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<MultilineTextInput
			value={'abc\ndef'}
			rows={2}
			onChange={(next) => {
				changes.push(next);
			}}
		/>,
	);

	await delay(50);
	instance.rerender(
		<MultilineTextInput
			value="ab"
			rows={2}
			onChange={(next) => {
				changes.push(next);
			}}
		/>,
	);
	await delay(50);
	t.assert.strictEqual(instance.lastFrame(), `ab${cursor()}\n`);

	instance.stdin.write('X');
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['abX']);
});
