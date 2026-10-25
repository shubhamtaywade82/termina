import test, {type TestContext} from 'node:test';
import React from 'react';
import {Box, Text, render, useFocus, useFocusManager} from '../src/index.js';
import {createXtermTerminal} from './helpers/xterm-terminal.js';

// Reports the focused id from inside the tree, so a terminal test can ask what has focus without parsing the rendered text.
const createFocusProbe = () => {
	let activeId: string | undefined;
	function FocusProbe() {
		activeId = useFocusManager().activeId;
		return null;
	}

	return {FocusProbe, focusedId: () => activeId};
};

function Field({
	id,
	autoFocus,
}: {
	readonly id: string;
	readonly autoFocus?: boolean;
}) {
	const {isFocused} = useFocus({id, autoFocus});
	return <Text>{isFocused ? `${id} <` : id}</Text>;
}

const renderOn = (
	terminal: ReturnType<typeof createXtermTerminal>,
	element: React.ReactNode,
) =>
	render(element, {
		stdout: terminal.stdout,
		stdin: terminal.stdin,
		stderr: terminal.stdout,
		interactive: true,
		exitOnCtrlC: false,
		patchConsole: false,
	});

test('getLine, cellAt and cells expose the rendered text and its style', async (t: TestContext) => {
	const terminal = createXtermTerminal(20, 5);
	const instance = renderOn(
		terminal,
		<Box flexDirection="column">
			<Text bold>Hi</Text>
			<Text inverse>Go</Text>
		</Box>,
	);

	try {
		await terminal.settle();
		t.assert.strictEqual(terminal.getLine(0), 'Hi');
		t.assert.strictEqual(terminal.getLine(1), 'Go');
		t.assert.strictEqual(terminal.getLine(4), '', 'a blank row has no text');
		t.assert.deepStrictEqual(terminal.cellAt(0, 0), {
			char: 'H',
			width: 1,
			bold: true,
			dim: false,
			inverse: false,
		});
		t.assert.strictEqual(terminal.cellAt(1, 0)?.inverse, true);
		t.assert.strictEqual(terminal.cellAt(0, 99), undefined, 'outside the grid');

		const matrix = terminal.cells();
		t.assert.strictEqual(matrix.length, 5);
		t.assert.ok(matrix.every((row) => row.length === 20));
		t.assert.strictEqual(matrix[1]?.[0]?.char, 'G');
	} finally {
		instance.unmount();
		terminal.dispose();
	}
});

test('emitKey delivers Tab and Escape to the app, and the focus probe reports the result', async (t: TestContext) => {
	const terminal = createXtermTerminal(30, 6);
	const probe = createFocusProbe();
	const instance = renderOn(
		terminal,
		<>
			<Field autoFocus id="first" />
			<Field id="second" />
			<probe.FocusProbe />
		</>,
	);

	try {
		await terminal.settle();
		t.assert.strictEqual(probe.focusedId(), 'first');
		t.assert.strictEqual(terminal.getLine(0), 'first <');

		await terminal.emitKey('Tab');
		t.assert.strictEqual(probe.focusedId(), 'second');
		t.assert.strictEqual(terminal.getLine(0), 'first');
		t.assert.strictEqual(terminal.getLine(1), 'second <');

		await terminal.emitKey('Escape');
		t.assert.strictEqual(probe.focusedId(), undefined);
	} finally {
		instance.unmount();
		terminal.dispose();
	}
});
