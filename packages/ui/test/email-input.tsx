/* eslint-disable no-await-in-loop */
import React from 'react';
import test, {type TestContext} from 'node:test';
import {render} from './helpers/render.js';
import chalk from 'chalk';
import delay from 'delay';
import {EmailInput} from '../source/index.js';

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
	const {lastFrame} = render(<EmailInput placeholder="Start typing..." />);

	t.assert.strictEqual(lastFrame(), cursor('S') + chalk.dim('tart typing...'));
});

test("cursor can't be moved in placeholder", async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<EmailInput placeholder="Start typing..." />,
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
		<EmailInput isDisabled placeholder="Start typing..." />,
	);

	t.assert.strictEqual(lastFrame(), chalk.dim('Start typing...'));
});

test('default value', (t: TestContext) => {
	const {lastFrame} = render(
		<EmailInput defaultValue="test" placeholder="Start typing..." />,
	);

	t.assert.strictEqual(lastFrame(), `test${cursor()}`);
});

test('hide cursor in value when disabled', (t: TestContext) => {
	const {lastFrame} = render(
		<EmailInput isDisabled defaultValue="test" placeholder="Start typing..." />,
	);

	t.assert.strictEqual(lastFrame(), 'test');
});

test('insert character', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<EmailInput
			placeholder="Start typing..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('t');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `t${cursor()}`);
	t.assert.strictEqual(value, 't');
});

test('insert text', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<EmailInput
			placeholder="Start typing..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('test');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `test${cursor()}`);
	t.assert.strictEqual(value, 'test');
});

test('prevent two "@" characters', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<EmailInput
			placeholder="Start typing..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('test@');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `test@${cursor('a')}${chalk.dim('ol.com')}`);
	t.assert.strictEqual(value, 'test@');

	await delay(50);
	stdin.write('@');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `test@${cursor('a')}${chalk.dim('ol.com')}`);
	t.assert.strictEqual(value, 'test@');
});

test('ignore input when disabled', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<EmailInput
			isDisabled
			placeholder="Start typing..."
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write('t');
	await delay(50);

	t.assert.strictEqual(lastFrame(), chalk.dim('Start typing...'));
	t.assert.strictEqual(value, undefined);
});

test('delete character', async (t: TestContext) => {
	let value = 'test';

	const {lastFrame, stdin} = render(
		<EmailInput
			defaultValue={value}
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	await delay(50);
	stdin.write(del);
	await delay(50);

	t.assert.strictEqual(lastFrame(), `tes${cursor()}`);
	t.assert.strictEqual(value, 'tes');
});

test('delete all text', async (t: TestContext) => {
	let value = 'test';

	const {lastFrame, stdin} = render(
		<EmailInput
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
	const {lastFrame, stdin} = render(<EmailInput defaultValue="test" />);

	for (let at = 3; at >= 0; at--) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);

		t.assert.strictEqual(lastFrame(), cursorAt('test', at));
	}
});

test("cursor can't be moved left when at the beginning of the input", async (t: TestContext) => {
	const {lastFrame, stdin} = render(<EmailInput defaultValue="test" />);

	for (let press = 0; press < 5; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), cursorAt('test', 0));
});

test('move cursor to the right', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<EmailInput defaultValue="test" />);

	for (let press = 0; press < 4; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), cursorAt('test', 0));

	for (let at = 1; at < 4; at++) {
		await delay(50);
		stdin.write(arrowRight);
		await delay(50);

		t.assert.strictEqual(lastFrame(), cursorAt('test', at));
	}

	await delay(50);
	stdin.write(arrowRight);
	await delay(50);

	t.assert.strictEqual(lastFrame(), `test${cursor()}`);
});

test("cursor can't be moved right when at the end of the input", async (t: TestContext) => {
	const {lastFrame, stdin} = render(<EmailInput defaultValue="test" />);

	t.assert.strictEqual(lastFrame(), `test${cursor()}`);

	await delay(50);
	stdin.write(arrowRight);
	await delay(50);

	t.assert.strictEqual(lastFrame(), `test${cursor()}`);
});

test('insert character in the middle', async (t: TestContext) => {
	let value = 'hllo';

	const {lastFrame, stdin} = render(
		<EmailInput
			defaultValue={value}
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), `hllo${cursor()}`);

	for (let press = 0; press < 3; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), `h${cursor('l')}lo`);

	await delay(50);
	stdin.write('e');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `he${cursor('l')}lo`);
	t.assert.strictEqual(value, 'hello');
});

test('insert text in the middle', async (t: TestContext) => {
	let value = 'hllo';

	const {lastFrame, stdin} = render(
		<EmailInput
			defaultValue={value}
			onChange={newValue => {
				value = newValue;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), `hllo${cursor()}`);

	for (let press = 0; press < 3; press++) {
		await delay(50);
		stdin.write(arrowLeft);
		await delay(50);
	}

	t.assert.strictEqual(lastFrame(), `h${cursor('l')}lo`);

	await delay(50);
	stdin.write('eee');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `heee${cursor('l')}lo`);
	t.assert.strictEqual(value, 'heeello');
});

test('autocomplete domain', async (t: TestContext) => {
	let value: string | undefined;
	let submittedValue: string | undefined;

	const {lastFrame, stdin} = render(
		<EmailInput
			placeholder="Start typing..."
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
	stdin.write('test@');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `test@${cursor('a')}${chalk.dim('ol.com')}`);
	t.assert.strictEqual(value, 'test@');

	await delay(50);
	stdin.write('a');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `test@a${cursor('o')}${chalk.dim('l.com')}`);
	t.assert.strictEqual(value, 'test@a');

	await delay(50);
	stdin.write('o');
	await delay(50);

	t.assert.strictEqual(lastFrame(), `test@ao${cursor('l')}${chalk.dim('.com')}`);
	t.assert.strictEqual(value, 'test@ao');

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.strictEqual(lastFrame(), `test@aol.com${cursor()}`);
	t.assert.strictEqual(value, 'test@aol.com');
	t.assert.strictEqual(submittedValue, 'test@aol.com');
});

test('submit on enter', async (t: TestContext) => {
	let submittedValue: string | undefined;

	const {stdin} = render(
		<EmailInput
			defaultValue="test"
			onSubmit={value => {
				submittedValue = value;
			}}
		/>,
	);

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.strictEqual(submittedValue, 'test');
});
