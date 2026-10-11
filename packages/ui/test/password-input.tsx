/* eslint-disable no-await-in-loop */
import React from 'react';
import test, {type TestContext} from 'node:test';
import {render} from './helpers/render.js';
import chalk from 'chalk';
import delay from 'delay';
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
