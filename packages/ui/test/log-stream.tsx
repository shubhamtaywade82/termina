import React from 'react';
import test, {type TestContext} from 'node:test';
import delay from 'delay';
import {render} from './helpers/render.js';
import {LogStream} from '../source/index.js';

const entries = (count: number) =>
	Array.from({length: count}, (_, index) => `entry ${index}`);

const arrowUp = '\u001B[A';
const end = '\u001B[F';

test('a log stays pinned to the newest entry as lines arrive', async (t: TestContext) => {
	const instance = render(<LogStream lines={entries(10)} height={3} />);
	await delay(40);
	t.assert.ok((instance.lastFrame() ?? '').includes('entry 9'));
	t.assert.ok(!(instance.lastFrame() ?? '').includes('entry 6'));

	instance.rerender(<LogStream lines={entries(12)} height={3} />);
	await delay(40);
	t.assert.ok((instance.lastFrame() ?? '').includes('entry 11'));
	instance.unmount();
});

test('scrolling up releases the pin, and End re-pins it', async (t: TestContext) => {
	const instance = render(<LogStream lines={entries(12)} height={3} />);
	await delay(40);

	instance.stdin.write(arrowUp);
	await delay(40);
	instance.rerender(<LogStream lines={entries(14)} height={3} />);
	await delay(40);
	const held = instance.lastFrame() ?? '';
	t.assert.ok(held.includes('entry 8'));
	t.assert.ok(!held.includes('entry 11'));

	instance.stdin.write(end);
	await delay(40);
	t.assert.ok((instance.lastFrame() ?? '').includes('entry 13'));
	instance.unmount();
});
