import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import {Box, Text, renderToString} from '@nemesis-oss/termina-core';
import stripAnsi from 'strip-ansi';
import {render} from './helpers/render.js';
import {Gauge} from '../source/components/gauge/index.js';
import {ThemeProvider, defaultTheme, extendTheme} from '../source/theme.js';

type Color = 'green' | 'yellow' | 'red' | 'blue';

// Mirrors the chalk calls the theme's styles resolve to, so each frame compares as one string.
// Literal glyphs, not figures, so the test also pins the glyphs the docs name.
const bar = (filledCount: number, color: Color, width = 20): string => {
	const filled = chalk[color]('█'.repeat(filledCount));
	const empty = chalk.dim('░'.repeat(width - filledCount));
	return `${filled}${empty}`;
};

test('draws filled cells, then empty cells, then the percent', (t: TestContext) => {
	const {lastFrame} = render(<Gauge value={52} />);

	t.assert.strictEqual(lastFrame(), `${bar(10, 'green')} 52%`);
});

test('draws the label before the bar', (t: TestContext) => {
	const {lastFrame} = render(<Gauge label="CPU" value={52} />);

	t.assert.strictEqual(lastFrame(), `CPU ${bar(10, 'green')} 52%`);
});

test('uses the width prop as the number of cells', (t: TestContext) => {
	const {lastFrame} = render(<Gauge value={50} width={10} />);

	t.assert.strictEqual(lastFrame(), `${bar(5, 'green', 10)} 50%`);
});

test('hides the percent when showValue is false', (t: TestContext) => {
	const {lastFrame} = render(<Gauge value={52} showValue={false} />);

	t.assert.strictEqual(lastFrame(), bar(10, 'green'));
});

test('draws a full bar and 100% for values above 100', (t: TestContext) => {
	const {lastFrame} = render(<Gauge value={150} />);

	t.assert.strictEqual(lastFrame(), `${bar(20, 'red')} 100%`);
});

test('draws an empty bar and 0% for values below 0', (t: TestContext) => {
	const {lastFrame} = render(<Gauge value={-20} />);

	t.assert.strictEqual(lastFrame(), `${bar(0, 'green')} 0%`);
});

test('draws NaN as 0', (t: TestContext) => {
	const {lastFrame} = render(<Gauge value={Number.NaN} />);

	t.assert.strictEqual(lastFrame(), `${bar(0, 'green')} 0%`);
});

test('rounds only the shown percent, so the bar and color use the exact value', (t: TestContext) => {
	const {lastFrame} = render(<Gauge value={89.6} />);

	t.assert.strictEqual(lastFrame(), `${bar(18, 'yellow')} 90%`);
});

test('colors the filled cells green below 70, yellow from 70, and red from 90', (t: TestContext) => {
	const cases: Array<[number, number, Color]> = [
		[69, 14, 'green'],
		[70, 14, 'yellow'],
		[89, 18, 'yellow'],
		[90, 18, 'red'],
	];

	for (const [value, filledCount, color] of cases) {
		const {lastFrame} = render(<Gauge value={value} />);

		t.assert.strictEqual(lastFrame(), `${bar(filledCount, color)} ${value}%`);
	}
});

test('an empty label draws nothing', (t: TestContext) => {
	const {lastFrame} = render(<Gauge label="" value={52} />);

	t.assert.strictEqual(lastFrame(), `${bar(10, 'green')} 52%`);
});

test('a new value takes effect on the next render', async (t: TestContext) => {
	const {lastFrame, rerender} = render(<Gauge value={10} />);

	rerender(<Gauge value={80} />);
	await delay(20);

	t.assert.strictEqual(lastFrame(), `${bar(16, 'yellow')} 80%`);
});

test('stacks gauges in a column under a heading', (t: TestContext) => {
	const {lastFrame} = render(
		<Box flexDirection="column" gap={1}>
			<Text bold>Host metrics</Text>
			<Gauge label="CPU" value={42} />
			<Gauge label="MEM" value={78} />
			<Gauge label="DSK" value={55} />
			<Gauge label="NET" value={93} />
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			chalk.bold('Host metrics'),
			'',
			`CPU ${bar(8, 'green')} 42%`,
			'',
			`MEM ${bar(16, 'yellow')} 78%`,
			'',
			`DSK ${bar(11, 'green')} 55%`,
			'',
			`NET ${bar(19, 'red')} 93%`,
		].join('\n'),
	);
});

test('a filled() theme override replaces the config color', (t: TestContext) => {
	const theme = extendTheme(defaultTheme, {
		components: {
			Gauge: {
				styles: {
					filled: () => ({color: 'blue'}),
				},
			},
		},
	});
	const {lastFrame} = render(
		<ThemeProvider theme={theme}>
			<Gauge value={52} />
		</ThemeProvider>,
	);

	t.assert.strictEqual(lastFrame(), `${bar(10, 'blue')} 52%`);
});

test('passes config() the clamped value, not the raw one', (t: TestContext) => {
	const theme = extendTheme(defaultTheme, {
		components: {
			Gauge: {
				config: ({value}: {value: number}) => ({
					color: value === 100 ? 'red' : 'green',
				}),
			},
		},
	});
	const {lastFrame} = render(
		<ThemeProvider theme={theme}>
			<Gauge value={150} />
		</ThemeProvider>,
	);

	t.assert.strictEqual(lastFrame(), `${bar(20, 'red')} 100%`);
});

test('throws a RangeError when the width is negative', (t: TestContext) => {
	t.assert.throws(
		() => renderToString(<Gauge value={50} width={-1} />),
		RangeError,
	);
});

test('a width of 0 draws no bar, so the row starts with the gap before the percent', (t: TestContext) => {
	t.assert.strictEqual(stripAnsi(renderToString(<Gauge value={50} width={0} />)), ' 50%');
});
