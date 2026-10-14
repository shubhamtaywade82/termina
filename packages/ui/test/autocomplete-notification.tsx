import test, {type TestContext} from 'node:test';
import React from 'react';
import delay from 'delay';
import {Autocomplete} from '../source/components/autocomplete/index.js';
import {render} from './helpers/render.js';

type Instance = ReturnType<typeof render>;

const enter = '\r';
const up = '\u{1B}[A';
const down = '\u{1B}[B';
const right = '\u{1B}[C';
const left = '\u{1B}[D';
const backspace = '\u{7F}';
const forwardDelete = '\u{1B}[3~';

const packages = ['react', 'Redux', 'vue', 'preact'];
const collect = (values: string[]) => (value: string) => {
	values.push(value);
};

const press = async (instance: Instance, keys: string[]) => {
	for (const key of keys) {
		instance.stdin.write(key);
		// eslint-disable-next-line no-await-in-loop -- Each key must reach the component before the next one is written.
		await delay(20);
	}
};

// Writes every key in one stdin read, so the events of the read are handled before the next render.
const burst = async (instance: Instance, keys: string) => {
	instance.stdin.write(keys);
	await delay(20);
};

test('a burst of keys in one read reports each event in order', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<Autocomplete options={packages} onChange={collect(changes)} />,
	);

	await burst(instance, 'ab' + backspace);

	t.assert.deepStrictEqual(changes, ['ab', 'a']);
	instance.unmount();
});

test('every backspace-split event in one read reports its own value, including a repeated value', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<Autocomplete options={packages} onChange={collect(changes)} />,
	);

	await burst(instance, 'a' + backspace + 'a' + backspace + 'b');

	t.assert.deepStrictEqual(changes, ['a', '', 'a', '', 'b']);
	instance.unmount();
});

test('enter in the same read as a burst submits the latest value when no row matches', async (t: TestContext) => {
	const submitted: string[] = [];
	const changes: string[] = [];
	const instance = render(
		<Autocomplete
			options={['vue']}
			onChange={collect(changes)}
			onSubmit={collect(submitted)}
		/>,
	);

	await burst(instance, 'abx' + backspace + enter);

	t.assert.deepStrictEqual(submitted, ['ab']);
	t.assert.deepStrictEqual(changes, ['abx', 'ab']);
	instance.unmount();
});

// Enter is its own key event even when text comes before it in the same read, so a read can end in text followed by Enter.
test('enter that follows text in the same read submits that text', async (t: TestContext) => {
	const submitted: string[] = [];
	const changes: string[] = [];
	const instance = render(
		<Autocomplete
			options={['vue']}
			onChange={collect(changes)}
			onSubmit={collect(submitted)}
		/>,
	);

	await burst(instance, 'abx' + enter);

	t.assert.deepStrictEqual(submitted, ['abx']);
	t.assert.deepStrictEqual(changes, ['abx']);
	instance.unmount();
});

test('enter in the same read as a burst accepts the row the burst matched, not the value from before the read', async (t: TestContext) => {
	const submitted: string[] = [];
	const changes: string[] = [];
	const instance = render(
		<Autocomplete
			options={['abc']}
			onChange={collect(changes)}
			onSubmit={collect(submitted)}
		/>,
	);

	await burst(instance, 'abx' + backspace + enter);

	t.assert.deepStrictEqual(submitted, []);
	t.assert.deepStrictEqual(changes, ['abx', 'ab', 'abc']);
	instance.unmount();
});

test('a parent re-render with a new onChange does not replay the last value', async (t: TestContext) => {
	const first: string[] = [];
	const second: string[] = [];
	const instance = render(
		<Autocomplete options={packages} onChange={collect(first)} />,
	);

	await press(instance, ['r']);
	instance.rerender(
		<Autocomplete options={packages} onChange={collect(second)} />,
	);
	await delay(20);

	t.assert.deepStrictEqual(first, ['r']);
	t.assert.deepStrictEqual(second, []);
	instance.unmount();
});

test('accepting a row equal to the input does not notify', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<Autocomplete options={['react']} onChange={collect(changes)} />,
	);

	await press(instance, ['r', 'e', 'a', 'c', 't']);
	await press(instance, [enter]);

	t.assert.deepStrictEqual(changes, ['r', 're', 'rea', 'reac', 'react']);
	instance.unmount();
});

test('mount and highlight moves do not notify', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<Autocomplete
			options={packages}
			defaultValue="re"
			onChange={collect(changes)}
		/>,
	);

	await delay(20);
	await press(instance, [down, down, up]);

	t.assert.deepStrictEqual(changes, []);
	instance.unmount();
});

test('edits that change nothing do not notify', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<Autocomplete options={[]} onChange={collect(changes)} />,
	);

	await press(instance, [backspace, forwardDelete, left, right]);
	await press(instance, ['a', right, backspace, backspace]);

	t.assert.deepStrictEqual(changes, ['a', '']);
	instance.unmount();
});
