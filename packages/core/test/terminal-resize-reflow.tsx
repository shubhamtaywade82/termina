import React from 'react';
import test, {type TestContext} from 'node:test';
import {Box, Static, Text, render} from '../src/index.js';
import {createXtermTerminal} from './helpers/xterm-terminal.js';

// Each frame is three lines and the middle one wraps at every width below 80 columns. Ghost copies left by a reflow show up as extra headers, footers or paragraph words.
const paragraph = 'lorem ipsum dolor sit amet '.repeat(3).trim();
const widths = [40, 20, 60, 100];

const Frame = () => (
	<Box flexDirection="column">
		<Text>HEADER-MARK</Text>
		<Text>{paragraph}</Text>
		<Text>FOOTER-MARK</Text>
	</Box>
);

const countMark = (lines: string[], mark: string): number =>
	lines.filter(line => line.includes(mark)).length;

const countWord = (lines: string[], word: string): number =>
	lines.join(' ').split(word).length - 1;

const assertSingleFrame = (
	t: TestContext,
	lines: string[],
	columns: number,
): void => {
	const where = `at ${columns} columns`;
	t.assert.strictEqual(countMark(lines, 'HEADER-MARK'), 1, `header ${where}`);
	t.assert.strictEqual(countMark(lines, 'FOOTER-MARK'), 1, `footer ${where}`);
	t.assert.strictEqual(countWord(lines, 'lorem'), 3, `paragraph ${where}`);
};

const renderOn = (
	terminal: ReturnType<typeof createXtermTerminal>,
	element: React.ReactNode,
	alternateScreen = false,
) =>
	render(element, {
		stdout: terminal.stdout,
		stdin: terminal.stdin,
		stderr: terminal.stdout,
		interactive: true,
		alternateScreen,
		exitOnCtrlC: false,
		patchConsole: false,
	});

test('a width change erases the wrapped frame it reflowed, leaving one copy at every width', async (t: TestContext) => {
	const terminal = createXtermTerminal(80, 24);
	const instance = renderOn(terminal, <Frame />);

	try {
		await terminal.settle();
		assertSingleFrame(t, terminal.screen(), 80);

		for (const columns of widths) {
			await terminal.resize(columns);
			const lines = terminal.screen();
			assertSingleFrame(t, lines, columns);
			t.assert.strictEqual(lines[0], 'HEADER-MARK', `nothing above frame at ${columns}`);
		}
	} finally {
		instance.unmount();
		terminal.dispose();
	}
});

test('alternate screen frames survive width changes without ghost copies', async (t: TestContext) => {
	const terminal = createXtermTerminal(80, 24);
	const instance = renderOn(terminal, <Frame />, true);

	try {
		await terminal.settle();

		for (const columns of widths) {
			await terminal.resize(columns);
			assertSingleFrame(t, terminal.screen(), columns);
		}
	} finally {
		instance.unmount();
		terminal.dispose();
	}
});

test('<Static> output stays in scrollback once and is not replayed by a width change', async (t: TestContext) => {
	const terminal = createXtermTerminal(80, 24);
	const instance = renderOn(
		terminal,
		<Box flexDirection="column">
			<Static items={['STATIC-MARK']}>
				{item => <Text key={item}>{item}</Text>}
			</Static>
			<Frame />
		</Box>,
	);

	try {
		await terminal.settle();

		for (const columns of widths) {
			await terminal.resize(columns);
			const lines = terminal.screen();
			assertSingleFrame(t, lines, columns);
			t.assert.strictEqual(
				countMark(lines, 'STATIC-MARK'),
				1,
				`static output at ${columns} columns`,
			);
		}
	} finally {
		instance.unmount();
		terminal.dispose();
	}
});
