import test, {type TestContext} from 'node:test';
import React, {type ReactNode} from 'react';
import {
	render,
	Box,
	Text,
	useApp,
	useCursorShape,
	type CursorShape,
} from '../src/index.js';
import createStdout, {type FakeStdout} from './helpers/create-stdout.js';
import {createStdin} from './helpers/create-stdin.js';
import {act} from './helpers/act.js';

const bar = '\u{1B}[6 q';
const block = '\u{1B}[2 q';
const restore = '\u{1B}[0 q';

// Cursor shape writes are whole writes of one DECSCUSR sequence, so they can be told apart from the frame.
const shapeWrites = (stdout: FakeStdout): string[] =>
	stdout
		.getWrites()
		.filter((data) => data.startsWith('\u{1B}[') && data.endsWith(' q'));

const renderShape = async (
	element: ReactNode,
	{interactive = true}: {readonly interactive?: boolean} = {},
) => {
	const stdout = createStdout();
	let instance!: ReturnType<typeof render>;

	await act(async () => {
		instance = render(element, {
			stdin: createStdin(),
			stdout,
			interactive,
			patchConsole: false,
		});
	});

	return {stdout, instance};
};

// Renders nothing. It holds a cursor shape request for as long as it is mounted.
function Cursor({shape}: {readonly shape: CursorShape}) {
	useCursorShape(shape);
	return null;
}

function Screen({children}: {readonly children?: ReactNode}) {
	return (
		<Box flexDirection="column">
			<Text>screen</Text>
			{children}
		</Box>
	);
}

// Two fixed slots. A request appearing or leaving one slot does not remount the other, so only the requests named here change.
function Stack({
	first,
	second,
}: {
	readonly first?: CursorShape;
	readonly second?: CursorShape;
}) {
	return (
		<Box flexDirection="column">
			<Text>screen</Text>
			{first === undefined ? null : <Cursor shape={first} />}
			{second === undefined ? null : <Cursor shape={second} />}
		</Box>
	);
}

test('a bar cursor is written on mount and not again on a rerender with the same shape', async (t: TestContext) => {
	const {stdout, instance} = await renderShape(
		<Screen>
			<Cursor shape="bar" />
		</Screen>,
	);
	t.after(() => {
		instance.unmount();
	});

	t.assert.deepStrictEqual(shapeWrites(stdout), [bar]);

	await act(async () => {
		instance.rerender(
			<Screen>
				<Cursor shape="bar" />
			</Screen>,
		);
	});

	t.assert.deepStrictEqual(shapeWrites(stdout), [bar]);
});

test('unmounting ends with the default cursor shape', async (t: TestContext) => {
	const {stdout, instance} = await renderShape(
		<Screen>
			<Cursor shape="bar" />
		</Screen>,
	);

	instance.unmount();

	t.assert.deepStrictEqual(shapeWrites(stdout), [bar, restore]);
	const writes = stdout.getWrites().filter((data) => data !== '');
	t.assert.strictEqual(writes.at(-1), restore);
});

test('changing the shape writes the new shape', async (t: TestContext) => {
	const {stdout, instance} = await renderShape(<Cursor shape="bar" />);
	t.after(() => {
		instance.unmount();
	});

	await act(async () => {
		instance.rerender(<Cursor shape="block" />);
	});

	t.assert.strictEqual(shapeWrites(stdout).at(-1), block);
});

test('with two requests, unmounting the inner one restores the outer shape', async (t: TestContext) => {
	const {stdout, instance} = await renderShape(<Stack first="bar" />);
	t.after(() => {
		instance.unmount();
	});

	await act(async () => {
		instance.rerender(<Stack first="bar" second="block" />);
	});

	await act(async () => {
		instance.rerender(<Stack first="bar" />);
	});

	t.assert.deepStrictEqual(shapeWrites(stdout), [bar, block, bar]);
});

test('requests with the same shape write once, and the default comes back only when the last one leaves', async (t: TestContext) => {
	const {stdout, instance} = await renderShape(
		<Stack first="bar" second="bar" />,
	);
	t.after(() => {
		instance.unmount();
	});

	t.assert.deepStrictEqual(shapeWrites(stdout), [bar]);

	await act(async () => {
		instance.rerender(<Stack first="bar" />);
	});

	t.assert.deepStrictEqual(shapeWrites(stdout), [bar]);

	await act(async () => {
		instance.rerender(<Stack />);
	});

	t.assert.deepStrictEqual(shapeWrites(stdout), [bar, restore]);
});

test('suspending restores the default shape and resuming writes the bar again', async (t: TestContext) => {
	let app!: ReturnType<typeof useApp>;
	function Suspendable() {
		app = useApp();
		useCursorShape('bar');
		return <Text>suspendable</Text>;
	}

	const {stdout, instance} = await renderShape(<Suspendable />);
	t.after(() => {
		instance.unmount();
	});

	const suspension = await app.suspendTerminal();
	t.assert.deepStrictEqual(shapeWrites(stdout), [bar, restore]);

	await suspension.resume();
	t.assert.deepStrictEqual(shapeWrites(stdout), [bar, restore, bar]);
});

test('a shape requested while suspended is written on resume, not during the suspension', async (t: TestContext) => {
	let app!: ReturnType<typeof useApp>;
	function Suspendable({shape}: {readonly shape: CursorShape}) {
		app = useApp();
		useCursorShape(shape);
		return <Text>suspendable</Text>;
	}

	const {stdout, instance} = await renderShape(<Suspendable shape="bar" />);
	t.after(() => {
		instance.unmount();
	});

	const suspension = await app.suspendTerminal();

	await act(async () => {
		instance.rerender(<Suspendable shape="block" />);
	});
	t.assert.deepStrictEqual(shapeWrites(stdout), [bar, restore]);

	await suspension.resume();
	t.assert.deepStrictEqual(shapeWrites(stdout), [bar, restore, block]);
});

test('a non-interactive render writes no cursor shape', async (t: TestContext) => {
	const {stdout, instance} = await renderShape(<Cursor shape="bar" />, {
		interactive: false,
	});

	instance.unmount();

	t.assert.deepStrictEqual(shapeWrites(stdout), []);
});
