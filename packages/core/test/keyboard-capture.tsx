import {PassThrough} from 'node:stream';
import test, {type TestContext} from 'node:test';
import React from 'react';
import delay from 'delay';
import {
	KeyboardCapture,
	Text,
	render,
	useFocus,
	useInput,
	useMouse,
	usePaste,
} from '../src/index.js';
import createStdout from './helpers/create-stdout.js';

const esc = '\u{1B}';

type FakeInput = PassThrough & {
	isTTY: boolean;
	setRawMode: (isEnabled: boolean) => void;
};

const createInput = (): FakeInput => {
	const stdin = new PassThrough() as FakeInput;
	stdin.isTTY = true;
	stdin.setRawMode = () => {};
	return stdin;
};

// Each probe records what it receives in its own array, so a test can see which listener got an event.
function KeyProbe({received}: {readonly received: string[]}) {
	useInput((input) => {
		received.push(input);
	});

	return <Text>key probe</Text>;
}

function PasteProbe({received}: {readonly received: string[]}) {
	usePaste((text) => {
		received.push(text);
	});

	return <Text>paste probe</Text>;
}

function MouseProbe({received}: {readonly received: string[]}) {
	useMouse((event) => {
		received.push(`${event.action}:${event.x},${event.y}`);
	});

	return <Text>mouse probe</Text>;
}

// `states` gets one entry per render, so the last entry is the current focus state.
function FocusProbe({states}: {readonly states: boolean[]}) {
	const {isFocused} = useFocus({autoFocus: true});
	states.push(isFocused);

	return <Text>focus probe</Text>;
}

const renderTree = (tree: React.ReactElement, shouldExitOnCtrlC = false) => {
	const stdout = createStdout(80, true);
	const stdin = createInput();
	const instance = render(tree, {
		stdout,
		stdin: stdin as unknown as NodeJS.ReadStream,
		stderr: stdout,
		interactive: true,
		exitOnCtrlC: shouldExitOnCtrlC,
		patchConsole: false,
	});

	return {instance, stdin};
};

// Writes one read to stdin and waits long enough for the event to be handled. A lone Escape waits for the parser's flush delay (40 ms), so it needs a longer wait.
const send = async (
	stdin: FakeInput,
	data: string,
	waitMs = 60,
): Promise<void> => {
	stdin.write(data);
	await delay(waitMs);
};

test('outside useInput listeners get no keys while a KeyboardCapture is active, and inside listeners do', async (t: TestContext) => {
	const outer: string[] = [];
	const inner: string[] = [];
	const {instance, stdin} = renderTree(
		<>
			<KeyProbe received={outer} />
			<KeyboardCapture>
				<KeyProbe received={inner} />
			</KeyboardCapture>
		</>,
	);
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	await send(stdin, 'a');

	t.assert.deepStrictEqual(outer, []);
	t.assert.deepStrictEqual(inner, ['a']);
});

test('a nested KeyboardCapture restricts keys to the innermost owner', async (t: TestContext) => {
	const outer: string[] = [];
	const middle: string[] = [];
	const inner: string[] = [];
	const {instance, stdin} = renderTree(
		<>
			<KeyProbe received={outer} />
			<KeyboardCapture>
				<KeyProbe received={middle} />
				<KeyboardCapture>
					<KeyProbe received={inner} />
				</KeyboardCapture>
			</KeyboardCapture>
		</>,
	);
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	await send(stdin, 'b');

	t.assert.deepStrictEqual(outer, []);
	t.assert.deepStrictEqual(middle, []);
	t.assert.deepStrictEqual(inner, ['b']);
});

test('releasing the inner KeyboardCapture restores the outer owner', async (t: TestContext) => {
	const outer: string[] = [];
	const middle: string[] = [];
	const inner: string[] = [];
	const tree = (hasInner: boolean) => (
		<>
			<KeyProbe received={outer} />
			<KeyboardCapture>
				<KeyProbe received={middle} />
				{hasInner && (
					<KeyboardCapture>
						<KeyProbe received={inner} />
					</KeyboardCapture>
				)}
			</KeyboardCapture>
		</>
	);
	const {instance, stdin} = renderTree(tree(true));
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	await send(stdin, 'c');
	t.assert.deepStrictEqual(inner, ['c']);
	t.assert.deepStrictEqual(middle, []);

	instance.rerender(tree(false));
	await instance.waitUntilRenderFlush();
	await send(stdin, 'd');

	t.assert.deepStrictEqual(middle, ['d']);
	t.assert.deepStrictEqual(outer, []);
	t.assert.deepStrictEqual(inner, ['c']);
});

test('releasing every KeyboardCapture restores every listener', async (t: TestContext) => {
	const outer: string[] = [];
	const inner: string[] = [];
	const tree = (hasCapture: boolean) => (
		<>
			<KeyProbe received={outer} />
			{hasCapture && (
				<KeyboardCapture>
					<KeyboardCapture>
						<KeyProbe received={inner} />
					</KeyboardCapture>
				</KeyboardCapture>
			)}
		</>
	);
	const {instance, stdin} = renderTree(tree(true));
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	await send(stdin, 'e');
	t.assert.deepStrictEqual(outer, []);
	t.assert.deepStrictEqual(inner, ['e']);

	instance.rerender(tree(false));
	await instance.waitUntilRenderFlush();
	await send(stdin, 'f');

	t.assert.deepStrictEqual(outer, ['f']);
	t.assert.deepStrictEqual(inner, ['e']);
});

test('unmounting a KeyboardCapture while it is active releases the stack', async (t: TestContext) => {
	const outer: string[] = [];
	const inner: string[] = [];
	const tree = (hasCapture: boolean) => (
		<>
			<KeyProbe received={outer} />
			{hasCapture && (
				<KeyboardCapture>
					<KeyProbe received={inner} />
				</KeyboardCapture>
			)}
		</>
	);
	const {instance, stdin} = renderTree(tree(true));
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	instance.rerender(tree(false));
	await instance.waitUntilRenderFlush();
	await send(stdin, 'g');

	t.assert.deepStrictEqual(outer, ['g']);
	t.assert.deepStrictEqual(inner, []);
});

test('Escape clears focus when no KeyboardCapture is active', async (t: TestContext) => {
	const states: boolean[] = [];
	const {instance, stdin} = renderTree(<FocusProbe states={states} />);
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	await delay(20);
	t.assert.strictEqual(states.at(-1), true);

	await send(stdin, esc, 100);

	t.assert.strictEqual(states.at(-1), false);
});

test('Escape does not clear focus while a KeyboardCapture is active', async (t: TestContext) => {
	const states: boolean[] = [];
	const inner: string[] = [];
	const {instance, stdin} = renderTree(
		<>
			<FocusProbe states={states} />
			<KeyboardCapture>
				<KeyProbe received={inner} />
			</KeyboardCapture>
		</>,
	);
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	await delay(20);
	t.assert.strictEqual(states.at(-1), true);

	await send(stdin, esc, 100);

	t.assert.strictEqual(states.at(-1), true);
	// The captured listener still gets the Escape key itself, so the capture only changes focus handling.
	t.assert.strictEqual(inner.length, 1);
});

test('Ctrl+C still exits while a KeyboardCapture is active', async (t: TestContext) => {
	const inner: string[] = [];
	const {instance, stdin} = renderTree(
		<KeyboardCapture>
			<KeyProbe received={inner} />
		</KeyboardCapture>,
		true,
	);
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	const exit = instance.waitUntilExit().then(() => true);
	await send(stdin, '\u{3}');

	const hasExited = await Promise.race([exit, delay(1000).then(() => false)]);

	t.assert.strictEqual(hasExited, true);
	t.assert.deepStrictEqual(inner, []);
});

test('paste reaches only the usePaste listener inside a KeyboardCapture', async (t: TestContext) => {
	const outer: string[] = [];
	const inner: string[] = [];
	const {instance, stdin} = renderTree(
		<>
			<PasteProbe received={outer} />
			<KeyboardCapture>
				<PasteProbe received={inner} />
			</KeyboardCapture>
		</>,
	);
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	await send(stdin, `${esc}[200~hello${esc}[201~`);

	t.assert.deepStrictEqual(outer, []);
	t.assert.deepStrictEqual(inner, ['hello']);
});

test('paste with no usePaste listener is gated on useInput like typed input', async (t: TestContext) => {
	const outer: string[] = [];
	const inner: string[] = [];
	const {instance, stdin} = renderTree(
		<>
			<KeyProbe received={outer} />
			<KeyboardCapture>
				<KeyProbe received={inner} />
			</KeyboardCapture>
		</>,
	);
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	await send(stdin, `${esc}[200~hello${esc}[201~`);

	t.assert.deepStrictEqual(outer, []);
	t.assert.deepStrictEqual(inner, ['hello']);
});

test('mouse reports reach only the useMouse listener inside a KeyboardCapture', async (t: TestContext) => {
	const outer: string[] = [];
	const inner: string[] = [];
	const {instance, stdin} = renderTree(
		<>
			<MouseProbe received={outer} />
			<KeyboardCapture>
				<MouseProbe received={inner} />
			</KeyboardCapture>
		</>,
	);
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	await send(stdin, `${esc}[<0;24;12M`);

	t.assert.deepStrictEqual(outer, []);
	t.assert.deepStrictEqual(inner, ['press:24,12']);
});

test('toggling isActive starts and stops the capture', async (t: TestContext) => {
	const outer: string[] = [];
	const inner: string[] = [];
	const tree = (isActive: boolean) => (
		<>
			<KeyProbe received={outer} />
			<KeyboardCapture isActive={isActive}>
				<KeyProbe received={inner} />
			</KeyboardCapture>
		</>
	);
	const {instance, stdin} = renderTree(tree(true));
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	await send(stdin, 'h');
	t.assert.deepStrictEqual(outer, []);
	t.assert.deepStrictEqual(inner, ['h']);

	instance.rerender(tree(false));
	await instance.waitUntilRenderFlush();
	await send(stdin, 'i');
	t.assert.deepStrictEqual(outer, ['i']);

	instance.rerender(tree(true));
	await instance.waitUntilRenderFlush();
	await send(stdin, 'j');
	t.assert.deepStrictEqual(outer, ['i']);
	t.assert.deepStrictEqual(inner, ['h', 'i', 'j']);
});

test('an inactive KeyboardCapture leaves the owner of its children unchanged', async (t: TestContext) => {
	const outer: string[] = [];
	const middle: string[] = [];
	const inner: string[] = [];
	const {instance, stdin} = renderTree(
		<>
			<KeyProbe received={outer} />
			<KeyboardCapture>
				<KeyProbe received={middle} />
				<KeyboardCapture isActive={false}>
					<KeyProbe received={inner} />
				</KeyboardCapture>
			</KeyboardCapture>
		</>,
	);
	t.after(() => {
		instance.unmount();
	});

	await instance.waitUntilRenderFlush();
	await send(stdin, 'k');

	t.assert.deepStrictEqual(outer, []);
	t.assert.deepStrictEqual(middle, ['k']);
	t.assert.deepStrictEqual(inner, ['k']);
});
