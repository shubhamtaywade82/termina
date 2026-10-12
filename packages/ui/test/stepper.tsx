import React from 'react';
import test, {type TestContext} from 'node:test';
import {render} from './helpers/render.js';
import {Box, Text} from '@nemesis-oss/termina-core';
import chalk from 'chalk';
import delay from 'delay';
import figures from 'figures';
import {Stepper} from '../source/components/stepper/index.js';

const steps = [
	'Install dependencies',
	'Configure API keys',
	'Deploy to production',
	'Run smoke tests',
];

const doneRow = (label: string) => `${chalk.green(figures.tick)} ${label}`;
const currentRow = (label: string) =>
	`${chalk.blue(figures.circleFilled)} ${chalk.bold(label)}`;
const pendingRow = (label: string) => `${chalk.dim(figures.circle)} ${label}`;

test('render one row per step with its state', (t: TestContext) => {
	const {lastFrame} = render(
		<Box flexDirection="column" gap={1}>
			<Text>Installing my-cli</Text>
			<Stepper steps={steps} current={1} />
		</Box>,
	);

	t.assert.strictEqual(
		lastFrame(),
		[
			'Installing my-cli',
			'',
			doneRow('Install dependencies'),
			currentRow('Configure API keys'),
			pendingRow('Deploy to production'),
			pendingRow('Run smoke tests'),
		].join('\n'),
	);
});

test('mark the first step as current when current is omitted', (t: TestContext) => {
	const {lastFrame} = render(<Stepper steps={steps} />);

	t.assert.strictEqual(
		lastFrame(),
		[
			currentRow('Install dependencies'),
			pendingRow('Configure API keys'),
			pendingRow('Deploy to production'),
			pendingRow('Run smoke tests'),
		].join('\n'),
	);
});

test('treat a current value below 0 as the first step', (t: TestContext) => {
	const {lastFrame} = render(<Stepper steps={steps} current={-3} />);

	t.assert.strictEqual(
		lastFrame(),
		[
			currentRow('Install dependencies'),
			pendingRow('Configure API keys'),
			pendingRow('Deploy to production'),
			pendingRow('Run smoke tests'),
		].join('\n'),
	);
});

test('mark every step as done when current is at or above the step count', (t: TestContext) => {
	const allDone = [
		doneRow('Install dependencies'),
		doneRow('Configure API keys'),
		doneRow('Deploy to production'),
		doneRow('Run smoke tests'),
	].join('\n');

	t.assert.strictEqual(
		render(<Stepper steps={steps} current={steps.length} />).lastFrame(),
		allDone,
	);
	t.assert.strictEqual(
		render(<Stepper steps={steps} current={steps.length + 2} />).lastFrame(),
		allDone,
	);
});

test('render no output for an empty steps array', (t: TestContext) => {
	const {lastFrame} = render(<Stepper steps={[]} />);

	t.assert.strictEqual(lastFrame(), '');
});

test('redraw the list when current or steps change after mount', async (t: TestContext) => {
	const {lastFrame, rerender} = render(<Stepper steps={steps} current={0} />);

	rerender(<Stepper steps={steps} current={2} />);
	await delay(20);

	t.assert.strictEqual(
		lastFrame(),
		[
			doneRow('Install dependencies'),
			doneRow('Configure API keys'),
			currentRow('Deploy to production'),
			pendingRow('Run smoke tests'),
		].join('\n'),
	);

	rerender(<Stepper steps={['Publish']} current={0} />);
	await delay(20);

	t.assert.strictEqual(lastFrame(), currentRow('Publish'));
});

test('wrap a label wider than the terminal onto more rows', (t: TestContext) => {
	const {lastFrame} = render(<Stepper steps={['x'.repeat(120)]} />);

	t.assert.strictEqual(lastFrame()?.split('\n').length, 2);
});

test('render with piped stdin', (t: TestContext) => {
	const {lastFrame} = render(<Stepper steps={steps} current={1} />, {
		isStdinPiped: true,
	});

	t.assert.strictEqual(
		lastFrame(),
		[
			doneRow('Install dependencies'),
			currentRow('Configure API keys'),
			pendingRow('Deploy to production'),
			pendingRow('Run smoke tests'),
		].join('\n'),
	);
});
