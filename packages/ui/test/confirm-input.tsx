import test, {type TestContext} from 'node:test';
import React from 'react';
import delay from 'delay';
import {ConfirmInput} from '../source/index.js';
import {render} from './helpers/render.js';

const enter = '\r';

test('confirm via "Y"', async (t: TestContext) => {
	let isConfirmed = false;
	let isCancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			onConfirm={() => {
				isConfirmed = true;
			}}
			onCancel={() => {
				isCancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write('Y');
	await delay(50);

	t.assert.ok(isConfirmed);
	t.assert.ok(!isCancelled);
});

test('confirm via "y"', async (t: TestContext) => {
	let isConfirmed = false;
	let isCancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			onConfirm={() => {
				isConfirmed = true;
			}}
			onCancel={() => {
				isCancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write('y');
	await delay(50);

	t.assert.ok(isConfirmed);
	t.assert.ok(!isCancelled);
});

test('confirm via enter', async (t: TestContext) => {
	let isConfirmed = false;
	let isCancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			onConfirm={() => {
				isConfirmed = true;
			}}
			onCancel={() => {
				isCancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.ok(isConfirmed);
	t.assert.ok(!isCancelled);
});

test('confirm with disabled enter', async (t: TestContext) => {
	let isConfirmed = false;
	let isCancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			submitOnEnter={false}
			onConfirm={() => {
				isConfirmed = true;
			}}
			onCancel={() => {
				isCancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.ok(!isConfirmed);
	t.assert.ok(!isCancelled);

	await delay(50);
	stdin.write('y');
	await delay(50);

	t.assert.ok(isConfirmed);
	t.assert.ok(!isCancelled);
});

test('cancel via "N"', async (t: TestContext) => {
	let isConfirmed = false;
	let isCancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			onConfirm={() => {
				isConfirmed = true;
			}}
			onCancel={() => {
				isCancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write('N');
	await delay(50);

	t.assert.ok(!isConfirmed);
	t.assert.ok(isCancelled);
});

test('cancel via "n"', async (t: TestContext) => {
	let isConfirmed = false;
	let isCancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			onConfirm={() => {
				isConfirmed = true;
			}}
			onCancel={() => {
				isCancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write('n');
	await delay(50);

	t.assert.ok(!isConfirmed);
	t.assert.ok(isCancelled);
});

test('cancel via enter', async (t: TestContext) => {
	let isConfirmed = false;
	let isCancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			defaultChoice="cancel"
			onConfirm={() => {
				isConfirmed = true;
			}}
			onCancel={() => {
				isCancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'y/N');

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.ok(!isConfirmed);
	t.assert.ok(isCancelled);
});

test('cancel with disabled enter', async (t: TestContext) => {
	let isConfirmed = false;
	let isCancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			defaultChoice="cancel"
			submitOnEnter={false}
			onConfirm={() => {
				isConfirmed = true;
			}}
			onCancel={() => {
				isCancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'y/N');

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.ok(!isConfirmed);
	t.assert.ok(!isCancelled);

	await delay(50);
	stdin.write('n');
	await delay(50);

	t.assert.ok(!isConfirmed);
	t.assert.ok(isCancelled);
});
