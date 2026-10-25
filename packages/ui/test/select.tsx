/* eslint-disable no-await-in-loop -- Each step drives the component, and the next step starts only after the last one has rendered. */
import test, {type TestContext} from 'node:test';
import React from 'react';
import chalk from 'chalk';
import figures from 'figures';
import delay from 'delay';
import {Select} from '../source/index.js';
import {render} from './helpers/render.js';

const options = [
	{
		label: 'Red',
		value: 'red',
	},
	{
		label: 'Green',
		value: 'green',
	},
	{
		label: 'Yellow',
		value: 'yellow',
	},
	{
		label: 'Blue',
		value: 'blue',
	},
	{
		label: 'Magenta',
		value: 'magenta',
	},
	{
		label: 'Cyan',
		value: 'cyan',
	},
	{
		label: 'White',
		value: 'white',
	},
];

const arrowDown = '\u{1B}[B';
const arrowUp = '\u{1B}[A';
const enter = '\r';

test('limit number of visible options', (t: TestContext) => {
	const {lastFrame} = render(
		<Select visibleOptionCount={6} options={options} />,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.blue(figures.pointer)} ${chalk.blue('Red')}`,
			'  Green',
			'  Yellow',
			'  Blue',
			'  Magenta',
			'  Cyan',
		].join('\n'),
	);
});

test('focus next option', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<Select options={options} />);

	await delay(50);
	stdin.write(arrowDown);
	await delay(50);

	t.assert.strictEqual(
		lastFrame(),
		[
			'  Red',
			`${chalk.blue(figures.pointer)} ${chalk.blue('Green')}`,
			'  Yellow',
			'  Blue',
			'  Magenta',
		].join('\n'),
	);
});

test('focus next option and scroll down', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<Select options={options} />);

	for (let press = 0; press < 6; press++) {
		await delay(50);
		stdin.write(arrowDown);
		await delay(50);
	}

	t.assert.strictEqual(
		lastFrame(),
		[
			'  Yellow',
			'  Blue',
			'  Magenta',
			'  Cyan',
			`${chalk.blue(figures.pointer)} ${chalk.blue('White')}`,
		].join('\n'),
	);
});

test("don't scroll down when focused option is the last one", async (t: TestContext) => {
	const {lastFrame, stdin} = render(<Select options={options} />);

	for (let press = 0; press < 7; press++) {
		await delay(50);
		stdin.write(arrowDown);
		await delay(50);
	}

	t.assert.strictEqual(
		lastFrame(),
		[
			'  Yellow',
			'  Blue',
			'  Magenta',
			'  Cyan',
			`${chalk.blue(figures.pointer)} ${chalk.blue('White')}`,
		].join('\n'),
	);
});

test('focus previous option', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<Select options={options} />);

	await delay(50);
	stdin.write(arrowDown);
	await delay(50);

	t.assert.strictEqual(
		lastFrame(),
		[
			'  Red',
			`${chalk.blue(figures.pointer)} ${chalk.blue('Green')}`,
			'  Yellow',
			'  Blue',
			'  Magenta',
		].join('\n'),
	);

	await delay(50);
	stdin.write(arrowUp);
	await delay(50);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.blue(figures.pointer)} ${chalk.blue('Red')}`,
			'  Green',
			'  Yellow',
			'  Blue',
			'  Magenta',
		].join('\n'),
	);
});

test('focus previous option and scroll up', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<Select options={options} />);

	for (let press = 0; press < 6; press++) {
		await delay(50);
		stdin.write(arrowDown);
		await delay(50);
	}

	t.assert.strictEqual(
		lastFrame(),
		[
			'  Yellow',
			'  Blue',
			'  Magenta',
			'  Cyan',
			`${chalk.blue(figures.pointer)} ${chalk.blue('White')}`,
		].join('\n'),
	);

	for (let press = 0; press < 6; press++) {
		await delay(50);
		stdin.write(arrowUp);
		await delay(50);
	}

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.blue(figures.pointer)} ${chalk.blue('Red')}`,
			'  Green',
			'  Yellow',
			'  Blue',
			'  Magenta',
		].join('\n'),
	);
});

test('focus rests on the top visible row before the list scrolls up', async (t: TestContext) => {
	const {lastFrame, stdin} = render(<Select options={options} />);

	for (let press = 0; press < 6; press++) {
		await delay(50);
		stdin.write(arrowDown);
		await delay(50);
	}

	// Focus moves up onto the top visible row, Yellow. The window does not move.
	for (let press = 0; press < 4; press++) {
		await delay(50);
		stdin.write(arrowUp);
		await delay(50);
	}

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.blue(figures.pointer)} ${chalk.blue('Yellow')}`,
			'  Blue',
			'  Magenta',
			'  Cyan',
			'  White',
		].join('\n'),
	);

	// One more step moves focus above the window, so the list scrolls up by one row.
	await delay(50);
	stdin.write(arrowUp);
	await delay(50);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.blue(figures.pointer)} ${chalk.blue('Green')}`,
			'  Yellow',
			'  Blue',
			'  Magenta',
			'  Cyan',
		].join('\n'),
	);
});

test("don't scroll up when focused option is the first one", async (t: TestContext) => {
	const {lastFrame, stdin} = render(<Select options={options} />);

	for (let press = 0; press < 6; press++) {
		await delay(50);
		stdin.write(arrowDown);
		await delay(50);
	}

	t.assert.strictEqual(
		lastFrame(),
		[
			'  Yellow',
			'  Blue',
			'  Magenta',
			'  Cyan',
			`${chalk.blue(figures.pointer)} ${chalk.blue('White')}`,
		].join('\n'),
	);

	for (let press = 0; press < 7; press++) {
		await delay(50);
		stdin.write(arrowUp);
		await delay(50);
	}

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.blue(figures.pointer)} ${chalk.blue('Red')}`,
			'  Green',
			'  Yellow',
			'  Blue',
			'  Magenta',
		].join('\n'),
	);
});

test('ignore input when disabled', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<Select
			isDisabled
			options={options}
			onChange={(newValue) => {
				value = newValue;
			}}
		/>,
	);

	t.assert.strictEqual(
		lastFrame(),
		['  Red', '  Green', '  Yellow', '  Blue', '  Magenta'].join('\n'),
	);

	t.assert.strictEqual(value, undefined);

	await delay(50);
	stdin.write(arrowDown);
	await delay(50);

	t.assert.strictEqual(
		lastFrame(),
		['  Red', '  Green', '  Yellow', '  Blue', '  Magenta'].join('\n'),
	);

	t.assert.strictEqual(value, undefined);

	await delay(50);
	stdin.write(arrowUp);
	await delay(50);

	t.assert.strictEqual(
		lastFrame(),
		['  Red', '  Green', '  Yellow', '  Blue', '  Magenta'].join('\n'),
	);

	t.assert.strictEqual(value, undefined);

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.strictEqual(
		lastFrame(),
		['  Red', '  Green', '  Yellow', '  Blue', '  Magenta'].join('\n'),
	);

	t.assert.strictEqual(value, undefined);
});

test('select focused option', async (t: TestContext) => {
	let value: string | undefined;

	const {lastFrame, stdin} = render(
		<Select
			options={options}
			onChange={(newValue) => {
				value = newValue;
			}}
		/>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.blue(figures.pointer)} ${chalk.blue('Red')}`,
			'  Green',
			'  Yellow',
			'  Blue',
			'  Magenta',
		].join('\n'),
	);

	t.assert.strictEqual(value, undefined);

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.blue(figures.pointer)} ${chalk.blue('Red')} ${chalk.green(
				figures.tick,
			)}`,
			'  Green',
			'  Yellow',
			'  Blue',
			'  Magenta',
		].join('\n'),
	);

	t.assert.strictEqual(value, 'red');

	await delay(50);
	stdin.write(arrowDown);
	await delay(50);

	t.assert.strictEqual(
		lastFrame(),
		[
			`  ${chalk.green('Red')} ${chalk.green(figures.tick)}`,
			`${chalk.blue(figures.pointer)} ${chalk.blue('Green')}`,
			'  Yellow',
			'  Blue',
			'  Magenta',
		].join('\n'),
	);
});

test('selected option by default', (t: TestContext) => {
	const {lastFrame} = render(<Select defaultValue="green" options={options} />);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.blue(figures.pointer)} ${chalk.blue('Red')}`,
			`  ${chalk.green('Green')} ${chalk.green(figures.tick)}`,
			'  Yellow',
			'  Blue',
			'  Magenta',
		].join('\n'),
	);
});

test('highlight text in options', (t: TestContext) => {
	const {lastFrame} = render(<Select highlightText="l" options={options} />);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.blue(figures.pointer)} ${chalk.blue('Red')}`,
			'  Green',
			`  Ye${chalk.bold('l')}low`,
			`  B${chalk.bold('l')}ue`,
			'  Magenta',
		].join('\n'),
	);
});
