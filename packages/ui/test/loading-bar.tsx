import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import figures from 'figures';
import delay from 'delay';
import {renderToString} from '@nemesis-oss/termina-core';
import {render} from './helpers/render.js';
import {LoadingBar} from '../source/components/loading-bar/index.js';

const BLOCK_CELLS = 4;

const drawTrack =(width: number, start: number): string => {
	const blockCells = Math.min(BLOCK_CELLS, width);
	const trailingCells = width - start - blockCells;

	return (
		chalk.dim(figures.squareLightShade.repeat(start)) +
		chalk.magenta(figures.square.repeat(blockCells)) +
		chalk.dim(figures.squareLightShade.repeat(trailingCells))
	);
};

test('draws a 20 cell track with the block at the start by default', (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, unmount} = render(<LoadingBar />);

	t.assert.strictEqual(lastFrame(), chalk.magenta('████') + chalk.dim('░'.repeat(16)));
	unmount();
});

test('bounces the block between the ends of the track', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, unmount} = render(<LoadingBar width={6} interval={12} />);
	const frames: string[] = [];

	for (let tick = 0; tick < 8; tick++) {
		t.mock.timers.tick(12);
		await delay(20);
		frames.push(lastFrame() ?? '');
	}

	t.assert.deepStrictEqual(
		frames,
		[1, 2, 1, 0, 1, 2, 1, 0].map(start => drawTrack(6, start)),
	);
	unmount();
});

test('moves one cell every 80 ms by default', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, unmount} = render(<LoadingBar width={10} />);

	t.mock.timers.tick(79);
	await delay(20);
	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));

	t.mock.timers.tick(1);
	await delay(20);
	t.assert.strictEqual(lastFrame(), drawTrack(10, 1));
	unmount();
});

test('returns the block to the start when isActive turns false mid-sweep', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, rerender, unmount} = render(<LoadingBar width={10} interval={12} />);

	t.mock.timers.tick(36);
	await delay(20);
	t.assert.strictEqual(lastFrame(), drawTrack(10, 3));

	rerender(<LoadingBar width={10} interval={12} isActive={false} />);
	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));
	await delay(20);
	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));
	unmount();
});

test('draws the block at the start when isActive is false from mount', (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, unmount} = render(<LoadingBar width={10} isActive={false} />);

	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));
	unmount();
});

test('starts the sweep from the start when isActive turns true again', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, rerender, unmount} = render(<LoadingBar width={10} interval={12} />);

	t.mock.timers.tick(36);
	await delay(20);
	rerender(<LoadingBar width={10} interval={12} isActive={false} />);
	await delay(20);
	rerender(<LoadingBar width={10} interval={12} />);
	await delay(20);
	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));

	t.mock.timers.tick(12);
	await delay(20);
	t.assert.strictEqual(lastFrame(), drawTrack(10, 1));
	unmount();
});

test('clears its timer when isActive turns false and on unmount', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const setIntervalMock = t.mock.method(globalThis, 'setInterval');
	const clearIntervalMock = t.mock.method(globalThis, 'clearInterval');
	const {rerender, unmount} = render(<LoadingBar interval={1234} />);
	await delay(20);
	rerender(<LoadingBar interval={1234} isActive={false} />);
	await delay(20);
	rerender(<LoadingBar interval={1234} />);
	await delay(20);
	unmount();
	await delay(20);

	const loadingBarTimers = setIntervalMock.mock.calls
		.filter(call => call.arguments[1] === 1234)
		.map(call => call.result);
	const clearedTimers = clearIntervalMock.mock.calls.map(call => call.arguments[0]);

	t.assert.strictEqual(loadingBarTimers.length, 2);
	t.assert.deepStrictEqual(
		loadingBarTimers.filter(timer => clearedTimers.includes(timer)),
		loadingBarTimers,
	);
});

test('redraws the track at a new width and keeps the animation running', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, rerender, unmount} = render(<LoadingBar width={10} interval={12} />);

	t.mock.timers.tick(36);
	await delay(20);
	rerender(<LoadingBar width={6} interval={12} />);
	await delay(20);
	t.assert.strictEqual(lastFrame(), drawTrack(6, 1));

	t.mock.timers.tick(12);
	await delay(20);
	t.assert.strictEqual(lastFrame(), drawTrack(6, 0));
	unmount();
});

test('fills a track narrower than the block without moving it', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, unmount} = render(<LoadingBar width={3} interval={12} />);

	t.mock.timers.tick(48);
	await delay(20);
	t.assert.strictEqual(lastFrame(), chalk.magenta('███'));
	unmount();
});

test('draws nothing for a zero or negative width without throwing', (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	t.assert.strictEqual(renderToString(<LoadingBar width={0} />), '');
	t.assert.strictEqual(renderToString(<LoadingBar width={-5} />), '');
});

test('rounds a fractional width down to whole cells', (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, unmount} = render(<LoadingBar width={10.9} />);

	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));
	unmount();
});

test('renders when stdin is piped', (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, unmount} = render(<LoadingBar width={10} />, {isStdinPiped: true});

	t.assert.strictEqual(lastFrame(), drawTrack(10, 0));
	unmount();
});
