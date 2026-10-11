import React from 'react';
import test, {type TestContext} from 'node:test';
import {render} from './helpers/render.js';
import delay from 'delay';
import {ConfirmInput} from '../source/index.js';

const enter = '\r';

test('confirm via "Y"', async (t: TestContext) => {
	let confirmed = false;
	let cancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			onConfirm={() => {
				confirmed = true;
			}}
			onCancel={() => {
				cancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write('Y');
	await delay(50);

	t.assert.ok(confirmed);
	t.assert.ok(!(cancelled));
});

test('confirm via "y"', async (t: TestContext) => {
	let confirmed = false;
	let cancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			onConfirm={() => {
				confirmed = true;
			}}
			onCancel={() => {
				cancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write('y');
	await delay(50);

	t.assert.ok(confirmed);
	t.assert.ok(!(cancelled));
});

test('confirm via enter', async (t: TestContext) => {
	let confirmed = false;
	let cancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			onConfirm={() => {
				confirmed = true;
			}}
			onCancel={() => {
				cancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.ok(confirmed);
	t.assert.ok(!(cancelled));
});

test('confirm with disabled enter', async (t: TestContext) => {
	let confirmed = false;
	let cancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			submitOnEnter={false}
			onConfirm={() => {
				confirmed = true;
			}}
			onCancel={() => {
				cancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.ok(!(confirmed));
	t.assert.ok(!(cancelled));

	await delay(50);
	stdin.write('y');
	await delay(50);

	t.assert.ok(confirmed);
	t.assert.ok(!(cancelled));
});

test('cancel via "N"', async (t: TestContext) => {
	let confirmed = false;
	let cancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			onConfirm={() => {
				confirmed = true;
			}}
			onCancel={() => {
				cancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write('N');
	await delay(50);

	t.assert.ok(!(confirmed));
	t.assert.ok(cancelled);
});

test('cancel via "n"', async (t: TestContext) => {
	let confirmed = false;
	let cancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			onConfirm={() => {
				confirmed = true;
			}}
			onCancel={() => {
				cancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'Y/n');

	await delay(50);
	stdin.write('n');
	await delay(50);

	t.assert.ok(!(confirmed));
	t.assert.ok(cancelled);
});

test('cancel via enter', async (t: TestContext) => {
	let confirmed = false;
	let cancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			defaultChoice="cancel"
			onConfirm={() => {
				confirmed = true;
			}}
			onCancel={() => {
				cancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'y/N');

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.ok(!(confirmed));
	t.assert.ok(cancelled);
});

test('cancel with disabled enter', async (t: TestContext) => {
	let confirmed = false;
	let cancelled = false;

	const {lastFrame, stdin} = render(
		<ConfirmInput
			defaultChoice="cancel"
			submitOnEnter={false}
			onConfirm={() => {
				confirmed = true;
			}}
			onCancel={() => {
				cancelled = true;
			}}
		/>,
	);

	t.assert.strictEqual(lastFrame(), 'y/N');

	await delay(50);
	stdin.write(enter);
	await delay(50);

	t.assert.ok(!(confirmed));
	t.assert.ok(!(cancelled));

	await delay(50);
	stdin.write('n');
	await delay(50);

	t.assert.ok(!(confirmed));
	t.assert.ok(cancelled);
});
