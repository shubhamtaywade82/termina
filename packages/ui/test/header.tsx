import React from 'react';
import test, {type TestContext} from 'node:test';
import chalk from 'chalk';
import delay from 'delay';
import stripAnsi from 'strip-ansi';
import {Box, Text} from '@nemesis-oss/termina-core';
import {render} from './helpers/render.js';
import {Header} from '../source/components/header/index.js';

test('should draw only the bold title when no subtitle is given', (t: TestContext) => {
	const {lastFrame} = render(<Header title="Deploy Dashboard" />);

	t.assert.strictEqual(lastFrame(), chalk.bold('Deploy Dashboard'));
});

test('should draw the dimmed subtitle two columns after the title', (t: TestContext) => {
	const {lastFrame} = render(
		<Header title="Deployer" subtitle="Targeting: production" />,
	);

	t.assert.strictEqual(
		lastFrame(),
		`${chalk.bold('Deployer')}  ${chalk.dim('Targeting: production')}`,
	);
});

test('should draw no subtitle when the subtitle is an empty string', (t: TestContext) => {
	const {lastFrame} = render(<Header title="Deployer" subtitle="" />);

	t.assert.strictEqual(lastFrame(), chalk.bold('Deployer'));
});

test('should keep the two-column gap when the title is an empty string', (t: TestContext) => {
	const {lastFrame} = render(
		<Header title="" subtitle="Targeting: production" />,
	);

	t.assert.strictEqual(lastFrame(), `  ${chalk.dim('Targeting: production')}`);
});

test('should remove the subtitle when a re-render drops it', async (t: TestContext) => {
	const {lastFrame, rerender} = render(
		<Header title="Deployer" subtitle="Targeting: production" />,
	);

	rerender(<Header title="Deployer" />);
	await delay(20);

	t.assert.strictEqual(lastFrame(), chalk.bold('Deployer'));
});

test('should wrap the title and subtitle onto more rows when the row is too narrow for both', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={24}>
			<Header title="Deployer" subtitle="Targeting: production" />
		</Box>,
	);
	const rows = (lastFrame() ?? '').split('\n');

	t.assert.ok(rows.length > 1);
	t.assert.ok(rows.every(row => !row.includes('Deployer')));
});

test('should wrap a title wider than the row onto more rows', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={7}>
			<Header title="Deployer" />
		</Box>,
	);

	t.assert.ok((lastFrame() ?? '').split('\n').length > 1);
});

test('should draw the demo layout with the header above a status list', (t: TestContext) => {
	const {lastFrame} = render(
		<Box flexDirection="column" gap={1}>
			<Header title="Deployer" subtitle="Targeting: production · Region: us-east-1" />
			<Box flexDirection="column">
				<Text>Deploying 3 services</Text>
				<Text color="green">api: done</Text>
				<Text color="green">worker: done</Text>
				<Text color="yellow">web: running</Text>
			</Box>
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			`${chalk.bold('Deployer')}  ${chalk.dim('Targeting: production · Region: us-east-1')}`,
			'',
			'Deploying 3 services',
			chalk.green('api: done'),
			chalk.green('worker: done'),
			chalk.yellow('web: running'),
		].join('\n'),
	);
});

test('should break a title mid-word when the row is narrower than the title', (t: TestContext) => {
	const {lastFrame} = render(
		<Box width={24}>
			<Header title="Deployer" subtitle="Targeting: production" />
		</Box>,
	);

	t.assert.strictEqual(
		stripAnsi(lastFrame() ?? ''),
		'Deploye Targeting:\nr       production',
	);
});
