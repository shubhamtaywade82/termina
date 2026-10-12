import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {Box, Text} from '@nemesis-oss/termina-core';
import {render} from './helpers/render.js';
import {Sparkline} from '../source/components/sparkline/index.js';
import {ThemeProvider, defaultTheme, extendTheme} from '../source/theme.js';

// Mirrors the color of the bars() theme style, so each frame compares as one string.
const bars = (blocks: string): string => chalk.cyan(blocks);

const requestsPerSecond = [42, 45, 51, 48, 63, 70, 66, 58, 61, 77, 84, 79, 71, 68, 74, 88];
const p95LatencyMs = [120, 118, 131, 127, 140, 152, 149, 138, 133, 128, 126, 124, 130, 129, 127, 125];
const errorsPerMinute = [0, 1, 0, 0, 2, 1, 0, 0, 0, 5, 3, 1, 0, 0, 1, 0];

test('draws one block per value, from lowest to highest', (t: TestContext) => {
	const {lastFrame} = render(<Sparkline data={[0, 1, 2, 3, 4, 5, 6, 7]} />);

	t.assert.strictEqual(lastFrame(), bars('▁▂▃▄▅▆▇█'));
});

test('scales values between the smallest and largest value', (t: TestContext) => {
	const {lastFrame} = render(<Sparkline data={[0, 50, 100]} />);

	t.assert.strictEqual(lastFrame(), bars('▁▅█'));
});

test('scales negative values the same way', (t: TestContext) => {
	const {lastFrame} = render(<Sparkline data={[-10, 0, 10]} />);

	t.assert.strictEqual(lastFrame(), bars('▁▅█'));
});

test('rounds each value to the nearest block', (t: TestContext) => {
	const roundedUp = render(<Sparkline data={[0, 6, 70]} />);
	const roundedDown = render(<Sparkline data={[0, 2, 70]} />);

	t.assert.strictEqual(roundedUp.lastFrame(), bars('▁▂█'));
	t.assert.strictEqual(roundedDown.lastFrame(), bars('▁▁█'));
});

test('draws the lowest block for every value when all values are equal', (t: TestContext) => {
	const {lastFrame} = render(<Sparkline data={[5, 5, 5]} />);

	t.assert.strictEqual(lastFrame(), bars('▁▁▁'));
});

test('draws a single value as the lowest block', (t: TestContext) => {
	const {lastFrame} = render(<Sparkline data={[42]} />);

	t.assert.strictEqual(lastFrame(), bars('▁'));
});

test('draws the last width values, scaled between those values only', (t: TestContext) => {
	const {lastFrame} = render(<Sparkline data={[100, 0, 7]} width={2} />);

	t.assert.strictEqual(lastFrame(), bars('▁█'));
});

test('draws every value when width is larger than the data', (t: TestContext) => {
	const {lastFrame} = render(<Sparkline data={[0, 1, 2, 3, 4, 5, 6, 7]} width={20} />);

	t.assert.strictEqual(lastFrame(), bars('▁▂▃▄▅▆▇█'));
});

test('draws nothing when width is 0 or less', (t: TestContext) => {
	for (const width of [0, -1]) {
		const {lastFrame} = render(<Sparkline data={[1, 2, 3]} width={width} />);

		t.assert.strictEqual(lastFrame(), '');
	}
});

test('draws nothing for empty data', (t: TestContext) => {
	const {lastFrame} = render(<Sparkline data={[]} />);

	t.assert.strictEqual(lastFrame(), '');
});

test('counts NaN as 0', (t: TestContext) => {
	const {lastFrame} = render(<Sparkline data={[20, Number.NaN, 70]} />);

	t.assert.strictEqual(lastFrame(), bars('▃▁█'));
});

test('counts infinite values as 0', (t: TestContext) => {
	const {lastFrame} = render(
		<Sparkline data={[14, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 70]} />,
	);

	t.assert.strictEqual(lastFrame(), bars('▂▁▁█'));
});

test('a new data and width take effect on the next render', async (t: TestContext) => {
	const {lastFrame, rerender} = render(<Sparkline data={[1, 2, 3]} />);

	rerender(<Sparkline data={[8, 4, 0]} width={2} />);
	await delay(20);

	t.assert.strictEqual(lastFrame(), bars('█▁'));
});

test('lays out labelled sparklines in rows under a heading', (t: TestContext) => {
	const {lastFrame} = render(
		<Box flexDirection="column" gap={1}>
			<Text bold>api-gateway · last 16 minutes</Text>
			<Box flexDirection="column">
				<Box gap={1}>
					<Box width={10}>
						<Text>req/s</Text>
					</Box>
					<Sparkline data={requestsPerSecond} />
				</Box>
				<Box gap={1}>
					<Box width={10}>
						<Text>p95 ms</Text>
					</Box>
					<Sparkline data={p95LatencyMs} width={12} />
				</Box>
				<Box gap={1}>
					<Box width={10}>
						<Text>errors</Text>
					</Box>
					<Sparkline data={errorsPerMinute} />
				</Box>
			</Box>
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			chalk.bold('api-gateway · last 16 minutes'),
			'',
			`req/s      ${bars('▁▁▂▂▄▅▅▃▄▆▇▇▅▅▆█')}`,
			`p95 ms     ${bars('▅█▇▅▃▂▂▁▃▂▂▁')}`,
			`errors     ${bars('▁▂▁▁▄▂▁▁▁█▅▂▁▁▂▁')}`,
		].join('\n'),
	);
});

test('draws the bars in the color of a bars() theme override', (t: TestContext) => {
	const theme = extendTheme(defaultTheme, {
		components: {
			Sparkline: {
				styles: {
					bars: () => ({color: 'magenta'}),
				},
			},
		},
	});
	const {lastFrame} = render(
		<ThemeProvider theme={theme}>
			<Sparkline data={[0, 1]} />
		</ThemeProvider>,
	);

	t.assert.strictEqual(lastFrame(), chalk.magenta('▁█'));
});

test('scales values near the largest finite number without overflowing', (t: TestContext) => {
	const {lastFrame} = render(<Sparkline data={[-Number.MAX_VALUE, 0, Number.MAX_VALUE]} />);

	t.assert.strictEqual(stripAnsi(lastFrame() ?? ''), '▁▅█');
});
