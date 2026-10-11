import {PassThrough} from 'node:stream';
import React from 'react';
import test, {type TestContext} from 'node:test';
import delay from 'delay';
import {Box, Text, render} from '../src/index.js';
import {mouseTrackingEnable} from '../src/mouse.js';
import createStdout from './helpers/create-stdout.js';

const esc = '\u{1B}';
const press = (x: number, y: number) => `${esc}[<0;${x};${y}M`;
const release = (x: number, y: number) => `${esc}[<0;${x};${y}m`;
const wheelDown = (x: number, y: number) => `${esc}[<65;${x};${y}M`;

const createInput = (): NodeJS.ReadStream => {
	const stdin = new PassThrough() as PassThrough & {
		isTTY: boolean;
		setRawMode: (mode: boolean) => void;
	};
	stdin.isTTY = true;
	stdin.setRawMode = () => {};
	return stdin as unknown as NodeJS.ReadStream;
};

// Mounts with mouse tracking on, unless told otherwise. Positions in the tests are 1-based, as the terminal reports them.
const mount = async (element: React.ReactElement, mouse = true) => {
	const stdout = createStdout(40, true);
	const stdin = createInput();
	const instance = render(element, {
		stdout,
		stdin,
		stderr: stdout,
		interactive: true,
		mouse,
		exitOnCtrlC: false,
		patchConsole: false,
	});
	await instance.waitUntilRenderFlush();
	await delay(20);
	return {instance, stdin, stdout};
};

const send = async (stdin: NodeJS.ReadStream, ...sequences: string[]) => {
	for (const sequence of sequences) {
		(stdin as unknown as PassThrough).write(sequence);
		await delay(10);
	}

	await delay(20);
};

test('a press and release in place fires onClick once', async (t: TestContext) => {
	const clicks: string[] = [];
	const {instance, stdin} = await mount(
		<Box width={10} height={3} onClick={() => clicks.push('box')}>
			<Text>button</Text>
		</Box>,
	);

	await send(stdin, press(3, 2), release(3, 2));
	t.assert.deepStrictEqual(clicks, ['box']);
	instance.unmount();
});

test('a press that is released elsewhere is not a click', async (t: TestContext) => {
	const clicks: string[] = [];
	const {instance, stdin} = await mount(
		<Box width={10} height={3} onClick={() => clicks.push('box')}>
			<Text>button</Text>
		</Box>,
	);

	await send(stdin, press(3, 2), release(30, 20));
	t.assert.deepStrictEqual(clicks, []);
	instance.unmount();
});

test('a click on an element without its own handler bubbles to its ancestor', async (t: TestContext) => {
	const clicks: string[] = [];
	const {instance, stdin} = await mount(
		<Box width={10} height={3} onClick={() => clicks.push('outer')}>
			<Box width={4} height={1}>
				<Text>inner</Text>
			</Box>
		</Box>,
	);

	await send(stdin, press(1, 1), release(1, 1));
	t.assert.deepStrictEqual(clicks, ['outer']);
	instance.unmount();
});

test('the closest handler wins, and ancestors do not also fire', async (t: TestContext) => {
	const clicks: string[] = [];
	const {instance, stdin} = await mount(
		<Box width={10} height={3} onClick={() => clicks.push('outer')}>
			<Box width={4} height={1} onClick={() => clicks.push('inner')}>
				<Text>inner</Text>
			</Box>
		</Box>,
	);

	await send(stdin, press(1, 1), release(1, 1));
	t.assert.deepStrictEqual(clicks, ['inner']);
	instance.unmount();
});

test('the mouse wheel reaches onWheel only over the element', async (t: TestContext) => {
	const wheel: string[] = [];
	const {instance, stdin} = await mount(
		<Box width={10} height={3} onWheel={event => wheel.push(event.button)}>
			<Text>scroll me</Text>
		</Box>,
	);

	await send(stdin, wheelDown(2, 2), wheelDown(30, 20));
	t.assert.deepStrictEqual(wheel, ['wheelDown']);
	instance.unmount();
});

test('an overflow-hidden ancestor clips hits to the visible area', async (t: TestContext) => {
	const clicks: string[] = [];
	const {instance, stdin} = await mount(
		<Box width={10} height={3} overflow="hidden" flexDirection="column">
			<Box width={10} height={6} flexShrink={0} onClick={() => clicks.push('tall')} />
		</Box>,
	);

	// Row 5 is below the three-row viewport, so the child is clipped there.
	await send(stdin, press(1, 5), release(1, 5));
	t.assert.deepStrictEqual(clicks, []);

	await send(stdin, press(1, 2), release(1, 2));
	t.assert.deepStrictEqual(clicks, ['tall']);
	instance.unmount();
});

test('contentOffsetY shifts hit targets with the rendered content', async (t: TestContext) => {
	const clicks: string[] = [];
	const row = (name: string) => (
		<Box key={name} height={1} flexShrink={0} onClick={() => clicks.push(name)}>
			<Text>{name}</Text>
		</Box>
	);

	const {instance, stdin} = await mount(
		<Box width={10} height={3} overflow="hidden" contentOffsetY={2} flexDirection="column">
			{['row0', 'row1', 'row2', 'row3'].map(row)}
		</Box>,
	);

	// Two rows are scrolled off the top, so the first visible row is row2.
	await send(stdin, press(1, 1), release(1, 1));
	t.assert.deepStrictEqual(clicks, ['row2']);
	instance.unmount();
});

test('without the mouse option nothing enables tracking and nothing is dispatched', async (t: TestContext) => {
	const clicks: string[] = [];
	const {instance, stdin, stdout} = await mount(
		<Box width={10} height={3} onClick={() => clicks.push('box')}>
			<Text>button</Text>
		</Box>,
		false,
	);

	await send(stdin, press(3, 2), release(3, 2));
	t.assert.strictEqual(stdout.getWrites().includes(mouseTrackingEnable), false);
	t.assert.deepStrictEqual(clicks, []);
	instance.unmount();
});
