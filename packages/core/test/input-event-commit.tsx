import test, {type TestContext} from 'node:test';
import React, {useState} from 'react';
import delay from 'delay';
import {render, Text, useInput} from '../src/index.js';
import createStdout from './helpers/create-stdout.js';
import {createStdin, emitReadable} from './helpers/create-stdin.js';

// Keys that arrive in one read are delivered as separate input events. Each event must see the state the previous event committed, as it would if the read had arrived in pieces.
test('each input event in one read sees the state committed by the event before it', async (t: TestContext) => {
	function Echo() {
		const [text, setText] = useState('');

		useInput(input => {
			if (input === 'a' || input === 'b') {
				setText(text + input);
			}
		});

		return <Text>{text}</Text>;
	}

	const stdout = createStdout();
	const stdin = createStdin();
	const instance = render(<Echo />, {
		stdout,
		stdin,
		debug: true,
		patchConsole: false,
	});
	t.after(() => {
		instance.unmount();
	});

	await delay(20);
	// 'a', then Left arrow, then 'b': three events, one read.
	emitReadable(stdin, 'a\u001B[Db');
	await delay(20);

	t.assert.strictEqual(stdout.get(), 'ab');
});
