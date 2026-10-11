import {PassThrough} from 'node:stream';
import React from 'react';
import test, {type TestContext} from 'node:test';
import delay from 'delay';
import {
	type MouseEvent,
	Text,
	parseMouseEvent,
	render,
	useInput,
	useMouse,
} from '../src/index.js';
import {mouseTrackingDisable, mouseTrackingEnable} from '../src/mouse.js';
import createStdout from './helpers/create-stdout.js';

const esc = '\u{1B}';

test('a left press decodes to 1-based cell coordinates', (t: TestContext) => {
	t.assert.deepStrictEqual(parseMouseEvent(`${esc}[<0;24;12M`), {
		action: 'press',
		button: 'left',
		x: 24,
		y: 12,
		shift: false,
		meta: false,
		ctrl: false,
	});
});

test('a release keeps its button and uses the m final byte', (t: TestContext) => {
	t.assert.strictEqual(parseMouseEvent(`${esc}[<2;3;4m`)?.action, 'release');
	t.assert.strictEqual(parseMouseEvent(`${esc}[<2;3;4m`)?.button, 'right');
});

test('modifier bits are decoded independently of the button', (t: TestContext) => {
	const event = parseMouseEvent(`${esc}[<28;1;1M`);
	t.assert.strictEqual(event?.button, 'left');
	t.assert.strictEqual(event?.shift, true);
	t.assert.strictEqual(event?.meta, true);
	t.assert.strictEqual(event?.ctrl, true);
});

test('wheel steps decode to wheel buttons, not presses', (t: TestContext) => {
	t.assert.deepStrictEqual(
		[64, 65, 66, 67].map(code => parseMouseEvent(`${esc}[<${code};5;6M`)),
		[
			{action: 'wheel', button: 'wheelUp', x: 5, y: 6, shift: false, meta: false, ctrl: false},
			{action: 'wheel', button: 'wheelDown', x: 5, y: 6, shift: false, meta: false, ctrl: false},
			{action: 'wheel', button: 'wheelLeft', x: 5, y: 6, shift: false, meta: false, ctrl: false},
			{action: 'wheel', button: 'wheelRight', x: 5, y: 6, shift: false, meta: false, ctrl: false},
		],
	);
});

test('motion with a held button is a drag, and motion without one is a move', (t: TestContext) => {
	t.assert.strictEqual(parseMouseEvent(`${esc}[<32;10;2M`)?.action, 'drag');
	t.assert.strictEqual(parseMouseEvent(`${esc}[<35;10;2M`)?.action, 'move');
	t.assert.strictEqual(parseMouseEvent(`${esc}[<35;10;2M`)?.button, 'none');
});

test('coordinates beyond the legacy 223-column limit are not truncated', (t: TestContext) => {
	t.assert.strictEqual(parseMouseEvent(`${esc}[<0;300;150M`)?.x, 300);
});

test('malformed reports are rejected', (t: TestContext) => {
	t.assert.strictEqual(parseMouseEvent(`${esc}[<0;0;1M`), undefined);
	t.assert.strictEqual(parseMouseEvent(`${esc}[<0;1;1`), undefined);
	t.assert.strictEqual(parseMouseEvent(`${esc}[A`), undefined);
	t.assert.strictEqual(parseMouseEvent('x'), undefined);
});

const createInput = (): NodeJS.ReadStream => {
	const stdin = new PassThrough() as PassThrough & {
		isTTY: boolean;
		setRawMode: (mode: boolean) => void;
	};
	stdin.isTTY = true;
	stdin.setRawMode = () => {};
	return stdin as unknown as NodeJS.ReadStream;
};

test('useMouse receives reports, useInput never does, and tracking follows mount state', async (t: TestContext) => {
	const events: MouseEvent[] = [];
	const keys: string[] = [];

	function Probe() {
		useMouse(event => {
			events.push(event);
		});
		useInput(input => {
			keys.push(input);
		});
		return <Text>probe</Text>;
	}

	const stdout = createStdout(80, true);
	const stdin = createInput();
	const instance = render(<Probe />, {
		stdout,
		stdin,
		stderr: stdout,
		interactive: true,
		exitOnCtrlC: false,
		patchConsole: false,
	});

	await instance.waitUntilRenderFlush();
	t.assert.ok(stdout.getWrites().includes(mouseTrackingEnable));

	stdin.write(`${esc}[<0;24;12M`);
	stdin.write(`${esc}[<64;5;6M`);
	await delay(50);

	t.assert.deepStrictEqual(
		events.map(event => [event.action, event.button, event.x, event.y]),
		[
			['press', 'left', 24, 12],
			['wheel', 'wheelUp', 5, 6],
		],
	);
	t.assert.deepStrictEqual(keys, []);

	instance.unmount();
	t.assert.ok(stdout.getWrites().includes(mouseTrackingDisable));
});

test('mouse tracking is shared by mounted hooks and released with the last one', async (t: TestContext) => {
	function Listener() {
		useMouse(() => {});
		return <Text>listener</Text>;
	}

	const stdout = createStdout(80, true);
	const instance = render(
		<>
			<Listener />
			<Listener />
		</>,
		{
			stdout,
			stdin: createInput(),
			stderr: stdout,
			interactive: true,
			exitOnCtrlC: false,
			patchConsole: false,
		},
	);

	await instance.waitUntilRenderFlush();
	const enables = stdout.getWrites().filter(write => write === mouseTrackingEnable);
	t.assert.strictEqual(enables.length, 1);

	instance.unmount();
	const disables = stdout.getWrites().filter(write => write === mouseTrackingDisable);
	t.assert.strictEqual(disables.length, 1);
});
