import test, {type TestContext} from 'node:test';
import logUpdate from '../src/log-update.js';
import {createXtermTerminal} from './helpers/xterm-terminal.js';
import {largestUpwardTravel} from './helpers/cursor-travel.js';

// A write must not move the cursor above the top of the viewport. The cumulative upward travel of one shrinking write, starting from the bottom row of the viewport, may not exceed rows - 1. Emulators clamp movement at the top, so the visible output can be correct while the bytes still ask for impossible movement.

const ROWS = 5;
const COLUMNS = 20;

const lines = (count: number, prefix: string) =>
	Array.from({length: count}, (_, index) => `${prefix}${index}`).join('\n') +
	'\n';

const scenarios = [
	{
		name: 'disjoint rows',
		before: lines(20, 'old'),
		after: lines(3, 'new'),
		visible: ['new0', 'new1', 'new2', '', ''],
	},
	{
		name: 'shared leading rows',
		before: lines(20, 'row'),
		after: 'row0\nrow1\nchanged2\n',
		visible: ['row0', 'row1', 'changed2', '', ''],
	},
];

for (const scenario of scenarios) {
	test(`a shrinking incremental write never moves the cursor above the viewport (${scenario.name})`, async (t: TestContext) => {
		const terminal = createXtermTerminal(COLUMNS, ROWS);
		const writes: string[] = [];
		const stdout = terminal.stdout as unknown as {
			write: (data: string, callback?: () => void) => boolean;
		};
		const originalWrite = stdout.write.bind(terminal.stdout);
		stdout.write = (data: string, callback?: () => void) => {
			writes.push(data);
			return originalWrite(data, callback);
		};

		const render = logUpdate.create(terminal.stdout, {
			incremental: true,
		});

		try {
			render(scenario.before);
			await terminal.settle();

			writes.length = 0;
			render(scenario.after);
			await terminal.settle();

			const shrinkWrite = writes.join('');
			const travel = largestUpwardTravel(shrinkWrite, ROWS - 1);
			t.assert.deepStrictEqual(
				[0, 1, 2, 3, 4].map((row) => terminal.getLine(row)),
				scenario.visible,
				'visible rows show only the new frame',
			);
			t.assert.ok(
				travel <= ROWS - 1,
				`shrink write moves the cursor ${travel} rows up; the viewport has ${ROWS - 1} rows above the bottom row`,
			);
		} finally {
			terminal.dispose();
		}
	});
}
