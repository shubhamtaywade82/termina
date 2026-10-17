/* eslint-disable no-await-in-loop */
import test, {type TestContext} from 'node:test';
import React, {useState} from 'react';
import {render} from './helpers/render.js';
import chalk from 'chalk';
import delay from 'delay';
import {catNames} from 'cat-names';
import {TextInput} from '../source/index.js';

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
	const {lastFrame} = render(<TextInput placeholder="Start typing..." />);

	t.assert.strictEqual(lastFrame(), cursor('S') + chalk.dim('tart typing...'));
});

test("cursor can't be moved in placeholder", async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<TextInput placeholder="Start typing..." />,
	);

	await delay(50);
	stdin.write(arrowLeft);
	await delay(50);

	t.assert.strictEqual(lastFrame(), cursor('S') + chalk.dim('tart typing...'));

	await delay(50);
	stdin.write(arrowRight);
	await delay(50);

	t.assert.strictEqual(lastFrame(), cursor('S') + chalk.dim('tart typing...'));
});

test('hide cursor in placeholder when disabled', (t: TestContext) => {
	const {lastFrame} = render(
		<TextInput isDisabled placeholder="Start typing..." />,
	);

	t.assert.strictEqual(lastFrame(), chalk.dim('Start typing...'));
});

test('default value', (t: TestContext) => {
	const {lastFrame} = render(
		<TextInput defaultValue="Test" placeholder="Start typing..." />,
	);

	t.assert.strictEqual(lastFrame(), `Test${cursor()}`);
});

test('hide cursor in value when disabled', (t: TestContext) => {
	const {lastFrame} = render(
		<TextInput isDisabled defaultValue="Test" placeholder="Start typing..." />,
	);

	t.assert.strictEqual(lastFrame(), 'Test');
});

test('insert character', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<TextInput
			placeholder="Start typing..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('T');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `T${cursor()}`);
	t.assert.strictEqual(value, 'T');
});

test('insert text', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<TextInput
			placeholder="Start typing..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('Test');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `Test${cursor()}`);
	t.assert.strictEqual(value, 'Test');
});

test('ignore input when disabled', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<TextInput
			isDisabled
			placeholder="Start typing..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('T');
	await delay(50);

	t.assert.strictEqual(lastFrame(), chalk.dim('Start typing...'));
	t.assert.strictEqual(value, undefined);
});

test('delete character', async (t: TestContext) => {
	let value = 'Test';

	const {lastFrame, stdin} = render(
		<TextInput
			defaultValue={value}
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write(del);
	await delay(50);

	t.assert.strictEqual(lastFrame(), `Tes${cursor()}`);
	t.assert.strictEqual(value, 'Tes');
});

test('delete all text', async (t: TestContext) => {
	let value = 'Test';

	const {lastFrame, stdin} = render(
		<TextInput
			defaultValue={value}
			placeholder="Start typing..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	for (let press = 0; press < 4; press++) {
		await delay(50);
		stdin.write(del);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), cursor('S') + chalk.dim('tart typing...'));
	t.assert.strictEqual(value, '');
});

test('move cursor to the left', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<TextInput defaultValue="Test" />);

	for (let at = 3; at >= 0; at--) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);

		t.assert.strictEqual(lastFrame(), cursorAt('Test', at));
	}
});

test("cursor can't be moved left when at the beginning of the input", async (t: TestContext) => {
	const {lastFrame, stdin} = render(<TextInput defaultValue="Test" />);

	for (let press = 0; press < 5; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), cursorAt('Test', 0));
});

test('move cursor to the right', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<TextInput defaultValue="Test" />);

	for (let press = 0; press < 4; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), cursorAt('Test', 0));

	for (let at = 1; at < 4; at++) {
		await delay(50);
		stdin.write(arrowRight);
		await delay(50);

		t.assert.strictEqual(lastFrame(), cursorAt('Test', at));
	}

	await delay(50);
	stdin.write(arrowRight);
	await delay(50);

	t.assert.strictEqual(lastFrame(), `Test${cursor()}`);
});

test("cursor can't be moved right when at the end of the input", async (t: TestContext) => {
	const {lastFrame, stdin} = render(<TextInput defaultValue="Test" />);

	t.assert.strictEqual(lastFrame(), `Test${cursor()}`);

	await delay(50);
	stdin.write(arrowRight);
	await delay(50);

	t.assert.strictEqual(lastFrame(), `Test${cursor()}`);
});

test('insert character in the middle', async (t: TestContext) => {
	let value = 'Hllo';

	const {lastFrame, stdin} = render(
		<TextInput
			defaultValue={value}
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), `Hllo${cursor()}`);

	for (let press = 0; press < 3; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), `H${cursor('l')}lo`);

	await delay(50);
	stdin.write('e');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `He${cursor('l')}lo`);
	t.assert.strictEqual(value, 'Hello');
});

test('insert text in the middle', async (t: TestContext) => {
	let value = 'Hllo';

	const {lastFrame, stdin} = render(
		<TextInput
			defaultValue={value}
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), `Hllo${cursor()}`);

	for (let press = 0; press < 3; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), `H${cursor('l')}lo`);

	await delay(50);
	stdin.write('eee');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `Heee${cursor('l')}lo`);
	t.assert.strictEqual(value, 'Heeello');
});

test('autocomplete', async (t: TestContext) => {
	let value: string | undefined;
	let submittedValue: string | undefined;

	const {lastFrame, stdin} = render(
		<TextInput
			placeholder="Start typing..."
			suggestions={catNames as string[]}
			onChange={newValue => {
				value = newValue;
			}}
			onSubmit={newValue => {
				submittedValue = newValue;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), cursor('S') + chalk.dim('tart typing...'));

	await delay(50);
	stdin.write('A');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `A${cursor('b')}${chalk.dim('by')}`);
	t.assert.strictEqual(value, 'A');

	await delay(50);
	stdin.write('b');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `Ab${cursor('b')}${chalk.dim('y')}`);
	t.assert.strictEqual(value, 'Ab');

	await delay(50);
	stdin.write('b');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `Abb${cursor('y')}`);
	t.assert.strictEqual(value, 'Abb');

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.strictEqual(lastFrame(), `Abby${cursor()}`);
	t.assert.strictEqual(value, 'Abby');
	t.assert.strictEqual(submittedValue, 'Abby');
});

test('submit on enter', async (t: TestContext) => {
	let submittedValue: string | undefined;

	const {stdin} = render(
		<TextInput
			defaultValue="Test"
			onSubmit={value => {
				submittedValue = value;
			}}
		/>,
	);

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.strictEqual(submittedValue, 'Test');
});

test('shows the value and ignores keys when stdin is piped', async (t: TestContext) => {
	const submitted: string[] = [];
	const {lastFrame, stdin, unmount} = render(
		<TextInput defaultValue="deploy" onSubmit={value => submitted.push(value)} />,
		{isStdinPiped: true},
	);

	await delay(20);
	stdin.write('\r');
	await delay(20);

	t.assert.ok((lastFrame() ?? '').includes('deploy'));
	t.assert.ok(!(lastFrame() ?? '').includes('Raw mode'));
	t.assert.deepStrictEqual(submitted, []);
	unmount();
});

// A controlled `value` is owned by the parent. Edits are reported through onChange, and the display follows the prop, so an edit the parent ignores does not appear.

test('a controlled value is displayed', (t: TestContext) => {
	const {lastFrame} = render(<TextInput value="abc" />);

	t.assert.strictEqual(lastFrame(), `abc${cursor()}`);
});

test('typing into a controlled value reports the next value and keeps the displayed value', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<TextInput
			value="abc"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	instance.stdin.write('d');
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['abcd']);
	t.assert.strictEqual(instance.lastFrame(), `abc${cursor()}`);
});

test('a parent that stores a controlled value shows each keystroke', async (t: TestContext) => {
	function Form() {
		const [value, setValue] = useState('');
		return <TextInput value={value} onChange={setValue} />;
	}

	const instance = render(<Form />);

	await delay(50);
	instance.stdin.write('a');
	await delay(30);
	instance.stdin.write('b');
	await delay(50);
	instance.unmount();

	t.assert.strictEqual(instance.lastFrame(), `ab${cursor()}`);
});

test('a burst into a controlled value reports one change per input event and shows the final value', async (t: TestContext) => {
	const run = async (isBurst: boolean) => {
		const changes: string[] = [];

		function Form() {
			const [value, setValue] = useState('');
			return (
				<TextInput
					value={value}
					onChange={(next) => {
						changes.push(next);
						setValue(next);
					}}
				/>
			);
		}

		const instance = render(<Form />);

		await delay(50);
		if (isBurst) {
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

test('an external shorter value keeps the caret inside the value', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<TextInput
			value="hello"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	instance.rerender(
		<TextInput
			value="hi"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);
	await delay(50);
	t.assert.strictEqual(instance.lastFrame(), `hi${cursor()}`);
	instance.stdin.write('X');
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['hiX']);
});

test('a caret inside a multi-code-unit character snaps to a character boundary after an external change', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<TextInput
			value="ab"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	instance.stdin.write(arrowLeft);
	await delay(30);
	instance.rerender(
		<TextInput
			value="😀x"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);
	await delay(50);
	instance.stdin.write('X');
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['X😀x']);
});

test('value takes precedence over defaultValue', (t: TestContext) => {
	const {lastFrame} = render(<TextInput value="abc" defaultValue="zzz" />);

	t.assert.strictEqual(lastFrame(), `abc${cursor()}`);
});

test('accepting a suggestion in a controlled value reports onChange before onSubmit', async (t: TestContext) => {
	const events: string[] = [];
	const instance = render(
		<TextInput
			value="app"
			suggestions={['apple']}
			onChange={(value) => {
				events.push(`change:${value}`);
			}}
			onSubmit={(value) => {
				events.push(`submit:${value}`);
			}}
		/>,
	);

	await delay(50);
	instance.stdin.write(enter);
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(events, ['change:apple', 'submit:apple']);
});

test('a disabled controlled value ignores keys', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<TextInput
			isDisabled
			value="abc"
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(50);
	instance.stdin.write('d');
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(changes, []);
	t.assert.strictEqual(instance.lastFrame(), 'abc');
});

test('a controlled value without onChange is read-only', async (t: TestContext) => {
	const instance = render(<TextInput value="abc" />);

	await delay(50);
	instance.stdin.write('d');
	await delay(50);
	instance.unmount();

	t.assert.strictEqual(instance.lastFrame(), `abc${cursor()}`);
});

test('a parent can transform the value it stores', async (t: TestContext) => {
	function Form() {
		const [value, setValue] = useState('');
		return (
			<TextInput
				value={value}
				onChange={(next) => {
					setValue(next.toUpperCase());
				}}
			/>
		);
	}

	const instance = render(<Form />);

	await delay(50);
	instance.stdin.write('a');
	await delay(30);
	instance.stdin.write('b');
	await delay(50);
	instance.unmount();

	t.assert.strictEqual(instance.lastFrame(), `AB${cursor()}`);
});

test('a key the parent rejects does not move the caret', async (t: TestContext) => {
	const instance = render(<TextInput value="abc" onChange={() => {}} />);

	await delay(50);
	instance.stdin.write(arrowLeft);
	await delay(30);
	instance.stdin.write(arrowLeft);
	await delay(30);
	instance.stdin.write('X');
	await delay(50);
	instance.unmount();

	t.assert.strictEqual(instance.lastFrame(), `a${cursor('b')}c`);
});

test('a key the parent rejects is not built on by the next key in the same read', async (t: TestContext) => {
	const changes: string[] = [];

	function DigitsOnly() {
		const [value, setValue] = useState('1');
		return (
			<TextInput
				value={value}
				onChange={(next) => {
					changes.push(next);
					if (/^\d*$/.test(next)) {
						setValue(next);
					}
				}}
			/>
		);
	}

	const instance = render(<DigitsOnly />);

	await delay(50);
	// 'x' is rejected, Up is ignored, '2' is accepted: all three arrive in one read.
	instance.stdin.write('x\u{1B}[A2');
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(changes, ['1x', '12']);
	t.assert.strictEqual(instance.lastFrame(), `12${cursor()}`);
});

test('Enter after a key the parent rejects submits the stored value', async (t: TestContext) => {
	const submitted: string[] = [];
	const instance = render(
		<TextInput
			value="abc"
			onChange={() => {}}
			onSubmit={(value) => {
				submitted.push(value);
			}}
		/>,
	);

	await delay(50);
	instance.stdin.write('d\u{1B}[A' + enter);
	await delay(50);
	instance.unmount();

	t.assert.deepStrictEqual(submitted, ['abc']);
});

test('an external shorter value moves the caret to the new end only when it was past it', async (t: TestContext) => {
	const instance = render(<TextInput value="abcdef" onChange={() => {}} />);

	await delay(50);
	for (let index = 0; index < 4; index++) {
		instance.stdin.write(arrowLeft);
		await delay(30);
	}

	instance.rerender(<TextInput value="abcd" onChange={() => {}} />);
	await delay(50);
	instance.unmount();

	t.assert.strictEqual(instance.lastFrame(), `ab${cursor('c')}d`);
});

test('autocomplete skips a suggestion equal to the value for a longer one', async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<TextInput suggestions={['git', 'git commit']} />,
	);

	await delay(50);
	stdin.write('git');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `git${cursor(' ')}${chalk.dim('commit')}`);
});
