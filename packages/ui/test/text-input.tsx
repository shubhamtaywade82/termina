/* eslint-disable no-await-in-loop */
import React from 'react';
import test, {type TestContext} from 'node:test';
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
