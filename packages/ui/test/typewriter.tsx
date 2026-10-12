import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import {render} from './helpers/render.js';
import {Typewriter} from '../source/components/typewriter/index.js';

const cursor = chalk.blue('▋');
const FAST_SPEED = 50;
const STEP_MS = 20;

test('shows only the cursor before the first character', (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, unmount} = render(<Typewriter text="ab" speed={FAST_SPEED} />);

	t.assert.strictEqual(lastFrame(), cursor);
	unmount();
});

test('reveals one character per interval and hides the cursor when done', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {frames, unmount} = render(<Typewriter text="ab" speed={FAST_SPEED} />);

	t.mock.timers.tick(STEP_MS);
	await delay(20);
	t.mock.timers.tick(STEP_MS);
	await delay(20);

	t.assert.deepStrictEqual([...new Set(frames)], [cursor, `a${cursor}`, 'ab']);
	unmount();
});

test('reveals 30 characters per second by default', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const text = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN';
	const {lastFrame, unmount} = render(<Typewriter text={text} />);

	t.mock.timers.tick(1010);
	await delay(20);

	t.assert.strictEqual(lastFrame(), `${text.slice(0, 30)}${cursor}`);
	unmount();
});

test('reveals text by code point so an emoji is never split', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {frames, unmount} = render(<Typewriter text="😀👍🏽" speed={FAST_SPEED} />);

	for (let step = 0; step < 3; step++) {
		t.mock.timers.tick(STEP_MS);
		await delay(20);
	}

	t.assert.deepStrictEqual(
		[...new Set(frames)],
		[cursor, `😀${cursor}`, `😀👍${cursor}`, '😀👍🏽'],
	);
	unmount();
});

test('restarts the reveal when text changes', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, rerender, unmount} = render(<Typewriter text="ab" speed={FAST_SPEED} />);

	t.mock.timers.tick(STEP_MS * 2);
	await delay(20);
	t.assert.strictEqual(lastFrame(), 'ab');

	rerender(<Typewriter text="xy" speed={FAST_SPEED} />);
	await delay(20);
	t.assert.strictEqual(lastFrame(), cursor);

	t.mock.timers.tick(STEP_MS);
	await delay(20);
	t.assert.strictEqual(lastFrame(), `x${cursor}`);
	unmount();
});

test('calls onComplete once for each text', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const onComplete = t.mock.fn();
	const {rerender, unmount} = render(
		<Typewriter text="ab" speed={FAST_SPEED} onComplete={onComplete} />,
	);

	t.mock.timers.tick(STEP_MS * 2);
	await delay(20);
	t.mock.timers.tick(STEP_MS * 5);
	await delay(20);
	t.assert.strictEqual(onComplete.mock.callCount(), 1);

	rerender(<Typewriter text="xy" speed={FAST_SPEED} onComplete={onComplete} />);
	t.mock.timers.tick(STEP_MS * 2);
	await delay(20);
	t.assert.strictEqual(onComplete.mock.callCount(), 2);

	rerender(<Typewriter text="" speed={FAST_SPEED} onComplete={onComplete} />);
	await delay(20);
	t.assert.strictEqual(onComplete.mock.callCount(), 3);
	unmount();
});

test('keeps the reveal going when re-rendered with the same text and calls the latest onComplete once', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const firstOnComplete = t.mock.fn();
	const latestOnComplete = t.mock.fn();
	const newestOnComplete = t.mock.fn();
	const {lastFrame, rerender, unmount} = render(
		<Typewriter text="ab" speed={FAST_SPEED} onComplete={firstOnComplete} />,
	);

	t.mock.timers.tick(STEP_MS);
	await delay(20);
	rerender(<Typewriter text="ab" speed={FAST_SPEED} onComplete={latestOnComplete} />);
	t.mock.timers.tick(STEP_MS);
	await delay(20);
	t.assert.strictEqual(lastFrame(), 'ab');

	rerender(<Typewriter text="ab" speed={FAST_SPEED} onComplete={newestOnComplete} />);
	t.mock.timers.tick(STEP_MS * 5);
	await delay(20);
	t.assert.strictEqual(firstOnComplete.mock.callCount(), 0);
	t.assert.strictEqual(latestOnComplete.mock.callCount(), 1);
	t.assert.strictEqual(newestOnComplete.mock.callCount(), 0);
	unmount();
});

test('treats empty text as complete at once', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const onComplete = t.mock.fn();
	const {lastFrame, unmount} = render(<Typewriter text="" onComplete={onComplete} />);

	await delay(20);
	t.assert.strictEqual(onComplete.mock.callCount(), 1);
	t.assert.strictEqual(lastFrame(), '');
	unmount();
});

test('hides the cursor when cursor is false', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {frames, unmount} = render(
		<Typewriter text="ab" cursor={false} speed={FAST_SPEED} />,
	);

	t.mock.timers.tick(STEP_MS);
	await delay(20);
	t.mock.timers.tick(STEP_MS);
	await delay(20);

	t.assert.deepStrictEqual([...new Set(frames)], ['', 'a', 'ab']);
	unmount();
});

test('calls onComplete after the full text is rendered', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	let frameAtComplete: string | undefined;
	const view = render(
		<Typewriter
			text="ab"
			speed={FAST_SPEED}
			onComplete={() => {
				frameAtComplete = view.lastFrame();
			}}
		/>,
	);

	t.mock.timers.tick(STEP_MS * 2);
	await delay(20);

	t.assert.strictEqual(frameAtComplete, 'ab');
	view.unmount();
});

test('does not call onComplete when unmounted before the text is shown', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const onComplete = t.mock.fn();
	const {unmount} = render(
		<Typewriter text="ab" speed={FAST_SPEED} onComplete={onComplete} />,
	);

	t.mock.timers.tick(STEP_MS);
	await delay(20);
	unmount();
	t.mock.timers.tick(STEP_MS * 5);
	await delay(20);

	t.assert.strictEqual(onComplete.mock.callCount(), 0);
});

test('clears its timer on unmount', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const setIntervalMock = t.mock.method(globalThis, 'setInterval');
	const clearIntervalMock = t.mock.method(globalThis, 'clearInterval');
	const {unmount} = render(<Typewriter text="abc" speed={FAST_SPEED} />);

	await delay(20);
	unmount();

	const typewriterTimers = setIntervalMock.mock.calls
		.filter(call => call.arguments[1] === 1000 / FAST_SPEED)
		.map(call => call.result);
	const clearedTimers = clearIntervalMock.mock.calls.map(call => call.arguments[0]);

	t.assert.strictEqual(typewriterTimers.length, 1);
	t.assert.ok(clearedTimers.includes(typewriterTimers[0]));
});
