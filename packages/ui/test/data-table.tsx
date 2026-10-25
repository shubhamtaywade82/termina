import test, {type TestContext} from 'node:test';
import React from 'react';
import chalk from 'chalk';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {Box, Text} from '@nemesis-oss/termina-core';
import {DataTable} from '../source/components/data-table/index.js';
import theme from '../source/components/data-table/theme.js';
import {
	type TableColumn,
	type TableRow,
} from '../source/components/table/index.js';
import {render} from './helpers/render.js';

const up = '\u{1B}[A';
const down = '\u{1B}[B';
const right = '\u{1B}[C';
const left = '\u{1B}[D';
const enter = '\r';
const sortKey = 's';
const ctrlS = '\u{13}';
const altS = '\u{1B}s';
const HIGHLIGHT_START = '\u{1B}[44m';
const columns: TableColumn[] = [
	{key: 'name', header: 'Name'},
	{key: 'pid', header: 'PID', align: 'right'},
	{key: 'cpu', header: 'CPU', align: 'right'},
];

const processes: TableRow[] = [
	{name: 'nginx', pid: 1234, cpu: 1.8},
	{name: 'node', pid: 5678, cpu: 10.1},
	{name: 'redis', pid: 9012, cpu: 0.6},
	{name: 'Chrome', pid: 42, cpu: 3},
	{name: 'zsh', pid: 7, cpu: 0},
	{name: 'postgres', pid: 999, cpu: 22},
];

const underlined = (label: string): string =>
	chalk.underline(chalk.bold(label));

const pressKeys = async (
	stdin: {write: (data: string) => void},
	keys: string[],
) => {
	for (const key of keys) {
		stdin.write(key);
		// eslint-disable-next-line no-await-in-loop
		await delay(20);
	}
};

// Trailing spaces are not part of the layout under test, so each line is trimmed.
const plainLines = (frame: string | undefined): string[] =>
	stripAnsi(frame ?? '')
		.split('\n')
		.map((line) => line.trimEnd());

const headerText = (frame: string | undefined): string =>
	plainLines(frame)[0] ?? '';

// Body lines come after the header and the rule.
const bodyNames = (frame: string | undefined): string[] =>
	plainLines(frame)
		.slice(2)
		.map((line) => line.trim().split(/\s+/, 1)[0] ?? '');

// Only the focused row carries the highlight background.
const highlightedRow = (frame: string | undefined): string | undefined => {
	const line = (frame ?? '')
		.split('\n')
		.find((candidate) => candidate.includes(HIGHLIGHT_START));
	return line === undefined ? undefined : plainLines(line)[0];
};

test('renders a bold header, a dim rule, and five rows, with the focused row highlighted', (t: TestContext) => {
	const {lastFrame} = render(<DataTable columns={columns} rows={processes} />);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${underlined('Name')}        ${chalk.bold('PID')}    ${chalk.bold('CPU')}`,
			chalk.dim('─'.repeat(22)),
			chalk.bgBlue('nginx      1234    1.8'),
			'node       5678   10.1',
			'redis      9012    0.6',
			'Chrome       42      3',
			'zsh           7      0',
		].join('\n'),
	);
});

test('sizes each column to its widest cell, header and sort room included, and measures every row', (t: TestContext) => {
	const container = render(
		<DataTable
			columns={[
				{key: 'name', header: 'Container'},
				{key: 'state', header: 'State'},
			]}
			rows={[
				{name: 'api', state: 'up'},
				{name: 'db', state: 'down'},
			]}
		/>,
	);
	t.assert.deepStrictEqual(plainLines(container.lastFrame()), [
		'Container    State',
		'─'.repeat(20),
		'api          up',
		'db           down',
	]);

	const hidden = render(
		<DataTable
			columns={[{key: 'name', header: 'Name'}]}
			rows={[{name: 'a'}, {name: 'longest'}]}
			visibleRowCount={1}
		/>,
	);
	t.assert.deepStrictEqual(plainLines(hidden.lastFrame()), [
		'Name',
		'─'.repeat(7),
		'a',
	]);
});

test('moves focus with Up and Down without wrapping, and scrolls the window past its edges', async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<DataTable columns={columns} rows={processes} />,
	);

	await pressKeys(stdin, [up]);
	t.assert.strictEqual(highlightedRow(lastFrame()), 'nginx      1234    1.8');

	await pressKeys(stdin, [down, down, down, down, down]);
	t.assert.deepStrictEqual(bodyNames(lastFrame()), [
		'node',
		'redis',
		'Chrome',
		'zsh',
		'postgres',
	]);
	t.assert.strictEqual(highlightedRow(lastFrame()), 'postgres    999     22');

	await pressKeys(stdin, [down]);
	t.assert.strictEqual(highlightedRow(lastFrame()), 'postgres    999     22');

	await pressKeys(stdin, [up, up, up, up, up]);
	t.assert.deepStrictEqual(bodyNames(lastFrame()), [
		'nginx',
		'node',
		'redis',
		'Chrome',
		'zsh',
	]);
});

test('moves the underlined header with Left and Right without wrapping', async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<DataTable columns={columns} rows={processes} />,
	);
	const header = (): string => (lastFrame() ?? '').split('\n', 1)[0] ?? '';

	await pressKeys(stdin, [left]);
	t.assert.ok(header().includes(underlined('Name')));

	await pressKeys(stdin, [right, right, right, right]);
	t.assert.ok(header().includes(underlined('CPU')));
	t.assert.ok(!header().includes(underlined('Name')));
});

test('s sorts ascending, then descending, then clears the sort', async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<DataTable columns={columns} rows={processes} />,
	);

	await pressKeys(stdin, [sortKey]);
	t.assert.ok(headerText(lastFrame()).includes('Name ↑'));
	t.assert.deepStrictEqual(bodyNames(lastFrame()), [
		'Chrome',
		'nginx',
		'node',
		'postgres',
		'redis',
	]);

	await pressKeys(stdin, [sortKey]);
	t.assert.ok(headerText(lastFrame()).includes('Name ↓'));
	t.assert.deepStrictEqual(bodyNames(lastFrame()), [
		'zsh',
		'redis',
		'postgres',
		'node',
		'nginx',
	]);

	await pressKeys(stdin, [sortKey]);
	t.assert.doesNotMatch(headerText(lastFrame()), /[↑↓]/);
	t.assert.deepStrictEqual(bodyNames(lastFrame()), [
		'nginx',
		'node',
		'redis',
		'Chrome',
		'zsh',
	]);
});

test('sorts cells that parse as numbers by value, and other cells as text ignoring case', async (t: TestContext) => {
	const numbers = render(<DataTable columns={columns} rows={processes} />);
	// Sorting by name first shows that a new column starts ascending, not descending.
	await pressKeys(numbers.stdin, [sortKey, right, sortKey]);
	t.assert.ok(headerText(numbers.lastFrame()).includes('PID ↑'));
	t.assert.deepStrictEqual(bodyNames(numbers.lastFrame()), [
		'zsh',
		'Chrome',
		'postgres',
		'nginx',
		'node',
	]);

	const fruit = render(
		<DataTable
			columns={[{key: 'name', header: 'Fruit'}]}
			rows={[{name: 'Banana'}, {name: 'apple'}, {name: 'cherry'}]}
		/>,
	);
	await pressKeys(fruit.stdin, [sortKey]);
	t.assert.deepStrictEqual(bodyNames(fruit.lastFrame()), [
		'apple',
		'Banana',
		'cherry',
	]);

	// Numbers sort before text, so 9 comes before 1a.
	const mixed = render(
		<DataTable
			columns={[{key: 'v', header: 'V'}]}
			rows={[{v: '1a'}, {v: '9'}]}
		/>,
	);
	await pressKeys(mixed.stdin, [sortKey]);
	t.assert.deepStrictEqual(bodyNames(mixed.lastFrame()), ['9', '1a']);
});

test('gives a mixed column one order, whatever the order of its rows', async (t: TestContext) => {
	const column = [{key: 'v', header: 'V'}];
	const first = render(
		<DataTable columns={column} rows={[{v: '10'}, {v: '1a'}, {v: '9'}]} />,
	);
	const second = render(
		<DataTable columns={column} rows={[{v: '1a'}, {v: '10'}, {v: '9'}]} />,
	);
	await pressKeys(first.stdin, [sortKey]);
	await pressKeys(second.stdin, [sortKey]);
	t.assert.deepStrictEqual(bodyNames(first.lastFrame()), ['9', '10', '1a']);
	t.assert.deepStrictEqual(bodyNames(second.lastFrame()), ['9', '10', '1a']);
});

test('sorts blank cells first in ascending order, without reading them as 0', async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<DataTable
			columns={[
				{key: 'name', header: 'Name'},
				{key: 'cpu', header: 'CPU', align: 'right'},
			]}
			rows={[{name: 'a', cpu: -1}, {name: 'b'}, {name: 'c', cpu: 0}]}
		/>,
	);

	await pressKeys(stdin, [right, sortKey]);
	t.assert.deepStrictEqual(bodyNames(lastFrame()), ['b', 'a', 'c']);
});

test('keeps focus on the same position when the sort changes', async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<DataTable columns={columns} rows={processes} />,
	);

	await pressKeys(stdin, [down, down, sortKey]);
	// Sorted by name, position 2 is node, not the redis row that was focused before.
	t.assert.strictEqual(highlightedRow(lastFrame()), 'node       5678   10.1');
});

test('keeps every column in place when sorting, because the header reserves room for the indicator', async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<DataTable columns={columns} rows={processes} />,
	);
	const before = plainLines(lastFrame());

	await pressKeys(stdin, [right, sortKey]);
	const after = plainLines(lastFrame());

	t.assert.strictEqual(after[0]?.indexOf('CPU'), before[0]?.indexOf('CPU'));
	t.assert.strictEqual(after[1], before[1]);
});

test('Enter passes the object from rows for the focused row, also after sorting', async (t: TestContext) => {
	const selected: TableRow[] = [];
	const {stdin} = render(
		<DataTable
			columns={columns}
			rows={processes}
			onSelect={(row) => {
				selected.push(row);
			}}
		/>,
	);

	await pressKeys(stdin, [enter]);
	t.assert.strictEqual(selected[0], processes[0]);

	// Descending by name, position 2 is postgres, which is index 5 in rows.
	await pressKeys(stdin, [sortKey, sortKey, down, down, enter]);
	t.assert.strictEqual(selected.length, 2);
	t.assert.strictEqual(selected[1], processes[5]);
});

test('renders only the header and rule when rows is empty, and ignores keys', async (t: TestContext) => {
	const selected: TableRow[] = [];
	const {lastFrame, stdin} = render(
		<DataTable
			columns={columns}
			rows={[]}
			onSelect={(row) => {
				selected.push(row);
			}}
		/>,
	);

	await pressKeys(stdin, [down, up, enter]);
	t.assert.deepStrictEqual(plainLines(lastFrame()), [
		'Name      PID    CPU',
		'─'.repeat(20),
	]);
	t.assert.strictEqual(selected.length, 0);
});

test('ignores keys when isActive is false or stdin is piped, and still renders', async (t: TestContext) => {
	const selected: TableRow[] = [];
	const onSelect = (row: TableRow) => {
		selected.push(row);
	};

	const inactive = render(
		<DataTable
			columns={columns}
			rows={processes}
			isActive={false}
			onSelect={onSelect}
		/>,
	);
	const piped = render(
		<DataTable columns={columns} rows={processes} onSelect={onSelect} />,
		{isStdinPiped: true},
	);

	for (const instance of [inactive, piped]) {
		const before = instance.lastFrame();
		// eslint-disable-next-line no-await-in-loop -- Each step must finish before the next one starts, so the steps stay in order.
		await pressKeys(instance.stdin, [down, sortKey, right, enter]);
		t.assert.ok(plainLines(before)[2]?.startsWith('nginx'));
		t.assert.strictEqual(instance.lastFrame(), before);
	}

	t.assert.strictEqual(selected.length, 0);
});

test('ignores Ctrl and Alt chords and other keys, so Ctrl+s, Alt+s, Ctrl+Down, x, and S do nothing', async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<DataTable columns={columns} rows={processes} />,
	);
	const before = lastFrame();

	await pressKeys(stdin, [ctrlS, altS, '\u{1B}[1;5B', 'x', 'S']);
	t.assert.strictEqual(lastFrame(), before);
});

test('keeps focus on the last row when rows shrink, and keeps it visible when visibleRowCount shrinks', async (t: TestContext) => {
	const selected: TableRow[] = [];
	const onSelect = (row: TableRow) => {
		selected.push(row);
	};

	const instance = render(
		<DataTable columns={columns} rows={processes} onSelect={onSelect} />,
	);

	await pressKeys(instance.stdin, [down, down, down, down]);
	instance.rerender(
		<DataTable
			columns={columns}
			rows={processes.slice(0, 2)}
			onSelect={onSelect}
		/>,
	);
	await delay(20);

	// Removing postgres narrows the name column, so the rows move left.
	t.assert.strictEqual(
		highlightedRow(instance.lastFrame()),
		'node     5678   10.1',
	);
	await pressKeys(instance.stdin, [enter]);
	t.assert.strictEqual(selected[0], processes[1]);

	const windowed = render(
		<DataTable columns={columns} rows={processes} onSelect={onSelect} />,
	);
	await pressKeys(windowed.stdin, [down, down, down, down]);
	windowed.rerender(
		<DataTable
			columns={columns}
			rows={processes}
			visibleRowCount={2}
			onSelect={onSelect}
		/>,
	);
	await delay(20);
	t.assert.ok(highlightedRow(windowed.lastFrame())?.startsWith('zsh'));
	await pressKeys(windowed.stdin, [enter]);
	t.assert.strictEqual(selected[1], processes[4]);
});

test('sizes the window from visibleRowCount: every row when it is large, one when below 1, and rounded down', async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<DataTable columns={columns} rows={processes} visibleRowCount={10} />,
	);
	t.assert.strictEqual(plainLines(lastFrame()).length, 8);

	await pressKeys(stdin, [down, down, down, down, down]);
	t.assert.strictEqual(highlightedRow(lastFrame()), 'postgres    999     22');

	const single = render(
		<DataTable columns={columns} rows={processes} visibleRowCount={0} />,
	);
	await pressKeys(single.stdin, [down, down]);
	t.assert.deepStrictEqual(bodyNames(single.lastFrame()), ['redis']);
	t.assert.ok(highlightedRow(single.lastFrame())?.startsWith('redis'));

	const fraction = render(
		<DataTable columns={columns} rows={processes} visibleRowCount={2.5} />,
	);
	t.assert.deepStrictEqual(bodyNames(fraction.lastFrame()), ['nginx', 'node']);
});

test('gives a row with only blank cells one line', async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<DataTable
			columns={[{key: 'name', header: 'Name'}]}
			rows={[{}, {name: 'x'}]}
		/>,
	);

	await pressKeys(stdin, [down]);
	t.assert.deepStrictEqual(plainLines(lastFrame()), [
		'Name',
		'─'.repeat(6),
		'',
		'x',
	]);
});

test('renders blank lines and no rule when there are no columns, and ignores sort and Right', async (t: TestContext) => {
	const {lastFrame, stdin} = render(
		<DataTable columns={[]} rows={[{name: 'x'}, {name: 'y'}]} />,
	);

	await pressKeys(stdin, [sortKey, right]);
	t.assert.deepStrictEqual(plainLines(lastFrame()), ['', '', '']);
});

test('lays out the demo in 11 lines', (t: TestContext) => {
	const demoColumns: TableColumn[] = [
		{key: 'name', header: 'Process'},
		{key: 'pid', header: 'PID', align: 'right'},
		{key: 'cpu', header: 'CPU %', align: 'right'},
		{key: 'memory', header: 'Memory MB', align: 'right'},
		{key: 'status', header: 'Status'},
	];
	const demoRows: TableRow[] = [
		{name: 'nginx', pid: 1234, cpu: 1.8, memory: 126, status: 'running'},
		{name: 'node', pid: 5678, cpu: 10.1, memory: 248, status: 'running'},
		{name: 'redis', pid: 9012, cpu: 0.6, memory: 62, status: 'idle'},
		{name: 'postgres', pid: 3311, cpu: 4.2, memory: 310, status: 'running'},
		{name: 'worker', pid: 4410, cpu: 0.2, memory: 48, status: 'idle'},
		{name: 'cron', pid: 88, cpu: 0, memory: 3, status: 'stopped'},
	];
	const {lastFrame} = render(
		<Box flexDirection="column" gap={1}>
			<Text>Up and down to move, s to sort, enter to select</Text>
			<DataTable columns={demoColumns} rows={demoRows} />
			<Text>› selected none</Text>
		</Box>,
	);

	t.assert.strictEqual(plainLines(lastFrame()).length, 11);
});

test('theme keys return the props the docs list', (t: TestContext) => {
	t.assert.deepStrictEqual(theme.styles.container(), {flexDirection: 'column'});
	t.assert.deepStrictEqual(theme.styles.headerCell({isFocused: true}), {
		bold: true,
		underline: true,
	});
	t.assert.deepStrictEqual(theme.styles.row({isFocused: true}), {
		flexDirection: 'row',
		gap: 2,
		minHeight: 1,
		backgroundColor: 'blue',
	});
	t.assert.strictEqual(
		theme.styles.row({isFocused: false}).backgroundColor,
		undefined,
	);
	t.assert.deepStrictEqual(theme.styles.cell(), {flexShrink: 1, minWidth: 1});
	t.assert.deepStrictEqual(theme.styles.separator(), {dimColor: true});
	t.assert.deepStrictEqual(theme.styles.sortIndicator(), {color: 'cyan'});
});
