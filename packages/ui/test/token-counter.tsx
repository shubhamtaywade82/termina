import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {render} from './helpers/render.js';
import {TokenCounter} from '../source/components/token-counter/index.js';

test('without a limit, shows the count in the ok color', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={1234} />);

	t.assert.strictEqual(lastFrame(), `${chalk.green('1,234')} tokens`);
});

test('formats counts with thousands separators', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={1234567} />);

	t.assert.strictEqual(lastFrame(), `${chalk.green('1,234,567')} tokens`);
});

test('shows the count against the limit and the percent used', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={1234} limit={4096} />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.green('1,234 / 4,096')} tokens ${chalk.green('(30%)')}`,
	);
});

test('rounds the percent to a whole number', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={2} limit={3} />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.green('2 / 3')} tokens ${chalk.green('(67%)')}`,
	);
});

test('is green at 50 percent', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={500} limit={1000} />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.green('500 / 1,000')} tokens ${chalk.green('(50%)')}`,
	);
});

test('is yellow from 80 percent', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={800} limit={1000} />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.yellow('800 / 1,000')} tokens ${chalk.yellow('(80%)')}`,
	);
});

test('is red at 100 percent', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={1000} limit={1000} />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.red('1,000 / 1,000')} tokens ${chalk.red('(100%)')}`,
	);
});

test('is red above the limit and shows a percent over 100', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={1220} limit={1000} />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.red('1,220 / 1,000')} tokens ${chalk.red('(122%)')}`,
	);
});

test('colors by the exact ratio, so 799 of 1,000 is green at 80 percent', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={799} limit={1000} />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.green('799 / 1,000')} tokens ${chalk.green('(80%)')}`,
	);
});

test('stays yellow at 999 of 1,000, which shows 100 percent', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={999} limit={1000} />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.yellow('999 / 1,000')} tokens ${chalk.yellow('(100%)')}`,
	);
});

test('shows zero in the ok color', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={0} limit={1000} />);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.green('0 / 1,000')} tokens ${chalk.green('(0%)')}`,
	);
});

test('shows zero without a limit in the ok color', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={0} />);

	t.assert.strictEqual(lastFrame(), `${chalk.green('0')} tokens`);
});

test('draws no label when it is empty, leaving one space before the percent', (t: TestContext) => {
	const {lastFrame} = render(
		<TokenCounter count={1234} limit={4096} label="" />,
	);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.green('1,234 / 4,096')} ${chalk.green('(30%)')}`,
	);
});

test('uses the label prop in place of tokens', (t: TestContext) => {
	const {lastFrame} = render(
		<TokenCounter count={1234} label="input tokens" />,
	);

	t.assert.strictEqual(lastFrame(), `${chalk.green('1,234')} input tokens`);
});

test('updates the count, limit, color and percent after a rerender', async (t: TestContext) => {
	const {lastFrame, rerender} = render(
		<TokenCounter count={500} limit={1000} />,
	);

	await delay(20);
	rerender(<TokenCounter count={1800} limit={2000} />);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.yellow('1,800 / 2,000')} tokens ${chalk.yellow('(90%)')}`,
	);
});

test('shows a negative count as given, in the ok color', (t: TestContext) => {
	const {lastFrame} = render(<TokenCounter count={-5} limit={100} />);

	t.assert.ok((lastFrame() ?? '').includes(chalk.green('-5 / 100')));
	t.assert.ok(stripAnsi(lastFrame() ?? '').startsWith('-5 / 100 tokens (-5%)'));
});
