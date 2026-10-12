import React, {act} from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import {render} from './helpers/render.js';
import {Typewriter} from '../source/components/typewriter/index.js';

const cursor = chalk.blue('▋');
const FAST_SPEED = 50;
const STEP_MS = 20;

// act() drains the renders and effects that a tick schedules before it resolves. A delay cannot promise that under load.
const runInAct = async (callback: () => void) => {
	const environment = globalThis as Record<string, unknown>;
	environment['IS_REACT_ACT_ENVIRONMENT'] = true;
	try {
		await act(async () => {
			callback();
		});
	} finally {
		environment['IS_REACT_ACT_ENVIRONMENT'] = false;
	}
};

const advance = async (t: TestContext, ms: number) => {
	await runInAct(() => {
		t.mock.timers.tick(ms);
	});
};

test('shows only the cursor before the first character', (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, unmount} = render(<Typewriter text="ab" speed={FAST_SPEED} />);

	t.assert.strictEqual(lastFrame(), cursor);
	unmount();
});

test('reveals one character per interval and hides the cursor when done', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {frames, unmount} = render(<Typewriter text="ab" speed={FAST_SPEED} />);

	await advance(t, STEP_MS);
	await advance(t, STEP_MS);

	t.assert.deepStrictEqual([...new Set(frames)], [cursor, `a${cursor}`, 'ab']);
	unmount();
});

test('reveals 30 characters per second by default', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const text = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN';
	const {lastFrame, unmount} = render(<Typewriter text={text} />);

	await advance(t, 1010);

	t.assert.strictEqual(lastFrame(), `${text.slice(0, 30)}${cursor}`);
	unmount();
});

test('starts no timer when speed is not a positive number', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const setIntervalMock = t.mock.method(globalThis, 'setInterval');
	const onComplete = t.mock.fn();

	for (const speed of [0, -5, Number.NaN]) {
		const {lastFrame, unmount} = render(
			<Typewriter text="ab" speed={speed} onComplete={onComplete} />,
		);
		await advance(t, 60000);
		t.assert.strictEqual(lastFrame(), cursor);
		unmount();
	}

	t.assert.strictEqual(setIntervalMock.mock.callCount(), 0);
	t.assert.strictEqual(onComplete.mock.callCount(), 0);
});

test('reveals text by code point so an emoji is never split', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {frames, unmount} = render(<Typewriter text="😀👍🏽" speed={FAST_SPEED} />);

	for (let step = 0; step < 3; step++) {
		await advance(t, STEP_MS);
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

	await advance(t, STEP_MS * 2);
	t.assert.strictEqual(lastFrame(), 'ab');

	await runInAct(() => {
		rerender(<Typewriter text="xy" speed={FAST_SPEED} />);
	});
	t.assert.strictEqual(lastFrame(), cursor);

	await advance(t, STEP_MS);
	t.assert.strictEqual(lastFrame(), `x${cursor}`);
	unmount();
});

test('applies a new speed from the next character without restarting the reveal', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {lastFrame, rerender, unmount} = render(<Typewriter text="abc" speed={FAST_SPEED} />);

	await advance(t, STEP_MS);
	await runInAct(() => {
		rerender(<Typewriter text="abc" speed={1} />);
	});
	await advance(t, STEP_MS * 5);
	t.assert.strictEqual(lastFrame(), `a${cursor}`);

	await advance(t, 900);
	t.assert.strictEqual(lastFrame(), `ab${cursor}`);
	unmount();
});

test('calls onComplete once for each text', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const onComplete = t.mock.fn();
	const {rerender, unmount} = render(
		<Typewriter text="ab" speed={FAST_SPEED} onComplete={onComplete} />,
	);

	await advance(t, STEP_MS * 2);
	await advance(t, STEP_MS * 5);
	t.assert.strictEqual(onComplete.mock.callCount(), 1);

	await runInAct(() => {
		rerender(<Typewriter text="xy" speed={FAST_SPEED} onComplete={onComplete} />);
	});
	await advance(t, STEP_MS * 2);
	t.assert.strictEqual(onComplete.mock.callCount(), 2);

	await runInAct(() => {
		rerender(<Typewriter text="" speed={FAST_SPEED} onComplete={onComplete} />);
	});
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

	await advance(t, STEP_MS);
	await runInAct(() => {
		rerender(<Typewriter text="ab" speed={FAST_SPEED} onComplete={latestOnComplete} />);
	});
	await advance(t, STEP_MS);
	t.assert.strictEqual(lastFrame(), 'ab');

	await runInAct(() => {
		rerender(<Typewriter text="ab" speed={FAST_SPEED} onComplete={newestOnComplete} />);
	});
	await advance(t, STEP_MS * 5);
	t.assert.strictEqual(firstOnComplete.mock.callCount(), 0);
	t.assert.strictEqual(latestOnComplete.mock.callCount(), 1);
	t.assert.strictEqual(newestOnComplete.mock.callCount(), 0);
	unmount();
});

test('treats empty text as complete at once', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const onComplete = t.mock.fn();
	const {lastFrame, unmount} = render(<Typewriter text="" onComplete={onComplete} />);

	t.assert.strictEqual(onComplete.mock.callCount(), 1);
	t.assert.strictEqual(lastFrame(), '');
	unmount();
});

test('hides the cursor when cursor is false', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const {frames, unmount} = render(
		<Typewriter text="ab" cursor={false} speed={FAST_SPEED} />,
	);

	await advance(t, STEP_MS);
	await advance(t, STEP_MS);

	t.assert.deepStrictEqual([...new Set(frames)], ['', 'a', 'ab']);
	unmount();
});

test('calls onComplete after the last character is rendered', async (t: TestContext) => {
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

	await advance(t, STEP_MS * 2);

	t.assert.strictEqual(frameAtComplete, 'ab');
	view.unmount();
});

test('does not call onComplete when unmounted before the text is shown', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const onComplete = t.mock.fn();
	const {unmount} = render(
		<Typewriter text="ab" speed={FAST_SPEED} onComplete={onComplete} />,
	);

	await advance(t, STEP_MS);
	unmount();
	await advance(t, STEP_MS * 5);

	t.assert.strictEqual(onComplete.mock.callCount(), 0);
});

test('clears its timer on unmount', async (t: TestContext) => {
	t.mock.timers.enable({apis: ['setInterval']});
	const setIntervalMock = t.mock.method(globalThis, 'setInterval');
	const clearIntervalMock = t.mock.method(globalThis, 'clearInterval');
	const {unmount} = render(<Typewriter text="abc" speed={FAST_SPEED} />);

	await runInAct(() => {
		unmount();
	});

	const typewriterTimers = setIntervalMock.mock.calls
		.filter(call => call.arguments[1] === 1000 / FAST_SPEED)
		.map(call => call.result);
	const clearedTimers = clearIntervalMock.mock.calls.map(call => call.arguments[0]);

	t.assert.strictEqual(typewriterTimers.length, 1);
	t.assert.ok(clearedTimers.includes(typewriterTimers[0]));
});
