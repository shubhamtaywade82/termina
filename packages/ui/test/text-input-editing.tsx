import test, {type TestContext} from 'node:test';
import React from 'react';
import delay from 'delay';
import {TextInput} from '../source/index.js';
import {render} from './helpers/render.js';

const enter = '\r';
const left = '\u{1B}[D';
const backspace = '\u{7F}';
const forwardDelete = '\u{1B}[3~';

// Types each key, submits, and returns the value Enter delivered.
const submitAfter = async (
	keys: string[],
	defaultValue = '',
): Promise<string | undefined> => {
	const submitted: string[] = [];
	const instance = render(
		<TextInput
			defaultValue={defaultValue}
			onSubmit={(value) => {
				submitted.push(value);
			}}
		/>,
	);

	await delay(20);
	for (const key of [...keys, enter]) {
		instance.stdin.write(key);
		// eslint-disable-next-line no-await-in-loop -- Each step must finish before the next one starts, so the steps stay in order.
		await delay(15);
	}

	instance.unmount();
	return submitted[0];
};

test('backspace at the start of the input deletes nothing', async (t: TestContext) => {
	t.assert.strictEqual(
		await submitAfter([left, left, left, backspace], 'abc'),
		'abc',
	);
});

test('forward delete removes the character under the cursor', async (t: TestContext) => {
	t.assert.strictEqual(
		await submitAfter([left, left, forwardDelete], 'abc'),
		'ac',
	);
});

test('backspace removes a whole emoji, not half of its surrogate pair', async (t: TestContext) => {
	t.assert.strictEqual(await submitAfter(['😀', backspace]), '');
});

test('the cursor steps over a whole emoji in one move', async (t: TestContext) => {
	// Two Left presses land between 'a' and the emoji. Typing there must not split the surrogate pair.
	t.assert.strictEqual(await submitAfter([left, left, 'X'], 'a😀b'), 'aX😀b');
});

test('backspace after one Left removes the emoji before the cursor', async (t: TestContext) => {
	t.assert.strictEqual(await submitAfter([left, backspace], 'a😀b'), 'ab');
});

test('backspace removes a combining mark together with its base letter', async (t: TestContext) => {
	t.assert.strictEqual(await submitAfter([left, backspace], 'éx'), 'x');
});

test('ctrl+letter does not insert the letter', async (t: TestContext) => {
	t.assert.strictEqual(await submitAfter(['\u{1}'], 'abc'), 'abc');
});

test('control characters in pasted text are not inserted', async (t: TestContext) => {
	t.assert.strictEqual(await submitAfter(['x\ny']), 'xy');
});

test('accepting a suggestion with the cursor mid-value appends it to the end', async (t: TestContext) => {
	const changes: string[] = [];
	const instance = render(
		<TextInput
			defaultValue="ap"
			suggestions={['apple']}
			onChange={(value) => {
				changes.push(value);
			}}
		/>,
	);

	await delay(20);
	instance.stdin.write(left);
	await delay(15);
	instance.stdin.write(enter);
	await delay(30);
	instance.unmount();

	t.assert.strictEqual(changes.at(-1), 'apple');
});
