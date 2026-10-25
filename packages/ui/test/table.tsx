import test, {type TestContext} from 'node:test';
import React from 'react';
import chalk from 'chalk';
import delay from 'delay';
import {Box, Text} from '@nemesis-oss/termina-core';
import {
	Table,
	type TableColumn,
	type TableRow,
} from '../source/components/table/index.js';
import {ThemeProvider, defaultTheme, extendTheme} from '../source/theme.js';
import {render} from './helpers/render.js';
import {waitForFrame} from './helpers/wait-for-frame.js';

const processColumns: TableColumn[] = [
	{key: 'name', header: 'Name'},
	{key: 'pid', header: 'PID', align: 'right'},
	{key: 'status', header: 'Status'},
];

const processes: TableRow[] = [
	{name: 'nginx', pid: 1234, status: 'running'},
	{name: 'node', pid: 5678, status: 'running'},
	{name: 'redis', pid: 9012, status: 'stopped'},
];

test('renders a bold header, a dim rule, and one line per row', (t: TestContext) => {
	const {lastFrame} = render(
		<Table columns={processColumns} rows={processes} />,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.bold('Name')}    ${chalk.bold('PID')}  ${chalk.bold('Status')}`,
			chalk.dim('─'.repeat(20)),
			'nginx  1234  running',
			'node   5678  running',
			'redis  9012  stopped',
		].join('\n'),
	);
});

test('sizes each column to its widest cell, header included', (t: TestContext) => {
	const {lastFrame} = render(
		<Table
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

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.bold('Container')}  ${chalk.bold('State')}`,
			chalk.dim('─'.repeat(16)),
			'api        up',
			'db         down',
		].join('\n'),
	);
});

test('right-aligns the header and the cells of a right-aligned column', (t: TestContext) => {
	const {lastFrame} = render(
		<Table
			columns={[{key: 'size', header: 'Size', align: 'right'}]}
			rows={[{size: 5}, {size: 1024}]}
		/>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[chalk.bold('Size'), chalk.dim('────'), '   5', '1024'].join('\n'),
	);
});

test('counts CJK and emoji as two cells each', (t: TestContext) => {
	const {lastFrame} = render(
		<Table
			columns={[
				{key: 'name', header: 'Name'},
				{key: 'note', header: 'Note'},
			]}
			rows={[
				{name: '日本', note: 'cjk'},
				{name: '🚀', note: 'emoji'},
				{name: 'abcd', note: 'ascii'},
			]}
		/>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.bold('Name')}  ${chalk.bold('Note')}`,
			chalk.dim('─'.repeat(11)),
			'日本  cjk',
			'🚀    emoji',
			'abcd  ascii',
		].join('\n'),
	);
});

test('shows an empty cell when a row has no value for a column', (t: TestContext) => {
	const {lastFrame} = render(
		<Table columns={processColumns} rows={[{name: 'api', status: 'up'}]} />,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.bold('Name')}  ${chalk.bold('PID')}  ${chalk.bold('Status')}`,
			chalk.dim('─'.repeat(17)),
			'api        up',
		].join('\n'),
	);
});

test('shows an empty cell for a key that only Object.prototype defines', (t: TestContext) => {
	const {lastFrame} = render(
		<Table columns={[{key: 'constructor', header: 'Note'}]} rows={[{}]} />,
	);

	t.assert.strictEqual(
		lastFrame(),
		[chalk.bold('Note'), chalk.dim('────'), ''].join('\n'),
	);
});

test('renders numbers as text, so 0 shows and 1.50 shows as 1.5', (t: TestContext) => {
	const {lastFrame} = render(
		<Table
			columns={[
				{key: 'hits', header: 'Hits', align: 'right'},
				{key: 'ratio', header: 'Ratio'},
			]}
			rows={[{hits: 0, ratio: 1.5}]}
		/>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.bold('Hits')}  ${chalk.bold('Ratio')}`,
			chalk.dim('─'.repeat(11)),
			'   0  1.5',
		].join('\n'),
	);
});

test('renders the header and rule only when rows is empty', (t: TestContext) => {
	const {lastFrame} = render(<Table columns={processColumns} rows={[]} />);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.bold('Name')}  ${chalk.bold('PID')}  ${chalk.bold('Status')}`,
			chalk.dim('─'.repeat(17)),
		].join('\n'),
	);
});

test('renders a blank line for a row with no values', (t: TestContext) => {
	const {lastFrame} = render(
		<Table
			columns={[{key: 'name', header: 'Name'}]}
			rows={[{}, {name: 'x'}]}
		/>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[chalk.bold('Name'), chalk.dim('────'), '', 'x'].join('\n'),
	);
});

test('fits a table wider than its parent to the parent width, one line per row', async (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={10}>
			<Table
				columns={[
					{key: 'a', header: 'Alpha'},
					{key: 'b', header: 'Beta'},
				]}
				rows={[{a: 'twelve chars', b: 'x'}]}
			/>
		</Box>,
	);
	// The natural row is 18 cells. The widest column gives up cells until the row is 10, so `Beta` keeps its width.
	const fitted = [
		`${chalk.bold('Alp…')}  ${chalk.bold('Beta')}`,
		chalk.dim('─'.repeat(10)),
		'twe…  x',
	].join('\n');

	// The container is measured after the first layout, and the fitted frame follows the throttled render, so wait for it rather than for a fixed delay.
	await waitForFrame(lastFrame, fitted);
	t.assert.strictEqual(lastFrame(), fitted);
});

test('recomputes widths when rows change', async (t: TestContext) => {
	const columns: TableColumn[] = [{key: 'name', header: 'Name'}];
	const {lastFrame, rerender} = render(
		<Table columns={columns} rows={[{name: 'a'}]} />,
	);

	rerender(<Table columns={columns} rows={[{name: 'longer'}]} />);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[chalk.bold('Name'), chalk.dim('──────'), 'longer'].join('\n'),
	);
});

test('renders blank lines and no rule when there are no columns', (t: TestContext) => {
	const {lastFrame} = render(<Table columns={[]} rows={[{}, {}]} />);

	t.assert.strictEqual(lastFrame(), ['', '', ''].join('\n'));
});

test('a style key replaced through ThemeProvider changes the output', (t: TestContext) => {
	const theme = extendTheme(defaultTheme, {
		components: {
			Table: {
				styles: {
					separator: () => ({color: 'blue'}),
				},
			},
		},
	});
	const {lastFrame} = render(
		<ThemeProvider theme={theme}>
			<Table columns={[{key: 'name', header: 'Name'}]} rows={[{name: 'api'}]} />
		</ThemeProvider>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[chalk.bold('Name'), chalk.blue('────'), 'api'].join('\n'),
	);
});

test('sizes the rule from the gap of a replaced row style', (t: TestContext) => {
	const theme = extendTheme(defaultTheme, {
		components: {
			Table: {
				styles: {row: () => ({flexDirection: 'row', gap: 4, minHeight: 1})},
			},
		},
	});
	const columns = [
		{key: 'a', header: 'A'},
		{key: 'b', header: 'Bb'},
	];
	const {lastFrame} = render(
		<ThemeProvider theme={theme}>
			<Table columns={columns} rows={[{a: 'x', b: 'y'}]} />
		</ThemeProvider>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.bold('A')}    ${chalk.bold('Bb')}`,
			chalk.dim('─'.repeat(7)),
			'x    y',
		].join('\n'),
	);
});

test('renders the demo content in nine lines', (t: TestContext) => {
	const {lastFrame} = render(
		<Box flexDirection="column" gap={1}>
			<Text>Processes on this host</Text>
			<Table
				columns={[
					{key: 'name', header: 'Name'},
					{key: 'pid', header: 'PID', align: 'right'},
					{key: 'cpu', header: 'CPU', align: 'right'},
					{key: 'status', header: 'Status'},
				]}
				rows={[
					{name: 'nginx', pid: 1234, cpu: '0.4%', status: 'running'},
					{name: 'node', pid: 5678, cpu: '12.9%', status: 'running'},
					{name: 'redis-server', pid: 9012, cpu: '0.1%', status: 'stopped'},
				]}
			/>
			<Text color="green">2 of 3 running</Text>
		</Box>,
	);

	t.assert.strictEqual(lastFrame()?.split('\n').length, 9);
});
