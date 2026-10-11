import React from 'react';
import test, {type TestContext} from 'node:test';
import delay from 'delay';
import {render} from './helpers/render.js';
import {TextInput} from '../source/index.js';

const enter = '\r';
const left = '\u001B[D';
const backspace = '\u007F';
const forwardDelete = '\u001B[3~';

// Types each key, submits, and returns the value Enter delivered.
const submitAfter = async (
	keys: string[],
	defaultValue = '',
): Promise<string | undefined> => {
	const submitted: string[] = [];
	const instance = render(
		<TextInput
			defaultValue={defaultValue}
			onSubmit={value => {
				submitted.push(value);
			}}
		/>,
	);

	await delay(20);
	for (const key of [...keys, enter]) {
		instance.stdin.write(key);
		await delay(15);
	}

	instance.unmount();
	return submitted[0];
};

test('backspace at the start of the input deletes nothing', async (t: TestContext) => {
	t.assert.strictEqual(await submitAfter([left, left, left, backspace], 'abc'), 'abc');
});

test('forward delete removes the character under the cursor', async (t: TestContext) => {
	t.assert.strictEqual(await submitAfter([left, left, forwardDelete], 'abc'), 'ac');
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
	t.assert.strictEqual(await submitAfter(['\u0001'], 'abc'), 'abc');
});

test('control characters in pasted text are not inserted', async (t: TestContext) => {
	t.assert.strictEqual(await submitAfter(['x\ny']), 'xy');
});
