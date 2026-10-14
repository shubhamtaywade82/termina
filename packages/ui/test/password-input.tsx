/* eslint-disable no-await-in-loop */
import React, {useState} from 'react';
import test, {type TestContext} from 'node:test';
import {render} from './helpers/render.js';
import chalk from 'chalk';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {PasswordInput} from '../source/index.js';

const cursor = (character = ' ') => chalk.inverse(character);
const enter = '\r';
const arrowLeft = '\u001B[D';
const arrowRight = '\u001B[C';
const del = '\u007F';

const cursorAt = (input: string, at: number): string => {
	return [...input]
		.map((character, index) => {
			return index === at ? cursor(character) : character;
		})
		.join('');
};

test('placeholder', (t: TestContext) => {
	const {lastFrame} = render(<PasswordInput placeholder="Enter password..." />);

	t.assert.strictEqual(lastFrame(), cursor('E') + chalk.dim('nter password...'));
});

test("cursor can't be moved in placeholder", async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<PasswordInput placeholder="Enter password..." />,
	);

	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);

	t.assert.strictEqual(lastFrame(), cursor('E') + chalk.dim('nter password...'));

	await delay(50);
	stdin.write(arrowRight);
	await delay(50);

	t.assert.strictEqual(lastFrame(), cursor('E') + chalk.dim('nter password...'));
});

test('hide cursor in placeholder when disabled', (t: TestContext) => {
	const {lastFrame} = render(
		<PasswordInput isDisabled placeholder="Enter password..." />,
	);

	t.assert.strictEqual(lastFrame(), chalk.dim('Enter password...'));
});

test('insert character', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<PasswordInput
			placeholder="Enter password..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('T');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `*${cursor()}`);
	t.assert.strictEqual(value, 'T');
});

test('insert text', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<PasswordInput
			placeholder="Enter password..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('Test');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `****${cursor()}`);
	t.assert.strictEqual(value, 'Test');
});

test('ignore input when disabled', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<PasswordInput
			isDisabled
			placeholder="Enter password..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('T');
	await delay(50);

	t.assert.strictEqual(lastFrame(), chalk.dim('Enter password...'));
	t.assert.strictEqual(value, undefined);
});

test('delete character', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<PasswordInput
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('Test');
	await delay(50);

	t.assert.strictEqual(value, 'Test');

	await delay(50);
	stdin.write(del);
	await delay(50);

	t.assert.strictEqual(lastFrame(), `***${cursor()}`);
	t.assert.strictEqual(value, 'Tes');
});

test('delete all text', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<PasswordInput
			placeholder="Enter password..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('Test');
	await delay(50);

	t.assert.strictEqual(value, 'Test');

	for (let press = 0; press < 4; press++) {
		await delay(50);
		stdin.write(del);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), cursor('E') + chalk.dim('nter password...'));
	t.assert.strictEqual(value, '');
});

test('move cursor to the left', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<PasswordInput />);

	await delay(50);
	stdin.write('Test');
	await delay(50);

	for (let at = 3; at >= 0; at--) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);

		t.assert.strictEqual(lastFrame(), cursorAt('****', at));
	}
});

test("cursor can't be moved left when at the beginning of the input", async (t: TestContext) => {
	const {lastFrame, stdin} = render(<PasswordInput />);

	await delay(50);
	stdin.write('Test');
	await delay(50);

	for (let press = 0; press < 5; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), cursorAt('****', 0));
});

test('move cursor to the right', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<PasswordInput />);

	await delay(50);
	stdin.write('Test');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `****${cursor()}`);

	for (let press = 0; press < 4; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), cursorAt('****', 0));

	for (let at = 1; at < 4; at++) {
		await delay(50);
		stdin.write(arrowRight);
		await delay(50);

		t.assert.strictEqual(lastFrame(), cursorAt('****', at));
	}

	await delay(50);
	stdin.write(arrowRight);
	await delay(50);

	t.assert.strictEqual(lastFrame(), `****${cursor()}`);
});

test("cursor can't be moved right when at the end of the input", async (t: TestContext) => {
	const {lastFrame, stdin} = render(<PasswordInput />);

	await delay(50);
	stdin.write('Test');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `****${cursor()}`);

	await delay(50);
	stdin.write(arrowRight);
	await delay(50);

	t.assert.strictEqual(lastFrame(), `****${cursor()}`);
});

test('insert character in the middle', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<PasswordInput
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('Hllo');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `****${cursor()}`);

	for (let press = 0; press < 3; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), `*${cursor('*')}**`);

	await delay(50);
	stdin.write('e');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `**${cursor('*')}**`);
	t.assert.strictEqual(value, 'Hello');
});

test('insert text in the middle', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<PasswordInput
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('Hllo');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `****${cursor()}`);

	for (let press = 0; press < 3; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), `*${cursor('*')}**`);

	await delay(50);
	stdin.write('eee');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `****${cursor('*')}**`);
	t.assert.strictEqual(value, 'Heeello');
});

test('submit on enter', async (t: TestContext) => {
	let submittedValue: string | undefined;

	const {stdin} = render(
		<PasswordInput
			onSubmit={value => {
				submittedValue = value;
			}}
		/>,
	);

	await delay(50);
	stdin.write('Test');
	await delay(50);

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.strictEqual(submittedValue, 'Test');
});

// Types each piece of text in order, pausing so each one is its own input event.
const typeText = async (stdin: {write: (data: string) => void}, ...pieces: string[]) => {
	for (const piece of pieces) {
		stdin.write(piece);
		await delay(20);
	}
};

test('an emoji is masked as one asterisk, not one per UTF-16 unit', async (t: TestContext) => {
	const {lastFrame, stdin, unmount} = render(<PasswordInput />);

	await delay(20);
	await typeText(stdin, 'a😀b');
	t.assert.strictEqual(lastFrame(), `***${cursor()}`);
	unmount();
});

test('a letter with a combining mark is masked as one asterisk', async (t: TestContext) => {
	const {lastFrame, stdin, unmount} = render(<PasswordInput />);

	await delay(20);
	await typeText(stdin, 'é');
	t.assert.strictEqual(lastFrame(), `*${cursor()}`);
	unmount();
});

test('the cursor highlights a whole emoji when moved over it', async (t: TestContext) => {
	const {lastFrame, stdin, unmount} = render(<PasswordInput />);

	await delay(20);
	await typeText(stdin, 'a😀', arrowLeft);
	t.assert.strictEqual(lastFrame(), `*${cursor('*')}`);
	unmount();
});

test('backspace removes a whole emoji from the mask', async (t: TestContext) => {
	const {lastFrame, stdin, unmount} = render(<PasswordInput />);

	await delay(20);
	await typeText(stdin, 'a😀', del);
	t.assert.strictEqual(lastFrame(), `*${cursor()}`);
	unmount();
});

test('the submitted value keeps the emoji intact while the display stays masked', async (t: TestContext) => {
	let submitted: string | undefined;
	const {lastFrame, stdin, unmount} = render(
		<PasswordInput
			onSubmit={value => {
				submitted = value;
			}}
		/>,
	);

	await delay(20);
	await typeText(stdin, '😀', enter);
	t.assert.strictEqual(submitted, '😀');
	t.assert.strictEqual(lastFrame(), `*${cursor()}`);
	unmount();
});

test('shows the placeholder without an error when stdin is piped', async (t: TestContext) => {
	const {lastFrame, unmount} = render(
		<PasswordInput placeholder="enter a password" />,
		{isStdinPiped: true},
	);

	await delay(20);

	const frame = stripAnsi(lastFrame() ?? '');
	t.assert.ok(frame.includes('enter a password'));
	t.assert.ok(!frame.includes('Raw mode'));
	unmount();
});

// A controlled `value` is owned by the parent. The display follows the prop, so an edit the parent ignores does not appear.

test('a controlled value is displayed masked', (t: TestContext) => {
	const {lastFrame} = render(<PasswordInput value="abc" />);

	t.assert.strictEqual(lastFrame(), `***${cursor()}`);
});

test('typing into a controlled value reports the next value and keeps the masked display', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<PasswordInput
			value="abc"
			onChange={value => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	instance.stdin.write('d');
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['abcd']);
	t.assert.strictEqual(instance.lastFrame(), `***${cursor()}`);
});

test('a parent that stores a controlled password shows each keystroke masked', async (t: TestContext) => {
	function Form() {
		const [value, setValue] = useState('');
		return <PasswordInput value={value} onChange={setValue} />;
	}

	const instance = render(<Form />);

	await delay(50);
	instance.stdin.write('a');
	await delay(30);
	instance.stdin.write('b');
	await delay(50);
	instance.unmount();

	t.assert.strictEqual(instance.lastFrame(), `**${cursor()}`);
});

test('an external shorter controlled password keeps the caret inside the value', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<PasswordInput
			value="abcd"
			onChange={value => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	instance.rerender(
		<PasswordInput
			value="xy"
			onChange={value => {
				changes.push(value);
			}}
		/>,
	);
	await delay(50);
	instance.stdin.write('Z');
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['xyZ']);
});

test('a burst into a controlled password reports one change per input event and shows the final value', async (t: TestContext) => {
	const run = async (burst: boolean) => {
		const changes: string[] = [];

		function Form() {
			const [value, setValue] = useState('');
			return (
				<PasswordInput
					value={value}
					onChange={next => {
						changes.push(next);
						setValue(next);
					}}
				/>
			);
		}

		const instance = render(<Form />);

		await delay(50);
		if (burst) {
			instance.stdin.write('ab' + del);
		} else {
			instance.stdin.write('a');
			await delay(30);
			instance.stdin.write('b');
			await delay(30);
			instance.stdin.write(del);
		}

		await delay(50);
		instance.unmount();
		return {changes, frame: instance.lastFrame()};
	};

	const sequential = await run(false);
	const burst = await run(true);

	t.assert.deepStrictEqual(sequential.changes, ['a', 'ab', 'a']);
	t.assert.deepStrictEqual(burst.changes, ['ab', 'a']);
	t.assert.strictEqual(burst.frame, sequential.frame);
});

test('a controlled password without onChange is read-only', async (t: TestContext) => {
	const instance = render(<PasswordInput value="abc" />);

	await delay(50);
	instance.stdin.write('d');
	await delay(50);
	instance.unmount();

	t.assert.strictEqual(instance.lastFrame(), `***${cursor()}`);
});
