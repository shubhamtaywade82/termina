import test, {type TestContext} from 'node:test';
import React, {useRef} from 'react';
import stripAnsi from 'strip-ansi';
import {
	Box,
	KeyboardCapture,
	type DOMElement,
	Text,
	render,
	useFocus,
	useFocusManager,
	useInput,
} from '../src/index.js';
import {createStdin, emitReadable} from './helpers/create-stdin.js';
import createStdout from './helpers/create-stdout.js';
import {act} from './helpers/act.js';

const up = '\u{1B}[A';
const down = '\u{1B}[B';
const right = '\u{1B}[C';
const left = '\u{1B}[D';

type CellProps = {
	readonly id: string;
	readonly autoFocus?: boolean;
	readonly isActive?: boolean;
	readonly hasRef?: boolean;
	readonly height?: number;
};

// A focusable 10 columns wide and fixed in height, so a shrinking parent clips it rather than shortening it. `hasRef` controls whether its focus registration gets a rectangle.
function Cell({
	id,
	autoFocus = false,
	isActive = true,
	hasRef = true,
	height = 3,
}: CellProps) {
	const ref = useRef<DOMElement>(null);
	const {isFocused} = useFocus({
		id,
		autoFocus,
		isActive,
		ref: hasRef ? ref : undefined,
	});

	return (
		<Box ref={ref} width={10} height={height} flexShrink={0}>
			<Text>{isFocused ? `[${id}]` : id}</Text>
		</Box>
	);
}

// Arrow keys call focusDirection, and the focused id is printed on the last line so a frame shows it.
function Controller({children}: {readonly children: React.ReactNode}) {
	const {activeId, focusDirection} = useFocusManager();

	useInput((_input, key) => {
		if (key.upArrow) {
			focusDirection('up');
		} else if (key.downArrow) {
			focusDirection('down');
		} else if (key.leftArrow) {
			focusDirection('left');
		} else if (key.rightArrow) {
			focusDirection('right');
		}
	});

	return (
		<Box flexDirection="column">
			{children}
			<Text>{`focus:${activeId ?? ''}`}</Text>
		</Box>
	);
}

const mount = (node: React.ReactNode) => {
	const stdin = createStdin();
	const stdout = createStdout(100);
	const instance = render(node, {
		stdin,
		stdout,
		debug: true,
		patchConsole: false,
		exitOnCtrlC: false,
	});

	return {
		stdin,
		focused: () =>
			/focus:(?<id>\S*)/.exec(stripAnsi(stdout.get()))?.groups?.id ?? '',
		async press(key: string) {
			await act(async () => {
				emitReadable(stdin, key);
			});
		},
		unmount() {
			instance.unmount();
		},
	};
};

test('moves focus to the neighbor in each direction of a grid', async (t: TestContext) => {
	const screen = mount(
		<Controller>
			<Box flexDirection="column">
				<Box>
					<Cell autoFocus id="A" />
					<Cell id="B" />
				</Box>
				<Box>
					<Cell id="C" />
					<Cell id="D" />
				</Box>
			</Box>
		</Controller>,
	);
	t.after(() => {
		screen.unmount();
	});
	await act(async () => {});

	t.assert.strictEqual(screen.focused(), 'A');

	await screen.press(right);
	t.assert.strictEqual(screen.focused(), 'B');

	await screen.press(down);
	t.assert.strictEqual(screen.focused(), 'D');

	await screen.press(left);
	t.assert.strictEqual(screen.focused(), 'C');

	await screen.press(up);
	t.assert.strictEqual(screen.focused(), 'A');
});

test('stays put when nothing lies in the direction', async (t: TestContext) => {
	const screen = mount(
		<Controller>
			<Box>
				<Cell autoFocus id="A" />
				<Cell id="B" />
			</Box>
		</Controller>,
	);
	t.after(() => {
		screen.unmount();
	});
	await act(async () => {});

	await screen.press(left);
	t.assert.strictEqual(screen.focused(), 'A');

	await screen.press(right);
	await screen.press(right);
	t.assert.strictEqual(screen.focused(), 'B');
});

test('skips an inactive component and a component that passed no ref', async (t: TestContext) => {
	const screen = mount(
		<Controller>
			<Box>
				<Cell autoFocus id="A" />
				<Cell id="B" isActive={false} />
				<Cell id="C" hasRef={false} />
				<Cell id="D" />
			</Box>
		</Controller>,
	);
	t.after(() => {
		screen.unmount();
	});
	await act(async () => {});

	// B is inactive and C has no rectangle, so the nearest reachable component to the right is D.
	await screen.press(right);
	t.assert.strictEqual(screen.focused(), 'D');

	await screen.press(left);
	t.assert.strictEqual(screen.focused(), 'A');
});

test('a component clipped out of its overflow-hidden parent is not a candidate', async (t: TestContext) => {
	// The clip shows rows 1 and 2. Q and R are drawn there, and S starts on row 3, past the clip.
	const screen = mount(
		<Controller>
			<Box flexDirection="column">
				<Cell autoFocus id="P" height={1} />
				<Box height={2} overflow="hidden" flexDirection="column">
					<Cell id="Q" height={1} />
					<Cell id="R" height={1} />
					<Cell id="S" height={1} />
				</Box>
			</Box>
		</Controller>,
	);
	t.after(() => {
		screen.unmount();
	});
	await act(async () => {});

	await screen.press(down);
	t.assert.strictEqual(screen.focused(), 'Q');

	await screen.press(down);
	t.assert.strictEqual(screen.focused(), 'R');

	// S is not drawn, so nothing lies below R and focus stays on it.
	await screen.press(down);
	t.assert.strictEqual(screen.focused(), 'R');
});

test('focus moves within an active capture and does not reach content outside it', async (t: TestContext) => {
	// While a capture is active, keys reach only the components inside it, so the controller sits inside.
	const screen = mount(
		<Box flexDirection="column">
			<Cell id="A" />
			<KeyboardCapture>
				<Controller>
					<Box>
						<Cell autoFocus id="X" />
						<Cell id="Y" />
					</Box>
				</Controller>
			</KeyboardCapture>
		</Box>,
	);
	t.after(() => {
		screen.unmount();
	});
	await act(async () => {});

	t.assert.strictEqual(screen.focused(), 'X');

	await screen.press(right);
	t.assert.strictEqual(screen.focused(), 'Y');

	// A is directly above X, but it is outside the capture, so Up has no candidate.
	await screen.press(up);
	t.assert.strictEqual(screen.focused(), 'Y');

	await screen.press(left);
	t.assert.strictEqual(screen.focused(), 'X');
});
