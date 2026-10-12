import React from 'react';
import test, {type TestContext} from 'node:test';
import {render} from './helpers/render.js';
import {Text} from '@nemesis-oss/termina-core';
import chalk from 'chalk';
import delay from 'delay';
import figures from 'figures';
import {Toast} from '../source/components/toast/index.js';

test('renders the message with the info icon by default', (t: TestContext) => {
	const {lastFrame, unmount} = render(<Toast>Saved</Toast>);

	t.assert.strictEqual(lastFrame(), ` ${chalk.blue(figures.info)} Saved`);
	unmount();
});

test('uses the icon and color of the variant', (t: TestContext) => {
	const {lastFrame, unmount} = render(<Toast variant="success">Saved</Toast>);

	t.assert.strictEqual(lastFrame(), ` ${chalk.green(figures.tick)} Saved`);
	unmount();
});

test('renders Text elements as children', (t: TestContext) => {
	const {lastFrame, unmount} = render(
		<Toast>
			<Text color="green">Saved</Text>
		</Toast>,
	);

	t.assert.strictEqual(
		lastFrame(),
		` ${chalk.blue(figures.info)} ${chalk.green('Saved')}`,
	);
	unmount();
});

test('waits 3000 ms before hiding by default', async (t: TestContext) => {
	const setTimeoutMock = t.mock.method(globalThis, 'setTimeout');
	const {unmount} = render(<Toast>Saved</Toast>);

	await delay(20);
	unmount();
	const scheduledDelays = setTimeoutMock.mock.calls.map(
		call => call.arguments[1],
	);
	t.assert.ok(scheduledDelays.includes(3000));
});

test('hides after durationMs and calls onDismiss once', async (t: TestContext) => {
	const onDismiss = t.mock.fn();
	const {lastFrame, unmount} = render(
		<Toast durationMs={150} onDismiss={onDismiss}>
			Saved
		</Toast>,
	);

	await delay(40);
	t.assert.strictEqual(lastFrame(), ` ${chalk.blue(figures.info)} Saved`);

	await delay(260);
	t.assert.strictEqual(lastFrame(), '');
	t.assert.strictEqual(onDismiss.mock.callCount(), 1);

	await delay(150);
	t.assert.strictEqual(onDismiss.mock.callCount(), 1);
	unmount();
});

test('keeps the toast when durationMs is 0', async (t: TestContext) => {
	const onDismiss = t.mock.fn();
	const {lastFrame, unmount} = render(
		<Toast durationMs={0} onDismiss={onDismiss}>
			Saved
		</Toast>,
	);

	await delay(100);
	t.assert.strictEqual(lastFrame(), ` ${chalk.blue(figures.info)} Saved`);
	t.assert.strictEqual(onDismiss.mock.callCount(), 0);
	unmount();
});

test('keeps the toast when durationMs is negative', async (t: TestContext) => {
	const onDismiss = t.mock.fn();
	const {lastFrame, unmount} = render(
		<Toast durationMs={-1} onDismiss={onDismiss}>
			Saved
		</Toast>,
	);

	await delay(100);
	t.assert.strictEqual(lastFrame(), ` ${chalk.blue(figures.info)} Saved`);
	t.assert.strictEqual(onDismiss.mock.callCount(), 0);
	unmount();
});

test('unmounting before durationMs cancels the countdown and onDismiss', async (t: TestContext) => {
	const onDismiss = t.mock.fn();
	const {unmount} = render(
		<Toast durationMs={150} onDismiss={onDismiss}>
			Saved
		</Toast>,
	);

	await delay(20);
	unmount();
	await delay(200);
	t.assert.strictEqual(onDismiss.mock.callCount(), 0);
});

test('re-rendering does not restart the countdown and calls the latest onDismiss', async (t: TestContext) => {
	const firstOnDismiss = t.mock.fn();
	const latestOnDismiss = t.mock.fn();
	const {lastFrame, rerender, unmount} = render(
		<Toast durationMs={300} onDismiss={firstOnDismiss}>
			Saved
		</Toast>,
	);

	await delay(225);
	rerender(
		<Toast durationMs={300} variant="warning" onDismiss={latestOnDismiss}>
			Saved again
		</Toast>,
	);
	await delay(185);

	t.assert.strictEqual(lastFrame(), '');
	t.assert.strictEqual(firstOnDismiss.mock.callCount(), 0);
	t.assert.strictEqual(latestOnDismiss.mock.callCount(), 1);
	unmount();
});

test('changing key restarts the countdown', async (t: TestContext) => {
	const onDismiss = t.mock.fn();
	const {lastFrame, rerender, unmount} = render(
		<Toast key="first" durationMs={300} onDismiss={onDismiss}>
			Saved
		</Toast>,
	);

	await delay(225);
	rerender(
		<Toast key="second" durationMs={300} onDismiss={onDismiss}>
			Saved
		</Toast>,
	);
	await delay(185);
	// The first countdown would have hidden the toast at 300 ms.
	t.assert.strictEqual(lastFrame(), ` ${chalk.blue(figures.info)} Saved`);

	await delay(250);
	t.assert.strictEqual(lastFrame(), '');
	t.assert.strictEqual(onDismiss.mock.callCount(), 1);
	unmount();
});

test('changing durationMs while visible restarts the countdown', async (t: TestContext) => {
	const onDismiss = t.mock.fn();
	const {lastFrame, rerender, unmount} = render(
		<Toast durationMs={400} onDismiss={onDismiss}>
			Saved
		</Toast>,
	);

	await delay(20);
	rerender(
		<Toast durationMs={100} onDismiss={onDismiss}>
			Saved
		</Toast>,
	);
	await delay(240);

	t.assert.strictEqual(lastFrame(), '');
	t.assert.strictEqual(onDismiss.mock.callCount(), 1);
	unmount();
});

test('a hidden toast stays hidden on re-render and does not call onDismiss again', async (t: TestContext) => {
	const onDismiss = t.mock.fn();
	const {lastFrame, rerender, unmount} = render(
		<Toast durationMs={150} onDismiss={onDismiss}>
			Saved
		</Toast>,
	);

	await delay(250);
	rerender(
		<Toast durationMs={50} onDismiss={onDismiss}>
			Saved again
		</Toast>,
	);
	await delay(150);

	t.assert.strictEqual(lastFrame(), '');
	t.assert.strictEqual(onDismiss.mock.callCount(), 1);
	unmount();
});

test('a new key shows the toast again after it has hidden', async (t: TestContext) => {
	const onDismiss = t.mock.fn();
	const {lastFrame, rerender, unmount} = render(
		<Toast key="first" durationMs={150} onDismiss={onDismiss}>
			Saved
		</Toast>,
	);

	await delay(250);
	rerender(
		<Toast key="second" durationMs={150} onDismiss={onDismiss}>
			Saved
		</Toast>,
	);
	await delay(20);
	t.assert.strictEqual(lastFrame(), ` ${chalk.blue(figures.info)} Saved`);

	await delay(250);
	t.assert.strictEqual(lastFrame(), '');
	t.assert.strictEqual(onDismiss.mock.callCount(), 2);
	unmount();
});
