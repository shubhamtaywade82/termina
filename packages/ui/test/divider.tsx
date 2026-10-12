import React from 'react';
import test, {type TestContext} from 'node:test';
import {render} from './helpers/render.js';
import chalk from 'chalk';
import {Box, Text} from '@nemesis-oss/termina-core';
import {Divider} from '../source/components/divider/index.js';

// The render helper reports 100 columns, so a rule at the root is 100 wide.
const TERMINAL_COLUMNS = 100;

const rule = (columns: number): string => chalk.gray('─'.repeat(columns));

const titledRule = (title: string, columns: number): string =>
	`${chalk.gray('──')} ${chalk.bold(title)} ${rule(columns - title.length - 4)}`;

test('draws a plain rule across the terminal width', (t: TestContext) => {
	const {lastFrame} = render(<Divider />);

	t.assert.strictEqual(lastFrame(), rule(TERMINAL_COLUMNS));
});

test('draws the title after a two-column line with one space on each side', (t: TestContext) => {
	const {lastFrame} = render(<Divider title="Results" />);

	t.assert.strictEqual(lastFrame(), titledRule('Results', TERMINAL_COLUMNS));
});

test('draws an empty title as a plain rule', (t: TestContext) => {
	const {lastFrame} = render(<Divider title="" />);

	t.assert.strictEqual(lastFrame(), rule(TERMINAL_COLUMNS));
});

test('fills the width of its parent instead of the terminal', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={40}>
			<Divider />
		</Box>,
	);

	t.assert.strictEqual(lastFrame(), rule(40));
});

test('fills the parent width around a title', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={20}>
			<Divider title="Results" />
		</Box>,
	);

	t.assert.strictEqual(lastFrame(), titledRule('Results', 20));
});

test('wraps a title that is too wide and drops the trailing line', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={12}>
			<Divider title="Configuration" />
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.gray('──')} ${chalk.bold('Configur')}\n   ${chalk.bold('ation')}`,
	);
});

test('runs a title past the edge when the parent is four columns or narrower', (t: TestContext) => {
	for (const width of [3, 4]) {
		const {lastFrame} = render(
			<Box width={width}>
				<Divider title="Results" />
			</Box>,
		);

		t.assert.strictEqual(
			lastFrame(),
			`${chalk.gray('──')} ${chalk.bold('Results')}`,
		);
	}
});

test('draws sections of a report in a column', (t: TestContext) => {
	const {lastFrame} = render(
		<Box flexDirection="column">
			<Text>Build finished in 4.2s</Text>
			<Divider />
			<Text>3 packages built, 0 errors</Text>
			<Divider title="Results" />
			<Text>dist/index.js 48.1 kB</Text>
			<Text>dist/cli.js 12.7 kB</Text>
			<Divider title="Next steps" />
			<Text>Run pnpm test to check the build.</Text>
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			'Build finished in 4.2s',
			rule(TERMINAL_COLUMNS),
			'3 packages built, 0 errors',
			titledRule('Results', TERMINAL_COLUMNS),
			'dist/index.js 48.1 kB',
			'dist/cli.js 12.7 kB',
			titledRule('Next steps', TERMINAL_COLUMNS),
			'Run pnpm test to check the build.',
		].join('\n'),
	);
});
