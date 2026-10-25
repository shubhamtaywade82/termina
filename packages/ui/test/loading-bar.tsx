import test, {type TestContext} from 'node:test';
import React from 'react';
import chalk from 'chalk';
import figures from 'figures';
import delay from 'delay';
import {renderToString} from '@nemesis-oss/termina-core';
import {LoadingBar} from '../source/components/loading-bar/index.js';
import theme from '../source/components/loading-bar/theme.js';
import {ThemeProvider, defaultTheme, extendTheme} from '../source/theme.js';
import {render} from './helpers/render.js';
import {waitForFrame} from './helpers/wait-for-frame.js';
import {enableIntervalClock} from './helpers/mock-clock.js';

const BLOCK_CELLS = 4;

const drawTrack = (width: number, start: number): string => {
	const blockCells = Math.min(BLOCK_CELLS, width);
	const trailingCells = width - start - blockCells;

	return (
		chalk.dim(figures.squareLightShade.repeat(start)) +
		chalk.magenta(figures.square.repeat(blockCells)) +
		chalk.dim(figures.squareLightShade.repeat(trailingCells))
	);
};

test('draws a 20 cell track with the block at the start by default', (t: TestContext) => {
	enableIntervalClock(t);
	const {lastFrame, unmount} = render(<LoadingBar />);

	t.assert.strictEqual(
		lastFrame(),
		chalk.magenta('████') + chalk.dim('░'.repeat(16)),
	);
	unmount();
});

test('bounces the block between the ends of the track', async (t: TestContext) => {
	enableIntervalClock(t);
	const {lastFrame, unmount} = render(<LoadingBar width={6} interval={12} />);
	const expected = [1, 2, 1, 0, 1, 2, 1, 0].map((start) => drawTrack(6, start));

	// Each frame is awaited before the next tick, so the frames are read one after another.
	const collect = async (
		remaining: string[],
		frames: string[],
	): Promise<string[]> => {
		const [frame, ...rest] = remaining;
		if (frame === undefined) {
			return frames;
		}

		t.mock.timers.tick(12);
		await waitForFrame(lastFrame, frame);
		return collect(rest, [...frames, lastFrame() ?? '']);
	};

	const frames = await collect(expected, []);

	t.assert.deepStrictEqual(frames, expected);
	unmount();
});

test('moves one cell every 80 ms by default', async (t: TestContext) => {
	enableIntervalClock(t);
	const {lastFrame, unmount} = render(<LoadingBar width={10} />);

	t.mock.timers.tick(79);
	await delay(20);
	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));

	t.mock.timers.tick(1);
	await waitForFrame(lastFrame, drawTrack(10, 1));
	t.assert.strictEqual(lastFrame(), drawTrack(10, 1));
	unmount();
});

test('returns the block to the start when isActive turns false mid-sweep', async (t: TestContext) => {
	enableIntervalClock(t);
	const {lastFrame, rerender, unmount} = render(
		<LoadingBar width={10} interval={12} />,
	);

	t.mock.timers.tick(36);
	await waitForFrame(lastFrame, drawTrack(10, 3));
	t.assert.strictEqual(lastFrame(), drawTrack(10, 3));

	rerender(<LoadingBar width={10} interval={12} isActive={false} />);
	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));
	await delay(20);
	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));
	unmount();
});

test('draws the block at the start when isActive is false from mount', (t: TestContext) => {
	enableIntervalClock(t);
	const {lastFrame, unmount} = render(
		<LoadingBar width={10} isActive={false} />,
	);

	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));
	unmount();
});

test('starts the sweep from the start when isActive turns true again', async (t: TestContext) => {
	enableIntervalClock(t);
	const {lastFrame, rerender, unmount} = render(
		<LoadingBar width={10} interval={12} />,
	);

	t.mock.timers.tick(36);
	await waitForFrame(lastFrame, drawTrack(10, 3));
	rerender(<LoadingBar width={10} interval={12} isActive={false} />);
	await delay(20);
	rerender(<LoadingBar width={10} interval={12} />);
	await delay(20);
	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));

	t.mock.timers.tick(12);
	await waitForFrame(lastFrame, drawTrack(10, 1));
	t.assert.strictEqual(lastFrame(), drawTrack(10, 1));
	unmount();
});

test('clears its timer when isActive turns false', async (t: TestContext) => {
	enableIntervalClock(t);
	const setIntervalMock = t.mock.method(globalThis, 'setInterval');
	const clearIntervalMock = t.mock.method(globalThis, 'clearInterval');
	const {rerender, unmount} = render(<LoadingBar interval={1234} />);
	await delay(20);
	rerender(<LoadingBar interval={1234} isActive={false} />);
	await delay(20);

	const loadingBarTimers = setIntervalMock.mock.calls
		.filter((call) => call.arguments[1] === 1234)
		.map((call) => call.result);
	const clearedTimers = clearIntervalMock.mock.calls.map(
		(call) => call.arguments[0],
	);

	t.assert.strictEqual(loadingBarTimers.length, 1);
	t.assert.ok(clearedTimers.includes(loadingBarTimers[0]));
	unmount();
});

test('clears its timer on unmount', async (t: TestContext) => {
	enableIntervalClock(t);
	const setIntervalMock = t.mock.method(globalThis, 'setInterval');
	const clearIntervalMock = t.mock.method(globalThis, 'clearInterval');
	const {unmount} = render(<LoadingBar interval={1234} />);
	await delay(20);
	unmount();
	await delay(20);

	const loadingBarTimers = setIntervalMock.mock.calls
		.filter((call) => call.arguments[1] === 1234)
		.map((call) => call.result);
	const clearedTimers = clearIntervalMock.mock.calls.map(
		(call) => call.arguments[0],
	);

	t.assert.strictEqual(loadingBarTimers.length, 1);
	t.assert.ok(clearedTimers.includes(loadingBarTimers[0]));
});

test('redraws the track at a new width and keeps the animation running', async (t: TestContext) => {
	enableIntervalClock(t);
	const {lastFrame, rerender, unmount} = render(
		<LoadingBar width={10} interval={12} />,
	);

	t.mock.timers.tick(36);
	await waitForFrame(lastFrame, drawTrack(10, 3));
	t.assert.strictEqual(lastFrame(), drawTrack(10, 3));

	rerender(<LoadingBar width={6} interval={12} />);
	await waitForFrame(lastFrame, drawTrack(6, 1));
	t.assert.strictEqual(lastFrame(), drawTrack(6, 1));

	t.mock.timers.tick(12);
	await waitForFrame(lastFrame, drawTrack(6, 0));
	t.assert.strictEqual(lastFrame(), drawTrack(6, 0));
	unmount();
});

test('fills a track narrower than the block without moving it', async (t: TestContext) => {
	enableIntervalClock(t);
	const {lastFrame, rerender, unmount} = render(
		<LoadingBar width={3} interval={12} />,
	);

	t.mock.timers.tick(48);
	await waitForFrame(lastFrame, chalk.magenta('███'));
	t.assert.strictEqual(lastFrame(), chalk.magenta('███'));

	rerender(<LoadingBar width={1} interval={12} />);
	t.mock.timers.tick(48);
	await waitForFrame(lastFrame, chalk.magenta('█'));
	t.assert.strictEqual(lastFrame(), chalk.magenta('█'));
	unmount();
});

test('draws nothing for a zero or negative width without throwing', (t: TestContext) => {
	enableIntervalClock(t);
	t.assert.strictEqual(renderToString(<LoadingBar width={0} />), '');
	t.assert.strictEqual(renderToString(<LoadingBar width={-5} />), '');
});

test('rounds a fractional width down to whole cells', async (t: TestContext) => {
	enableIntervalClock(t);
	const {lastFrame, rerender, unmount} = render(
		<LoadingBar width={10.9} interval={12} />,
	);

	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));

	rerender(<LoadingBar width={5.9} interval={12} />);
	t.mock.timers.tick(24);
	await waitForFrame(lastFrame, drawTrack(5, 0));
	t.assert.strictEqual(lastFrame(), drawTrack(5, 0));
	unmount();
});

test('renders when stdin is piped', (t: TestContext) => {
	enableIntervalClock(t);
	const {lastFrame, unmount} = render(<LoadingBar width={10} />, {
		isStdinPiped: true,
	});

	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));
	unmount();
});

test('takes its block colour from a ThemeProvider override', (t: TestContext) => {
	enableIntervalClock(t);
	const overriddenTheme = extendTheme(defaultTheme, {
		components: {
			LoadingBar: {
				styles: {
					block: () => ({color: 'cyan'}),
				},
			},
		},
	});
	const {lastFrame, unmount} = render(
		<ThemeProvider theme={overriddenTheme}>
			<LoadingBar width={10} />
		</ThemeProvider>,
	);

	t.assert.strictEqual(
		lastFrame(),
		chalk.cyan('████') + chalk.dim('░'.repeat(6)),
	);
	unmount();
});

test('theme keys return the documented props and there are no config keys', (t: TestContext) => {
	t.assert.deepStrictEqual(theme.styles.container(), {flexDirection: 'row'});
	t.assert.deepStrictEqual(theme.styles.track(), {dimColor: true});
	t.assert.deepStrictEqual(theme.styles.block(), {color: 'magenta'});
	t.assert.deepStrictEqual(Object.keys(theme), ['styles']);
});

test('draws nothing for an infinite or NaN width, without throwing', (t: TestContext) => {
	for (const width of [Infinity, NaN]) {
		const {lastFrame, unmount} = render(
			<LoadingBar width={width} isActive={false} />,
		);
		t.assert.strictEqual(lastFrame() ?? '', '');
		unmount();
	}
});
