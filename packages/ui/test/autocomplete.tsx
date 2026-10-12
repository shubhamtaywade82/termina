/* eslint-disable no-await-in-loop */
import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import figures from 'figures';
import {render} from './helpers/render.js';
import {Autocomplete} from '../source/components/autocomplete/index.js';

type Instance = ReturnType<typeof render>;

const enter = '\r';
const up = '\u001B[A';
const down = '\u001B[B';
const right = '\u001B[C';
const left = '\u001B[D';
const backspace = '\u007F';
const forwardDelete = '\u001B[3~';
const tab = '\t';
const escape = '\u001B';

const packages = ['react', 'Redux', 'vue', 'preact'];
const cursor = chalk.inverse(' ');
const pointerRow = (text: string) => chalk.blue(`${figures.pointer} ${text}`);
const lines = (...rows: string[]) => rows.join('\n');
const collect = (values: string[]) => (value: string) => {
	values.push(value);
};

const press = async (instance: Instance, keys: string[]) => {
	for (const key of keys) {
		instance.stdin.write(key);
		await delay(20);
	}
};

const typeText = async (instance: Instance, text: string) => {
	await press(instance, [...text]);
};

test('shows the placeholder and no list before anything is typed', (t: TestContext) => {
	const instance = render(<Autocomplete options={packages} placeholder="Search" />);

	t.assert.strictEqual(instance.lastFrame(), chalk.inverse('S') + chalk.dim('earch'));
	instance.unmount();
});

test('lists the options that contain the typed text, ignoring case, in option order', async (t: TestContext) => {
	const instance = render(<Autocomplete options={packages} />);

	await typeText(instance, 'RE');

	t.assert.strictEqual(instance.lastFrame(), lines(`RE${cursor}`, pointerRow('react'), '  Redux', '  preact'));
	instance.unmount();
});

test('typing moves the highlight back to the first match', async (t: TestContext) => {
	const instance = render(<Autocomplete options={packages} />);

	await typeText(instance, 're');
	await press(instance, [down]);
	await typeText(instance, 'a');

	t.assert.strictEqual(instance.lastFrame(), lines(`rea${cursor}`, pointerRow('react'), '  preact'));
	instance.unmount();
});

test('down and up move the highlight one row', async (t: TestContext) => {
	const instance = render(<Autocomplete options={packages} />);

	await typeText(instance, 're');
	await press(instance, [down]);
	t.assert.strictEqual(instance.lastFrame(), lines(`re${cursor}`, '  react', pointerRow('Redux'), '  preact'));

	await press(instance, [up]);
	t.assert.strictEqual(instance.lastFrame(), lines(`re${cursor}`, pointerRow('react'), '  Redux', '  preact'));
	instance.unmount();
});

test('up above the first row and down below the last row do not wrap', async (t: TestContext) => {
	const instance = render(<Autocomplete options={packages} />);

	await typeText(instance, 're');
	await press(instance, [up]);
	t.assert.strictEqual(instance.lastFrame(), lines(`re${cursor}`, pointerRow('react'), '  Redux', '  preact'));

	await press(instance, [down, down, down]);
	t.assert.strictEqual(instance.lastFrame(), lines(`re${cursor}`, '  react', '  Redux', pointerRow('preact')));
	instance.unmount();
});

test('shows at most five rows by default and cannot highlight a later match', async (t: TestContext) => {
	const instance = render(<Autocomplete options={['a1', 'a2', 'a3', 'a4', 'a5', 'a6']} />);

	await typeText(instance, 'a');
	await press(instance, [down, down, down, down, down]);

	t.assert.strictEqual(instance.lastFrame(), lines(`a${cursor}`, '  a1', '  a2', '  a3', '  a4', pointerRow('a5')));
	instance.unmount();
});

test('limit sets the number of rows', async (t: TestContext) => {
	const instance = render(<Autocomplete options={['a1', 'a2', 'a3']} limit={2} />);

	await typeText(instance, 'a');
	await press(instance, [down, down]);

	t.assert.strictEqual(instance.lastFrame(), lines(`a${cursor}`, '  a1', pointerRow('a2')));
	instance.unmount();
});

test('enter sets the value to the highlighted row, hides the list, and reports the value once', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(<Autocomplete options={packages} onChange={collect(changes)} />);

	await typeText(instance, 'red');
	await press(instance, [enter]);

	t.assert.strictEqual(instance.lastFrame(), `Redux${cursor}`);
	t.assert.deepStrictEqual(changes, ['r', 're', 'red', 'Redux']);
	instance.unmount();
});

test('enter with no matches submits the typed text and shows No matches', async (t: TestContext) => {
	const submitted: string[] = [];
	const instance = render(<Autocomplete options={packages} onSubmit={collect(submitted)} />);

	await typeText(instance, 'zz');
	t.assert.strictEqual(instance.lastFrame(), lines(`zz${cursor}`, chalk.dim('No matches')));

	await press(instance, [enter]);
	t.assert.deepStrictEqual(submitted, ['zz']);
	instance.unmount();
});

test('enter after accepting a row submits the accepted value', async (t: TestContext) => {
	const submitted: string[] = [];
	const instance = render(<Autocomplete options={packages} onSubmit={collect(submitted)} />);

	await typeText(instance, 're');
	await press(instance, [enter]);
	t.assert.deepStrictEqual(submitted, []);

	await press(instance, [enter]);
	t.assert.deepStrictEqual(submitted, ['react']);
	instance.unmount();
});

test('after Enter accepts a row, cursor moves keep the list hidden and typing or backspace reopens it', async (t: TestContext) => {
	const instance = render(<Autocomplete options={packages} />);

	await typeText(instance, 're');
	await press(instance, [enter, left, right]);
	t.assert.strictEqual(instance.lastFrame(), `react${cursor}`);

	await typeText(instance, 'x');
	t.assert.strictEqual(instance.lastFrame(), lines(`reactx${cursor}`, chalk.dim('No matches')));

	await press(instance, [backspace]);
	t.assert.strictEqual(instance.lastFrame(), lines(`react${cursor}`, pointerRow('react'), '  preact'));
	instance.unmount();
});

test('backspace removes a whole emoji from the input', async (t: TestContext) => {
	const instance = render(<Autocomplete options={['😀 smile']} />);

	await typeText(instance, '😀');
	await press(instance, [backspace]);

	t.assert.strictEqual(instance.lastFrame(), cursor);
	instance.unmount();
});

test('left and right step over a whole emoji', async (t: TestContext) => {
	const submitted: string[] = [];
	const instance = render(<Autocomplete options={[]} onSubmit={collect(submitted)} />);

	await typeText(instance, '😀x');
	await press(instance, [left, left, right]);
	await typeText(instance, 'a');
	await press(instance, [enter]);

	t.assert.deepStrictEqual(submitted, ['😀ax']);
	instance.unmount();
});

test('forward delete removes a whole emoji after the cursor', async (t: TestContext) => {
	const submitted: string[] = [];
	const instance = render(<Autocomplete options={[]} onSubmit={collect(submitted)} />);

	await typeText(instance, 'a😀');
	await press(instance, [left, forwardDelete, enter]);

	t.assert.deepStrictEqual(submitted, ['a']);
	instance.unmount();
});

test('tab, escape, Home, End and F1 have no effect', async (t: TestContext) => {
	const submitted: string[] = [];
	const instance = render(<Autocomplete options={packages} onSubmit={collect(submitted)} />);

	await typeText(instance, 're');
	await press(instance, [tab, escape, '\u001B[H', '\u001B[F', '\u001BOP']);

	t.assert.strictEqual(instance.lastFrame(), lines(`re${cursor}`, pointerRow('react'), '  Redux', '  preact'));
	t.assert.deepStrictEqual(submitted, []);
	instance.unmount();
});

test('a non-empty defaultValue opens the list at mount', (t: TestContext) => {
	const instance = render(<Autocomplete options={packages} defaultValue="re" />);

	t.assert.strictEqual(instance.lastFrame(), lines(`re${cursor}`, pointerRow('react'), '  Redux', '  preact'));
	instance.unmount();
});

test('a later defaultValue is ignored', (t: TestContext) => {
	const instance = render(<Autocomplete options={packages} defaultValue="re" />);

	instance.rerender(<Autocomplete options={packages} defaultValue="vu" />);

	t.assert.strictEqual(instance.lastFrame(), lines(`re${cursor}`, pointerRow('react'), '  Redux', '  preact'));
	instance.unmount();
});

test('accepting a row equal to the input does not call onChange', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(<Autocomplete options={['react']} onChange={collect(changes)} />);

	await typeText(instance, 'react');
	await press(instance, [enter]);

	t.assert.deepStrictEqual(changes, ['r', 're', 'rea', 'reac', 'react']);
	t.assert.strictEqual(instance.lastFrame(), `react${cursor}`);
	instance.unmount();
});

test('a parent re-render with a new onChange does not repeat the last change', async (t: TestContext) => {
	const first: string[] = [];
	const second: string[] = [];
	const instance = render(<Autocomplete options={packages} onChange={collect(first)} />);

	await typeText(instance, 'r');
	instance.rerender(<Autocomplete options={packages} onChange={collect(second)} />);
	await delay(20);

	t.assert.deepStrictEqual(first, ['r']);
	t.assert.deepStrictEqual(second, []);
	instance.unmount();
});

test('changing options after mount updates the list and keeps the input', async (t: TestContext) => {
	const instance = render(<Autocomplete options={packages} />);

	await typeText(instance, 're');
	instance.rerender(<Autocomplete options={['relay']} />);
	await delay(20);

	t.assert.strictEqual(instance.lastFrame(), lines(`re${cursor}`, pointerRow('relay')));
	instance.unmount();
});

test('disabled ignores keys and highlights no row', async (t: TestContext) => {
	const changes: string[] = [];
	const submitted: string[] = [];
	const instance = render(<Autocomplete isDisabled defaultValue="re" options={packages} onChange={collect(changes)} onSubmit={collect(submitted)} />);

	await press(instance, ['x', down, enter]);

	t.assert.strictEqual(instance.lastFrame(), lines('re', '  react', '  Redux', '  preact'));
	t.assert.deepStrictEqual(changes, []);
	t.assert.deepStrictEqual(submitted, []);
	instance.unmount();
});

test('renders the input and rows without throwing when stdin is piped', async (t: TestContext) => {
	const instance = render(<Autocomplete options={packages} defaultValue="re" />, {isStdinPiped: true});

	await delay(20);
	instance.stdin.write('x');
	await delay(20);

	t.assert.strictEqual(instance.lastFrame(), lines('re', pointerRow('react'), '  Redux', '  preact'));
	instance.unmount();
});

test('pasted control characters are removed from the input', async (t: TestContext) => {
	const submitted: string[] = [];
	const instance = render(<Autocomplete options={['react']} onSubmit={collect(submitted)} />);

	await press(instance, ['x\ny', enter]);

	t.assert.deepStrictEqual(submitted, ['xy']);
	instance.unmount();
});
