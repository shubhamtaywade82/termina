import test, {type TestContext} from 'node:test';
import React from 'react';
import {Box, Text, render} from '../src/index.js';
import {createXtermTerminal} from './helpers/xterm-terminal.js';

const rowsOf = (count: number, prefix: string) =>
	Array.from({length: count}, (_, index) => `${prefix}${index}`);

const Frame = ({rows}: {readonly rows: string[]}) => (
	<Box flexDirection="column">
		{rows.map((row) => (
			<Text key={row}>{row}</Text>
		))}
	</Box>
);

const renderOn = (
	terminal: ReturnType<typeof createXtermTerminal>,
	element: React.ReactNode,
	isIncremental: boolean,
) =>
	render(element, {
		stdout: terminal.stdout,
		stdin: terminal.stdin,
		stderr: terminal.stdout,
		interactive: true,
		incrementalRendering: isIncremental,
		exitOnCtrlC: false,
		patchConsole: false,
	});

// Shrinking a frame that is taller than the viewport must leave only the new rows visible. A stale row that survives in the viewport, or a kept row that is erased, is the symptom.
const scenarios = [
	{
		name: 'disjoint rows',
		before: rowsOf(20, 'old'),
		after: ['new0', 'new1', 'new2'],
	},
	{
		name: 'shared leading rows',
		before: rowsOf(20, 'row'),
		after: ['row0', 'row1', 'changed2'],
	},
];

for (const scenario of scenarios) {
	for (const isIncremental of [false, true]) {
		test(`shrinking a 20-row frame to 3 rows at 5 rows, ${scenario.name} (incrementalRendering=${isIncremental})`, async (t: TestContext) => {
			const terminal = createXtermTerminal(20, 5);
			const instance = renderOn(
				terminal,
				<Frame rows={scenario.before} />,
				isIncremental,
			);

			try {
				await terminal.settle();
				instance.rerender(<Frame rows={scenario.after} />);
				await terminal.settle();

				const visible = [0, 1, 2, 3, 4].map((row) => terminal.getLine(row));
				t.assert.deepStrictEqual(
					visible,
					[...scenario.after, '', ''].slice(0, 5),
				);
			} finally {
				instance.unmount();
				terminal.dispose();
			}
		});
	}
}
